import { create } from 'zustand';
import toast from 'react-hot-toast';
import {
  Product, Category, Zone, RequisitionForm, GoodsReceiptNote, DeliveryNote, User, InventoryAudit, InventoryAuditItem, InventoryTransaction,
  DefectiveItem, RepairBatch, RepairBatchStatus
} from '../types';
import {
  productsService,
  categoriesService,
  zonesService,
  requisitionsService,
  receiptsService,
  deliveryNotesService,
  usersService,
  inventoryAuditsService,
  inventoryTransactionsService,
  defectiveItemsService,
  repairBatchesService
} from '../services/supabaseService';
import {
  inventoryDocumentsCoreService,
  warehousesCoreService
} from '../services/inventoryCoreService';
import { cloneProductList } from '../utils/productUtils';
import { calculateVariantStock } from '../utils/stockCalculator';
import { useAuthStore } from './authStore';

let latestInitialFetchId = 0;

const INITIAL_DATA_RETRY_COUNT = 1;
const RETRY_DELAY_MS = 600;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const syncLegacyRequisitionToInventoryCore = async (
  form: RequisitionForm,
  cart: CartItem[],
  zones: Zone[],
  createdBy?: User | null
) => {
  const zoneId = zones.find(zone => zone.name === form.zone)?.id;

  await inventoryDocumentsCoreService.createDraft({
    documentType: 'requisition',
    status: form.status === 'Đang chờ xử lý'
      ? 'submitted'
      : form.status === 'Đã hoàn thành'
        ? 'received'
        : form.status === 'Đã huỷ'
          ? 'cancelled'
          : 'approved',
    zoneId,
    requesterName: form.requesterName,
    createdBy: createdBy?.id,
    documentDate: form.createdAt?.slice(0, 10),
    notes: form.purpose,
    legacyTable: 'requisition_forms',
    legacyId: form.id,
    metadata: {
      legacyStatus: form.status,
      fulfilledBy: form.fulfilledBy,
      fulfilledAt: form.fulfilledAt,
      receivedBy: form.receivedBy,
      receivedAt: form.receivedAt,
    },
    items: cart.map((item, index) => ({
      productId: item.product.id,
      variantId: item.variant.id,
      quantityRequested: item.quantity,
      quantityApproved: form.status === 'Đang chờ xử lý' ? undefined : item.quantity,
      quantityIssued: form.fulfilledAt ? item.quantity : undefined,
      quantityReceived: form.receivedAt ? item.quantity : undefined,
      unit: item.variant.unit,
      purposeType: item.purposeType,
      reason: item.defectNotes,
      notes: item.groupNotes,
      displayOrder: index,
      metadata: {
        groupId: item.groupId,
        groupName: item.groupName,
        isExchange: item.isExchange,
        defectDescription: item.defectDescription,
        repairNeeds: item.repairNeeds,
        exchangedAt: item.exchangedAt,
        defectImages: item.defectImages || [],
      },
    })),
  });
};

const syncLegacyIssueToInventoryCore = async (
  form: RequisitionForm,
  items: CartItem[],
  zones: Zone[],
  issuedBy?: User | null,
  notes?: string
) => {
  const mainWarehouse = await warehousesCoreService.getMainWarehouse();
  if (!mainWarehouse) {
    throw new Error('Không tìm thấy kho chính trong hệ thống kho mới.');
  }

  const zoneId = zones.find(zone => zone.name === form.zone)?.id;

  await inventoryDocumentsCoreService.createStockIssue({
    sourceLocationId: mainWarehouse.id,
    zoneId,
    createdBy: issuedBy?.id,
    createdByName: issuedBy?.name,
    requesterName: form.requesterName,
    documentDate: new Date().toISOString().slice(0, 10),
    notes,
    legacyTable: 'requisition_forms:issue',
    legacyId: form.id,
    metadata: {
      requisitionId: form.id,
      requisitionStatus: form.status,
      fulfilledBy: form.fulfilledBy,
      fulfilledAt: form.fulfilledAt,
    },
    items: items.map((item, index) => ({
      productId: item.product.id,
      variantId: item.variant.id,
      quantity: item.quantity,
      quantityRequested: item.quantity,
      quantityApproved: item.quantity,
      quantityIssued: item.quantity,
      unit: item.variant.unit,
      purposeType: item.purposeType,
      reason: item.defectNotes,
      notes: item.groupNotes,
      displayOrder: index,
      metadata: {
        sourceRequisitionId: form.id,
        groupId: item.groupId,
        groupName: item.groupName,
        isExchange: item.isExchange,
      },
    })),
  });
};

const syncLegacyAuditAdjustmentToInventoryCore = async (
  audit: InventoryAudit,
  adjustedItems: InventoryAuditItem[],
  adjustedBy?: User | null
) => {
  const mainWarehouse = await warehousesCoreService.getMainWarehouse();
  if (!mainWarehouse) {
    throw new Error('Không tìm thấy kho chính trong hệ thống kho mới.');
  }

  await inventoryDocumentsCoreService.createStockAdjustment({
    warehouseId: mainWarehouse.id,
    createdBy: adjustedBy?.id,
    createdByName: adjustedBy?.name,
    documentDate: new Date().toISOString().slice(0, 10),
    notes: `Điều chỉnh từ phiếu kiểm kê ${audit.title}`,
    legacyTable: 'inventory_audits:adjustment',
    legacyId: audit.id,
    metadata: {
      auditId: audit.id,
      auditTitle: audit.title,
      completedAt: audit.completedAt,
    },
    items: adjustedItems.map((item, index) => {
      const actualQuantity = item.actualQuantity ?? item.systemQuantity;
      const diff = actualQuantity - item.systemQuantity;
      return {
        productId: item.productId,
        variantId: item.variantId,
        adjustmentDelta: diff,
        reason: item.reason,
        notes: `Hệ thống: ${item.systemQuantity}; Thực tế: ${actualQuantity}`,
        displayOrder: index,
        metadata: {
          auditItemId: item.id,
          systemQuantity: item.systemQuantity,
          actualQuantity,
          adjustmentDelta: diff,
        },
      };
    }),
    allowNegative: true,
  });
};

const syncLegacyReceiptDeltaToInventoryCore = async (
  receiptId: string,
  deltas: Array<{
    productId: string;
    variantId: string;
    adjustmentDelta: number;
    unit?: string;
    batchCode?: string;
    expiryDate?: string;
    reason?: string;
  }>,
  notes: string,
  adjustedBy?: User | null
) => {
  try {
    const mainWarehouse = await warehousesCoreService.getMainWarehouse();
    if (!mainWarehouse) return;

    const nonZeroDeltas = deltas.filter(delta => delta.adjustmentDelta !== 0);
    if (nonZeroDeltas.length === 0) return;

    await inventoryDocumentsCoreService.createStockAdjustment({
      warehouseId: mainWarehouse.id,
      createdBy: adjustedBy?.id,
      createdByName: adjustedBy?.name,
      documentDate: new Date().toISOString().slice(0, 10),
      notes,
      legacyTable: 'goods_receipt_notes:adjustment',
      legacyId: receiptId,
      metadata: { legacyReceiptId: receiptId, reason: 'receipt_mutation_sync' },
      items: nonZeroDeltas.map((delta, index) => ({
        productId: delta.productId,
        variantId: delta.variantId,
        adjustmentDelta: delta.adjustmentDelta,
        unit: delta.unit,
        batchCode: delta.batchCode,
        expiryDate: delta.expiryDate,
        reason: delta.reason,
        displayOrder: index,
      })),
      allowNegative: true,
    });
  } catch (error) {
    console.warn('Tồn legacy đã đổi nhưng chưa ghi được vào sổ kho mới:', error);
  }
};

const loadWithRetry = async <T>(label: string, loader: () => Promise<T>): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= INITIAL_DATA_RETRY_COUNT; attempt += 1) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;
      console.warn(`Lỗi khi tải ${label}, lần ${attempt + 1}:`, error);
      if (attempt < INITIAL_DATA_RETRY_COUNT) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
};

interface DataState {
  products: Product[];
  categories: Category[];
  zones: Zone[];
  requisitions: RequisitionForm[];
  receipts: GoodsReceiptNote[];
  deliveries: DeliveryNote[];
  users: User[];
  inventoryTransactions: InventoryTransaction[];
  defectiveItems: DefectiveItem[];
  repairBatches: RepairBatch[];

  isFetchingInitialData: boolean;
  isActionLoading: boolean;
  fetchInitialData: () => Promise<void>;

  // Users
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Products
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  // Categories
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (originalName: string, updatedCategory: Category) => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<boolean>;
  reorderCategories: (categories: Category[]) => Promise<void>;

  // Zones
  addZone: (zone: Omit<Zone, 'id' | 'createdAt'>) => Promise<void>;
  updateZone: (id: string, zone: Omit<Zone, 'id' | 'createdAt'>) => Promise<void>;
  deleteZone: (id: string) => Promise<boolean>;

  // Requisitions
  createRequisition: (details: { requesterName: string; zone: string; purpose: string }, cart: any[]) => Promise<void>;
  updateRequisition: (form: RequisitionForm) => Promise<void>;
  deleteRequisition: (formId: string) => Promise<void>;
  fulfillRequisition: (formId: string, details: { notes: string; fulfillerName: string }) => Promise<{ success: boolean; message?: string }>;
  confirmRequisitionReceipt: (formId: string, receivedBy: string, receiveNotes: string) => Promise<void>;

  // Receipts
  createReceipt: (receiptData: Omit<GoodsReceiptNote, 'id' | 'createdAt'>) => Promise<{ fulfilledReqIds: string[] }>;

  // Deliveries
  createDelivery: (items: DeliveryNote['items'], receiptId: string, shipperId: string, createdBy: string) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  updateReceipt: (id: string, updates: Partial<GoodsReceiptNote>) => Promise<void>;
  verifyDelivery: (noteId: string, verifierName: string, verificationNotes?: string) => Promise<void>;
  rejectDelivery: (noteId: string, verifierName: string, rejectionReason: string) => Promise<void>;

  // Inventory Audits
  inventoryAudits: InventoryAudit[];
  createInventoryAudit: (audit: Omit<InventoryAudit, 'id' | 'createdAt' | 'items'>, items: Omit<InventoryAuditItem, 'id' | 'auditId'>[]) => Promise<void>;
  updateInventoryAuditItem: (auditId: string, itemId: string, actualQuantity: number, reason: string) => Promise<void>;
  updateInventoryAudit: (auditId: string, updates: Partial<{ title: string, notes: string }>) => Promise<void>;
  deleteInventoryAudit: (auditId: string) => Promise<void>;
  completeInventoryAudit: (auditId: string) => Promise<{ success: boolean; message?: string }>;

  // Inventory Transactions
  createInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<void>;

  // Defects & Repairs
  createRepairBatch: (details: { code?: string; repairVendor?: string; sentAt: string; expectedReturnAt?: string; notes?: string; createdBy: string }, items: Array<{ defectiveItemId: string; quantity: number }>) => Promise<void>;
  receiveRepairBatchItems: (batchId: string, items: Array<{ repairBatchItemId: string; quantityReturned: number; returnNotes?: string }>, receivedBy: string) => Promise<void>;
  disposeDefectiveItems: (items: Array<{ defectiveItemId: string; quantity: number; source?: 'waiting' | 'repairing' }>, reason: string, disposedBy: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  products: [],
  categories: [],
  zones: [],
  requisitions: [],
  receipts: [],
  deliveries: [],
  users: [],
  inventoryAudits: [],
  inventoryTransactions: [],
  defectiveItems: [],
  repairBatches: [],

  isFetchingInitialData: false,
  isActionLoading: false,

  fetchInitialData: async () => {
    const fetchId = ++latestInitialFetchId;
    set({ isFetchingInitialData: true });

    const loaders = {
      products: () => productsService.getAll(),
      categories: () => categoriesService.getAll(),
      zones: () => zonesService.getAll(),
      requisitions: () => requisitionsService.getAll(),
      receipts: () => receiptsService.getAll(),
      deliveries: () => deliveryNotesService.getAll(),
      users: () => usersService.getAll(),
      inventoryAudits: () => inventoryAuditsService.getAll(),
      inventoryTransactions: () => inventoryTransactionsService.getAll(),
      defectiveItems: () => defectiveItemsService.getAll(),
      repairBatches: () => repairBatchesService.getAll(),
    } as const;

    const entries = Object.entries(loaders) as Array<[
      keyof typeof loaders,
      (typeof loaders)[keyof typeof loaders]
    ]>;

    const results = await Promise.allSettled(
      entries.map(([key, loader]) => loadWithRetry(key, loader))
    );

    if (fetchId !== latestInitialFetchId) return;

    const nextState: Partial<DataState> = { isFetchingInitialData: false };
    const failedLoads: string[] = [];

    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === 'fulfilled') {
        (nextState as Record<string, unknown>)[key] = result.value;
      } else {
        failedLoads.push(key);
        console.error(`Lỗi khi lấy dữ liệu ${key} từ Supabase:`, result.reason);
      }
    });

    set(nextState);

    if (failedLoads.length > 0) {
      toast.error(`Một phần dữ liệu tải chưa xong: ${failedLoads.join(', ')}. Bấm tải lại nếu cần.`);
    }
  },

  // --- Users ---
  addUser: async (userData) => {
    set({ isActionLoading: true });
    try {
      const newUser = await usersService.create(userData);
      set(s => ({ users: [newUser, ...s.users] }));
    } finally { set({ isActionLoading: false }); }
  },

  updateUser: async (id, userData) => {
    set({ isActionLoading: true });
    try {
      await usersService.update(id, userData);
      set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...userData } : u) }));
    } finally { set({ isActionLoading: false }); }
  },

  deleteUser: async (id) => {
    set({ isActionLoading: true });
    try {
      await usersService.delete(id);
      set(s => ({ users: s.users.filter(u => u.id !== id) }));
    } finally { set({ isActionLoading: false }); }
  },

  // --- Products ---
  addProduct: async (productData) => {
    set({ isActionLoading: true });
    try {
      const newProduct = await productsService.create(productData);
      set(state => ({ products: [newProduct, ...state.products] }));
    } finally { set({ isActionLoading: false }); }
  },

  updateProduct: async (updatedProduct) => {
    set({ isActionLoading: true });
    try {
      await productsService.update(updatedProduct);
      set(state => ({ products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p) }));
    } finally { set({ isActionLoading: false }); }
  },

  deleteProduct: async (productId) => {
    set({ isActionLoading: true });
    try {
      await productsService.delete(productId);
      set(state => ({ products: state.products.filter(p => p.id !== productId) }));
    } finally { set({ isActionLoading: false }); }
  },

  // --- Categories ---
  addCategory: async (categoryData) => {
    const state = get();
    if (state.categories.some(c => c.name.toLowerCase() === categoryData.name.toLowerCase())) {
      alert("Một danh mục với tên này đã tồn tại.");
      return;
    }
    set({ isActionLoading: true });
    try {
      await categoriesService.create(categoryData);
      set(s => ({ categories: [...s.categories, categoryData] }));
    } finally { set({ isActionLoading: false }); }
  },

  updateCategory: async (originalName, updatedCategory) => {
    const state = get();
    if (originalName !== updatedCategory.name && state.categories.some(c => c.name.toLowerCase() === updatedCategory.name.toLowerCase())) {
      alert("Một danh mục với tên này đã tồn tại.");
      return;
    }
    set({ isActionLoading: true });
    try {
      await categoriesService.update(originalName, updatedCategory);
      // We must reload products since their category names changed, or update them in state manually
      const newCategories = state.categories.map(c => c.name === originalName ? updatedCategory : c);
      const newProducts = originalName !== updatedCategory.name
        ? state.products.map(p => p.category === originalName ? { ...p, category: updatedCategory.name } : p)
        : state.products;
      set({ categories: newCategories, products: newProducts });
    } finally { set({ isActionLoading: false }); }
  },

  deleteCategory: async (categoryName) => {
    if (categoryName === 'Vật tư Khác') {
      toast.error('Không thể xóa danh mục mặc định này');
      return false;
    }
    set({ isActionLoading: true });
    try {
      await categoriesService.delete(categoryName);

      const state = get();
      const hasFallback = state.categories.some(c => c.name === 'Vật tư Khác');
      const fallbackCategories = hasFallback
        ? state.categories
        : [...state.categories, { name: 'Vật tư Khác', icon: '' }];

      set(s => ({
        categories: fallbackCategories.filter(c => c.name !== categoryName),
        products: s.products.map(p =>
          p.category === categoryName ? { ...p, category: 'Vật tư Khác' } : p
        )
      }));
      return true;
    } catch (e) {
      return false;
    } finally { set({ isActionLoading: false }); }
  },

  reorderCategories: async (categories) => {
    set({ isActionLoading: true });
    try {
      await categoriesService.reorder(categories);
      set({ categories });
    } finally { set({ isActionLoading: false }); }
  },

  // --- Zones ---
  addZone: async (zoneData) => {
    set({ isActionLoading: true });
    try {
      const newZone = await zonesService.create(zoneData);
      set(s => ({ zones: [...s.zones, newZone] }));
    } catch (error) {
      console.error('Error adding zone:', error);
      throw error;
    } finally { set({ isActionLoading: false }); }
  },

  updateZone: async (id, zoneData) => {
    set({ isActionLoading: true });
    try {
      await zonesService.update(id, zoneData);
      set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...zoneData } : z) }));
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    } finally { set({ isActionLoading: false }); }
  },

  deleteZone: async (id) => {
    const state = get();
    const isUsed = state.requisitions.some(f => f.zone === state.zones.find(z => z.id === id)?.name);
    if (isUsed) return false;
    set({ isActionLoading: true });
    try {
      await zonesService.delete(id);
      set(s => ({ zones: s.zones.filter(z => z.id !== id) }));
      return true;
    } catch(e) {
      return false;
    } finally { set({ isActionLoading: false }); }
  },

  // --- Requisitions ---
  createRequisition: async (details: any, cart: any[]) => {
    set({ isActionLoading: true });
    try {
      if (details.isCompleted) {
        // Validate stock
        const state = get();
        const workingProducts = cloneProductList(state.products);
        let stockSufficient = true;
        const stockErrors: string[] = [];

        for (const item of cart) {
          const currentStock = calculateVariantStock(item.variant, workingProducts);
          if (currentStock < item.quantity) {
            const variantName = Object.values(item.variant.attributes || {}).join(" / ") || "";
            stockErrors.push(`- Không đủ tồn kho cho "${item.product.name}" ${variantName}. Yêu cầu ${item.quantity}, còn lại ${currentStock}.`);
            stockSufficient = false;
          }
        }

        if (!stockSufficient) {
          throw new Error("Không thể tạo phiếu hoàn thành:\n" + stockErrors.join("\n"));
        }

        // Direct complete creation
        const currentUser = useAuthStore.getState().user;
        const managerName = currentUser?.name || 'Quản trị viên';
        const now = new Date().toISOString();

        const newForm = await requisitionsService.create({
          ...details,
          items: cart,
          status: "Đã hoàn thành",
          fulfilledBy: managerName,
          fulfilledAt: now,
          fulfillmentNotes: 'Cấp phát trực tiếp',
          receivedBy: details.requesterName,
          receivedAt: now,
          receiveNotes: 'Đã nhận đủ'
        });

        // Deduct stock
        for (const item of cart) {
          const pIndex = workingProducts.findIndex((p: any) => p.id === item.product.id);
          if (pIndex === -1) continue;
          const isComposite = item.variant.components && item.variant.components.length > 0;

          const deductVariant = async (vId: string, quantityToDeduct: number, pIdx: number, vIdx: number) => {
            const batches = await productsService.getBatchesForVariant(vId);
            let remainingToDeduct = quantityToDeduct;
            for (const batch of batches) {
              if (remainingToDeduct <= 0) break;
              const deductAmount = Math.min(batch.stock, remainingToDeduct);
              await productsService.updateBatchStock(batch.id, batch.stock - deductAmount);
              remainingToDeduct -= deductAmount;
            }
            const newStock = workingProducts[pIdx].variants[vIdx].stock - quantityToDeduct;
            workingProducts[pIdx].variants[vIdx].stock = newStock;
          };

          if (isComposite) {
            for (const component of item.variant.components!) {
              const cvIndex = workingProducts[pIndex].variants.findIndex((v: any) => v.id === component.variantId);
              if (cvIndex !== -1) {
                await deductVariant(component.variantId, item.quantity * component.quantity, pIndex, cvIndex);
              }
            }
          } else {
            const vIndex = workingProducts[pIndex].variants.findIndex((v: any) => v.id === item.variant.id);
            if (vIndex !== -1) {
              await deductVariant(item.variant.id, item.quantity, pIndex, vIndex);
            }
          }
        }

        set(s => ({ products: workingProducts, requisitions: [newForm, ...s.requisitions] }));

        try {
          await syncLegacyRequisitionToInventoryCore(newForm, cart, state.zones, currentUser);
        } catch (ledgerError) {
          console.warn('Phiếu yêu cầu legacy đã tạo nhưng chưa ghi được vào hệ thống kho mới:', ledgerError);
        }

        try {
          await syncLegacyIssueToInventoryCore(
            newForm,
            cart,
            state.zones,
            currentUser,
            `Cấp phát trực tiếp từ phiếu yêu cầu ${newForm.id}`
          );
        } catch (ledgerError) {
          console.warn('Phiếu xuất legacy đã xử lý nhưng chưa ghi được vào sổ kho mới:', ledgerError);
        }

        const exchangeItems = cart.filter(item => item.isExchange);
        if (exchangeItems.length > 0) {
          await get().createInventoryTransaction({
            type: 'RETURN_DEFECTIVE',
            status: 'COMPLETED',
            createdBy: managerName,
            notes: `Thu hồi từ phiếu yêu cầu cấp đổi ${newForm.id}`,
            items: exchangeItems.flatMap(item => {
              const isComposite = item.variant.components && item.variant.components.length > 0;
              if (isComposite) {
                return item.variant.components.map((c: any) => {
                  const compProduct = workingProducts.find(p => p.variants.some((v: any) => v.id === c.variantId));
                  const compVariant = compProduct?.variants.find((v: any) => v.id === c.variantId);
                  return {
                    variantId: c.variantId,
                    quantity: item.quantity * c.quantity,
                    reason: item.defectNotes,
                    productId: compProduct?.id || item.product.id,
                    exchangedAt: item.exchangedAt || newForm.createdAt,
                    defectDescription: item.defectDescription,
                    repairNeeds: item.repairNeeds,
                    defectImages: item.defectImages,
                    sourceRequisitionId: newForm.id,
                    productName: compProduct?.name || item.product.name,
                    variantAttributes: compVariant?.attributes,
                    unit: compVariant?.unit || item.variant.unit
                  };
                });
              }
              return [{
                variantId: item.variant.id,
                quantity: item.quantity,
                reason: item.defectNotes,
                productId: item.product.id,
                exchangedAt: item.exchangedAt || newForm.createdAt,
                defectDescription: item.defectDescription,
                repairNeeds: item.repairNeeds,
                defectImages: item.defectImages,
                sourceRequisitionId: newForm.id,
                productName: item.product.name,
                variantAttributes: item.variant.attributes,
                unit: item.variant.unit
              }];
            })
          });
        }
      } else {
        const newForm = await requisitionsService.create({
          ...details,
          items: cart,
          status: "Đang chờ xử lý"
        });
        const currentUser = useAuthStore.getState().user;
        try {
          await syncLegacyRequisitionToInventoryCore(newForm, cart, get().zones, currentUser);
        } catch (ledgerError) {
          console.warn('Phiếu yêu cầu legacy đã tạo nhưng chưa ghi được vào hệ thống kho mới:', ledgerError);
        }
        set(s => ({ requisitions: [newForm, ...s.requisitions] }));
      }
    } finally { set({ isActionLoading: false }); }
  },

  updateRequisition: async (updatedForm) => {
    set({ isActionLoading: true });
    try {
      await requisitionsService.update(updatedForm);
      set(s => ({ requisitions: s.requisitions.map(f => f.id === updatedForm.id ? updatedForm : f) }));
    } finally { set({ isActionLoading: false }); }
  },

  deleteRequisition: async (formId) => {
    set({ isActionLoading: true });
    try {
      await requisitionsService.delete(formId);
      set(s => ({ requisitions: s.requisitions.filter(f => f.id !== formId) }));
    } finally { set({ isActionLoading: false }); }
  },

  fulfillRequisition: async (formId, details) => {
    const state = get();
    const formToFulfill = state.requisitions.find(f => f.id === formId);
    if (!formToFulfill) return { success: false, message: "Không tìm thấy phiếu yêu cầu." };

    const workingProducts = cloneProductList(state.products);
    let stockSufficient = true;
    const stockErrors: string[] = [];

    for (const item of formToFulfill.items) {
      const currentStock = calculateVariantStock(item.variant, workingProducts);
      if (currentStock < item.quantity) {
        const variantName = Object.values(item.variant.attributes).join(" / ") || "";
        stockErrors.push(`- Không đủ tồn kho cho "${item.product.name}" ${variantName}. Yêu cầu ${item.quantity}, còn lại ${currentStock}.`);
        stockSufficient = false;
      }
    }

    if (!stockSufficient) {
      return { success: false, message: "Không thể hoàn thành phiếu:\n" + stockErrors.join("\n") };
    }

    set({ isActionLoading: true });
    try {
      // API call to fulfill
      await requisitionsService.fulfill(formId, details);

      // Now we deduct stock locally and sync to server
      // (Optimally this should be an RPC function or trigger in Supabase, but doing it from client per current architecture)
      for (const item of formToFulfill.items) {
        const pIndex = workingProducts.findIndex(p => p.id === item.product.id);
        if (pIndex === -1) continue;
        const isComposite = item.variant.components && item.variant.components.length > 0;

        const deductVariant = async (vId: string, quantityToDeduct: number, pIdx: number, vIdx: number) => {
          const batches = await productsService.getBatchesForVariant(vId);
          let remainingToDeduct = quantityToDeduct;

          for (const batch of batches) {
            if (remainingToDeduct <= 0) break;
            const deductAmount = Math.min(batch.stock, remainingToDeduct);
            await productsService.updateBatchStock(batch.id, batch.stock - deductAmount);
            remainingToDeduct -= deductAmount;
          }

          // Trừ trên workingProducts để update UI
          const newStock = workingProducts[pIdx].variants[vIdx].stock - quantityToDeduct;
          workingProducts[pIdx].variants[vIdx].stock = newStock;
        };

        if (isComposite) {
          for (const component of item.variant.components!) {
            const cvIndex = workingProducts[pIndex].variants.findIndex(v => v.id === component.variantId);
            if (cvIndex !== -1) {
              await deductVariant(component.variantId, item.quantity * component.quantity, pIndex, cvIndex);
            }
          }
        } else {
          const vIndex = workingProducts[pIndex].variants.findIndex(v => v.id === item.variant.id);
          if (vIndex !== -1) {
            await deductVariant(item.variant.id, item.quantity, pIndex, vIndex);
          }
        }
      }

      set(s => ({
        products: workingProducts,
        requisitions: s.requisitions.map(f => f.id === formId ? {
          ...f, status: "Đã duyệt yêu cầu", fulfilledBy: details.fulfillerName,
          fulfillmentNotes: details.notes, fulfilledAt: new Date().toISOString()
        } : f)
      }));

      try {
        await syncLegacyIssueToInventoryCore(
          {
            ...formToFulfill,
            status: "Đã duyệt yêu cầu",
            fulfilledBy: details.fulfillerName,
            fulfillmentNotes: details.notes,
            fulfilledAt: new Date().toISOString(),
          },
          formToFulfill.items,
          state.zones,
          useAuthStore.getState().user,
          details.notes
        );
      } catch (ledgerError) {
        console.warn('Phiếu xuất legacy đã xử lý nhưng chưa ghi được vào sổ kho mới:', ledgerError);
      }

      const exchangeItems = formToFulfill.items.filter(item => item.isExchange);
      if (exchangeItems.length > 0) {
        await get().createInventoryTransaction({
          type: 'RETURN_DEFECTIVE',
          status: 'COMPLETED',
          createdBy: details.fulfillerName,
          notes: `Thu hồi từ phiếu yêu cầu cấp đổi ${formId}`,
          items: exchangeItems.flatMap(item => {
            const isComposite = item.variant.components && item.variant.components.length > 0;
            if (isComposite) {
              return item.variant.components.map((c: any) => {
                const compProduct = workingProducts.find(p => p.variants.some((v: any) => v.id === c.variantId));
                const compVariant = compProduct?.variants.find((v: any) => v.id === c.variantId);
                  return {
                    variantId: c.variantId,
                    quantity: item.quantity * c.quantity,
                    reason: item.defectNotes,
                    productId: compProduct?.id || item.product.id,
                    exchangedAt: item.exchangedAt || new Date().toISOString(),
                    defectDescription: item.defectDescription,
                    repairNeeds: item.repairNeeds,
                    defectImages: item.defectImages,
                    sourceRequisitionId: formId,
                    productName: compProduct?.name || item.product.name,
                    variantAttributes: compVariant?.attributes,
                    unit: compVariant?.unit || item.variant.unit
                };
              });
            }
            return [{
              variantId: item.variant.id,
              quantity: item.quantity,
              reason: item.defectNotes,
              productId: item.product.id,
              exchangedAt: item.exchangedAt || new Date().toISOString(),
              defectDescription: item.defectDescription,
              repairNeeds: item.repairNeeds,
              defectImages: item.defectImages,
              sourceRequisitionId: formId,
              productName: item.product.name,
              variantAttributes: item.variant.attributes,
              unit: item.variant.unit
            }];
          })
        });
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, message: "Lỗi hệ thống: " + error.message };
    } finally {
      set({ isActionLoading: false });
    }
  },

  confirmRequisitionReceipt: async (formId, receivedBy, receiveNotes) => {
    set({ isActionLoading: true });
    try {
      await requisitionsService.confirmReceipt(formId, receivedBy, receiveNotes);
      set(s => ({
        requisitions: s.requisitions.map(f => f.id === formId ? { ...f, status: 'Đã hoàn thành', receivedBy, receiveNotes, receivedAt: new Date().toISOString() } : f)
      }));
    } finally {
      set({ isActionLoading: false });
    }
  },

  // --- Receipts ---
  createReceipt: async (receiptData) => {
    set({ isActionLoading: true });
    try {
      const newReceipt = await receiptsService.create(receiptData);
      const currentUser = useAuthStore.getState().user;

      try {
        await inventoryDocumentsCoreService.createStockReceipt({
          supplierName: receiptData.supplier,
          createdBy: currentUser?.id,
          createdByName: receiptData.createdBy,
          notes: receiptData.notes,
          legacyTable: 'goods_receipt_notes',
          legacyId: newReceipt.id,
          metadata: {
            linkedRequisitionIds: receiptData.linkedRequisitionIds || [],
            legacyReceiptId: newReceipt.id,
          },
          items: receiptData.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            quantityReceived: item.quantity,
            unit: item.unit,
            batchCode: item.batchCode,
            expiryDate: item.expiryDate,
          })),
        });
      } catch (ledgerError) {
        console.warn('Phiếu nhập legacy đã tạo nhưng chưa ghi được vào sổ kho mới:', ledgerError);
      }

      const state = get();
      let workingProducts = cloneProductList(state.products);

      for (const item of receiptData.items) {
        const pIndex = workingProducts.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const vIndex = workingProducts[pIndex].variants.findIndex(v => v.id === item.variantId);
          if (vIndex !== -1) {
            const newStock = workingProducts[pIndex].variants[vIndex].stock + item.quantity;
            workingProducts[pIndex].variants[vIndex].stock = newStock;
            await productsService.createOrUpdateBatch(item.variantId, item.quantity, item.batchCode, item.expiryDate);
          }
        }
      }

      const fulfilledReqIds: string[] = [];
      const pendingReqs = state.requisitions
        .filter(f => f.status === "Đang chờ xử lý")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Cập nhật lại products vào state ngay lập tức để Auto Fulfill lấy đúng số dư mới
      set({ products: workingProducts });

      for (const form of pendingReqs) {
        const result = await get().fulfillRequisition(form.id, {
          notes: `Tự động cấp phát từ Phiếu nhập kho ${newReceipt.id}`,
          fulfillerName: "Hệ thống (Nhập kho)"
        });
        if (result.success) fulfilledReqIds.push(form.id);
      }

      set(s => ({ receipts: [newReceipt, ...s.receipts] }));
      return { fulfilledReqIds };
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteReceipt: async (id) => {
    try {
      const receipt = get().receipts.find(r => r.id === id);
      if (!receipt) return;

      const state = get();
      let workingProducts = cloneProductList(state.products);

      // Revert stock locally and remotely
      for (const item of receipt.items) {
        const pIndex = workingProducts.findIndex(p => p.id === item.productId);
        if (pIndex !== -1) {
          const vIndex = workingProducts[pIndex].variants.findIndex(v => v.id === item.variantId);
          if (vIndex !== -1) {
            workingProducts[pIndex].variants[vIndex].stock -= item.quantity;
            await productsService.createOrUpdateBatch(item.variantId, -item.quantity, item.batchCode, item.expiryDate);
          }
        }
      }

      await receiptsService.delete(id);

      await syncLegacyReceiptDeltaToInventoryCore(
        id,
        receipt.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          adjustmentDelta: -item.quantity,
          unit: item.unit,
          batchCode: item.batchCode,
          expiryDate: item.expiryDate,
          reason: 'Xoá phiếu nhập kho legacy',
        })),
        `Hoàn trả tồn khi xoá phiếu nhập kho ${id}`,
        useAuthStore.getState().user
      );

      set(s => ({
        products: workingProducts,
        receipts: s.receipts.filter(r => r.id !== id)
      }));
      toast.success('Đã xoá phiếu nhập kho');
    } catch (error: any) {
      toast.error('Lỗi khi xoá phiếu nhập kho: ' + error.message);
    }
  },

  updateReceipt: async (id, updates) => {
    set({ isActionLoading: true });
    try {
      const existing = get().receipts.find(r => r.id === id);
      if (!existing) return;

      let workingProducts = cloneProductList(get().products);

      // If items changed, revert old and apply new
      if (updates.items && JSON.stringify(updates.items) !== JSON.stringify(existing.items)) {
        // Revert old
        for (const item of existing.items) {
          const pIndex = workingProducts.findIndex(p => p.id === item.productId);
          if (pIndex !== -1) {
            const vIndex = workingProducts[pIndex].variants.findIndex(v => v.id === item.variantId);
            if (vIndex !== -1) {
              workingProducts[pIndex].variants[vIndex].stock -= item.quantity;
              await productsService.createOrUpdateBatch(item.variantId, -item.quantity, item.batchCode, item.expiryDate);
            }
          }
        }

        // Apply new
        for (const item of updates.items) {
          const pIndex = workingProducts.findIndex(p => p.id === item.productId);
          if (pIndex !== -1) {
            const vIndex = workingProducts[pIndex].variants.findIndex(v => v.id === item.variantId);
            if (vIndex !== -1) {
              workingProducts[pIndex].variants[vIndex].stock += item.quantity;
              await productsService.createOrUpdateBatch(item.variantId, item.quantity, item.batchCode, item.expiryDate);
            }
          }
        }
      }

      await receiptsService.update(id, updates);

      if (updates.items && JSON.stringify(updates.items) !== JSON.stringify(existing.items)) {
        await syncLegacyReceiptDeltaToInventoryCore(
          id,
          [
            ...existing.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              adjustmentDelta: -item.quantity,
              unit: item.unit,
              batchCode: item.batchCode,
              expiryDate: item.expiryDate,
              reason: 'Cập nhật phiếu nhập (hoàn trả dòng cũ)',
            })),
            ...updates.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              adjustmentDelta: item.quantity,
              unit: item.unit,
              batchCode: item.batchCode,
              expiryDate: item.expiryDate,
              reason: 'Cập nhật phiếu nhập (thêm dòng mới)',
            })),
          ],
          `Đồng bộ tồn khi cập nhật phiếu nhập kho ${id}`,
          useAuthStore.getState().user
        );
      }

      set(s => ({
        products: workingProducts,
        receipts: s.receipts.map(r => r.id === id ? { ...r, ...updates } : r)
      }));
      toast.success('Đã cập nhật phiếu nhập kho');
    } catch (error: any) {
      toast.error('Lỗi khi cập nhật phiếu nhập kho: ' + error.message);
    } finally {
      set({ isActionLoading: false });
    }
  },

  // --- Deliveries ---
  createDelivery: async (items, receiptId, shipperId, createdBy) => {
    set({ isActionLoading: true });
    try {
      const newNote = await deliveryNotesService.create({ items, receiptId, shipperId, createdBy, status: 'pending' });
      set(s => ({ deliveries: [newNote, ...s.deliveries] }));
    } finally { set({ isActionLoading: false }); }
  },

  verifyDelivery: async (noteId, verifierName, verificationNotes = "") => {
    set({ isActionLoading: true });
    try {
      await deliveryNotesService.verify(noteId, verifierName, verificationNotes);
      set(s => ({
        deliveries: s.deliveries.map(n => n.id === noteId ? {
          ...n, status: "verified", verifiedBy: verifierName, verificationNotes, verifiedAt: new Date().toISOString()
        } : n)
      }));
    } finally { set({ isActionLoading: false }); }
  },

  rejectDelivery: async (noteId, verifierName, rejectionReason) => {
    set({ isActionLoading: true });
    try {
      await deliveryNotesService.reject(noteId, verifierName, rejectionReason);
      set(s => ({
        deliveries: s.deliveries.map(n => n.id === noteId ? {
          ...n, status: "rejected", verifiedBy: verifierName, verificationNotes: rejectionReason, rejectionReason, verifiedAt: new Date().toISOString()
        } : n)
      }));
    } finally { set({ isActionLoading: false }); }
  },

  // --- Inventory Audits ---
  createInventoryAudit: async (audit, items) => {
    set({ isActionLoading: true });
    try {
      const newAudit = await inventoryAuditsService.create(audit, items);
      set(s => ({ inventoryAudits: [newAudit, ...s.inventoryAudits] }));
    } finally { set({ isActionLoading: false }); }
  },

  updateInventoryAuditItem: async (auditId, itemId, actualQuantity: number | null, reason) => {
    try {
      await inventoryAuditsService.updateItem(itemId, actualQuantity, reason);
      set(s => ({
        inventoryAudits: s.inventoryAudits.map(a => {
          if (a.id === auditId) {
            return {
              ...a,
              items: a.items.map(i => i.id === itemId ? { ...i, actualQuantity, reason } : i)
            };
          }
          return a;
        })
      }));
    } catch (error) {
      console.error("Auto-save failed", error);
      throw error;
    }
  },

  updateInventoryAudit: async (auditId, updates) => {
    set({ isActionLoading: true });
    try {
      await inventoryAuditsService.update(auditId, updates);
      set(state => ({
        inventoryAudits: state.inventoryAudits.map(a =>
          a.id === auditId ? { ...a, ...updates } : a
        )
      }));
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteInventoryAudit: async (auditId) => {
    set({ isActionLoading: true });
    try {
      await inventoryAuditsService.delete(auditId);
      set(state => ({
        inventoryAudits: state.inventoryAudits.filter(a => a.id !== auditId)
      }));
    } finally {
      set({ isActionLoading: false });
    }
  },

  completeInventoryAudit: async (auditId) => {
    set({ isActionLoading: true });
    try {
      const state = get();
      const audit = state.inventoryAudits.find(a => a.id === auditId);
      if (!audit) throw new Error('Không tìm thấy phiếu kiểm kê');

      // Update variant stocks based on actualQuantity
      const productsToUpdate = cloneProductList(state.products);

      for (const item of audit.items) {
        if (item.actualQuantity !== undefined && item.actualQuantity !== item.systemQuantity) {
          const pIndex = productsToUpdate.findIndex(p => p.id === item.productId);
          if (pIndex !== -1) {
            const vIndex = productsToUpdate[pIndex].variants.findIndex(v => v.id === item.variantId);
            if (vIndex !== -1) {
              const diff = item.actualQuantity - item.systemQuantity;

              if (diff > 0) {
                // Nhập kho điều chỉnh
                await productsService.createOrUpdateBatch(item.variantId, diff, 'ADJUSTMENT');
              } else if (diff < 0) {
                // Xuất kho điều chỉnh (FEFO)
                const batches = await productsService.getBatchesForVariant(item.variantId);
                let remainingToDeduct = Math.abs(diff);
                for (const batch of batches) {
                  if (remainingToDeduct <= 0) break;
                  const deductAmount = Math.min(batch.stock, remainingToDeduct);
                  await productsService.updateBatchStock(batch.id, batch.stock - deductAmount);
                  remainingToDeduct -= deductAmount;
                }
              }

              productsToUpdate[pIndex].variants[vIndex].stock = item.actualQuantity;
            }
          }
        }
      }

      await inventoryAuditsService.complete(auditId);

      const adjustedItems = audit.items.filter(item =>
        item.actualQuantity !== undefined && item.actualQuantity !== item.systemQuantity
      );

      if (adjustedItems.length > 0) {
        try {
          await syncLegacyAuditAdjustmentToInventoryCore(
            audit,
            adjustedItems,
            useAuthStore.getState().user
          );
        } catch (ledgerError) {
          console.warn('Phiếu kiểm kê legacy đã hoàn thành nhưng chưa ghi được điều chỉnh vào sổ kho mới:', ledgerError);
        }
      }

      set(s => ({
        products: productsToUpdate,
        inventoryAudits: s.inventoryAudits.map(a => a.id === auditId ? { ...a, status: 'Hoàn thành', completedAt: new Date().toISOString() } : a)
      }));

      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    } finally { set({ isActionLoading: false }); }
  },

  // --- Inventory Transactions ---
  createInventoryTransaction: async (transaction) => {
    set({ isActionLoading: true });
    try {
      const state = get();
      const workingProducts = cloneProductList(state.products);

      // Update defective_stock and repairing_stock in DB
      for (const item of transaction.items) {
        const pIndex = workingProducts.findIndex(p => p.variants.some(v => v.id === item.variantId));
        if (pIndex === -1) continue;

        const vIndex = workingProducts[pIndex].variants.findIndex(v => v.id === item.variantId);
        if (vIndex === -1) continue;

        const variant = workingProducts[pIndex].variants[vIndex];
        let defStock = variant.defective_stock || 0;
        let repStock = variant.repairing_stock || 0;

        if (transaction.type === 'RETURN' || transaction.type === 'RETURN_DEFECTIVE') {
          defStock += item.quantity;
        } else if (transaction.type === 'REPAIR_EXPORT') {
          defStock -= item.quantity;
          repStock += item.quantity;
        } else if (transaction.type === 'REPAIR_IMPORT') {
          repStock -= item.quantity;
          variant.stock += item.quantity;
          await productsService.createOrUpdateBatch(item.variantId, item.quantity, 'REPAIR_RETURN');
        } else if (transaction.type === 'DISPOSAL') {
          if (defStock >= item.quantity) {
             defStock -= item.quantity;
          } else {
             repStock -= item.quantity;
          }
        }

        if (defStock < 0 || repStock < 0) {
          throw new Error('Số lượng tồn kho hỏng/đang sửa không đủ hợp lệ để thực hiện thao tác.');
        }

        // Update working products
        variant.defective_stock = defStock;
        variant.repairing_stock = repStock;

        // Update in DB
        await productsService.updateVariantDefectStock(variant.id, defStock, repStock);
      }

      // Create transaction record
      const newTx = await inventoryTransactionsService.create(transaction);
      const newDefectiveItems = transaction.type === 'RETURN_DEFECTIVE'
        ? await defectiveItemsService.createMany(transaction.items.map(item => {
            const variantInfo = workingProducts
              .flatMap(product => product.variants.map(variant => ({ product, variant })))
              .find(entry => entry.variant.id === item.variantId);

            return {
              sourceRequisitionId: item.sourceRequisitionId,
              sourceRequisitionItemId: undefined,
              productId: item.productId || variantInfo?.product.id || '',
              variantId: item.variantId,
              quantity: item.quantity,
              exchangedAt: item.exchangedAt || newTx.createdAt,
              defectStatus: item.reason || 'Hỏng',
              defectDescription: item.defectDescription,
              repairNeeds: item.repairNeeds,
              images: item.defectImages || [],
              currentState: 'waiting_repair',
              createdBy: transaction.createdBy,
              productName: item.productName,
              variantAttributes: item.variantAttributes,
              unit: item.unit,
            };
          }).filter(item => item.productId))
        : [];

      set(s => ({
        products: workingProducts,
        inventoryTransactions: [newTx, ...s.inventoryTransactions],
        defectiveItems: [...newDefectiveItems, ...s.defectiveItems]
      }));

    } catch (e: any) {
      console.error(e);
      throw e;
    } finally {
      set({ isActionLoading: false });
    }
  },

  createRepairBatch: async (details, items) => {
    set({ isActionLoading: true });
    try {
      const state = get();
      const selectedItems = items.map(item => {
        const defectiveItem = state.defectiveItems.find(defect => defect.id === item.defectiveItemId);
        if (!defectiveItem) throw new Error('Không tìm thấy vật tư hỏng cần gửi sửa.');
        if (defectiveItem.currentState !== 'waiting_repair') throw new Error('Chỉ được gửi sửa vật tư đang chờ sửa.');
        if (item.quantity !== defectiveItem.quantity) throw new Error('Hiện tại mỗi dòng vật tư hỏng cần được gửi sửa nguyên số lượng.');
        return { defectiveItem, quantity: item.quantity };
      });

      const code = details.code?.trim() || `SC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;
      const newBatch = await repairBatchesService.create({
        code,
        repairVendor: details.repairVendor,
        sentAt: details.sentAt,
        expectedReturnAt: details.expectedReturnAt,
        status: 'sent',
        notes: details.notes,
        createdBy: details.createdBy,
      }, selectedItems.map(({ defectiveItem, quantity }) => ({
        defectiveItemId: defectiveItem.id,
        variantId: defectiveItem.variantId,
        quantitySent: quantity,
      })));

      for (const { defectiveItem } of selectedItems) {
        await defectiveItemsService.updateState(defectiveItem.id, 'sent_to_repair');
      }

      await get().createInventoryTransaction({
        type: 'REPAIR_EXPORT',
        status: 'COMPLETED',
        createdBy: details.createdBy,
        notes: `Phiếu xuất sửa ${code}${details.repairVendor ? ` - ${details.repairVendor}` : ''}${details.notes ? `\n${details.notes}` : ''}`,
        referenceId: newBatch.id,
        items: selectedItems.map(({ defectiveItem, quantity }) => ({
          variantId: defectiveItem.variantId,
          productId: defectiveItem.productId,
          quantity,
          reason: defectiveItem.defectStatus,
          exchangedAt: defectiveItem.exchangedAt,
          defectDescription: defectiveItem.defectDescription,
          repairNeeds: defectiveItem.repairNeeds,
          defectImages: defectiveItem.images,
          sourceRequisitionId: defectiveItem.sourceRequisitionId,
          productName: defectiveItem.productName,
          variantAttributes: defectiveItem.variantAttributes,
          unit: defectiveItem.unit,
        })),
      });

      const [defectiveItems, repairBatches] = await Promise.all([
        defectiveItemsService.getAll(),
        repairBatchesService.getAll(),
      ]);

      set({ defectiveItems, repairBatches });
    } finally {
      set({ isActionLoading: false });
    }
  },

  receiveRepairBatchItems: async (batchId, items, receivedBy) => {
    set({ isActionLoading: true });
    try {
      const state = get();
      const batch = state.repairBatches.find(item => item.id === batchId);
      if (!batch) throw new Error('Không tìm thấy phiếu sửa chữa.');

      const transactionItems = items.map(item => {
        const batchItem = batch.items.find(line => line.id === item.repairBatchItemId);
        if (!batchItem) throw new Error('Không tìm thấy dòng vật tư trong phiếu sửa.');

        const remaining = batchItem.quantitySent - batchItem.quantityReturned - batchItem.quantityDisposed;
        if (item.quantityReturned < 1 || item.quantityReturned > remaining) {
          throw new Error(`Số lượng nhập lại không hợp lệ cho ${batchItem.productName || 'vật tư'}.`);
        }

        return { batchItem, quantityReturned: item.quantityReturned, returnNotes: item.returnNotes };
      });

      const returnedAt = new Date().toISOString();
      for (const { batchItem, quantityReturned, returnNotes } of transactionItems) {
        const nextReturned = batchItem.quantityReturned + quantityReturned;
        await repairBatchesService.updateItem(batchItem.id, {
          quantityReturned: nextReturned,
          quantityDisposed: batchItem.quantityDisposed,
          returnNotes,
          returnedAt,
        });

        if (nextReturned + batchItem.quantityDisposed >= batchItem.quantitySent) {
          await defectiveItemsService.updateState(batchItem.defectiveItemId, 'repaired');
        }
      }

      await get().createInventoryTransaction({
        type: 'REPAIR_IMPORT',
        status: 'COMPLETED',
        createdBy: receivedBy,
        notes: `Nhập vật tư đã sửa từ phiếu ${batch.code}`,
        referenceId: batch.id,
        items: transactionItems.map(({ batchItem, quantityReturned, returnNotes }) => ({
          variantId: batchItem.variantId,
          productId: batchItem.defectiveItem?.productId,
          quantity: quantityReturned,
          reason: returnNotes || batchItem.defectiveItem?.defectStatus,
          exchangedAt: batchItem.defectiveItem?.exchangedAt,
          defectDescription: batchItem.defectiveItem?.defectDescription,
          repairNeeds: batchItem.defectiveItem?.repairNeeds,
          defectImages: batchItem.defectiveItem?.images,
          sourceRequisitionId: batchItem.defectiveItem?.sourceRequisitionId,
          productName: batchItem.productName || batchItem.defectiveItem?.productName,
          variantAttributes: batchItem.variantAttributes || batchItem.defectiveItem?.variantAttributes,
          unit: batchItem.unit || batchItem.defectiveItem?.unit,
        })),
      });

      const refreshedBatches = await repairBatchesService.getAll();
      const refreshedBatch = refreshedBatches.find(item => item.id === batchId);
      if (refreshedBatch) {
        const hasOpenItems = refreshedBatch.items.some(item => item.quantityReturned + item.quantityDisposed < item.quantitySent);
        const hasReturnedItems = refreshedBatch.items.some(item => item.quantityReturned > 0);
        const status: RepairBatchStatus = hasOpenItems ? (hasReturnedItems ? 'partially_returned' : 'sent') : 'completed';
        await repairBatchesService.updateStatus(batchId, status);
      }

      const [defectiveItems, repairBatches] = await Promise.all([
        defectiveItemsService.getAll(),
        repairBatchesService.getAll(),
      ]);

      set({ defectiveItems, repairBatches });
    } finally {
      set({ isActionLoading: false });
    }
  },

  disposeDefectiveItems: async (items, reason, disposedBy) => {
    set({ isActionLoading: true });
    try {
      const state = get();
      const selectedItems = items.map(item => {
        const defectiveItem = state.defectiveItems.find(defect => defect.id === item.defectiveItemId);
        if (!defectiveItem) throw new Error('Không tìm thấy vật tư hỏng cần thanh lý.');
        if (item.quantity !== defectiveItem.quantity) throw new Error('Hiện tại mỗi dòng vật tư hỏng cần được thanh lý nguyên số lượng.');
        return { defectiveItem, quantity: item.quantity };
      });

      for (const { defectiveItem } of selectedItems) {
        await defectiveItemsService.updateState(defectiveItem.id, 'disposed');
      }

      await get().createInventoryTransaction({
        type: 'DISPOSAL',
        status: 'COMPLETED',
        createdBy: disposedBy,
        notes: reason,
        items: selectedItems.map(({ defectiveItem, quantity }) => ({
          variantId: defectiveItem.variantId,
          productId: defectiveItem.productId,
          quantity,
          reason,
          exchangedAt: defectiveItem.exchangedAt,
          defectDescription: defectiveItem.defectDescription,
          repairNeeds: defectiveItem.repairNeeds,
          defectImages: defectiveItem.images,
          sourceRequisitionId: defectiveItem.sourceRequisitionId,
          productName: defectiveItem.productName,
          variantAttributes: defectiveItem.variantAttributes,
          unit: defectiveItem.unit,
        })),
      });

      const defectiveItems = await defectiveItemsService.getAll();
      set({ defectiveItems });
    } finally {
      set({ isActionLoading: false });
    }
  },
}));

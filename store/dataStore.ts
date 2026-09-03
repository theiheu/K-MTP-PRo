import { create } from 'zustand';
import toast from 'react-hot-toast';
import {
  Product, Category, Zone, RequisitionForm, GoodsReceiptNote, DeliveryNote, User, InventoryAudit, InventoryAuditItem, InventoryTransaction
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
  inventoryTransactionsService
} from '../services/supabaseService';
import { cloneProductList } from '../utils/productUtils';
import { calculateVariantStock } from '../utils/stockCalculator';

let latestInitialFetchId = 0;

const INITIAL_DATA_RETRY_COUNT = 1;
const RETRY_DELAY_MS = 600;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        const { useAuthStore } = await import('./authStore');
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

        const exchangeItems = cart.filter(item => item.isExchange);
        if (exchangeItems.length > 0) {
          await get().createInventoryTransaction({
            type: 'RETURN',
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

      const exchangeItems = formToFulfill.items.filter(item => item.isExchange);
      if (exchangeItems.length > 0) {
        await get().createInventoryTransaction({
          type: 'RETURN',
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

        if (transaction.type === 'RETURN') {
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

      set(s => ({
        products: workingProducts,
        inventoryTransactions: [newTx, ...s.inventoryTransactions]
      }));

    } catch (e: any) {
      console.error(e);
      throw e;
    } finally {
      set({ isActionLoading: false });
    }
  },
}));

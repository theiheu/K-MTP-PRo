import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryDocumentsCoreService, stockCoreService } from '../services/inventoryCoreService';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import type { InventoryDocument, InventoryDocumentType, StockBalance, StockMovement } from '../types/inventory';
import {
  INVENTORY_DOCUMENT_STATUS_LABELS,
  INVENTORY_DOCUMENT_TYPE_LABELS,
  STOCK_BALANCE_STATE_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from '../types/inventory';

type WorkspaceTab = 'stock' | 'documents' | 'movements';
type DocumentFilter = 'all' | InventoryDocumentType;
type ReceiptDraftLine = {
  quantity: number;
  batchCode: string;
  expiryDate: string;
  unitPrice: string;
};
type IssueDraftLine = {
  quantity: number;
  notes: string;
};
type RequisitionDraftLine = {
  quantity: number;
  purposeType: string;
  notes: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getVariantLabel = (attributes?: Record<string, string>) => {
  const values = Object.values(attributes || {}).filter(Boolean);
  return values.length > 0 ? values.join(' / ') : 'Mặc định';
};

const getDocumentItemQuantity = (item: InventoryDocument['items'][number]) =>
  item.quantityIssued || item.quantityReceived || item.quantityApproved || item.quantityRequested || 0;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderDocumentPrintHtml = (document: InventoryDocument) => {
  const documentType = INVENTORY_DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType;
  const status = INVENTORY_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INVENTORY_DOCUMENT_STATUS_LABELS] || document.status;
  const rows = (document.items || []).map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${escapeHtml(item.productName || item.variantId)}</strong>
        <div>${escapeHtml(getVariantLabel(item.variantAttributes))}</div>
      </td>
      <td>${escapeHtml(item.unit || '')}</td>
      <td class="number">${formatNumber(getDocumentItemQuantity(item))}</td>
      <td>${escapeHtml(item.reason || item.notes || '')}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(document.documentCode)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1 { font-size: 22px; margin: 0 0 8px; text-align: center; text-transform: uppercase; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 24px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; }
          .number { text-align: right; font-weight: 700; }
          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; text-align: center; font-size: 13px; }
          .signature-space { height: 72px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(documentType)}</h1>
        <p style="text-align:center;margin:0;">${escapeHtml(document.documentCode)}</p>
        <div class="meta">
          <div><strong>Ngày phiếu:</strong> ${escapeHtml(formatDate(document.documentDate))}</div>
          <div><strong>Trạng thái:</strong> ${escapeHtml(status)}</div>
          <div><strong>Người yêu cầu:</strong> ${escapeHtml(document.requesterName || '-')}</div>
          <div><strong>Số dòng:</strong> ${formatNumber(document.items?.length || 0)}</div>
          <div style="grid-column:1 / -1;"><strong>Ghi chú:</strong> ${escapeHtml(document.notes || '-')}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:48px;">STT</th>
              <th>Vật tư</th>
              <th style="width:90px;">ĐVT</th>
              <th style="width:110px;">Số lượng</th>
              <th>Lý do/Ghi chú</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5">Không có dòng vật tư</td></tr>'}</tbody>
        </table>
        <div class="signatures">
          <div><strong>Người lập phiếu</strong><div class="signature-space"></div></div>
          <div><strong>Thủ kho</strong><div class="signature-space"></div></div>
          <div><strong>Người nhận</strong><div class="signature-space"></div></div>
        </div>
      </body>
    </html>
  `;
};

const documentFilters: Array<{ value: DocumentFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'requisition', label: 'Yêu cầu' },
  { value: 'stock_issue', label: 'Xuất kho' },
  { value: 'stock_receipt', label: 'Nhập kho' },
  { value: 'stock_adjustment', label: 'Điều chỉnh' },
  { value: 'stock_audit', label: 'Kiểm kê' },
];

const InventoryCoreWorkspace: React.FC = () => {
  const products = useDataStore(state => state.products);
  const zones = useDataStore(state => state.zones);
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('stock');
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptSearchTerm, setReceiptSearchTerm] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptDraft, setReceiptDraft] = useState<Record<string, ReceiptDraftLine>>({});
  const [issueSearchTerm, setIssueSearchTerm] = useState('');
  const [issueZoneId, setIssueZoneId] = useState('');
  const [issueRequesterName, setIssueRequesterName] = useState(user?.name || '');
  const [issueNotes, setIssueNotes] = useState('');
  const [issueDraft, setIssueDraft] = useState<Record<string, IssueDraftLine>>({});
  const [requisitionSearchTerm, setRequisitionSearchTerm] = useState('');
  const [requisitionZoneId, setRequisitionZoneId] = useState('');
  const [requisitionRequesterName, setRequisitionRequesterName] = useState(user?.name || '');
  const [requisitionNotes, setRequisitionNotes] = useState('');
  const [requisitionDraft, setRequisitionDraft] = useState<Record<string, RequisitionDraftLine>>({});
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [documents, setDocuments] = useState<InventoryDocument[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<InventoryDocument | null>(null);
  const [isReceiptFormOpen, setIsReceiptFormOpen] = useState(false);
  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [isRequisitionFormOpen, setIsRequisitionFormOpen] = useState(false);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const [isSavingRequisition, setIsSavingRequisition] = useState(false);
  const [isIssuingSelectedDocument, setIsIssuingSelectedDocument] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadInventoryCore = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [nextBalances, nextDocuments, nextMovements] = await Promise.all([
        stockCoreService.getBalances(),
        inventoryDocumentsCoreService.getAll(),
        stockCoreService.getRecentMovements(120),
      ]);

      setBalances(nextBalances);
      setDocuments(nextDocuments);
      setMovements(nextMovements);
    } catch (error) {
      console.warn('Không tải được sổ kho mới:', error);
      setErrorMessage('Chưa đọc được sổ kho mới. Kiểm tra lại các migration 015-018 trên Supabase rồi tải lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialInventoryCore = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [nextBalances, nextDocuments, nextMovements] = await Promise.all([
          stockCoreService.getBalances(),
          inventoryDocumentsCoreService.getAll(),
          stockCoreService.getRecentMovements(120),
        ]);

        if (!isMounted) return;
        setBalances(nextBalances);
        setDocuments(nextDocuments);
        setMovements(nextMovements);
      } catch (error) {
        if (!isMounted) return;
        console.warn('Không tải được sổ kho mới:', error);
        setErrorMessage('Chưa đọc được sổ kho mới. Kiểm tra lại các migration 015-018 trên Supabase rồi tải lại.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialInventoryCore();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedReceiptSearch = receiptSearchTerm.trim().toLowerCase();
  const normalizedIssueSearch = issueSearchTerm.trim().toLowerCase();
  const normalizedRequisitionSearch = requisitionSearchTerm.trim().toLowerCase();

  const receiptProducts = useMemo(
    () => products
      .filter(product => {
        if (!normalizedReceiptSearch) return true;
        return [
          product.name,
          product.category,
          ...product.variants.map(variant => getVariantLabel(variant.attributes)),
          ...product.variants.map(variant => variant.sku || ''),
        ].some(value => value.toLowerCase().includes(normalizedReceiptSearch));
      })
      .slice(0, 40),
    [products, normalizedReceiptSearch]
  );

  const receiptItems = useMemo(
    () => products.flatMap(product => product.variants.map(variant => ({
      product,
      variant,
      draft: receiptDraft[variant.id],
    }))).filter(item => (item.draft?.quantity || 0) > 0),
    [products, receiptDraft]
  );

  const availableQuantityByVariant = useMemo(
    () => balances.reduce<Record<string, number>>((acc, item) => {
      if (item.balanceState !== 'available') return acc;
      acc[item.variantId] = (acc[item.variantId] || 0) + item.quantity;
      return acc;
    }, {}),
    [balances]
  );

  const issueProducts = useMemo(
    () => products
      .filter(product => {
        if (!normalizedIssueSearch) return true;
        return [
          product.name,
          product.category,
          ...product.variants.map(variant => getVariantLabel(variant.attributes)),
          ...product.variants.map(variant => variant.sku || ''),
        ].some(value => value.toLowerCase().includes(normalizedIssueSearch));
      })
      .slice(0, 40),
    [products, normalizedIssueSearch]
  );

  const issueItems = useMemo(
    () => products.flatMap(product => product.variants.map(variant => ({
      product,
      variant,
      draft: issueDraft[variant.id],
    }))).filter(item => (item.draft?.quantity || 0) > 0),
    [products, issueDraft]
  );

  const requisitionProducts = useMemo(
    () => products
      .filter(product => {
        if (!normalizedRequisitionSearch) return true;
        return [
          product.name,
          product.category,
          ...product.variants.map(variant => getVariantLabel(variant.attributes)),
          ...product.variants.map(variant => variant.sku || ''),
        ].some(value => value.toLowerCase().includes(normalizedRequisitionSearch));
      })
      .slice(0, 40),
    [products, normalizedRequisitionSearch]
  );

  const requisitionItems = useMemo(
    () => products.flatMap(product => product.variants.map(variant => ({
      product,
      variant,
      draft: requisitionDraft[variant.id],
    }))).filter(item => (item.draft?.quantity || 0) > 0),
    [products, requisitionDraft]
  );

  const availableBalances = useMemo(
    () => balances.filter(item => item.balanceState === 'available'),
    [balances]
  );

  const totalAvailableQuantity = useMemo(
    () => availableBalances.reduce((total, item) => total + item.quantity, 0),
    [availableBalances]
  );

  const filteredBalances = useMemo(
    () => availableBalances.filter(item => {
      if (!normalizedSearch) return true;
      return [
        item.productName,
        getVariantLabel(item.variantAttributes),
        item.unit,
        item.batchCode,
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }),
    [availableBalances, normalizedSearch]
  );

  const filteredDocuments = useMemo(
    () => documents.filter(document => {
      if (documentFilter !== 'all' && document.documentType !== documentFilter) return false;
      if (!normalizedSearch) return true;
      return [
        document.documentCode,
        INVENTORY_DOCUMENT_TYPE_LABELS[document.documentType],
        document.requesterName,
        document.notes,
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }),
    [documents, documentFilter, normalizedSearch]
  );

  const filteredMovements = useMemo(
    () => movements.filter(movement => {
      if (!normalizedSearch) return true;
      return [
        movement.productName,
        getVariantLabel(movement.variantAttributes),
        STOCK_MOVEMENT_TYPE_LABELS[movement.movementType],
        movement.notes,
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }),
    [movements, normalizedSearch]
  );

  const tabs: Array<{ value: WorkspaceTab; label: string; count: number }> = [
    { value: 'stock', label: 'Tồn kho', count: filteredBalances.length },
    { value: 'documents', label: 'Phiếu kho', count: filteredDocuments.length },
    { value: 'movements', label: 'Sổ phát sinh', count: filteredMovements.length },
  ];

  const handlePrintDocument = (document: InventoryDocument) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(renderDocumentPrintHtml(document));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const updateReceiptDraftLine = (
    variantId: string,
    field: keyof ReceiptDraftLine,
    value: string
  ) => {
    setReceiptDraft(prev => {
      const current = prev[variantId] || {
        quantity: 0,
        batchCode: '',
        expiryDate: '',
        unitPrice: '',
      };

      if (field === 'quantity') {
        const quantity = Number(value);
        return {
          ...prev,
          [variantId]: {
            ...current,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          },
        };
      }

      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const updateIssueDraftLine = (
    variantId: string,
    field: keyof IssueDraftLine,
    value: string
  ) => {
    setIssueDraft(prev => {
      const current = prev[variantId] || {
        quantity: 0,
        notes: '',
      };

      if (field === 'quantity') {
        const quantity = Number(value);
        return {
          ...prev,
          [variantId]: {
            ...current,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          },
        };
      }

      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const updateRequisitionDraftLine = (
    variantId: string,
    field: keyof RequisitionDraftLine,
    value: string
  ) => {
    setRequisitionDraft(prev => {
      const current = prev[variantId] || {
        quantity: 0,
        purposeType: 'regular_use',
        notes: '',
      };

      if (field === 'quantity') {
        const quantity = Number(value);
        return {
          ...prev,
          [variantId]: {
            ...current,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          },
        };
      }

      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSubmitReceipt = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!supplierName.trim()) {
      toast.error('Vui lòng nhập nhà cung cấp.');
      return;
    }

    if (receiptItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một vật tư.');
      return;
    }

    setIsSavingReceipt(true);
    try {
      await inventoryDocumentsCoreService.createStockReceipt({
        supplierName: supplierName.trim(),
        createdBy: user?.id,
        createdByName: user?.name,
        notes: receiptNotes.trim() || undefined,
        metadata: {
          source: 'inventory_core_workspace',
        },
        items: receiptItems.map(({ product, variant, draft }, index) => ({
          productId: product.id,
          variantId: variant.id,
          quantity: draft.quantity,
          quantityReceived: draft.quantity,
          unit: variant.unit,
          unitPrice: draft.unitPrice ? Number(draft.unitPrice) : undefined,
          batchCode: draft.batchCode.trim() || undefined,
          expiryDate: draft.expiryDate || undefined,
          displayOrder: index,
          metadata: {
            source: 'direct_core_receipt',
          },
        })),
      });

      toast.success('Đã tạo phiếu nhập kho.');
      setSupplierName('');
      setReceiptNotes('');
      setReceiptDraft({});
      setReceiptSearchTerm('');
      setIsReceiptFormOpen(false);
      setActiveTab('documents');
      setDocumentFilter('stock_receipt');
      await loadInventoryCore();
    } catch (error) {
      console.error('Không tạo được phiếu nhập kho core:', error);
      toast.error('Không tạo được phiếu nhập kho.');
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleSubmitIssue = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!issueZoneId) {
      toast.error('Vui lòng chọn khu nhận vật tư.');
      return;
    }

    if (!issueRequesterName.trim()) {
      toast.error('Vui lòng nhập người nhận/yêu cầu.');
      return;
    }

    if (issueItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một vật tư.');
      return;
    }

    const overIssuedItem = issueItems.find(({ variant, draft }) =>
      draft.quantity > (availableQuantityByVariant[variant.id] || 0)
    );

    if (overIssuedItem) {
      toast.error('Số lượng xuất vượt tồn khả dụng.');
      return;
    }

    setIsSavingIssue(true);
    try {
      await inventoryDocumentsCoreService.createStockIssue({
        zoneId: issueZoneId,
        requesterName: issueRequesterName.trim(),
        createdBy: user?.id,
        createdByName: user?.name,
        notes: issueNotes.trim() || undefined,
        metadata: {
          source: 'inventory_core_workspace',
        },
        items: issueItems.map(({ product, variant, draft }, index) => ({
          productId: product.id,
          variantId: variant.id,
          quantity: draft.quantity,
          quantityRequested: draft.quantity,
          quantityApproved: draft.quantity,
          quantityIssued: draft.quantity,
          unit: variant.unit,
          reason: draft.notes.trim() || undefined,
          displayOrder: index,
          metadata: {
            source: 'direct_core_issue',
            availableBeforeIssue: availableQuantityByVariant[variant.id] || 0,
          },
        })),
      });

      toast.success('Đã tạo phiếu xuất kho.');
      setIssueZoneId('');
      setIssueRequesterName(user?.name || '');
      setIssueNotes('');
      setIssueDraft({});
      setIssueSearchTerm('');
      setIsIssueFormOpen(false);
      setActiveTab('documents');
      setDocumentFilter('stock_issue');
      await loadInventoryCore();
    } catch (error) {
      console.error('Không tạo được phiếu xuất kho core:', error);
      toast.error('Không tạo được phiếu xuất kho.');
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleSubmitRequisition = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!requisitionZoneId) {
      toast.error('Vui lòng chọn khu yêu cầu.');
      return;
    }

    if (!requisitionRequesterName.trim()) {
      toast.error('Vui lòng nhập người yêu cầu.');
      return;
    }

    if (requisitionItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một vật tư.');
      return;
    }

    setIsSavingRequisition(true);
    try {
      await inventoryDocumentsCoreService.createDraft({
        documentType: 'requisition',
        status: 'submitted',
        zoneId: requisitionZoneId,
        requesterId: user?.id,
        requesterName: requisitionRequesterName.trim(),
        createdBy: user?.id,
        notes: requisitionNotes.trim() || undefined,
        metadata: {
          source: 'inventory_core_workspace',
        },
        items: requisitionItems.map(({ product, variant, draft }, index) => ({
          productId: product.id,
          variantId: variant.id,
          quantityRequested: draft.quantity,
          unit: variant.unit,
          purposeType: draft.purposeType,
          notes: draft.notes.trim() || undefined,
          displayOrder: index,
          metadata: {
            source: 'direct_core_requisition',
            availableAtRequest: availableQuantityByVariant[variant.id] || 0,
          },
        })),
      });

      toast.success('Đã tạo phiếu yêu cầu.');
      setRequisitionZoneId('');
      setRequisitionRequesterName(user?.name || '');
      setRequisitionNotes('');
      setRequisitionDraft({});
      setRequisitionSearchTerm('');
      setIsRequisitionFormOpen(false);
      setActiveTab('documents');
      setDocumentFilter('requisition');
      await loadInventoryCore();
    } catch (error) {
      console.error('Không tạo được phiếu yêu cầu core:', error);
      toast.error('Không tạo được phiếu yêu cầu.');
    } finally {
      setIsSavingRequisition(false);
    }
  };

  const handleIssueSelectedRequisition = async (document: InventoryDocument) => {
    const items = document.items || [];
    if (document.documentType !== 'requisition' || items.length === 0) return;

    const overIssuedItem = items.find(item =>
      getDocumentItemQuantity(item) > (availableQuantityByVariant[item.variantId] || 0)
    );

    if (overIssuedItem) {
      toast.error('Phiếu có vật tư vượt tồn khả dụng.');
      return;
    }

    setIsIssuingSelectedDocument(true);
    try {
      await inventoryDocumentsCoreService.createStockIssue({
        zoneId: document.zoneId,
        requesterName: document.requesterName,
        createdBy: user?.id,
        createdByName: user?.name,
        notes: `Xuất theo phiếu yêu cầu ${document.documentCode}`,
        legacyTable: 'inventory_documents:requisition',
        legacyId: document.id,
        metadata: {
          source: 'issue_from_core_requisition',
          requisitionDocumentId: document.id,
          requisitionDocumentCode: document.documentCode,
        },
        items: items.map((item, index) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: getDocumentItemQuantity(item),
          quantityRequested: item.quantityRequested,
          quantityApproved: item.quantityApproved || item.quantityRequested,
          quantityIssued: getDocumentItemQuantity(item),
          unit: item.unit,
          purposeType: item.purposeType,
          reason: item.reason,
          notes: item.notes,
          displayOrder: index,
          metadata: {
            source: 'issue_from_core_requisition',
            requisitionDocumentItemId: item.id,
            availableBeforeIssue: availableQuantityByVariant[item.variantId] || 0,
          },
        })),
      });

      await inventoryDocumentsCoreService.updateStatus(
        document.id,
        'issued',
        user?.id,
        'Đã xuất kho theo phiếu yêu cầu'
      );

      toast.success('Đã xuất kho theo phiếu yêu cầu.');
      setSelectedDocument(null);
      setActiveTab('documents');
      setDocumentFilter('stock_issue');
      await loadInventoryCore();
    } catch (error) {
      console.error('Không xuất được theo phiếu yêu cầu core:', error);
      toast.error('Không xuất được theo phiếu yêu cầu.');
    } finally {
      setIsIssuingSelectedDocument(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Sổ kho mới</h2>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi tồn hiện tại, phiếu nhập xuất và lịch sử phát sinh từ core ledger.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setIsRequisitionFormOpen(true)}
            className="col-span-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:col-span-1"
          >
            Tạo yêu cầu
          </button>
          <button
            type="button"
            onClick={() => setIsReceiptFormOpen(true)}
            className="col-span-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:col-span-1"
          >
            Tạo phiếu nhập
          </button>
          <button
            type="button"
            onClick={() => setIsIssueFormOpen(true)}
            className="col-span-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 sm:col-span-1"
          >
            Tạo phiếu xuất
          </button>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Dòng tồn</p>
            <p className="text-base font-semibold text-gray-900">{formatNumber(availableBalances.length)}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Tổng SL khả dụng</p>
            <p className="text-base font-semibold text-gray-900">{formatNumber(totalAvailableQuantity)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Tìm vật tư, mã phiếu, người yêu cầu..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
          <div className="grid grid-cols-3 gap-2 sm:flex">
            {tabs.map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  activeTab === tab.value
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className="ml-1 text-xs opacity-80">({formatNumber(tab.count)})</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'documents' && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {documentFilters.map(filter => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setDocumentFilter(filter.value)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                  documentFilter === filter.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Đang tải sổ kho mới...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && activeTab === 'stock' && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredBalances.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Chưa có dòng tồn phù hợp.
            </div>
          ) : filteredBalances.map(item => (
            <article key={`${item.warehouseId}-${item.variantId}-${item.batchCode || 'none'}-${item.expiryDate || 'none'}`} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-gray-900">{item.productName || item.variantId}</h3>
                  <p className="mt-1 text-sm text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-bold text-gray-900">{formatNumber(item.quantity)}</p>
                  <p className="text-xs text-gray-500">{item.unit || 'đơn vị'}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-green-50 px-2 py-1 font-medium text-green-700">
                  {STOCK_BALANCE_STATE_LABELS[item.balanceState] || item.balanceState}
                </span>
                {item.batchCode && <span className="rounded-full bg-gray-100 px-2 py-1">Lô {item.batchCode}</span>}
                {item.expiryDate && <span className="rounded-full bg-gray-100 px-2 py-1">HSD {formatDate(item.expiryDate)}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && activeTab === 'documents' && (
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Chưa có phiếu kho phù hợp.
            </div>
          ) : filteredDocuments.map(document => (
            <article key={document.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{document.documentCode}</h3>
                    <span className="rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                      {INVENTORY_DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {INVENTORY_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INVENTORY_DOCUMENT_STATUS_LABELS] || document.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {document.requesterName || 'Kho'} · {formatDate(document.documentDate)}
                  </p>
                  {document.notes && <p className="mt-1 text-sm text-gray-500">{document.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(document.items?.length || 0)} dòng</p>
                  <button
                    type="button"
                    onClick={() => setSelectedDocument(document)}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
              {!!document.items?.length && (
                <div className="mt-3 divide-y divide-gray-100 rounded-md bg-gray-50">
                  {document.items.slice(0, 4).map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-800">{item.productName || item.variantId}</p>
                        <p className="text-xs text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                      </div>
                      <p className="shrink-0 font-semibold text-gray-900">
                        {formatNumber(getDocumentItemQuantity(item))} {item.unit || ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {isRequisitionFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <form onSubmit={handleSubmitRequisition} className="max-h-[94dvh] w-full overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-w-5xl sm:rounded-lg">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
              <div>
                <p className="text-xs font-medium uppercase text-blue-700">Core ledger</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Tạo phiếu yêu cầu vật tư</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequisitionFormOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>

            <div className="grid max-h-[calc(94dvh-142px)] grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                <input
                  value={requisitionSearchTerm}
                  onChange={event => setRequisitionSearchTerm(event.target.value)}
                  placeholder="Tìm vật tư cần yêu cầu..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="space-y-3">
                  {requisitionProducts.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 p-5 text-center text-sm text-gray-500">
                      Không tìm thấy vật tư phù hợp.
                    </div>
                  ) : requisitionProducts.map(product => (
                    <article key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{product.name}</h4>
                        <p className="mt-0.5 text-xs text-gray-500">{product.category}</p>
                      </div>

                      <div className="mt-3 space-y-2">
                        {product.variants.map(variant => {
                          const draft = requisitionDraft[variant.id] || {
                            quantity: 0,
                            purposeType: 'regular_use',
                            notes: '',
                          };
                          const availableQuantity = availableQuantityByVariant[variant.id] || 0;

                          return (
                            <div key={variant.id} className="rounded-md bg-gray-50 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{getVariantLabel(variant.attributes)}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    Tồn khả dụng {formatNumber(availableQuantity)} {variant.unit || ''}
                                  </p>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.quantity || ''}
                                  onChange={event => updateRequisitionDraftLine(variant.id, 'quantity', event.target.value)}
                                  placeholder="SL"
                                  className="w-24 rounded-md border border-gray-300 px-2 py-2 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
                                <select
                                  value={draft.purposeType}
                                  onChange={event => updateRequisitionDraftLine(variant.id, 'purposeType', event.target.value)}
                                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="regular_use">Dùng hằng ngày</option>
                                  <option value="farm_repair">Sửa chữa khu</option>
                                  <option value="exchange">Đổi hàng hỏng</option>
                                  <option value="supplement">Bổ sung</option>
                                  <option value="other">Khác</option>
                                </select>
                                <input
                                  value={draft.notes}
                                  onChange={event => updateRequisitionDraftLine(variant.id, 'notes', event.target.value)}
                                  placeholder="Lý do/ghi chú"
                                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-3 lg:sticky lg:top-0 lg:self-start">
                <div>
                  <label htmlFor="core-requisition-zone" className="block text-sm font-medium text-gray-900">
                    Khu yêu cầu
                  </label>
                  <select
                    id="core-requisition-zone"
                    value={requisitionZoneId}
                    onChange={event => setRequisitionZoneId(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn khu</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="core-requisition-requester" className="block text-sm font-medium text-gray-900">
                    Người yêu cầu
                  </label>
                  <input
                    id="core-requisition-requester"
                    value={requisitionRequesterName}
                    onChange={event => setRequisitionRequesterName(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Tên người yêu cầu"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="core-requisition-notes" className="block text-sm font-medium text-gray-900">
                    Mục đích chung
                  </label>
                  <textarea
                    id="core-requisition-notes"
                    value={requisitionNotes}
                    onChange={event => setRequisitionNotes(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nội dung yêu cầu"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Vật tư yêu cầu ({formatNumber(requisitionItems.length)})</h4>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {requisitionItems.length === 0 ? (
                      <p className="rounded-md bg-white p-3 text-sm text-gray-500">
                        Nhập số lượng ở danh sách bên trái.
                      </p>
                    ) : requisitionItems.map(({ product, variant, draft }) => (
                      <div key={variant.id} className="rounded-md bg-white p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{getVariantLabel(variant.attributes)}</p>
                          </div>
                          <p className="shrink-0 font-semibold text-gray-900">
                            {formatNumber(draft.quantity)} {variant.unit || ''}
                          </p>
                        </div>
                        {draft.notes && <p className="mt-2 text-xs text-gray-500">{draft.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-4">
              <button
                type="submit"
                disabled={isSavingRequisition}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
              >
                {isSavingRequisition ? 'Đang lưu...' : 'Gửi yêu cầu'}
              </button>
              <button
                type="button"
                onClick={() => setIsRequisitionFormOpen(false)}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:flex-none"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {isReceiptFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <form onSubmit={handleSubmitReceipt} className="max-h-[94dvh] w-full overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-w-5xl sm:rounded-lg">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
              <div>
                <p className="text-xs font-medium uppercase text-green-700">Core ledger</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Tạo phiếu nhập kho</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptFormOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>

            <div className="grid max-h-[calc(94dvh-142px)] grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                <input
                  value={receiptSearchTerm}
                  onChange={event => setReceiptSearchTerm(event.target.value)}
                  placeholder="Tìm vật tư cần nhập..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />

                <div className="space-y-3">
                  {receiptProducts.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 p-5 text-center text-sm text-gray-500">
                      Không tìm thấy vật tư phù hợp.
                    </div>
                  ) : receiptProducts.map(product => (
                    <article key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{product.name}</h4>
                        <p className="mt-0.5 text-xs text-gray-500">{product.category}</p>
                      </div>

                      <div className="mt-3 space-y-2">
                        {product.variants.map(variant => {
                          const draft = receiptDraft[variant.id] || {
                            quantity: 0,
                            batchCode: '',
                            expiryDate: '',
                            unitPrice: '',
                          };

                          return (
                            <div key={variant.id} className="rounded-md bg-gray-50 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{getVariantLabel(variant.attributes)}</p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    Tồn legacy {formatNumber(variant.stock || 0)} {variant.unit || ''}
                                  </p>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.quantity || ''}
                                  onChange={event => updateReceiptDraftLine(variant.id, 'quantity', event.target.value)}
                                  placeholder="SL"
                                  className="w-24 rounded-md border border-gray-300 px-2 py-2 text-right text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <input
                                  value={draft.batchCode}
                                  onChange={event => updateReceiptDraftLine(variant.id, 'batchCode', event.target.value)}
                                  placeholder="Mã lô"
                                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                                <input
                                  type="date"
                                  value={draft.expiryDate}
                                  onChange={event => updateReceiptDraftLine(variant.id, 'expiryDate', event.target.value)}
                                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={draft.unitPrice}
                                  onChange={event => updateReceiptDraftLine(variant.id, 'unitPrice', event.target.value)}
                                  placeholder="Đơn giá"
                                  className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-3 lg:sticky lg:top-0 lg:self-start">
                <div>
                  <label htmlFor="core-receipt-supplier" className="block text-sm font-medium text-gray-900">
                    Nhà cung cấp
                  </label>
                  <input
                    id="core-receipt-supplier"
                    value={supplierName}
                    onChange={event => setSupplierName(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Tên cửa hàng/nhà cung cấp"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="core-receipt-notes" className="block text-sm font-medium text-gray-900">
                    Ghi chú
                  </label>
                  <textarea
                    id="core-receipt-notes"
                    value={receiptNotes}
                    onChange={event => setReceiptNotes(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Nội dung nhập kho"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Vật tư sẽ nhập ({formatNumber(receiptItems.length)})</h4>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {receiptItems.length === 0 ? (
                      <p className="rounded-md bg-white p-3 text-sm text-gray-500">
                        Nhập số lượng ở danh sách bên trái.
                      </p>
                    ) : receiptItems.map(({ product, variant, draft }) => (
                      <div key={variant.id} className="rounded-md bg-white p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{getVariantLabel(variant.attributes)}</p>
                          </div>
                          <p className="shrink-0 font-semibold text-gray-900">
                            {formatNumber(draft.quantity)} {variant.unit || ''}
                          </p>
                        </div>
                        {(draft.batchCode || draft.expiryDate) && (
                          <p className="mt-2 text-xs text-gray-500">
                            {draft.batchCode ? `Lô ${draft.batchCode}` : ''}
                            {draft.batchCode && draft.expiryDate ? ' · ' : ''}
                            {draft.expiryDate ? `HSD ${formatDate(draft.expiryDate)}` : ''}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-4">
              <button
                type="submit"
                disabled={isSavingReceipt}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
              >
                {isSavingReceipt ? 'Đang lưu...' : 'Lưu phiếu nhập'}
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptFormOpen(false)}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:flex-none"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {isIssueFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <form onSubmit={handleSubmitIssue} className="max-h-[94dvh] w-full overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-w-5xl sm:rounded-lg">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
              <div>
                <p className="text-xs font-medium uppercase text-yellow-700">Core ledger</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">Tạo phiếu xuất kho</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueFormOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>

            <div className="grid max-h-[calc(94dvh-142px)] grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                <input
                  value={issueSearchTerm}
                  onChange={event => setIssueSearchTerm(event.target.value)}
                  placeholder="Tìm vật tư cần xuất..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                />

                <div className="space-y-3">
                  {issueProducts.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 p-5 text-center text-sm text-gray-500">
                      Không tìm thấy vật tư phù hợp.
                    </div>
                  ) : issueProducts.map(product => (
                    <article key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{product.name}</h4>
                        <p className="mt-0.5 text-xs text-gray-500">{product.category}</p>
                      </div>

                      <div className="mt-3 space-y-2">
                        {product.variants.map(variant => {
                          const draft = issueDraft[variant.id] || {
                            quantity: 0,
                            notes: '',
                          };
                          const availableQuantity = availableQuantityByVariant[variant.id] || 0;
                          const isOverAvailable = draft.quantity > availableQuantity;

                          return (
                            <div key={variant.id} className="rounded-md bg-gray-50 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{getVariantLabel(variant.attributes)}</p>
                                  <p className={`mt-0.5 text-xs ${availableQuantity > 0 ? 'text-gray-500' : 'font-medium text-red-600'}`}>
                                    Tồn khả dụng {formatNumber(availableQuantity)} {variant.unit || ''}
                                  </p>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={draft.quantity || ''}
                                  onChange={event => updateIssueDraftLine(variant.id, 'quantity', event.target.value)}
                                  placeholder="SL"
                                  className={`w-24 rounded-md border px-2 py-2 text-right text-sm focus:outline-none focus:ring-1 ${
                                    isOverAvailable
                                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                      : 'border-gray-300 focus:border-yellow-500 focus:ring-yellow-500'
                                  }`}
                                />
                              </div>
                              <textarea
                                value={draft.notes}
                                onChange={event => updateIssueDraftLine(variant.id, 'notes', event.target.value)}
                                rows={2}
                                placeholder="Lý do/ghi chú riêng cho dòng này"
                                className="mt-3 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                              />
                              {isOverAvailable && (
                                <p className="mt-2 text-xs font-medium text-red-600">
                                  Số lượng xuất đang vượt tồn khả dụng.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-3 lg:sticky lg:top-0 lg:self-start">
                <div>
                  <label htmlFor="core-issue-zone" className="block text-sm font-medium text-gray-900">
                    Khu nhận
                  </label>
                  <select
                    id="core-issue-zone"
                    value={issueZoneId}
                    onChange={event => setIssueZoneId(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    required
                  >
                    <option value="">Chọn khu</option>
                    {zones.map(zone => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="core-issue-requester" className="block text-sm font-medium text-gray-900">
                    Người nhận/yêu cầu
                  </label>
                  <input
                    id="core-issue-requester"
                    value={issueRequesterName}
                    onChange={event => setIssueRequesterName(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Tên người nhận"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="core-issue-notes" className="block text-sm font-medium text-gray-900">
                    Ghi chú
                  </label>
                  <textarea
                    id="core-issue-notes"
                    value={issueNotes}
                    onChange={event => setIssueNotes(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    placeholder="Nội dung xuất kho"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Vật tư sẽ xuất ({formatNumber(issueItems.length)})</h4>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {issueItems.length === 0 ? (
                      <p className="rounded-md bg-white p-3 text-sm text-gray-500">
                        Nhập số lượng ở danh sách bên trái.
                      </p>
                    ) : issueItems.map(({ product, variant, draft }) => {
                      const availableQuantity = availableQuantityByVariant[variant.id] || 0;
                      return (
                        <div key={variant.id} className="rounded-md bg-white p-3 text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{getVariantLabel(variant.attributes)}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                Còn {formatNumber(availableQuantity)} {variant.unit || ''}
                              </p>
                            </div>
                            <p className={`shrink-0 font-semibold ${draft.quantity > availableQuantity ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatNumber(draft.quantity)} {variant.unit || ''}
                            </p>
                          </div>
                          {draft.notes && <p className="mt-2 text-xs text-gray-500">{draft.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-4">
              <button
                type="submit"
                disabled={isSavingIssue}
                className="flex-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
              >
                {isSavingIssue ? 'Đang lưu...' : 'Lưu phiếu xuất'}
              </button>
              <button
                type="button"
                onClick={() => setIsIssueFormOpen(false)}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:flex-none"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[92dvh] w-full overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-w-4xl sm:rounded-lg">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-gray-500">
                  {INVENTORY_DOCUMENT_TYPE_LABELS[selectedDocument.documentType] || selectedDocument.documentType}
                </p>
                <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">{selectedDocument.documentCode}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(selectedDocument.documentDate)} · {selectedDocument.requesterName || 'Kho'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[calc(92dvh-140px)] overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {INVENTORY_DOCUMENT_STATUS_LABELS[selectedDocument.status as keyof typeof INVENTORY_DOCUMENT_STATUS_LABELS] || selectedDocument.status}
                  </p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Số dòng</p>
                  <p className="mt-1 font-semibold text-gray-900">{formatNumber(selectedDocument.items?.length || 0)}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Ngày tạo</p>
                  <p className="mt-1 font-semibold text-gray-900">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Legacy</p>
                  <p className="mt-1 truncate font-semibold text-gray-900">{selectedDocument.legacyTable || '-'}</p>
                </div>
              </div>

              {selectedDocument.notes && (
                <div className="mt-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-900">
                  {selectedDocument.notes}
                </div>
              )}

              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden grid-cols-[48px_1fr_100px_120px_1fr] gap-0 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase text-gray-500 md:grid">
                  <span>STT</span>
                  <span>Vật tư</span>
                  <span>ĐVT</span>
                  <span className="text-right">Số lượng</span>
                  <span>Ghi chú</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {(selectedDocument.items || []).map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 gap-2 px-3 py-3 text-sm md:grid-cols-[48px_1fr_100px_120px_1fr] md:items-start">
                      <span className="hidden text-gray-500 md:block">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{item.productName || item.variantId}</p>
                        <p className="text-xs text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                      </div>
                      <span className="text-gray-600">{item.unit || '-'}</span>
                      <span className="font-semibold text-gray-900 md:text-right">
                        {formatNumber(getDocumentItemQuantity(item))}
                      </span>
                      <span className="text-gray-500">{item.reason || item.notes || '-'}</span>
                    </div>
                  ))}
                  {(!selectedDocument.items || selectedDocument.items.length === 0) && (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      Phiếu chưa có dòng vật tư.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-4">
              {selectedDocument.documentType === 'requisition' && (
                <button
                  type="button"
                  onClick={() => handleIssueSelectedRequisition(selectedDocument)}
                  disabled={isIssuingSelectedDocument || selectedDocument.status === 'issued' || selectedDocument.status === 'received'}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
                >
                  {isIssuingSelectedDocument ? 'Đang xuất...' : 'Xuất theo phiếu'}
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePrintDocument(selectedDocument)}
                className="flex-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 sm:flex-none"
              >
                In phiếu
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 sm:flex-none"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && activeTab === 'movements' && (
        <div className="space-y-3">
          {filteredMovements.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Chưa có phát sinh phù hợp.
            </div>
          ) : filteredMovements.map(movement => (
            <article key={movement.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                      {STOCK_MOVEMENT_TYPE_LABELS[movement.movementType] || movement.movementType}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(movement.occurredAt)}</span>
                  </div>
                  <h3 className="mt-2 truncate text-base font-semibold text-gray-900">{movement.productName || movement.variantId}</h3>
                  <p className="mt-1 text-sm text-gray-500">{getVariantLabel(movement.variantAttributes)}</p>
                  {movement.notes && <p className="mt-2 text-sm text-gray-500">{movement.notes}</p>}
                </div>
                <p className="shrink-0 text-right text-lg font-bold text-gray-900">
                  {formatNumber(movement.quantity)} {movement.unit || ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default InventoryCoreWorkspace;

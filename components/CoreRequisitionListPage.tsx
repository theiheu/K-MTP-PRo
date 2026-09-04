import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { inventoryDocumentsCoreService, stockCoreService } from '../services/inventoryCoreService';
import { useAuthStore } from '../store/authStore';
import type { InventoryDocument, StockBalance } from '../types/inventory';
import {
  INVENTORY_DOCUMENT_STATUS_LABELS,
  INVENTORY_DOCUMENT_TYPE_LABELS,
} from '../types/inventory';

type StatusFilter = 'all' | 'submitted' | 'approved' | 'issued' | 'received' | 'cancelled';

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'submitted', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'issued', label: 'Đã xuất' },
  { value: 'received', label: 'Đã nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
];

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

const getItemQuantity = (item: NonNullable<InventoryDocument['items']>[number]) =>
  item.quantityIssued || item.quantityApproved || item.quantityRequested || item.quantityReceived || 0;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderRequisitionPrintHtml = (document: InventoryDocument) => {
  const status = INVENTORY_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INVENTORY_DOCUMENT_STATUS_LABELS] || document.status;
  const rows = (document.items || []).map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${escapeHtml(item.productName || item.variantId)}</strong>
        <div>${escapeHtml(getVariantLabel(item.variantAttributes))}</div>
      </td>
      <td>${escapeHtml(item.unit || '')}</td>
      <td class="number">${formatNumber(getItemQuantity(item))}</td>
      <td>${escapeHtml(item.purposeType || '')}</td>
      <td>${escapeHtml(item.notes || item.reason || '')}</td>
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
          .code { text-align: center; margin: 0; }
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
        <h1>Phiếu yêu cầu vật tư</h1>
        <p class="code">${escapeHtml(document.documentCode)}</p>
        <div class="meta">
          <div><strong>Ngày yêu cầu:</strong> ${escapeHtml(formatDate(document.documentDate))}</div>
          <div><strong>Trạng thái:</strong> ${escapeHtml(status)}</div>
          <div><strong>Người yêu cầu:</strong> ${escapeHtml(document.requesterName || '-')}</div>
          <div><strong>Số dòng:</strong> ${formatNumber(document.items?.length || 0)}</div>
          <div style="grid-column:1 / -1;"><strong>Mục đích/Ghi chú:</strong> ${escapeHtml(document.notes || '-')}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:48px;">STT</th>
              <th>Vật tư</th>
              <th style="width:80px;">ĐVT</th>
              <th style="width:100px;">Số lượng</th>
              <th style="width:120px;">Mục đích</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">Không có dòng vật tư</td></tr>'}</tbody>
        </table>
        <div class="signatures">
          <div><strong>Người yêu cầu</strong><div class="signature-space"></div></div>
          <div><strong>Thủ kho</strong><div class="signature-space"></div></div>
          <div><strong>Quản lý duyệt</strong><div class="signature-space"></div></div>
        </div>
      </body>
    </html>
  `;
};

const CoreRequisitionListPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [documents, setDocuments] = useState<InventoryDocument[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<InventoryDocument | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isManager = user?.role === 'manager';

  const loadRequisitions = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [nextDocuments, nextBalances] = await Promise.all([
        inventoryDocumentsCoreService.getByType('requisition'),
        stockCoreService.getBalances(),
      ]);
      setDocuments(nextDocuments);
      setBalances(nextBalances);
    } catch (error) {
      console.warn('Không tải được phiếu yêu cầu core:', error);
      setErrorMessage('Không tải được phiếu yêu cầu từ sổ kho mới.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequisitions();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleDocuments = useMemo(
    () => documents.filter(document => {
      if (statusFilter !== 'all' && document.status !== statusFilter) return false;
      if (!normalizedSearch) return true;
      return [
        document.documentCode,
        document.requesterName,
        document.notes,
        INVENTORY_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INVENTORY_DOCUMENT_STATUS_LABELS],
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }),
    [documents, normalizedSearch, statusFilter]
  );

  const statusCounts = useMemo(
    () => documents.reduce<Record<string, number>>((acc, document) => {
      acc[document.status] = (acc[document.status] || 0) + 1;
      return acc;
    }, {}),
    [documents]
  );

  const availableQuantityByVariant = useMemo(
    () => balances.reduce<Record<string, number>>((acc, item) => {
      if (item.balanceState !== 'available') return acc;
      acc[item.variantId] = (acc[item.variantId] || 0) + item.quantity;
      return acc;
    }, {}),
    [balances]
  );

  const handleUpdateStatus = async (
    document: InventoryDocument,
    status: 'approved' | 'received' | 'cancelled',
    successMessage: string
  ) => {
    setIsUpdating(true);
    try {
      await inventoryDocumentsCoreService.updateStatus(document.id, status, user?.id);
      toast.success(successMessage);
      setSelectedDocument(null);
      await loadRequisitions();
    } catch (error) {
      console.error('Không cập nhật được phiếu yêu cầu core:', error);
      toast.error('Không cập nhật được phiếu yêu cầu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIssueRequisition = async (document: InventoryDocument) => {
    const items = document.items || [];
    if (!isManager || document.status !== 'approved' || items.length === 0) return;

    const overIssuedItem = items.find(item =>
      getItemQuantity(item) > (availableQuantityByVariant[item.variantId] || 0)
    );

    if (overIssuedItem) {
      toast.error('Phiếu có vật tư vượt tồn khả dụng.');
      return;
    }

    setIsIssuing(true);
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
          source: 'core_requisition_list',
          requisitionDocumentId: document.id,
          requisitionDocumentCode: document.documentCode,
        },
        items: items.map((item, index) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: getItemQuantity(item),
          quantityRequested: item.quantityRequested,
          quantityApproved: item.quantityApproved || item.quantityRequested,
          quantityIssued: getItemQuantity(item),
          unit: item.unit,
          purposeType: item.purposeType,
          reason: item.reason,
          notes: item.notes,
          displayOrder: index,
          metadata: {
            source: 'core_requisition_list_issue',
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
      setStatusFilter('issued');
      await loadRequisitions();
    } catch (error) {
      console.error('Không xuất được theo phiếu yêu cầu core:', error);
      toast.error('Không xuất được theo phiếu yêu cầu.');
    } finally {
      setIsIssuing(false);
    }
  };

  const handlePrintRequisition = (document: InventoryDocument) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(renderRequisitionPrintHtml(document));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-blue-700">Core ledger</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Phiếu yêu cầu vật tư</h1>
          <p className="mt-1 text-sm text-gray-600">Theo dõi yêu cầu từ các khu trong hệ thống kho mới.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/warehouse/request')}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Tạo yêu cầu
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <input
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder="Tìm mã phiếu, người yêu cầu, ghi chú..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map(filter => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-75">
                ({formatNumber(filter.value === 'all' ? documents.length : statusCounts[filter.value] || 0)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Đang tải phiếu yêu cầu...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <div className="mt-4 space-y-3">
          {visibleDocuments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Không có phiếu yêu cầu phù hợp.
            </div>
          ) : visibleDocuments.map(document => (
            <article key={document.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">{document.documentCode}</h2>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {INVENTORY_DOCUMENT_TYPE_LABELS.requisition}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {INVENTORY_DOCUMENT_STATUS_LABELS[document.status as keyof typeof INVENTORY_DOCUMENT_STATUS_LABELS] || document.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {document.requesterName || 'Người yêu cầu'} · {formatDate(document.documentDate)}
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
            </article>
          ))}
        </div>
      )}

      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[92dvh] w-full overflow-hidden rounded-t-lg bg-white shadow-xl sm:max-w-3xl sm:rounded-lg">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-blue-700">Phiếu yêu cầu</p>
                <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">{selectedDocument.documentCode}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(selectedDocument.documentDate)} · {selectedDocument.requesterName || '-'}
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
              <div className="grid grid-cols-2 gap-3 text-sm">
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
              </div>

              {selectedDocument.notes && (
                <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                  {selectedDocument.notes}
                </div>
              )}

              <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
                {(selectedDocument.items || []).map(item => (
                  <div key={item.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{item.productName || item.variantId}</p>
                        <p className="mt-1 text-xs text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Tồn khả dụng {formatNumber(availableQuantityByVariant[item.variantId] || 0)} {item.unit || ''}
                        </p>
                        {(item.purposeType || item.notes) && (
                          <p className="mt-2 text-xs text-gray-500">{item.purposeType || ''}{item.purposeType && item.notes ? ' · ' : ''}{item.notes || ''}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-gray-900">
                        {formatNumber(getItemQuantity(item))} {item.unit || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={() => handlePrintRequisition(selectedDocument)}
                className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 sm:flex-none"
              >
                In phiếu
              </button>
              {isManager && selectedDocument.status === 'submitted' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(selectedDocument, 'approved', 'Đã duyệt phiếu yêu cầu.')}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
                >
                  Duyệt
                </button>
              )}
              {selectedDocument.status === 'issued' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(selectedDocument, 'received', 'Đã xác nhận nhận vật tư.')}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
                >
                  Đã nhận
                </button>
              )}
              {isManager && selectedDocument.status === 'approved' && (
                <button
                  type="button"
                  disabled={isIssuing}
                  onClick={() => handleIssueRequisition(selectedDocument)}
                  className="flex-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
                >
                  {isIssuing ? 'Đang xuất...' : 'Xuất kho'}
                </button>
              )}
              {isManager && ['submitted', 'approved'].includes(String(selectedDocument.status)) && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(selectedDocument, 'cancelled', 'Đã hủy phiếu yêu cầu.')}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:flex-none"
                >
                  Hủy
                </button>
              )}
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
    </main>
  );
};

export default CoreRequisitionListPage;

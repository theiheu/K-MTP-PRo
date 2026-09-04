import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryDocumentsCoreService, stockCoreService, warehousesCoreService } from '../services/inventoryCoreService';
import { useAuthStore } from '../store/authStore';
import type { InventoryDocument, StockBalance } from '../types/inventory';
import {
  INVENTORY_DOCUMENT_TYPE_LABELS,
  STOCK_BALANCE_STATE_LABELS,
} from '../types/inventory';

type DefectAction = 'defective_return' | 'repair_issue' | 'repair_return' | 'disposal';

const actionOptions: Array<{ value: DefectAction; label: string }> = [
  { value: 'defective_return', label: 'Trả hàng hỏng (available → defective)' },
  { value: 'repair_issue', label: 'Xuất đi sửa (defective → repairing)' },
  { value: 'repair_return', label: 'Nhập sau sửa (repairing → available)' },
  { value: 'disposal', label: 'Thanh lý (→ disposed)' },
];

const sourceStateByAction: Record<DefectAction, 'available' | 'defective' | 'repairing'> = {
  defective_return: 'available',
  repair_issue: 'defective',
  repair_return: 'repairing',
  disposal: 'defective',
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

const CoreDefectManagement: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [documents, setDocuments] = useState<InventoryDocument[]>([]);
  const [action, setAction] = useState<DefectAction>('defective_return');
  const [disposalSourceState, setDisposalSourceState] = useState<'available' | 'defective'>('defective');
  const [draft, setDraft] = useState<Record<string, { quantity: string; reason: string }>>({});
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [nextBalances, nextDocuments] = await Promise.all([
        stockCoreService.getBalances(),
        Promise.all([
          inventoryDocumentsCoreService.getByType('defective_return'),
          inventoryDocumentsCoreService.getByType('repair_issue'),
          inventoryDocumentsCoreService.getByType('repair_return'),
          inventoryDocumentsCoreService.getByType('disposal'),
        ]),
      ]);
      setBalances(nextBalances);
      setDocuments(
        nextDocuments[1]
          .flat()
          .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
          .slice(0, 30)
      );
    } catch (error) {
      console.warn('Không tải được dữ liệu hỏng/sửa core:', error);
      setErrorMessage('Không tải được dữ liệu hỏng/sửa từ sổ kho mới.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sourceState = action === 'disposal' ? disposalSourceState : sourceStateByAction[action];

  const sourceBalances = useMemo(
    () => balances.filter(item => item.balanceState === sourceState && item.quantity > 0),
    [balances, sourceState]
  );

  const selectedLines = useMemo(
    () => sourceBalances
      .map(balance => {
        const line = draft[balance.id];
        const quantity = line?.quantity ? Number(line.quantity) : 0;
        return {
          balance,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          reason: line?.reason || '',
        };
      })
      .filter(line => line.quantity > 0),
    [sourceBalances, draft]
  );

  const totalQuantity = selectedLines.reduce((sum, line) => sum + line.quantity, 0);

  const stateSummary = useMemo(() => {
    const summary: Record<string, number> = { available: 0, defective: 0, repairing: 0, disposed: 0 };
    balances.forEach(balance => {
      summary[balance.balanceState] = (summary[balance.balanceState] || 0) + balance.quantity;
    });
    return summary;
  }, [balances]);

  const handleQuantityChange = (balanceId: string, quantity: string) => {
    setDraft(prev => ({
      ...prev,
      [balanceId]: { quantity, reason: prev[balanceId]?.reason || '' },
    }));
  };

  const handleReasonChange = (balanceId: string, reason: string) => {
    setDraft(prev => ({
      ...prev,
      [balanceId]: { quantity: prev[balanceId]?.quantity || '', reason },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedLines.length === 0) {
      toast.error('Vui lòng nhập ít nhất một vật tư.');
      return;
    }

    setIsSaving(true);
    try {
      const mainWarehouse = await warehousesCoreService.getMainWarehouse();
      const items = selectedLines.map((line, index) => ({
        productId: line.balance.productId,
        variantId: line.balance.variantId,
        quantity: line.quantity,
        unit: line.balance.unit,
        batchCode: line.balance.batchCode,
        expiryDate: line.balance.expiryDate,
        reason: line.reason.trim() || notes.trim() || undefined,
        displayOrder: index,
        metadata: {
          source: 'core_defect_management',
          stockBalanceId: line.balance.id,
        },
      }));

      const common = {
        warehouseId: mainWarehouse?.id,
        createdBy: user?.id,
        createdByName: user?.name,
        notes: notes.trim() || undefined,
        metadata: { source: 'core_defect_management' },
        items,
      };

      if (action === 'defective_return') {
        await inventoryDocumentsCoreService.createDefectiveReturn(common);
      } else if (action === 'repair_issue') {
        await inventoryDocumentsCoreService.createRepairIssue(common);
      } else if (action === 'repair_return') {
        await inventoryDocumentsCoreService.createRepairReturn(common);
      } else {
        await inventoryDocumentsCoreService.createDisposal({ ...common, sourceState: disposalSourceState });
      }

      toast.success('Đã ghi nghiệp vụ hỏng/sửa vào sổ kho mới.');
      setDraft({});
      setNotes('');
      await loadData();
    } catch (error) {
      console.error('Không ghi được nghiệp vụ hỏng/sửa core:', error);
      toast.error('Không ghi được nghiệp vụ. Kiểm tra migration 019 trên Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-purple-700">Core ledger</p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900">Hàng hỏng & Sửa chữa</h2>
          <p className="mt-1 text-sm text-gray-600">
            Trả hàng hỏng, xuất đi sửa, nhập sau sửa và thanh lý đều ghi vào <code>stock_movements</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">{STOCK_BALANCE_STATE_LABELS.available}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(stateSummary.available)}</p>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-600">{STOCK_BALANCE_STATE_LABELS.defective}</p>
          <p className="mt-1 text-xl font-bold text-red-700">{formatNumber(stateSummary.defective)}</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">{STOCK_BALANCE_STATE_LABELS.repairing}</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatNumber(stateSummary.repairing)}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">{STOCK_BALANCE_STATE_LABELS.disposed}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(stateSummary.disposed)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-xs font-medium text-gray-600">Loại nghiệp vụ</span>
            <select
              value={action}
              onChange={event => {
                setAction(event.target.value as DefectAction);
                setDraft({});
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            >
              {actionOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {action === 'disposal' && (
            <label className="text-sm">
              <span className="block text-xs font-medium text-gray-600">Nguồn thanh lý</span>
              <select
                value={disposalSourceState}
                onChange={event => {
                  setDisposalSourceState(event.target.value as 'available' | 'defective');
                  setDraft({});
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="defective">Hàng hỏng</option>
                <option value="available">Hàng khả dụng</option>
              </select>
            </label>
          )}
        </div>

        <textarea
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={2}
          placeholder="Ghi chú chung"
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">
            Chọn vật tư ({STOCK_BALANCE_STATE_LABELS[sourceState]})
          </p>
          <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
            {sourceBalances.length === 0 ? (
              <p className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                Không có vật tư ở trạng thái này.
              </p>
            ) : sourceBalances.map(balance => {
              const line = draft[balance.id] || { quantity: '', reason: '' };
              return (
                <div key={balance.id} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{balance.productName || balance.variantId}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {getVariantLabel(balance.variantAttributes)}
                        {balance.batchCode ? ` · Lô ${balance.batchCode}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Còn {formatNumber(balance.quantity)} {balance.unit || ''}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={balance.quantity}
                      value={line.quantity}
                      onChange={event => handleQuantityChange(balance.id, event.target.value)}
                      placeholder="SL"
                      className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={line.reason}
                    onChange={event => handleReasonChange(balance.id, event.target.value)}
                    placeholder="Lý do (tuỳ chọn)"
                    className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-600">
            {formatNumber(selectedLines.length)} dòng · {formatNumber(totalQuantity)} đơn vị
          </p>
          <button
            type="submit"
            disabled={isSaving || selectedLines.length === 0}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSaving ? 'Đang ghi...' : 'Ghi vào sổ kho'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Đang tải...</div>
      )}

      {!isLoading && errorMessage && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">{errorMessage}</div>
      )}

      {!isLoading && !errorMessage && documents.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900">Phiếu hỏng/sửa gần đây</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <th className="border border-gray-200 px-3 py-2">Mã phiếu</th>
                  <th className="border border-gray-200 px-3 py-2">Loại</th>
                  <th className="border border-gray-200 px-3 py-2">Ngày</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Dòng</th>
                  <th className="border border-gray-200 px-3 py-2">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(document => (
                  <tr key={document.id} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">{document.documentCode}</td>
                    <td className="border border-gray-200 px-3 py-2">{INVENTORY_DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}</td>
                    <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">{formatDate(document.documentDate)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(document.items?.length || 0)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">{document.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
};

export default CoreDefectManagement;

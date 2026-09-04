import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryDocumentsCoreService, stockCoreService, warehousesCoreService } from '../services/inventoryCoreService';
import { useAuthStore } from '../store/authStore';
import { INVENTORY_DOCUMENT_TYPE_LABELS } from '../types/inventory';
import type { InventoryDocument, StockBalance } from '../types/inventory';

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

const CoreInventoryAuditSection: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [countedQuantities, setCountedQuantities] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [history, setHistory] = useState<InventoryDocument[]>([]);

  const loadBalances = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const nextBalances = await stockCoreService.getBalances();
      setBalances(nextBalances.filter(item => item.balanceState === 'available'));
    } catch (error) {
      console.warn('Không tải được tồn kiểm kê core:', error);
      setErrorMessage('Không tải được tồn kho mới để kiểm kê.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const [adjustments, audits] = await Promise.all([
        inventoryDocumentsCoreService.getByType('stock_adjustment'),
        inventoryDocumentsCoreService.getByType('stock_audit'),
      ]);

      setHistory(
        [...adjustments, ...audits]
          .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
          .slice(0, 30)
      );
    } catch (error) {
      console.warn('Không tải được lịch sử kiểm kê core:', error);
    }
  };

  useEffect(() => {
    loadBalances();
    loadHistory();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleBalances = useMemo(
    () => balances.filter(item => {
      if (!normalizedSearch) return true;
      return [
        item.productName,
        getVariantLabel(item.variantAttributes),
        item.unit,
        item.batchCode,
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }),
    [balances, normalizedSearch]
  );

  const countedRows = useMemo(
    () => balances.map(balance => {
      const rawValue = countedQuantities[balance.id];
      const actualQuantity = rawValue === undefined || rawValue === '' ? null : Number(rawValue);
      const delta = actualQuantity === null || !Number.isFinite(actualQuantity)
        ? 0
        : actualQuantity - balance.quantity;
      return {
        balance,
        actualQuantity,
        delta,
      };
    }),
    [balances, countedQuantities]
  );

  const changedRows = useMemo(
    () => countedRows.filter(row => row.actualQuantity !== null && row.delta !== 0),
    [countedRows]
  );

  const countedTotal = useMemo(
    () => countedRows.filter(row => row.actualQuantity !== null).length,
    [countedRows]
  );

  const shortageCount = useMemo(
    () => changedRows.filter(row => row.delta < 0).length,
    [changedRows]
  );

  const surplusCount = useMemo(
    () => changedRows.filter(row => row.delta > 0).length,
    [changedRows]
  );

  const handleFillSystemQuantities = () => {
    const next: Record<string, string> = {};
    balances.forEach(balance => {
      next[balance.id] = String(balance.quantity);
    });
    setCountedQuantities(next);
  };

  const handleSubmitAudit = async () => {
    if (changedRows.length === 0) {
      toast.error('Chưa có dòng lệch cần điều chỉnh.');
      return;
    }

    setIsSaving(true);
    try {
      const mainWarehouse = await warehousesCoreService.getMainWarehouse();

      await inventoryDocumentsCoreService.createStockAdjustment({
        warehouseId: mainWarehouse?.id,
        createdBy: user?.id,
        createdByName: user?.name,
        notes: notes.trim() || 'Điều chỉnh từ kiểm kê core',
        metadata: {
          source: 'core_inventory_audit_section',
          countedRows: countedTotal,
          changedRows: changedRows.length,
        },
        items: changedRows.map((row, index) => ({
          productId: row.balance.productId,
          variantId: row.balance.variantId,
          adjustmentDelta: row.delta,
          unit: row.balance.unit,
          batchCode: row.balance.batchCode,
          expiryDate: row.balance.expiryDate,
          reason: row.delta > 0 ? 'Kiểm kê thừa' : 'Kiểm kê thiếu',
          notes: `Sổ kho: ${formatNumber(row.balance.quantity)}; Thực tế: ${formatNumber(row.actualQuantity || 0)}`,
          displayOrder: index,
          metadata: {
            stockBalanceId: row.balance.id,
            systemQuantity: row.balance.quantity,
            actualQuantity: row.actualQuantity,
          },
        })),
        allowNegative: true,
      });

      toast.success('Đã ghi điều chỉnh kiểm kê.');
      setCountedQuantities({});
      setNotes('');
      await loadBalances();
    } catch (error) {
      console.error('Không ghi được kiểm kê core:', error);
      toast.error('Không ghi được điều chỉnh kiểm kê.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-green-700">Core ledger</p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900">Kiểm kê kho</h2>
          <p className="mt-1 text-sm text-gray-600">
            Nhập số thực tế theo từng dòng tồn khả dụng, hệ thống tự tạo phiếu điều chỉnh cho phần chênh lệch.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Đã kiểm</p>
            <p className="text-base font-semibold text-gray-900">{formatNumber(countedTotal)}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Thiếu</p>
            <p className="text-base font-semibold text-red-600">{formatNumber(shortageCount)}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs text-gray-500">Thừa</p>
            <p className="text-base font-semibold text-green-700">{formatNumber(surplusCount)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Tìm vật tư, biến thể, mã lô..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleFillSystemQuantities}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Điền theo sổ
          </button>
        </div>
        <textarea
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={2}
          placeholder="Ghi chú kiểm kê"
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Đang tải tồn kho để kiểm kê...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <div className="space-y-3">
          {visibleBalances.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Không có dòng tồn phù hợp.
            </div>
          ) : visibleBalances.map(balance => {
            const rawValue = countedQuantities[balance.id] || '';
            const actualQuantity = rawValue === '' ? null : Number(rawValue);
            const delta = actualQuantity === null || !Number.isFinite(actualQuantity)
              ? 0
              : actualQuantity - balance.quantity;

            return (
              <article key={balance.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">{balance.productName || balance.variantId}</h3>
                    <p className="mt-1 text-sm text-gray-500">{getVariantLabel(balance.variantAttributes)}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      {balance.batchCode && <span className="rounded-full bg-gray-100 px-2 py-1">Lô {balance.batchCode}</span>}
                      {balance.expiryDate && <span className="rounded-full bg-gray-100 px-2 py-1">HSD {formatDate(balance.expiryDate)}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-72">
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Theo sổ</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatNumber(balance.quantity)} {balance.unit || ''}
                      </p>
                    </div>
                    <label className="rounded-md bg-gray-50 p-3">
                      <span className="text-xs text-gray-500">Thực tế</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rawValue}
                        onChange={event => setCountedQuantities(prev => ({
                          ...prev,
                          [balance.id]: event.target.value,
                        }))}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm font-semibold focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="SL"
                      />
                    </label>
                  </div>
                </div>
                {actualQuantity !== null && (
                  <p className={`mt-3 text-sm font-medium ${
                    delta === 0 ? 'text-gray-500' : delta > 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {delta === 0
                      ? 'Khớp với sổ kho'
                      : `${delta > 0 ? 'Thừa' : 'Thiếu'} ${formatNumber(Math.abs(delta))} ${balance.unit || ''}`}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900">Lịch sử kiểm kê / điều chỉnh</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <th className="border border-gray-200 px-3 py-2">Mã phiếu</th>
                  <th className="border border-gray-200 px-3 py-2">Loại</th>
                  <th className="border border-gray-200 px-3 py-2">Ngày</th>
                  <th className="border border-gray-200 px-3 py-2">Người lập</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Dòng lệch</th>
                  <th className="border border-gray-200 px-3 py-2">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {history.map(document => {
                  const deltaRows = (document.items || []).filter(item => {
                    const delta = Number(item.metadata?.adjustmentDelta || 0);
                    return delta !== 0;
                  });
                  const actorName = (document.events || []).find(event => event.actorName)?.actorName || '-';

                  return (
                    <tr key={document.id} className="odd:bg-white even:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">{document.documentCode}</td>
                      <td className="border border-gray-200 px-3 py-2">{INVENTORY_DOCUMENT_TYPE_LABELS[document.documentType] || document.documentType}</td>
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">{formatDate(document.documentDate)}</td>
                      <td className="border border-gray-200 px-3 py-2">{actorName}</td>
                      <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(deltaRows.length)}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-600">{document.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="sticky bottom-16 z-20 rounded-lg border border-gray-200 bg-white p-3 shadow-lg sm:bottom-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Có <span className="font-semibold text-gray-900">{formatNumber(changedRows.length)}</span> dòng lệch sẽ được ghi điều chỉnh.
          </p>
          <button
            type="button"
            onClick={handleSubmitAudit}
            disabled={isSaving || changedRows.length === 0}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSaving ? 'Đang ghi...' : 'Ghi điều chỉnh'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CoreInventoryAuditSection;

import React, { useEffect, useMemo, useState } from 'react';
import { stockCoreService } from '../services/inventoryCoreService';
import type { LegacyStockReconciliationRow, LowStockItem, StockBalance } from '../types/inventory';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const getVariantLabel = (attributes: Record<string, string>) => {
  const values = Object.values(attributes || {}).filter(Boolean);
  return values.length > 0 ? values.join(' / ') : 'Mặc định';
};

const WarehouseCoreStatus: React.FC = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [reconciliationRows, setReconciliationRows] = useState<LegacyStockReconciliationRow[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadCoreStatus = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [lowStock, reconciliation, stockBalances] = await Promise.all([
          stockCoreService.getLowStockItems(),
          stockCoreService.getLegacyStockReconciliation(),
          stockCoreService.getBalances(),
        ]);

        if (!isMounted) return;
        setLowStockItems(lowStock);
        setReconciliationRows(reconciliation);
        setBalances(stockBalances);
      } catch (error) {
        if (!isMounted) return;
        console.warn('Không tải được tình trạng sổ kho mới:', error);
        setErrorMessage('Chưa đọc được sổ kho mới. Hãy apply migration 015/016 trên Supabase rồi tải lại.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCoreStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const topLowStock = useMemo(() => lowStockItems.slice(0, 5), [lowStockItems]);
  const availableBalances = useMemo(
    () => balances
      .filter(item => item.balanceState === 'available' && item.quantity > 0)
      .slice()
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8),
    [balances]
  );
  const topDifferences = useMemo(
    () => reconciliationRows
      .slice()
      .sort((a, b) => Math.abs(b.stockDifference) - Math.abs(a.stockDifference))
      .slice(0, 5),
    [reconciliationRows]
  );

  return (
    <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tình trạng sổ kho mới</h2>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi dữ liệu core ledger, tồn thấp và chênh lệch legacy trước khi chuyển hẳn sang hệ thống mới.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          Giai đoạn chuyển đổi
        </span>
      </div>

      {isLoading && (
        <div className="mt-4 text-sm text-gray-500">Đang kiểm tra sổ kho mới...</div>
      )}

      {!isLoading && errorMessage && (
        <div className="mt-4 rounded-md border border-yellow-200 bg-white p-3 text-sm text-yellow-800">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-white p-3 ring-1 ring-amber-100">
              <p className="text-xs font-medium uppercase text-gray-500">Dòng tồn core</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(balances.length)}</p>
            </div>
            <div className="rounded-md bg-white p-3 ring-1 ring-amber-100">
              <p className="text-xs font-medium uppercase text-gray-500">Vật tư tồn thấp</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{formatNumber(lowStockItems.length)}</p>
            </div>
            <div className="rounded-md bg-white p-3 ring-1 ring-amber-100">
              <p className="text-xs font-medium uppercase text-gray-500">Dòng lệch legacy/core</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{formatNumber(reconciliationRows.length)}</p>
            </div>
            <div className="rounded-md bg-white p-3 ring-1 ring-amber-100">
              <p className="text-xs font-medium uppercase text-gray-500">Trạng thái</p>
              <p className="mt-2 text-sm font-semibold text-green-700">
                {reconciliationRows.length === 0 ? 'Đã khớp tồn khả dụng' : 'Cần đối chiếu'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Tồn khả dụng</h3>
              <div className="mt-2 space-y-2">
                {availableBalances.length === 0 ? (
                  <p className="rounded-md bg-white p-3 text-sm text-gray-500 ring-1 ring-amber-100">
                    Chưa có dòng tồn khả dụng trong sổ kho mới.
                  </p>
                ) : availableBalances.map(item => (
                  <div key={`${item.warehouseId}-${item.variantId}-${item.batchCode || 'none'}`} className="rounded-md bg-white p-3 ring-1 ring-amber-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{item.productName || item.variantId}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{getVariantLabel(item.variantAttributes || {})}</p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-gray-900">
                        {formatNumber(item.quantity)} {item.unit || ''}
                      </p>
                    </div>
                    {(item.batchCode || item.expiryDate) && (
                      <p className="mt-2 text-xs text-gray-500">
                        {item.batchCode ? `Lô ${item.batchCode}` : ''}
                        {item.batchCode && item.expiryDate ? ' · ' : ''}
                        {item.expiryDate ? `HSD ${item.expiryDate}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800">Cần mua/bổ sung</h3>
              <div className="mt-2 space-y-2">
                {topLowStock.length === 0 ? (
                  <p className="rounded-md bg-white p-3 text-sm text-gray-500 ring-1 ring-amber-100">
                    Không có vật tư dưới tồn tối thiểu.
                  </p>
                ) : topLowStock.map(item => (
                  <div key={`${item.warehouseId}-${item.variantId}`} className="rounded-md bg-white p-3 ring-1 ring-amber-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-amber-700">
                        {formatNumber(item.availableQuantity)} {item.unit || ''}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Tối thiểu {formatNumber(item.minStock)}; gợi ý bổ sung {formatNumber(item.suggestedPurchaseQuantity)} {item.unit || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800">Cần đối chiếu tồn</h3>
              <div className="mt-2 space-y-2">
                {topDifferences.length === 0 ? (
                  <p className="rounded-md bg-white p-3 text-sm text-gray-500 ring-1 ring-amber-100">
                    Legacy variants.stock đang khớp core available stock.
                  </p>
                ) : topDifferences.map(item => (
                  <div key={item.variantId} className="rounded-md bg-white p-3 ring-1 ring-amber-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold text-red-600">
                        {formatNumber(item.stockDifference)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Legacy {formatNumber(item.legacyVariantStock)}; Core {formatNumber(item.coreAvailableStock)} {item.unit || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default WarehouseCoreStatus;

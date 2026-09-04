import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import toast from 'react-hot-toast';
import { reportsService } from '../services/reportsService';
import { stockCoreService } from '../services/inventoryCoreService';
import { useDataStore } from '../store/dataStore';
import type {
  InventoryMovementReportRow,
  LowStockItem,
  StockCardEntry,
  StockOnHandRow,
} from '../types/inventory';
import {
  STOCK_BALANCE_STATE_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from '../types/inventory';

type ReportTab = 'movement' | 'onhand' | 'lowstock' | 'stockcard' | 'zone';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const formatDate = (value: string) => {
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

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const monthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const writeExcel = (sheetName: string, rows: Array<Record<string, string | number>>) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${sheetName}_${today()}.xlsx`);
};

const InventoryCoreReports: React.FC = () => {
  const zones = useDataStore(state => state.zones);
  const [activeTab, setActiveTab] = useState<ReportTab>('movement');
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [searchTerm, setSearchTerm] = useState('');
  const [movementRows, setMovementRows] = useState<InventoryMovementReportRow[]>([]);
  const [onHandRows, setOnHandRows] = useState<StockOnHandRow[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [zoneRows, setZoneRows] = useState<Array<{ zoneId?: string; totalQuantity: number; documentCount: number }>>([]);
  const [stockCard, setStockCard] = useState<StockCardEntry | null>(null);
  const [stockCardVariantId, setStockCardVariantId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const loadMovementReport = async (from: string, to: string) => {
    setMovementRows(await reportsService.getInventoryMovementReport(from, to));
  };

  const loadOnHand = async () => {
    setOnHandRows(await reportsService.getStockOnHand());
  };

  const loadLowStock = async () => {
    setLowStockItems(await stockCoreService.getLowStockItems());
  };

  const loadZoneReport = async (from: string, to: string) => {
    setZoneRows(await reportsService.getZoneConsumptionReport(from, to));
  };

  const loadStockCard = async (variantId: string) => {
    if (!variantId) {
      setStockCard(null);
      return;
    }
    setStockCard(await reportsService.getStockCard(variantId));
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        switch (activeTab) {
          case 'movement':
            await loadMovementReport(fromDate, toDate);
            break;
          case 'onhand':
            await loadOnHand();
            break;
          case 'lowstock':
            await loadLowStock();
            break;
          case 'zone':
            await loadZoneReport(fromDate, toDate);
            break;
          case 'stockcard':
            await Promise.all([loadOnHand(), loadStockCard(stockCardVariantId)]);
            break;
          default:
            break;
        }
      } catch (error) {
        console.warn('Không tải được báo cáo kho core:', error);
        setErrorMessage('Chưa đọc được báo cáo. Kiểm tra migration 015-018 trên Supabase rồi tải lại.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab, fromDate, toDate, stockCardVariantId]);

  const filteredMovementRows = useMemo(
    () => movementRows.filter(row => {
      if (!normalizedSearch) return true;
      return [row.productName, getVariantLabel(row.variantAttributes)].some(value =>
        (value || '').toLowerCase().includes(normalizedSearch)
      );
    }),
    [movementRows, normalizedSearch]
  );

  const filteredOnHandRows = useMemo(
    () => onHandRows.filter(row => {
      if (!normalizedSearch) return true;
      return [
        row.productName,
        getVariantLabel(row.variantAttributes),
        row.warehouseName,
        STOCK_BALANCE_STATE_LABELS[row.balanceState],
        row.batchCode,
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }),
    [onHandRows, normalizedSearch]
  );

  const variantOptions = useMemo(() => {
    const seen = new Map<string, { productName: string; variantLabel: string }>();
    onHandRows.forEach(row => {
      if (!seen.has(row.variantId)) {
        seen.set(row.variantId, {
          productName: row.productName,
          variantLabel: getVariantLabel(row.variantAttributes),
        });
      }
    });
    return Array.from(seen.entries()).map(([id, value]) => ({ id, ...value }));
  }, [onHandRows]);

  const zoneName = (zoneId?: string) =>
    zoneId ? (zones.find(zone => zone.id === zoneId)?.name || zoneId) : 'Chưa gán khu';

  const handleExportMovement = () => {
    if (movementRows.length === 0) {
      toast.error('Không có dữ liệu để xuất.');
      return;
    }
    const rows = filteredMovementRows.map(row => ({
      'Vật tư': row.productName,
      'Biến thể': getVariantLabel(row.variantAttributes),
      'ĐVT': row.unit || '',
      'Tồn đầu kỳ': row.openingQuantity,
      'Nhập trong kỳ': row.receivedQuantity,
      'Xuất trong kỳ': row.issuedQuantity,
      'Trả về': row.returnedQuantity,
      'Hỏng/Thanh lý': row.defectiveQuantity,
      'Sửa xong nhập lại': row.repairedQuantity,
      'Điều chỉnh': row.adjustedQuantity,
      'Tồn cuối kỳ': row.closingQuantity,
    }));
    writeExcel('Bao_cao_xuat_nhap_ton', rows);
  };

  const handleExportOnHand = () => {
    if (onHandRows.length === 0) {
      toast.error('Không có dữ liệu để xuất.');
      return;
    }
    const rows = filteredOnHandRows.map(row => ({
      'Kho': row.warehouseName,
      'Trạng thái': STOCK_BALANCE_STATE_LABELS[row.balanceState],
      'Vật tư': row.productName,
      'Biến thể': getVariantLabel(row.variantAttributes),
      'Mã SKU': row.sku || '',
      'ĐVT': row.unit || '',
      'Lô': row.batchCode || '',
      'HSD': row.expiryDate || '',
      'Số lượng': row.quantity,
    }));
    writeExcel('Ton_kho_core', rows);
  };

  const handleExportLowStock = () => {
    if (lowStockItems.length === 0) {
      toast.error('Không có dữ liệu để xuất.');
      return;
    }
    const rows = lowStockItems.map(item => ({
      'Kho': item.warehouseName,
      'Vật tư': item.productName,
      'Biến thể': getVariantLabel(item.variantAttributes),
      'Mã SKU': item.sku || '',
      'ĐVT': item.unit || '',
      'Tồn khả dụng': item.availableQuantity,
      'Tồn tối thiểu': item.minStock,
      'Gợi ý bổ sung': item.suggestedPurchaseQuantity,
    }));
    writeExcel('Canh_bao_ton_thap', rows);
  };

  const handleExportZone = () => {
    if (zoneRows.length === 0) {
      toast.error('Không có dữ liệu để xuất.');
      return;
    }
    const rows = zoneRows.map(row => ({
      'Khu': zoneName(row.zoneId),
      'Tổng số lượng đã cấp': row.totalQuantity,
      'Số phiếu': row.documentCount,
    }));
    writeExcel('Tieu_hao_theo_khu', rows);
  };

  const tabs: Array<{ value: ReportTab; label: string }> = [
    { value: 'movement', label: 'Xuất nhập tồn' },
    { value: 'onhand', label: 'Tồn kho hiện tại' },
    { value: 'lowstock', label: 'Cảnh báo tồn thấp' },
    { value: 'stockcard', label: 'Thẻ kho vật tư' },
    { value: 'zone', label: 'Tiêu hao theo khu' },
  ];

  const movementTotals = useMemo(() => {
    const totals = {
      opening: 0,
      received: 0,
      issued: 0,
      returned: 0,
      defective: 0,
      repaired: 0,
      adjusted: 0,
      closing: 0,
    };
    filteredMovementRows.forEach(row => {
      totals.opening += row.openingQuantity;
      totals.received += row.receivedQuantity;
      totals.issued += row.issuedQuantity;
      totals.returned += row.returnedQuantity;
      totals.defective += row.defectiveQuantity;
      totals.repaired += row.repairedQuantity;
      totals.adjusted += row.adjustedQuantity;
      totals.closing += row.closingQuantity;
    });
    return totals;
  }, [filteredMovementRows]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Báo cáo kho (sổ kho mới)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Báo cáo xuất nhập tồn, tồn hiện tại, cảnh báo tồn thấp và tiêu hao theo khu đọc trực tiếp từ <code>stock_movements</code> và <code>stock_balances</code>.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`-mb-px whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium ${
              activeTab === tab.value
                ? 'border border-gray-200 border-b-white bg-white text-yellow-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === 'movement' || activeTab === 'zone') && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-xs font-medium text-gray-600">Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs font-medium text-gray-600">Đến ngày</span>
            <input
              type="date"
              value={toDate}
              onChange={event => setToDate(event.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          {activeTab === 'movement' && (
            <button
              onClick={handleExportMovement}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Xuất Excel
            </button>
          )}
          {activeTab === 'zone' && (
            <button
              onClick={handleExportZone}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Xuất Excel
            </button>
          )}
        </div>
      )}

      {(activeTab === 'onhand' || activeTab === 'lowstock') && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[16rem] flex-1 text-sm">
            <span className="block text-xs font-medium text-gray-600">Tìm kiếm</span>
            <input
              type="text"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Tên vật tư, biến thể, kho, lô..."
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>
          {activeTab === 'onhand' && (
            <button
              onClick={handleExportOnHand}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Xuất Excel
            </button>
          )}
          {activeTab === 'lowstock' && (
            <button
              onClick={handleExportLowStock}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Xuất Excel
            </button>
          )}
        </div>
      )}

      {activeTab === 'stockcard' && (
        <div className="mt-4">
          <label className="block text-sm">
            <span className="block text-xs font-medium text-gray-600">Chọn vật tư</span>
            <select
              value={stockCardVariantId}
              onChange={event => setStockCardVariantId(event.target.value)}
              className="mt-1 min-w-[16rem] rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">— Chọn vật tư —</option>
              {variantOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.productName} - {option.variantLabel}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="mt-4">
        {isLoading && <div className="py-8 text-center text-sm text-gray-500">Đang tải báo cáo...</div>}

        {!isLoading && errorMessage && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">{errorMessage}</div>
        )}

        {!isLoading && !errorMessage && activeTab === 'movement' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <th className="border border-gray-200 px-3 py-2">Vật tư</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Đầu kỳ</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Nhập</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Xuất</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Trả về</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Hỏng/Thanh lý</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Sửa xong</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Điều chỉnh</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Cuối kỳ</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovementRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-200 px-3 py-6 text-center text-gray-500">
                      Không có phát sinh trong kỳ.
                    </td>
                  </tr>
                ) : filteredMovementRows.map(row => (
                  <tr key={row.variantId} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">
                      <p className="font-medium text-gray-900">{row.productName}</p>
                      <p className="text-xs text-gray-500">{getVariantLabel(row.variantAttributes)}</p>
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.openingQuantity)} {row.unit || ''}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.receivedQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.issuedQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.returnedQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.defectiveQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.repairedQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(row.adjustedQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right font-semibold">{formatNumber(row.closingQuantity)} {row.unit || ''}</td>
                  </tr>
                ))}
                {filteredMovementRows.length > 0 && (
                  <tr className="bg-amber-50 font-semibold">
                    <td className="border border-gray-200 px-3 py-2">Tổng cộng</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.opening)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.received)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.issued)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.returned)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.defective)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.repaired)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.adjusted)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movementTotals.closing)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !errorMessage && activeTab === 'onhand' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <th className="border border-gray-200 px-3 py-2">Kho</th>
                  <th className="border border-gray-200 px-3 py-2">Trạng thái</th>
                  <th className="border border-gray-200 px-3 py-2">Vật tư</th>
                  <th className="border border-gray-200 px-3 py-2">SKU</th>
                  <th className="border border-gray-200 px-3 py-2">Lô / HSD</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {filteredOnHandRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-200 px-3 py-6 text-center text-gray-500">Chưa có tồn kho core.</td>
                  </tr>
                ) : filteredOnHandRows.map(row => (
                  <tr key={`${row.warehouseId}-${row.variantId}-${row.balanceState}-${row.batchCode || 'none'}`} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">{row.warehouseName}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {STOCK_BALANCE_STATE_LABELS[row.balanceState]}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      <p className="font-medium text-gray-900">{row.productName}</p>
                      <p className="text-xs text-gray-500">{getVariantLabel(row.variantAttributes)}</p>
                    </td>
                    <td className="border border-gray-200 px-3 py-2">{row.sku || '-'}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      {row.batchCode ? `Lô ${row.batchCode}` : '-'}
                      {row.expiryDate ? ` · HSD ${row.expiryDate}` : ''}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-right font-semibold">{formatNumber(row.quantity)} {row.unit || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !errorMessage && activeTab === 'lowstock' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {lowStockItems.length === 0 ? (
              <p className="col-span-full rounded-md bg-gray-50 p-6 text-center text-gray-500">
                Không có vật tư dưới tồn tối thiểu.
              </p>
            ) : lowStockItems.map(item => (
              <div key={`${item.warehouseId}-${item.variantId}`} className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-amber-700">
                    {formatNumber(item.availableQuantity)} {item.unit || ''}
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Tồn tối thiểu {formatNumber(item.minStock)}; gợi ý bổ sung {formatNumber(item.suggestedPurchaseQuantity)} {item.unit || ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !errorMessage && activeTab === 'stockcard' && (
          <>
            {!stockCardVariantId && (
              <p className="rounded-md bg-gray-50 p-6 text-center text-gray-500">Chọn vật tư để xem thẻ kho.</p>
            )}
            {stockCardVariantId && stockCard && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stockCard.balance.length === 0 && (
                    <p className="col-span-full text-sm text-gray-500">Chưa có tồn theo trạng thái.</p>
                  )}
                  {stockCard.balance.map(item => (
                    <div key={item.balanceState} className="rounded-md bg-white p-3 ring-1 ring-gray-200">
                      <p className="text-xs font-medium uppercase text-gray-500">{STOCK_BALANCE_STATE_LABELS[item.balanceState]}</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(item.quantity)}</p>
                      {item.batchCode && <p className="mt-1 text-xs text-gray-500">Lô {item.batchCode}</p>}
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                        <th className="border border-gray-200 px-3 py-2">Thời gian</th>
                        <th className="border border-gray-200 px-3 py-2">Loại</th>
                        <th className="border border-gray-200 px-3 py-2">Số phiếu</th>
                        <th className="border border-gray-200 px-3 py-2 text-right">Số lượng</th>
                        <th className="border border-gray-200 px-3 py-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockCard.movements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-200 px-3 py-6 text-center text-gray-500">Chưa có phát sinh.</td>
                        </tr>
                      ) : stockCard.movements.map(movement => (
                        <tr key={movement.id} className="odd:bg-white even:bg-gray-50">
                          <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">{formatDate(movement.occurredAt)}</td>
                          <td className="border border-gray-200 px-3 py-2">{STOCK_MOVEMENT_TYPE_LABELS[movement.movementType]}</td>
                          <td className="border border-gray-200 px-3 py-2">{movement.documentId}</td>
                          <td className="border border-gray-200 px-3 py-2 text-right">{formatNumber(movement.quantity)} {movement.unit || ''}</td>
                          <td className="border border-gray-200 px-3 py-2 text-gray-600">{movement.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !errorMessage && activeTab === 'zone' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                  <th className="border border-gray-200 px-3 py-2">Khu</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Tổng số lượng đã cấp</th>
                  <th className="border border-gray-200 px-3 py-2 text-right">Số phiếu</th>
                </tr>
              </thead>
              <tbody>
                {zoneRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="border border-gray-200 px-3 py-6 text-center text-gray-500">Không có phiếu xuất trong kỳ.</td>
                  </tr>
                ) : zoneRows.map(row => (
                  <tr key={row.zoneId || 'none'} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">{zoneName(row.zoneId)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right font-semibold">{formatNumber(row.totalQuantity)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right">{row.documentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default InventoryCoreReports;

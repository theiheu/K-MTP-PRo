import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import Pagination from './Pagination';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Product, RequisitionForm, GoodsReceiptNote } from '../types';
import {
  ReportPeriod,
  getRequisitionsByPeriod,
  getMostRequestedMaterials,
  getRequisitionStatsByStatus,
  getMaterialsByCategory,
  getRequisitionsByZone,
  getConsumedMaterials,
  getReceivedMaterials
} from '../utils/reportUtils';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
const STATUS_COLORS: Record<string, string> = {
  'Đang chờ xử lý': '#f59e0b',
  'Đã duyệt yêu cầu': '#10b981',
  'Đã hoàn thành': '#3b82f6'
};

type DashboardTab = 'overview' | 'history' | 'categories' | 'export';

const Dashboard: React.FC = () => {
  const { products, requisitions, receipts, categories } = useDataStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [historySortField, setHistorySortField] = useState<'createdAt' | 'status' | 'requesterName' | 'zone'>('createdAt');
  const [historySortDir, setHistorySortDir] = useState<'asc' | 'desc'>('desc');
  const [historySearch, setHistorySearch] = useState('');

  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const HISTORY_ITEMS_PER_PAGE = 10;
  
  const [consumedCurrentPage, setConsumedCurrentPage] = useState(1);
  const [receivedCurrentPage, setReceivedCurrentPage] = useState(1);
  const EXPORT_ITEMS_PER_PAGE = 10;

  const periodLabel = reportPeriod === 'today' ? 'Hôm nay' : reportPeriod === 'thisWeek' ? 'Tuần này' : reportPeriod === 'thisMonth' ? 'Tháng này' : 'Tuỳ chỉnh';

  // Reset page when search or tab changes
  React.useEffect(() => {
    setHistoryCurrentPage(1);
    setConsumedCurrentPage(1);
    setReceivedCurrentPage(1);
  }, [historySearch, activeTab, reportPeriod, historySortField, historySortDir]);

  // ===== COMPUTED DATA =====

  const statusStats = useMemo(() =>
    getRequisitionStatsByStatus(requisitions, reportPeriod, startDate, endDate),
    [requisitions, reportPeriod, startDate, endDate]
  );

  const topMaterials = useMemo(() =>
    getMostRequestedMaterials(requisitions, products, reportPeriod, startDate, endDate),
    [requisitions, products, reportPeriod, startDate, endDate]
  );

  const totalRequestedQty = useMemo(() =>
    topMaterials.reduce((s, i) => s + i.totalQuantity, 0),
    [topMaterials]
  );

  const filteredRequisitions = useMemo(() => {
    let filtered = getRequisitionsByPeriod(requisitions, reportPeriod, startDate, endDate);
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase();
      filtered = filtered.filter(req =>
        req.id.toLowerCase().includes(q) ||
        req.requesterName.toLowerCase().includes(q) ||
        (req.zone || '').toLowerCase().includes(q) ||
        req.purpose.toLowerCase().includes(q) ||
        req.status.toLowerCase().includes(q) ||
        (req.fulfilledBy || '').toLowerCase().includes(q) ||
        req.items.some(item => item.product.name.toLowerCase().includes(q))
      );
    }
    return [...filtered].sort((a, b) => {
      const dir = historySortDir === 'asc' ? 1 : -1;
      if (historySortField === 'createdAt') return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (historySortField === 'status') return dir * a.status.localeCompare(b.status);
      if (historySortField === 'requesterName') return dir * a.requesterName.localeCompare(b.requesterName);
      if (historySortField === 'zone') return dir * (a.zone || '').localeCompare(b.zone || '');
      return 0;
    });
  }, [requisitions, reportPeriod, startDate, endDate, historySortField, historySortDir, historySearch]);

  const categoryMaterialStats = useMemo(() =>
    getMaterialsByCategory(requisitions, products, reportPeriod, startDate, endDate),
    [requisitions, products, reportPeriod, startDate, endDate]
  );

  const zoneStats = useMemo(() =>
    getRequisitionsByZone(requisitions, reportPeriod, startDate, endDate),
    [requisitions, reportPeriod, startDate, endDate]
  );

  const statusPieData = useMemo(() => [
    { name: 'Đang chờ xử lý', value: statusStats.pending },
    { name: 'Đã duyệt yêu cầu', value: statusStats.completed },
    { name: 'Đã hoàn thành', value: statusStats.received }
  ].filter(d => d.value > 0), [statusStats]);

  const monthlyData = useMemo(() => {
    const months: string[] = [];
    const dataMap: Record<string, { month: string, label: string, requisitions: number, receipts: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const m = d.toISOString().substring(0, 7);
      const label = `T${d.getMonth() + 1}/${d.getFullYear()}`;
      months.push(m); dataMap[m] = { month: m, label, requisitions: 0, receipts: 0 };
    }
    requisitions.forEach(r => { const m = r.createdAt.substring(0, 7); if (dataMap[m]) dataMap[m].requisitions += 1; });
    receipts.forEach(r => { const m = r.createdAt.substring(0, 7); if (dataMap[m]) dataMap[m].receipts += 1; });
    return months.map(m => dataMap[m]);
  }, [requisitions, receipts]);

  const consumedData = useMemo(() => getConsumedMaterials(requisitions, reportPeriod, startDate, endDate), [requisitions, reportPeriod, startDate, endDate]);
  const receivedData = useMemo(() => getReceivedMaterials(receipts, products, reportPeriod, startDate, endDate), [receipts, products, reportPeriod, startDate, endDate]);
  const totalConsumedQty = useMemo(() => consumedData.reduce((s, i) => s + i.totalQuantity, 0), [consumedData]);
  const totalReceivedQty = useMemo(() => receivedData.reduce((s, i) => s + i.totalQuantity, 0), [receivedData]);

  // ===== HELPERS =====

  const formatNumber = (n: number) => n.toLocaleString('vi-VN');

  const handleHistorySort = (field: typeof historySortField) => {
    if (historySortField === field) setHistorySortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setHistorySortField(field); setHistorySortDir('desc'); }
  };

  const handleExportRequisitions = async () => {
    const { exportRequisitionsToExcel } = await import('../utils/excelExport');
    exportRequisitionsToExcel(requisitions, reportPeriod, periodLabel, startDate, endDate);
  };

  const handleExportFullReport = async () => {
    const { exportFullReportToExcel } = await import('../utils/excelExport');
    exportFullReportToExcel(requisitions, products, receipts, reportPeriod, periodLabel, startDate, endDate);
  };

  const handleExportSimpleReport = async () => {
    const { exportReportToExcel } = await import('../utils/excelExport');
    exportReportToExcel(consumedData, receivedData, periodLabel);
  };

  const handleExportPhieuXuatKho = async (req: RequisitionForm) => {
    const { exportPhieuXuatKho } = await import('../utils/excelExport');
    exportPhieuXuatKho(req);
  };

  const handlePrintPhieuXuatKho = async (req: RequisitionForm) => {
    const { printPhieuXuatKho } = await import('../utils/printUtils');
    printPhieuXuatKho(req);
  };

  const SortIcon = ({ field }: { field: typeof historySortField }) => {
    if (historySortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{historySortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      'Đang chờ xử lý': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Đã duyệt yêu cầu': 'bg-green-100 text-green-800 border-green-300',
      'Đã hoàn thành': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  // ===== PERIOD FILTER UI =====

  const PeriodFilter = () => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">📅 Kỳ báo cáo:</label>
      <div className="flex flex-wrap gap-2">
        {([['today', 'Hôm nay'], ['thisWeek', 'Tuần này'], ['thisMonth', 'Tháng này'], ['custom', 'Tuỳ chỉnh']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setReportPeriod(val)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${reportPeriod === val ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 bg-white border border-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>
      {reportPeriod === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-1.5 px-2" />
          <span className="text-gray-400">→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm py-1.5 px-2" />
        </div>
      )}
    </div>
  );

  // ===== TAB NAVIGATION =====

  const tabs: { key: DashboardTab; icon: string; label: string }[] = [
    { key: 'overview', icon: '📊', label: 'Tổng quan' },
    { key: 'history', icon: '📋', label: 'Lịch sử Phiếu YC' },
    { key: 'categories', icon: '🏷️', label: 'Phân loại Danh mục' },
    { key: 'export', icon: '📥', label: 'Xuất báo cáo' }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h2>
            <p className="text-sm text-gray-500">Cập nhật lúc: {new Date().toLocaleString('vi-VN')}</p>
          </div>
          <PeriodFilter />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 bg-white border border-gray-300 hover:border-gray-400'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================= TAB 1: TỔNG QUAN ========================= */}
      {activeTab === 'overview' && (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 shadow-md">
              <p className="text-xs font-medium opacity-80">Tổng phiếu yêu cầu</p>
              <p className="text-3xl font-bold mt-1">{statusStats.total}</p>
              <p className="text-xs opacity-70 mt-1">Trong {periodLabel.toLowerCase()}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-4 shadow-md">
              <p className="text-xs font-medium opacity-80">Đang chờ xử lý</p>
              <p className="text-3xl font-bold mt-1">{statusStats.pending}</p>
              <p className="text-xs opacity-70 mt-1">phiếu chờ duyệt</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-md">
              <p className="text-xs font-medium opacity-80">Đã duyệt yêu cầu</p>
              <p className="text-3xl font-bold mt-1">{statusStats.completed}</p>
              <p className="text-xs opacity-70 mt-1">phiếu đã cấp phát</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-md">
              <p className="text-xs font-medium opacity-80">Tổng VT đã yêu cầu</p>
              <p className="text-3xl font-bold mt-1">{formatNumber(totalRequestedQty)}</p>
              <p className="text-xs opacity-70 mt-1">{topMaterials.length} loại vật tư</p>
            </div>
          </div>

          {/* CHARTS ROW 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top vật tư yêu cầu nhiều nhất */}
            <div className="bg-white shadow rounded-xl p-6 border border-gray-100 lg:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 mb-4">🔥 Top vật tư được yêu cầu nhiều nhất ({periodLabel})</h3>
              <div className="h-80">
                {topMaterials.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMaterials.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="productName" type="category" width={120} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(value: number, _name: string, props: any) => [`${formatNumber(value)} ${props.payload.unit}`, 'Số lượng YC']} />
                      <Bar dataKey="totalQuantity" name="Số lượng YC" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Chưa có dữ liệu yêu cầu trong {periodLabel.toLowerCase()}</div>
                )}
              </div>
            </div>

            {/* Biểu đồ tròn trạng thái */}
            <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Phân bổ trạng thái phiếu</h3>
              <div className="h-64">
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} fill="#8884d8" dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name.split(' ').pop()} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                        {statusPieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [`${value} phiếu`, 'Số lượng']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Chưa có phiếu</div>
                )}
              </div>
              <div className="mt-3 space-y-1">
                {statusPieData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] }} />
                      <span className="text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHARTS ROW 2: Tần suất 6 tháng + Thống kê Zone */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">📈 Tần suất Phiếu YC (6 tháng)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/></linearGradient>
                      <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/></linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{fontSize: 12}} />
                    <YAxis allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="requisitions" name="Phiếu yêu cầu" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorReqs)" />
                    <Area type="monotone" dataKey="receipts" name="Phiếu nhập kho" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReceipts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">🏢 Phiếu YC theo Khu vực ({periodLabel})</h3>
              {zoneStats.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {zoneStats.map((zone, idx) => {
                    const maxCount = zoneStats[0]?.requisitionCount || 1;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 min-w-[80px]">{zone.zoneName}</span>
                        <div className="flex-1">
                          <div className="w-full bg-gray-100 rounded-full h-5 relative">
                            <div className="h-5 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-end pr-2 text-xs text-white font-medium"
                              style={{ width: `${Math.max((zone.requisitionCount / maxCount) * 100, 15)}%` }}>
                              {zone.requisitionCount}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 min-w-[60px] text-right">{formatNumber(zone.totalItemQuantity)} VT</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-gray-400">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* BẢNG TOP VẬT TƯ YÊU CẦU NHIỀU NHẤT */}
          {topMaterials.length > 0 && (
            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
                <h3 className="text-base font-semibold text-amber-900">🏆 Bảng xếp hạng Vật tư được yêu cầu nhiều nhất ({periodLabel})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Vật Tư</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân loại</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL Yêu Cầu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topMaterials.slice(0, 15).map((item, idx) => {
                      const pct = totalRequestedQty > 0 ? (item.totalQuantity / totalRequestedQty * 100) : 0;
                      return (
                        <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-amber-50/30">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.variantName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.category || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-amber-600">
                            {formatNumber(item.totalQuantity)} <span className="text-gray-400 text-xs font-normal">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================= TAB 2: LỊCH SỬ PHIẾU YÊU CẦU ========================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-gray-500 uppercase">Tổng phiếu</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredRequisitions.length}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-yellow-600 uppercase">Chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{statusStats.pending}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-green-600 uppercase">Đã duyệt yêu cầu</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{statusStats.completed}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-blue-600 uppercase">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{statusStats.received}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900">📋 Danh sách Phiếu Yêu Cầu ({periodLabel})</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Tìm phiếu, người YC, khu vực, vật tư..."
                    className="block w-64 rounded-lg border border-gray-300 py-1.5 pl-9 pr-8 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  {historySearch && (
                    <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <button onClick={handleExportRequisitions}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Xuất Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phiếu</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleHistorySort('requesterName')}>
                      Người yêu cầu <SortIcon field="requesterName" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleHistorySort('zone')}>
                      Khu vực <SortIcon field="zone" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mục đích</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số VT</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleHistorySort('status')}>
                      Trạng thái <SortIcon field="status" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleHistorySort('createdAt')}>
                      Ngày tạo <SortIcon field="createdAt" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người duyệt</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const totalHistoryPages = Math.ceil(filteredRequisitions.length / HISTORY_ITEMS_PER_PAGE) || 1;
                    const paginatedHistory = filteredRequisitions.slice((historyCurrentPage - 1) * HISTORY_ITEMS_PER_PAGE, historyCurrentPage * HISTORY_ITEMS_PER_PAGE);
                    return paginatedHistory.length > 0 ? paginatedHistory.map(req => (
                      <React.Fragment key={req.id}>
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 transform transition-transform ${expandedReqId === req.id ? 'rotate-90' : ''} text-gray-400`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              {req.id.substring(0, 8).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{req.requesterName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req.zone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{req.purpose}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-gray-700">{req.items.length}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center"><StatusBadge status={req.status} /></td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{req.fulfilledBy || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); void handleExportPhieuXuatKho(req); }}
                                className="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 text-xs font-medium"
                                title="Xuất phiếu xuất kho theo mẫu"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                Xuất PXK
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); void handlePrintPhieuXuatKho(req); }}
                                className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 text-xs font-medium"
                                title="In phiếu xuất kho"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v2.798c0 .197.161.357.357.357h9.786c.196 0 .357-.16.357-.357V9.083Z" /></svg>
                                In
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedReqId === req.id && (
                          <tr>
                            <td colSpan={9} className="px-0 py-0">
                              <div className="bg-gray-50 border-t border-b border-gray-200 p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Chi tiết vật tư trong phiếu</p>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">STT</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tên vật tư</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phân loại</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Số lượng</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Đơn vị</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {req.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="px-4 py-2 text-xs text-gray-400">{idx + 1}</td>
                                          <td className="px-4 py-2 text-sm font-medium text-gray-800">{item.product.name}</td>
                                          <td className="px-4 py-2 text-sm text-gray-500">{Object.values(item.variant.attributes).join(' / ') || 'Mặc định'}</td>
                                          <td className="px-4 py-2 text-sm text-right font-semibold text-amber-600">{item.quantity}</td>
                                          <td className="px-4 py-2 text-sm text-gray-500">{item.variant.unit || 'Cái'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {req.fulfilledAt && (
                                  <div className="mt-3 text-xs text-gray-500">
                                    <span className="font-medium">Duyệt bởi:</span> {req.fulfilledBy} — {new Date(req.fulfilledAt).toLocaleString('vi-VN')}
                                    {req.fulfillmentNotes && <> — <span className="italic">"{req.fulfillmentNotes}"</span></>}
                                  </div>
                                )}
                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); void handleExportPhieuXuatKho(req); }}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                    Xuất Phiếu Xuất Kho
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); void handlePrintPhieuXuatKho(req); }}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0v2.798c0 .197.161.357.357.357h9.786c.196 0 .357-.16.357-.357V9.083Z" /></svg>
                                    In Phiếu Xuất Kho
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) : <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400">Không có phiếu yêu cầu trong {periodLabel.toLowerCase()}</td></tr>;
                  })()}
                </tbody>
              </table>
            </div>
            {filteredRequisitions.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={historyCurrentPage}
                  totalPages={Math.ceil(filteredRequisitions.length / HISTORY_ITEMS_PER_PAGE)}
                  onPageChange={setHistoryCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================= TAB 3: PHÂN LOẠI DANH MỤC ========================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Phân bổ yêu cầu theo Danh mục ({periodLabel})</h3>
              <div className="h-72">
                {categoryMaterialStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryMaterialStats} cx="50%" cy="50%" innerRadius={50} outerRadius={90} fill="#8884d8"
                        dataKey="totalQuantity" nameKey="categoryName"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`} labelLine={false}>
                        {categoryMaterialStats.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [`${formatNumber(value)} đơn vị`, 'SL Yêu cầu']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">So sánh SL yêu cầu theo Danh mục</h3>
              <div className="h-72">
                {categoryMaterialStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryMaterialStats.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="categoryName" type="category" width={110} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(value: number) => [`${formatNumber(value)} đơn vị`, 'Tổng YC']} />
                      <Bar dataKey="totalQuantity" name="Tổng SL YC" radius={[0, 6, 6, 0]}>
                        {categoryMaterialStats.slice(0, 8).map((_entry, index) => (
                          <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          </div>

          {/* Bảng chi tiết danh mục (expandable) */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">🏷️ Chi tiết Vật tư theo Danh mục ({periodLabel})</h3>
              <p className="text-sm text-gray-500 mt-1">Click vào danh mục để xem chi tiết vật tư bên trong</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số loại VT</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng SL YC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryMaterialStats.map((cat, idx) => {
                    const pct = totalRequestedQty > 0 ? (cat.totalQuantity / totalRequestedQty * 100) : 0;
                    const isExpanded = expandedCategory === cat.categoryName;
                    return (
                      <React.Fragment key={cat.categoryName}>
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedCategory(isExpanded ? null : cat.categoryName)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 transform transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-400`} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              {cat.categoryName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">{cat.materialCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">{formatNumber(cat.totalQuantity)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && cat.items.map((item, iidx) => (
                          <tr key={iidx} className="bg-gray-50/70">
                            <td className="px-6 py-2 text-sm text-gray-600 pl-14">
                              → {item.productName} <span className="text-gray-400">({item.variantName})</span>
                            </td>
                            <td className="px-6 py-2"></td>
                            <td className="px-6 py-2 text-sm text-right font-medium text-gray-700">
                              {formatNumber(item.totalQuantity)} <span className="text-xs text-gray-400">{item.unit}</span>
                            </td>
                            <td className="px-6 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full bg-gray-400" style={{ width: `${cat.totalQuantity > 0 ? (item.totalQuantity / cat.totalQuantity * 100) : 0}%` }} />
                                </div>
                                <span className="text-xs text-gray-400">{cat.totalQuantity > 0 ? (item.totalQuantity / cat.totalQuantity * 100).toFixed(0) : 0}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {categoryMaterialStats.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">Chưa có dữ liệu yêu cầu trong {periodLabel.toLowerCase()}</td></tr>
                  )}
                </tbody>
                {categoryMaterialStats.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr className="font-bold">
                      <td className="px-6 py-4 text-sm text-gray-900">Tổng cộng</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{categoryMaterialStats.reduce((s, c) => s + c.materialCount, 0)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(totalRequestedQty)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================= TAB 4: XUẤT BÁO CÁO ========================= */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-amber-600 uppercase">Tổng đã xuất</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{formatNumber(totalConsumedQty)}</p>
              <p className="text-xs text-amber-500 mt-1">{consumedData.length} loại vật tư</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-green-600 uppercase">Tổng đã nhập</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{formatNumber(totalReceivedQty)}</p>
              <p className="text-xs text-green-500 mt-1">{receivedData.length} loại vật tư</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-blue-600 uppercase">Chênh lệch</p>
              <p className={`text-2xl font-bold mt-1 ${totalReceivedQty - totalConsumedQty >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {totalReceivedQty - totalConsumedQty >= 0 ? '+' : ''}{formatNumber(totalReceivedQty - totalConsumedQty)}
              </p>
              <p className="text-xs text-blue-500 mt-1">Nhập - Xuất</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-purple-600 uppercase">Kỳ báo cáo</p>
              <p className="text-lg font-bold text-purple-700 mt-1">{periodLabel}</p>
              <p className="text-xs text-purple-500 mt-1">{statusStats.total} phiếu YC</p>
            </div>
          </div>

          {/* EXPORT BUTTONS */}
          <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">📥 Xuất file báo cáo Excel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={handleExportFullReport}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all group">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📊</div>
                <div className="text-center">
                  <p className="font-semibold text-amber-900">Báo cáo đầy đủ</p>
                  <p className="text-xs text-amber-600 mt-1">6 sheet: Phiếu YC, Top VT, Danh mục, Zone, Xuất/Nhập kho</p>
                </div>
              </button>
              <button onClick={handleExportRequisitions}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all group">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📋</div>
                <div className="text-center">
                  <p className="font-semibold text-blue-900">Phiếu Yêu Cầu</p>
                  <p className="text-xs text-blue-600 mt-1">2 sheet: Danh sách phiếu + Chi tiết vật tư</p>
                </div>
              </button>
              <button onClick={handleExportSimpleReport}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all group">
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📦</div>
                <div className="text-center">
                  <p className="font-semibold text-green-900">Xuất / Nhập kho</p>
                  <p className="text-xs text-green-600 mt-1">2 sheet: Vật tư đã xuất + đã nhập</p>
                </div>
              </button>
            </div>
          </div>

          {/* BIỂU ĐỒ SO SÁNH XUẤT NHẬP */}
          {(consumedData.length > 0 || receivedData.length > 0) && (
            <div className="bg-white shadow rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Top vật tư Xuất / Nhập kho ({periodLabel})</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const mergedMap: Record<string, { name: string, consumed: number, received: number }> = {};
                    consumedData.slice(0, 8).forEach(item => { const k = item.productName; if (!mergedMap[k]) mergedMap[k] = { name: k, consumed: 0, received: 0 }; mergedMap[k].consumed += item.totalQuantity; });
                    receivedData.slice(0, 8).forEach(item => { const k = item.productName; if (!mergedMap[k]) mergedMap[k] = { name: k, consumed: 0, received: 0 }; mergedMap[k].received += item.totalQuantity; });
                    return Object.values(mergedMap).sort((a, b) => (b.consumed + b.received) - (a.consumed + a.received)).slice(0, 8);
                  })()} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="consumed" name="Đã xuất" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="received" name="Đã nhập" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* BẢNG CHI TIẾT XUẤT KHO */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-amber-50 flex items-center justify-between">
              <div><h3 className="text-base font-semibold text-amber-900">📤 Vật tư Đã Xuất ({periodLabel})</h3><p className="text-sm text-amber-700">Tổng hợp từ các phiếu yêu cầu Đã duyệt yêu cầu.</p></div>
              <span className="text-lg font-bold text-amber-600">{formatNumber(totalConsumedQty)} đơn vị</span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Vật Tư</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân Loại</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số Lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const paginatedConsumedData = consumedData.slice((consumedCurrentPage - 1) * EXPORT_ITEMS_PER_PAGE, consumedCurrentPage * EXPORT_ITEMS_PER_PAGE);
                  return paginatedConsumedData.map((item, index) => {
                    const absoluteIndex = (consumedCurrentPage - 1) * EXPORT_ITEMS_PER_PAGE + index;
                    const pct = totalConsumedQty > 0 ? (item.totalQuantity / totalConsumedQty * 100) : 0;
                    return (
                      <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-amber-50/30">
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">{absoluteIndex + 1}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{item.variantName}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-bold text-amber-600">{formatNumber(item.totalQuantity)} <span className="text-gray-400 text-xs font-normal">{item.unit}</span></td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm"><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${pct}%` }} /></div><span className="text-xs text-gray-500">{pct.toFixed(1)}%</span></div></td>
                      </tr>
                    );
                  });
                })()}
                {consumedData.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có dữ liệu xuất kho trong kỳ này.</td></tr>)}
              </tbody>
            </table>
            {consumedData.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={consumedCurrentPage}
                  totalPages={Math.ceil(consumedData.length / EXPORT_ITEMS_PER_PAGE)}
                  onPageChange={setConsumedCurrentPage}
                />
              </div>
            )}
          </div>

          {/* BẢNG CHI TIẾT NHẬP KHO */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50 flex items-center justify-between">
              <div><h3 className="text-base font-semibold text-green-900">📥 Vật tư Đã Nhập ({periodLabel})</h3><p className="text-sm text-green-700">Tổng hợp từ các phiếu nhập kho.</p></div>
              <span className="text-lg font-bold text-green-600">{formatNumber(totalReceivedQty)} đơn vị</span>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Vật Tư</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân Loại</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số Lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  const paginatedReceivedData = receivedData.slice((receivedCurrentPage - 1) * EXPORT_ITEMS_PER_PAGE, receivedCurrentPage * EXPORT_ITEMS_PER_PAGE);
                  return paginatedReceivedData.map((item, index) => {
                    const absoluteIndex = (receivedCurrentPage - 1) * EXPORT_ITEMS_PER_PAGE + index;
                    const pct = totalReceivedQty > 0 ? (item.totalQuantity / totalReceivedQty * 100) : 0;
                    return (
                      <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-green-50/30">
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">{absoluteIndex + 1}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{item.variantName}</td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-bold text-green-600">{formatNumber(item.totalQuantity)} <span className="text-gray-400 text-xs font-normal">{item.unit}</span></td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm"><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div><span className="text-xs text-gray-500">{pct.toFixed(1)}%</span></div></td>
                      </tr>
                    );
                  });
                })()}
                {receivedData.length === 0 && (<tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có dữ liệu nhập kho trong kỳ này.</td></tr>)}
              </tbody>
            </table>
            {receivedData.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={receivedCurrentPage}
                  totalPages={Math.ceil(receivedData.length / EXPORT_ITEMS_PER_PAGE)}
                  onPageChange={setReceivedCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;



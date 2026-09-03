import React, { useMemo, useState, useEffect } from 'react';
import { GoodsReceiptNote, Product, AdminTab } from '../types';
import ReceiptCard from './ReceiptCard';
import { exportReceiptsToExcel } from '../utils/excelExport';
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from './SortableHeader';
import Pagination from './Pagination';

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const ArrowDownTrayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.4a.75.75 0 00-1.06 1.06l3.23 3.23a.75.75 0 001.06 0l3.23-3.23a.75.75 0 10-1.06-1.06l-1.95 1.94V6.75z" clipRule="evenodd" />
  </svg>
);

interface ReceiptListProps {
    receipts: GoodsReceiptNote[];
    products: Product[];
    onNavigate: (view: 'create-receipt', tab?: AdminTab) => void;
    isReadOnly?: boolean;
    onEditReceipt?: (receipt: GoodsReceiptNote) => void;
    onDeleteReceipt?: (receiptId: string) => void;
}

import { printPhieuNhapKho } from '../utils/printUtils';

const ReceiptTableRow = ({ receipt, allProducts, onEdit, onDelete, isReadOnly }: any) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const itemsWithDetails = receipt.items.map((item: any) => {
    const product = allProducts.find((p: any) => p.id === item.productId);
    const variant = product?.variants.find((v: any) => v.id === item.variantId);
    const variantAttributes = variant ? Object.values(variant.attributes).join(' / ') : 'Không rõ';
    return {
      ...item,
      productName: product?.name || 'Không rõ',
      variantName: variantAttributes || 'Mặc định',
      unit: variant?.unit || 'đơn vị'
    };
  });
  
  const totalItems = receipt.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <React.Fragment>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 transform transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-400`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {receipt.id.substring(0, 8).toUpperCase()}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{receipt.supplier || 'Không rõ'}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-gray-700">{totalItems}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(receipt.createdAt).toLocaleDateString('vi-VN')}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{receipt.createdBy}</td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          {!isReadOnly && (
            <div className="flex justify-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(receipt); }}
                className="inline-flex justify-center rounded bg-gray-100 text-gray-700 px-2 py-1 text-xs font-medium hover:bg-gray-200"
              >
                Sửa
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(receipt.id); }}
                className="inline-flex justify-center rounded bg-red-100 text-red-700 px-2 py-1 text-xs font-medium hover:bg-red-200"
              >
                Xoá
              </button>
            </div>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-gray-50 border-t border-b border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Chi tiết vật tư nhập</h4>
              <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">STT</th>
                      <th className="px-4 py-2 font-medium">Tên vật tư</th>
                      <th className="px-4 py-2 font-medium">Phân loại</th>
                      <th className="px-4 py-2 font-medium text-right">Số lượng</th>
                      <th className="px-4 py-2 font-medium">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {itemsWithDetails.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">{item.productName}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.variantName}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-amber-600">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-2">
                  {receipt.notes && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Ghi chú:</span> {receipt.notes}
                    </div>
                  )}
                  {receipt.linkedRequisitionIds && receipt.linkedRequisitionIds.length > 0 && (
                    <div className="text-xs text-green-700 bg-green-50 p-2 rounded-md inline-block">
                      <span className="font-medium">Tự động cấp phát cho phiếu:</span> {receipt.linkedRequisitionIds.join(', ')}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => printPhieuNhapKho(receipt, allProducts)}
                  className="inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  In phiếu
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

const ReceiptList: React.FC<ReceiptListProps> = ({ receipts, products, onNavigate, isReadOnly, onEditReceipt, onDeleteReceipt }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const defaultSortedReceipts = useMemo(() => {
        let filtered = [...receipts];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(r => 
                r.id.toLowerCase().includes(lowerSearch) ||
                (r.supplier && r.supplier.toLowerCase().includes(lowerSearch)) ||
                (r.notes && r.notes.toLowerCase().includes(lowerSearch))
            );
        }

        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(r => new Date(r.createdAt) >= fromDate);
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => new Date(r.createdAt) <= toDate);
        }

        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [receipts, searchTerm, dateFrom, dateTo]);

    const { items: filteredAndSortedReceipts, requestSort, sortConfig } = useSortableData(defaultSortedReceipts, { key: '', direction: null });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFrom, dateTo]);

    const totalPages = Math.ceil(filteredAndSortedReceipts.length / ITEMS_PER_PAGE);
    const paginatedReceipts = filteredAndSortedReceipts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleCreateReceipt = () => {
        onNavigate('create-receipt');
    }

    const handleExportExcel = () => {
        exportReceiptsToExcel(filteredAndSortedReceipts, products);
    };

    const renderEmptyState = () => (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700">Chưa có Phiếu Nhập Kho nào</h2>
            <p className="mt-2 text-gray-500">Thử thay đổi bộ lọc hoặc tạo phiếu nhập đầu tiên của bạn.</p>
        </div>
    );

    return (
        <div className="flex flex-col flex-1">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Lịch sử Nhập Kho</h2>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex gap-2 w-full lg:flex-1">
                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tìm kiếm</label>
                            <input
                                type="text"
                                placeholder="Mã phiếu, Nhà cung cấp, Ghi chú..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="lg:hidden flex items-end">
                            <button
                                onClick={() => setShowFilters(true)}
                                className={`flex-shrink-0 px-3 py-2 border rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors h-[38px] ${
                                    showFilters || dateFrom || dateTo
                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Lọc {(dateFrom || dateTo) && <span className="flex h-2 w-2 rounded-full bg-red-500 ml-0.5"></span>}
                            </button>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex lg:flex-row gap-4">
                        <div className="w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Từ ngày</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-gray-700 bg-white"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        
                        <div className="w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Đến ngày</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-gray-700 bg-white"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Bottom Sheet */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowFilters(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl relative z-10 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Lọc phiếu nhập</h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Từ ngày</label>
                                <input
                                    type="date"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 focus:ring-0 bg-gray-50 transition-colors text-gray-800"
                                    style={{ WebkitAppearance: 'none', display: 'block' }}
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Đến ngày</label>
                                <input
                                    type="date"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 focus:ring-0 bg-gray-50 transition-colors text-gray-800"
                                    style={{ WebkitAppearance: 'none', display: 'block' }}
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                    className="flex-1 py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                >
                                    Xoá lọc
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-colors"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 justify-end mb-6">
                <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-2 justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 w-full sm:w-auto whitespace-nowrap"
                    title="Xuất danh sách hiện tại ra Excel"
                >
                    <ArrowDownTrayIcon className="w-5 h-5"/>
                    Xuất Excel
                </button>
                {!isReadOnly && (
                    <button
                        onClick={handleCreateReceipt}
                        className="inline-flex items-center gap-2 justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 w-full sm:w-auto whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5"/>
                        Tạo Phiếu Nhập Kho
                    </button>
                )}
            </div>
            {filteredAndSortedReceipts.length > 0 ? (
                <div className="space-y-6 flex flex-col flex-1">
                    <div className="overflow-x-auto bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <SortableHeader label="Mã phiếu" sortKey="id" currentSort={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader label="Nhà cung cấp" sortKey="supplier" currentSort={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader label="Tổng SL" sortKey="totalQuantity" currentSort={sortConfig} onRequestSort={requestSort} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none" />
                            <SortableHeader label="Ngày tạo" sortKey="createdAt" currentSort={sortConfig} onRequestSort={requestSort} />
                            <SortableHeader label="Người tạo" sortKey="createdBy" currentSort={sortConfig} onRequestSort={requestSort} />
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedReceipts.map(receipt => (
                            <ReceiptTableRow 
                              key={receipt.id} 
                              receipt={receipt} 
                              allProducts={products} 
                              onEdit={onEditReceipt} 
                              onDelete={onDeleteReceipt}
                              isReadOnly={isReadOnly}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-auto pt-4 pb-4">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                </div>
            ) : (
                renderEmptyState()
            )}
        </div>
    );
};

export default ReceiptList;


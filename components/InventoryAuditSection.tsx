import React, { useState, useMemo, useRef } from 'react';
import { useDataStore } from '../store/dataStore';
import { InventoryAudit } from '../types';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../store/authStore';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import Pagination from './Pagination';
import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from './SortableHeader';

const InventoryAuditSection: React.FC = () => {
  const { inventoryAudits, createInventoryAudit, updateInventoryAuditItem, completeInventoryAudit, deleteInventoryAudit, updateInventoryAudit, products, categories, zones } = useDataStore();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'audit'>('list');
  
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for search and filter inside audit detail view
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscrepancyOnly, setFilterDiscrepancyOnly] = useState(false);
  const [filterAuditStatus, setFilterAuditStatus] = useState<'all' | 'audited' | 'unaudited'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listSearchTerm, setListSearchTerm] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState("T?t c?");
  const [listStartDate, setListStartDate] = useState("");
  const [listEndDate, setListEndDate] = useState("");
  const LIST_ITEMS_PER_PAGE = 10;

  // Reset pagination when search or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDiscrepancyOnly, filterAuditStatus, selectedAuditId]);

  // States for editing info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // State for mobile audit modal
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalQuantityStr, setModalQuantityStr] = useState('');
  const [modalReason, setModalReason] = useState('');

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const isAudited = item.actualQuantity !== undefined && item.actualQuantity !== null && item.actualQuantity !== 0;
    setModalQuantityStr(isAudited ? item.actualQuantity.toString() : '');
    setModalReason(item.reason || '');
  };

  const handleSaveModal = () => {
    if (editingItem) {
      handleUpdateItem(editingItem.id, modalQuantityStr, modalReason);
      setEditingItem(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const itemsToAudit: any[] = [];
      products.forEach(p => {
        if (filterCategory && p.category !== filterCategory) return;
        
        p.variants.forEach(v => {
          itemsToAudit.push({
            productId: p.id,
            variantId: v.id,
            systemQuantity: v.stock,
            actualQuantity: 0,
            reason: '',
          });
        });
      });

      if (itemsToAudit.length === 0) {
        alert("Không có sản phẩm nào phù hợp với bộ lọc để kiểm kê.");
        setIsSubmitting(false);
        return;
      }

      await createInventoryAudit(
        {
          title,
          notes,
          status: 'Đang kiểm kê',
          createdBy: currentUser?.name || 'Admin',
        },
        itemsToAudit
      );
      
      setIsCreating(false);
      setTitle('');
      setNotes('');
      setFilterZone('');
      setFilterCategory('');
    } catch (error: any) {
      alert("Lỗi tạo phiếu kiểm kê: " + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAudit = useMemo(() => inventoryAudits.find(a => a.id === selectedAuditId), [inventoryAudits, selectedAuditId]);

  const handleUpdateItem = async (itemId: string, actualQuantityStr: string, reason: string) => {
    if (!selectedAuditId) return;
    let actualQuantity: number | null = null;
    if (actualQuantityStr.trim() !== '') {
      actualQuantity = parseInt(actualQuantityStr, 10);
      if (isNaN(actualQuantity)) return;
    }
    await updateInventoryAuditItem(selectedAuditId, itemId, actualQuantity, reason);
  };

  const handleComplete = async () => {
    if (!selectedAuditId || !selectedAudit) return;

    // Validation: Check if there are discrepancies without reasons
    const hasUnexplainedDiscrepancy = selectedAudit.items.some(item => {
      const diff = (item.actualQuantity !== undefined ? item.actualQuantity : item.systemQuantity) - item.systemQuantity;
      return diff !== 0 && (!item.reason || item.reason.trim() === '');
    });

    if (hasUnexplainedDiscrepancy) {
      alert("Vui lòng điền 'Lý do chênh lệch' cho tất cả các sản phẩm có số lượng Tồn thực tế khác với Tồn hệ thống trước khi hoàn tất.");
      return;
    }

    if (window.confirm("Hoàn tất kiểm kê? Số lượng tồn kho sẽ được cập nhật theo số lượng thực tế bạn đã nhập.")) {
      setIsSubmitting(true);
      try {
        await completeInventoryAudit(selectedAuditId);
        setSelectedAuditId(null);
      } catch (err: any) {
        alert("Lỗi hoàn tất: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedAuditId) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa phiếu kiểm kê này không? Hành động này không thể hoàn tác.")) {
      setIsSubmitting(true);
      try {
        await deleteInventoryAudit(selectedAuditId);
        setSelectedAuditId(null);
      } catch (err: any) {
        alert("Lỗi xóa phiếu: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleUpdateInfo = async () => {
    if (!selectedAuditId) return;
    setIsSubmitting(true);
    try {
      await updateInventoryAudit(selectedAuditId, { title: editTitle, notes: editNotes });
      setIsEditingInfo(false);
    } catch (err: any) {
      alert("Lỗi cập nhật: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingInfo = () => {
    if (selectedAudit) {
      setEditTitle(selectedAudit.title);
      setEditNotes(selectedAudit.notes || '');
      setIsEditingInfo(true);
    }
  };

  const handleExportExcel = () => {
    if (!selectedAudit) return;
    const wsData = [
      ['PHIẾU KIỂM KÊ KHO', '', '', '', ''],
      [`Tên đợt: ${selectedAudit.title}`, '', '', '', ''],
      [`Ngày tạo: ${new Date(selectedAudit.createdAt).toLocaleString('vi-VN')}`, '', '', '', ''],
      [`Trạng thái: ${selectedAudit.status}`, '', '', '', ''],
      ['', '', '', '', ''],
      ['STT', 'Sản phẩm', 'Thuộc tính', 'Tồn hệ thống', 'Tồn thực tế (Đếm tay)']
    ];

    const filteredItems = selectedAudit.items.filter(item => {
      const diff = (item.actualQuantity !== undefined ? item.actualQuantity : item.systemQuantity) - item.systemQuantity;
      if (filterDiscrepancyOnly && diff === 0) return false;
      const searchString = `${item.productName || ''} ${JSON.stringify(item.variantAttributes || '')}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

    filteredItems.forEach((item, index) => {
      wsData.push([
        (index + 1).toString(),
        item.productName || '',
        item.variantAttributes && Object.keys(item.variantAttributes).length > 0 
  ? Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ') 
  : 'Mặc định',
        item.systemQuantity.toString(),
        ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns
    const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 }];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kiem_Ke');
    XLSX.writeFile(wb, `Kiem_Ke_${selectedAudit.title}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredAuditItems = selectedAudit ? selectedAudit.items.filter(item => {
    // Treat null, undefined, or 0 as unaudited.
    const isAudited = item.actualQuantity !== undefined && item.actualQuantity !== null && item.actualQuantity !== 0;
    
    if (filterAuditStatus === 'audited' && !isAudited) return false;
    if (filterAuditStatus === 'unaudited' && isAudited) return false;

    const diff = (isAudited ? item.actualQuantity! : item.systemQuantity) - item.systemQuantity;
    if (filterDiscrepancyOnly && diff === 0) return false;
    
    const searchString = `${item.productName || ''} ${JSON.stringify(item.variantAttributes || '')}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) : [];

  const { items: sortedAuditItems, requestSort: requestAuditItemSort, sortConfig: auditItemSortConfig } = useSortableData(filteredAuditItems, { key: "productName", direction: "asc" });
  const totalPages = Math.ceil(sortedAuditItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = sortedAuditItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (selectedAudit) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 no-print gap-4">
          <div className="flex-1 w-full">
            {isEditingInfo ? (
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-lg font-bold"
                />
                <input 
                  type="text" 
                  value={editNotes} 
                  onChange={e => setEditNotes(e.target.value)} 
                  placeholder="Ghi chú..."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-gray-500"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleUpdateInfo} disabled={isSubmitting} className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700">Lưu</button>
                  <button onClick={() => setIsEditingInfo(false)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">Hủy</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedAudit.title}</h2>
                  <button onClick={startEditingInfo} className="text-amber-600 hover:text-amber-800 text-sm">✎ Sửa</button>
                </div>
                <p className="text-gray-500 text-sm">Tạo ngày: {new Date(selectedAudit.createdAt).toLocaleString('vi-VN')} - Trạng thái: {selectedAudit.status}</p>
                {selectedAudit.notes && <p className="text-gray-500 text-sm italic mt-1">Ghi chú: {selectedAudit.notes}</p>}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-green-700 text-sm">Xuất Excel</button>
            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-blue-700 text-sm">In Phiếu</button>
            <button onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-red-700 text-sm">Xóa phiếu</button>
            <button onClick={() => setSelectedAuditId(null)} className="text-gray-700 bg-gray-100 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 text-sm">Quay lại</button>
          </div>
        </div>

        {/* PRINT ONLY SECTION */}
        <div className="hidden print:block print-only">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold uppercase mb-2">Phiếu Kiểm Kê Kho</h1>
            <p className="text-lg">Tên đợt: {selectedAudit.title}</p>
            <p className="text-md">Ngày in: {new Date().toLocaleString('vi-VN')}</p>
          </div>
          <table className="w-full border-collapse border border-black mb-8">
            <thead>
              <tr>
                <th className="border border-black p-2 text-center w-12">STT</th>
                <th className="border border-black p-2 text-left">Sản phẩm</th>
                <th className="border border-black p-2 text-center w-32">Thuộc tính</th>
                <th className="border border-black p-2 text-center w-32">Tồn hệ thống</th>
                <th className="border border-black p-2 text-center w-32">Thực tế (Đếm)</th>
                <th className="border border-black p-2 text-left w-48">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {selectedAudit.items.filter(item => {
                const diff = (item.actualQuantity !== undefined ? item.actualQuantity : item.systemQuantity) - item.systemQuantity;
                if (filterDiscrepancyOnly && diff === 0) return false;
                const searchString = `${item.productName || ''} ${JSON.stringify(item.variantAttributes || '')}`.toLowerCase();
                return searchString.includes(searchTerm.toLowerCase());
              }).map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black p-2 text-center">{index + 1}</td>
                  <td className="border border-black p-2">{item.productName}</td>
                  <td className="border border-black p-2 text-center">{item.variantAttributes && Object.keys(item.variantAttributes).length > 0 
  ? Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ') 
  : 'Mặc định'}</td>
                  <td className="border border-black p-2 text-center">{item.systemQuantity}</td>
                  <td className="border border-black p-2"></td>
                  <td className="border border-black p-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between mt-12 px-12">
            <div className="text-center">
              <p className="font-bold mb-16">Người lập phiếu</p>
              <p>{selectedAudit.createdBy}</p>
            </div>
            <div className="text-center">
              <p className="font-bold mb-16">Người kiểm kê</p>
              <p>(Ký & Ghi rõ họ tên)</p>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTER CONTROLS */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 no-print bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm sản phẩm</label>
            <input 
              type="text" 
              placeholder="Nhập tên sản phẩm hoặc thuộc tính..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái kiểm kê</label>
            <select 
              value={filterAuditStatus}
              onChange={(e) => setFilterAuditStatus(e.target.value as any)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="audited">Đã kiểm kê</option>
              <option value="unaudited">Chưa kiểm kê</option>
            </select>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <label className="flex items-center cursor-pointer h-full pt-5">
              <input 
                type="checkbox" 
                checked={filterDiscrepancyOnly}
                onChange={(e) => setFilterDiscrepancyOnly(e.target.checked)}
                className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 whitespace-nowrap">Chỉ hiện có chênh lệch</span>
            </label>
          </div>
        </div>

        {/* WEB VIEW TABLE */}
        <div className="overflow-x-auto no-print">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader label="Sản phẩm" sortKey="productName" currentSort={auditItemSortConfig} onRequestSort={requestAuditItemSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none" />
                <SortableHeader label="Tồn hệ thống" sortKey="systemQuantity" currentSort={auditItemSortConfig} onRequestSort={requestAuditItemSort} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none" />
                <SortableHeader label="Tồn thực tế" sortKey="actualQuantity" currentSort={auditItemSortConfig} onRequestSort={requestAuditItemSort} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chênh lệch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú (Lý do)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.map(item => {
                const isAudited = item.actualQuantity !== undefined && item.actualQuantity !== null && item.actualQuantity !== 0;
                const diff = (item.actualQuantity !== undefined && item.actualQuantity !== null ? item.actualQuantity : item.systemQuantity) - item.systemQuantity;
                const product = products.find(p => p.id === item.productId);
                const variant = product?.variants.find(v => v.id === item.variantId);
                const images = variant?.images?.length ? variant.images : product?.images;
                const imageUrl = images?.[0];

                return (
                  <tr 
                    key={item.id} 
                    className={`${!isAudited ? 'bg-amber-50/30' : ''} cursor-pointer hover:bg-gray-50 transition-colors`}
                    onClick={() => {
                      if (selectedAudit.status === 'Đang kiểm kê') {
                        openEditModal(item);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium min-w-[250px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10">
                           <ImageWithPlaceholder src={imageUrl || ''} alt={item.productName || 'Product'} className="w-full h-full object-cover rounded-md shadow-sm" />
                        </div>
                        <div className="flex flex-col whitespace-normal">
                          <span>{item.productName}</span>
                          <span className="text-gray-500 font-normal text-xs mt-0.5">
                            {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 
                              ? Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ') 
                              : 'Mặc định'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{item.systemQuantity}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {selectedAudit.status === 'Đang kiểm kê' ? (
                        <input 
                          type="number"
                          className={`w-24 text-right border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm ${!isAudited ? 'bg-yellow-50 border-yellow-300' : ''}`}
                          defaultValue={isAudited ? item.actualQuantity! : ''}
                          placeholder={item.systemQuantity.toString()}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => handleUpdateItem(item.id, e.target.value, item.reason || '')}
                        />
                      ) : (
                        <span>{isAudited ? item.actualQuantity : '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-left">
                      <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {selectedAudit.status === 'Đang kiểm kê' ? (
                        <input 
                          type="text"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          defaultValue={item.reason || ''}
                          placeholder="Lý do chênh lệch..."
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => handleUpdateItem(item.id, isAudited ? item.actualQuantity!.toString() : '', e.target.value)}
                        />
                      ) : (
                        <span>{item.reason}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 no-print rounded-b-lg">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAuditItems.length)}</span> trong tổng số <span className="font-medium">{filteredAuditItems.length}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {selectedAudit.status === 'Đang kiểm kê' && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Hoàn tất kiểm kê & Cập nhật tồn kho
            </button>
          </div>
        )}

        {/* MOBILE EDIT MODAL */}
        {editingItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingItem(null)} />
              
              <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">Kiểm kê vật tư</h3>
                    <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-500 p-1">
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {(() => {
                    const product = products.find(p => p.id === editingItem.productId);
                    const variant = product?.variants.find(v => v.id === editingItem.variantId);
                    const images = variant?.images?.length ? variant.images : product?.images;
                    const imageUrl = images?.[0];
                    return (
                      <div className="flex flex-col gap-6">
                        <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg">
                          <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 bg-white rounded-md shadow-sm border border-gray-200 p-1">
                            <ImageWithPlaceholder src={imageUrl || ''} alt={editingItem.productName || 'Product'} className="w-full h-full object-contain rounded" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{editingItem.productName}</h4>
                            <p className="text-sm text-gray-500 mt-1 font-medium">
                              {editingItem.variantAttributes && Object.keys(editingItem.variantAttributes).length > 0 
                                ? Object.entries(editingItem.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ') 
                                : 'Mặc định'}
                            </p>
                            <div className="mt-3 inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              Tồn hệ thống: {editingItem.systemQuantity}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                              Tồn thực tế (Đếm được)
                            </label>
                            <input
                              type="number"
                              value={modalQuantityStr}
                              onChange={e => setModalQuantityStr(e.target.value)}
                              placeholder={editingItem.systemQuantity.toString()}
                              className="block w-full rounded-md border-0 py-3.5 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-600 text-xl font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                              Lý do chênh lệch (nếu có)
                            </label>
                            <textarea
                              rows={3}
                              value={modalReason}
                              onChange={e => setModalReason(e.target.value)}
                              className="block w-full rounded-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm sm:leading-6"
                              placeholder="Nhập lý do chênh lệch..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSaveModal}
                    className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-3 text-base font-semibold text-white shadow-sm hover:bg-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredAudits = useMemo(() => {
    return inventoryAudits.filter(audit => {
      const matchesSearch = audit.title.toLowerCase().includes(listSearchTerm.toLowerCase()) || 
                            audit.createdBy.toLowerCase().includes(listSearchTerm.toLowerCase());
      const matchesStatus = listStatusFilter === "T?t c?" || audit.status === listStatusFilter;
      const matchesStart = listStartDate ? new Date(audit.createdAt) >= new Date(listStartDate) : true;
      const matchesEnd = listEndDate ? new Date(audit.createdAt) <= new Date(listEndDate + "T23:59:59") : true;
      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [inventoryAudits, listSearchTerm, listStatusFilter, listStartDate, listEndDate]);

  const { items: sortedAudits, requestSort: requestListSort, sortConfig: listSortConfig } = useSortableData(filteredAudits, { key: "createdAt", direction: "desc" });
  const totalListPages = Math.ceil(sortedAudits.length / LIST_ITEMS_PER_PAGE) || 1;
  const paginatedAudits = sortedAudits.slice((listCurrentPage - 1) * LIST_ITEMS_PER_PAGE, listCurrentPage * LIST_ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 no-print">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Danh sách Phiếu Kiểm kê</h2>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-md shadow-sm font-medium hover:bg-amber-700"
        >
          + Tạo phiếu mới
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Tạo Phiếu Kiểm Kê Mới</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên đợt kiểm kê</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="VD: Kiểm kê định kỳ tháng 9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lọc theo danh mục (Tùy chọn)</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                <option value="">Tất cả danh mục</option>
                {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white px-4 py-2 rounded-md font-medium hover:bg-amber-700 disabled:opacity-50">Tạo phiếu</button>
            <button type="button" onClick={() => setIsCreating(false)} className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium hover:bg-gray-50">Hủy</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader label="Tên đợt" sortKey="title" currentSort={listSortConfig} onRequestSort={requestListSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" />
              <SortableHeader label="Ngày tạo" sortKey="createdAt" currentSort={listSortConfig} onRequestSort={requestListSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" />
              <SortableHeader label="Trạng thái" sortKey="status" currentSort={listSortConfig} onRequestSort={requestListSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" />
              <SortableHeader label="Người tạo" sortKey="createdBy" currentSort={listSortConfig} onRequestSort={requestListSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none" />
              <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAudits.length > 0 ? (
              paginatedAudits.map(audit => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{audit.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(audit.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${audit.status === 'Đang kiểm kê' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{audit.createdBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setSelectedAuditId(audit.id)} className="text-amber-600 hover:text-amber-900">Chi tiết</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Chưa có đợt kiểm kê nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-auto pt-4 pb-4">
        <Pagination currentPage={listCurrentPage} totalPages={totalListPages} onPageChange={setListCurrentPage} />
      </div>
    </div>
  );
};

export default InventoryAuditSection;

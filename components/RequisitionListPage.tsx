import React, { useState, useEffect } from "react";
import { RequisitionForm, User, CartItem, Product } from "../types";
import RequisitionCard from "./RequisitionCard";
import FulfillRequisitionModal from "./FulfillRequisitionModal";
import ImageGalleryModal from "./ImageGalleryModal";
import Pagination from "./Pagination";
import EditRequisitionPage from './EditRequisitionPage';

import { useSortableData } from '../hooks/useSortableData';
import SortableHeader from './SortableHeader';

interface RequisitionListPageProps {
  forms: RequisitionForm[];
  zones: { id: string; name: string }[];
  onFulfill: (
    formId: string,
    details: { notes: string; fulfillerName: string }
  ) => void;
  currentUser: User;
  cartItems: CartItem[];
  allProducts: Product[];
  onCartRemove: (variantId: string) => void;
  onCartUpdateItem: (variantId: string, quantity: number) => void;
  onCreateRequisition: () => void;
  onUpdateRequisition: (form: RequisitionForm) => void;
  onDeleteRequisition: (formId: string) => void;
  onConfirmReceipt: (formId: string) => void;
}

type StatusFilter = "Tất cả" | "Đang chờ xử lý" | "Đã duyệt yêu cầu" | "Đã hoàn thành" | "Đã huỷ";
type DateFilterOption = "all" | "today" | "thisWeek" | "thisMonth" | "custom";

const REQUISITIONS_PER_PAGE = 5;

const printRequisition = async (req: RequisitionForm) => {
  const { printPhieuXuatKho } = await import('../utils/printUtils');
  printPhieuXuatKho(req);
};

const RequisitionTableRow = ({ req, currentUser, handleInitiateFulfillment, onDeleteRequisition, onConfirmReceipt, handleEdit, allProducts }: any) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const exchangeCount = req.items.filter((item: any) => item.isExchange).length;
  const requisitionGroups = req.groups && req.groups.length > 0
    ? req.groups
    : Array.from(new Map(req.items.map((item: any) => [
      item.groupId || 'general-purpose',
      {
        id: item.groupId || 'general-purpose',
        name: item.groupName || 'Mục đích chung',
        purposeType: item.purposeType || 'regular_use',
        notes: item.groupNotes,
        neededBy: item.neededBy,
      },
    ])).values());
  const getItemGroup = (item: any) => requisitionGroups.find((group: any) => group.id === item.groupId);
  return (
    <React.Fragment>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 transform transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-400`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {req.id.substring(0, 8).toUpperCase()}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{req.requesterName}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req.zone}</td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{req.purpose}</td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-gray-700">{req.items.length}</span>
            {exchangeCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {exchangeCount} đổi
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'Đang chờ xử lý' ? 'bg-amber-100 text-amber-800' : req.status === 'Đã duyệt yêu cầu' ? 'bg-blue-100 text-blue-800' : req.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {req.status}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{req.fulfilledBy || '-'}</td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-2 w-full">
            {currentUser.role === 'manager' && req.status === 'Đang chờ xử lý' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleInitiateFulfillment(req); }}
                className="inline-flex justify-center rounded bg-green-100 text-green-700 px-2 py-1 text-xs font-medium hover:bg-green-200"
              >
                Duyệt
              </button>
            )}
            {currentUser.role !== 'auditor' && req.status === 'Đã duyệt yêu cầu' && onConfirmReceipt && (
              <button
                onClick={(e) => { e.stopPropagation(); onConfirmReceipt(req.id); }}
                className="inline-flex justify-center rounded bg-blue-100 text-blue-700 px-2 py-1 text-xs font-medium hover:bg-blue-200"
              >
                Nhận
              </button>
            )}
            {(currentUser.role === 'manager' || (currentUser.name === req.requesterName && req.status === 'Đang chờ xử lý')) && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(req); }}
                  className="inline-flex justify-center rounded bg-gray-100 text-gray-700 px-2 py-1 text-xs font-medium hover:bg-gray-200"
                >
                  Sửa
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteRequisition(req.id); }}
                  className="inline-flex justify-center rounded bg-red-100 text-red-700 px-2 py-1 text-xs font-medium hover:bg-red-200"
                >
                  Xoá
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="px-0 py-0">
            <div className="bg-gray-50 border-t border-b border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Chi tiết vật tư yêu cầu</h4>
              {requisitionGroups.length > 0 && (
                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {requisitionGroups.map((group: any) => {
                    const count = req.items.filter((item: any) => item.groupId === group.id || (!item.groupId && group.id === 'general-purpose')).length;
                    return (
                      <div key={group.id} className="rounded-md border border-gray-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                            {count}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-gray-500">{group.neededBy || 'Chưa ghi thời gian cần'}</p>
                        {group.notes && <p className="mt-2 text-xs text-gray-600">{group.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium text-center w-12">STT</th>
                      <th className="px-4 py-2 font-medium text-center w-20">Hình ảnh</th>
                      <th className="px-4 py-2 font-medium">Tên vật tư</th>
                      <th className="px-4 py-2 font-medium">Phân loại</th>
                      <th className="px-4 py-2 font-medium text-right">Số lượng</th>
                      <th className="px-4 py-2 font-medium">Hạng mục/Mục đích sử dụng</th>
                      <th className="px-4 py-2 font-medium">Thời gian cần</th>
                      <th className="px-4 py-2 font-medium text-right">Tồn kho</th>
                      <th className="px-4 py-2 font-medium">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {req.items.map((item: any, idx: number) => {
                      const product = allProducts?.find((p: any) => p.id === item.product.id);
                      const variant = product?.variants.find((v: any) => v.id === item.variant.id);
                      const stock = variant?.stock || 0;
                      const group = getItemGroup(item);
                      return (
                        <React.Fragment key={`${item.product.id}-${item.variant.id}-${idx}`}>
                          <tr>
                            <td className="px-4 py-2 text-xs text-gray-400 text-center">{idx + 1}</td>
                            <td className="px-4 py-2 text-center">
                              {product?.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded border border-gray-200 inline-block"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-gray-200 inline-flex">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-800">
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{item.product.name}</span>
                                {item.groupName && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                    {item.groupName}
                                  </span>
                                )}
                                {item.isExchange && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                    Cấp đổi
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{Object.values(item.variant.attributes).join(' / ') || 'Mặc định'}</td>
                            <td className="px-4 py-2 text-sm text-right font-semibold text-amber-600">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{group?.name || item.groupName || 'Mục đích chung'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{group?.neededBy || item.neededBy || '-'}</td>
                            <td className={`px-4 py-2 text-sm text-right font-semibold ${stock < item.quantity ? 'text-red-600' : 'text-green-600'}`}>{stock}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{item.variant.unit || 'Cái'}</td>
                          </tr>
                          {item.isExchange && (
                            <tr>
                              <td className="bg-amber-50 px-4 py-3" colSpan={9}>
                                <div className="ml-0 rounded-md border border-amber-200 bg-white p-3 sm:ml-16">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                      {['Đã duyệt yêu cầu', 'Đã hoàn thành'].includes(req.status)
                                        ? 'Đã đổi và ghi nhận kho hỏng'
                                        : 'Chờ duyệt cấp đổi'}
                                    </span>
                                    {item.exchangedAt && (
                                      <span className="text-xs text-gray-500">
                                        Ngày đổi: {new Date(item.exchangedAt).toLocaleDateString('vi-VN')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 lg:grid-cols-3">
                                    <p><span className="font-semibold text-gray-900">Tình trạng:</span> {item.defectNotes || 'Chưa ghi'}</p>
                                    <p><span className="font-semibold text-gray-900">Mô tả hỏng:</span> {item.defectDescription || 'Không ghi'}</p>
                                    <p><span className="font-semibold text-gray-900">Cần sửa:</span> {item.repairNeeds || 'Không ghi'}</p>
                                  </div>
                                  {item.defectImages && item.defectImages.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {item.defectImages.map((src: string, imageIndex: number) => (
                                        <button
                                          key={imageIndex}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(src, '_blank');
                                          }}
                                          className="h-14 w-14 overflow-hidden rounded border border-amber-200"
                                        >
                                          <img src={src} alt="Ảnh vật tư hỏng" className="h-full w-full object-cover" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-between sm:items-start gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Tạo bởi:</span> {req.requesterName} — {new Date(req.createdAt).toLocaleString('vi-VN')}
                    {req.purpose && <> — <span className="italic text-gray-500">"{req.purpose}"</span></>}
                  </div>
                  {req.fulfilledAt && (
                    <div className="text-xs text-blue-700">
                      <span className="font-semibold">Duyệt bởi:</span> {req.fulfilledBy} — {new Date(req.fulfilledAt).toLocaleString('vi-VN')}
                      {req.fulfillmentNotes && <> — <span className="italic">"{req.fulfillmentNotes}"</span></>}
                    </div>
                  )}
                  {req.receivedAt && (
                    <div className="text-xs text-green-700">
                      <span className="font-semibold">Nhận bởi:</span> {req.receivedBy} — {new Date(req.receivedAt).toLocaleString('vi-VN')}
                      {req.receiveNotes && <> — <span className="italic">"{req.receiveNotes}"</span></>}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { void printRequisition(req); }}
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

const RequisitionListPage: React.FC<RequisitionListPageProps> = ({
  forms,
  zones,
  onFulfill,
  currentUser,
  cartItems,
  allProducts,
  onCartRemove,
  onCartUpdateItem,
  onCreateRequisition,
  onUpdateRequisition,
  onDeleteRequisition,
  onConfirmReceipt,
}) => {
  const [formToFulfill, setFormToFulfill] = useState<RequisitionForm | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tất cả");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<RequisitionForm | null>(null);

  const handleEdit = (form: RequisitionForm) => {
    setEditingRequisition(form);
  };

  const handleCancelEdit = () => {
    setEditingRequisition(null);
  };

  const handleUpdateRequisition = (updatedForm: RequisitionForm) => {
    onUpdateRequisition(updatedForm);
    setEditingRequisition(null);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate, searchTerm]);

  const handleInitiateFulfillment = (form: RequisitionForm) => {
    setFormToFulfill(form);
  };

  const handleConfirmFulfillment = async (details: {
    notes: string;
    fulfillerName: string;
  }) => {
    if (formToFulfill) {
      await onFulfill(formToFulfill.id, details);
    }
    setFormToFulfill(null);
  };

  const handleOpenGallery = (images: string[], startIndex: number) => {
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  const userFilteredForms =
    ["manager", "auditor"].includes(currentUser.role)
      ? forms
      : forms.filter((form) => form.requesterName === currentUser.name);

  const finalFilteredForms = userFilteredForms.filter((form) => {
    // Status filter
    if (statusFilter !== "Tất cả" && form.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (startDate || endDate) {
      const formDate = new Date(form.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (formDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (formDate > end) return false;
      }
    }

    // Search term filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      const matches =
        form.id.toLowerCase().includes(lowercasedTerm) ||
        form.requesterName.toLowerCase().includes(lowercasedTerm) ||
        form.purpose.toLowerCase().includes(lowercasedTerm);
      if (!matches) {
        return false;
      }
    }

    return true;
  });

  const defaultSortedForms = [...finalFilteredForms].sort((a, b) => {
    if (a.status === "Đang chờ xử lý" && b.status !== "Đang chờ xử lý")
      return -1;
    if (a.status !== "Đang chờ xử lý" && b.status === "Đang chờ xử lý")
      return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const { items: sortedForms, requestSort, sortConfig } = useSortableData(defaultSortedForms, { key: '', direction: null });

  const totalPages = Math.ceil(sortedForms.length / REQUISITIONS_PER_PAGE);
  const paginatedForms = sortedForms.slice(
    (currentPage - 1) * REQUISITIONS_PER_PAGE,
    currentPage * REQUISITIONS_PER_PAGE
  );

  const filterOptions: StatusFilter[] = [
    "Tất cả",
    "Đang chờ xử lý",
    "Đã duyệt yêu cầu",
    "Đã hoàn thành",
    "Đã huỷ",
  ];

  const renderEmptyState = () => {
    const hasFormsOverall = userFilteredForms.length > 0;

    let message = "";
    let subMessage = "";

    if (hasFormsOverall) {
      if (startDate || endDate) {
        message = `Không có phiếu nào phù hợp với bộ lọc trạng thái và ngày đã chọn.`;
      } else {
        message = `Không có phiếu nào với trạng thái "${statusFilter}"`;
      }
      subMessage = "Vui lòng thay đổi bộ lọc của bạn hoặc kiểm tra lại sau.";
    } else {
      message =
        currentUser.role === "manager"
          ? "Chưa có Phiếu yêu cầu nào trong hệ thống."
          : "Bạn chưa tạo phiếu yêu cầu nào.";
      subMessage =
        currentUser.role === "manager"
          ? "Khi có phiếu mới, chúng sẽ xuất hiện ở đây."
          : "Tạo một phiếu yêu cầu mới từ trang Kho vật tư.";
    }

    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">{message}</h2>
        <p className="mt-2 text-gray-500">{subMessage}</p>
      </div>
    );
  };

  if (editingRequisition) {
    return (
      <EditRequisitionPage
        user={currentUser}
        requisition={editingRequisition}
        allProducts={allProducts}
        zones={zones}
        onSubmit={handleUpdateRequisition}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Phiếu Yêu Cầu
        </h1>
        <button
          onClick={onCreateRequisition}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-4 rounded shadow-sm"
        >
          Tạo phiếu yêu cầu
        </button>
      </div>



      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2 w-full lg:flex-1">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tìm mã, người yêu cầu..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="lg:hidden flex items-end">
                <button
                    onClick={() => setShowFilters(true)}
                    className={`flex-shrink-0 px-3 py-2 border rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors h-[38px] ${
                        showFilters || statusFilter !== 'Tất cả' || startDate || endDate
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Lọc {(statusFilter !== 'Tất cả' || startDate || endDate) && <span className="flex h-2 w-2 rounded-full bg-red-500 ml-0.5"></span>}
                </button>
            </div>
          </div>

          <div className="hidden lg:flex lg:flex-row gap-4">
            <div className="w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                {filterOptions.map(option => (
                  <option key={option} value={option}>{option === 'Tất cả' ? 'Tất cả' : option}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-gray-700 bg-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-gray-700 bg-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
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
              <h3 className="text-xl font-bold text-gray-900">Lọc phiếu yêu cầu</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                <select
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 focus:ring-0 bg-gray-50 transition-colors"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  {filterOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Từ ngày</label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 focus:ring-0 bg-gray-50 transition-colors text-gray-800"
                  style={{ WebkitAppearance: 'none', display: 'block' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Đến ngày</label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-500 focus:ring-0 bg-gray-50 transition-colors text-gray-800"
                  style={{ WebkitAppearance: 'none', display: 'block' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => { setStatusFilter('Tất cả'); setStartDate(''); setEndDate(''); }}
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

      <div className="space-y-6 flex flex-col flex-1">
        {sortedForms.length > 0 ? (
          <>
            <div className="overflow-x-auto bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableHeader label="Mã phiếu" sortKey="id" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Người yêu cầu" sortKey="requesterName" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Khu vực" sortKey="zone" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Mục đích" sortKey="purpose" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Số VT" sortKey="items.length" currentSort={sortConfig} onRequestSort={requestSort} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none" />
                    <SortableHeader label="Trạng thái" sortKey="status" currentSort={sortConfig} onRequestSort={requestSort} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none" />
                    <SortableHeader label="Ngày tạo" sortKey="createdAt" currentSort={sortConfig} onRequestSort={requestSort} />
                    <SortableHeader label="Người duyệt" sortKey="receivedBy" currentSort={sortConfig} onRequestSort={requestSort} />
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedForms.map(req => (
                    <RequisitionTableRow
                      key={req.id}
                      req={req}
                      currentUser={currentUser}
                      handleInitiateFulfillment={handleInitiateFulfillment}
                      onDeleteRequisition={onDeleteRequisition}
                      onConfirmReceipt={onConfirmReceipt}
                      handleEdit={handleEdit}
                      allProducts={allProducts}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-auto pt-8 pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          renderEmptyState()
        )}
      </div>

      <FulfillRequisitionModal
        isOpen={!!formToFulfill}
        onClose={() => setFormToFulfill(null)}
        form={formToFulfill}
        onSubmit={handleConfirmFulfillment}
        currentUser={currentUser}
      />

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={galleryImages}
        startIndex={galleryStartIndex}
      />
    </div>
  );
};

export default RequisitionListPage;

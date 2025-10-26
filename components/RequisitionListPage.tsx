
import React, { useState, useEffect } from 'react';
import { RequisitionForm, User } from '../types';
import RequisitionCard from './RequisitionCard';
import FulfillRequisitionModal from './FulfillRequisitionModal';
import ImageGalleryModal from './ImageGalleryModal';
import Pagination from './Pagination';

interface RequisitionListPageProps {
  forms: RequisitionForm[];
  onFulfill: (formId: string, details: { notes: string; fulfillerName: string }) => void;
  currentUser: User;
}

type StatusFilter = 'Tất cả' | 'Đang chờ xử lý' | 'Đã hoàn thành';
type DateFilterOption = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom';

const REQUISITIONS_PER_PAGE = 5;

const RequisitionListPage: React.FC<RequisitionListPageProps> = ({ forms, onFulfill, currentUser }) => {
  const [formToFulfill, setFormToFulfill] = useState<RequisitionForm | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Tất cả');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterOption, setDateFilterOption] = useState<DateFilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    const toYyyyMmDd = (d: Date) => d.toISOString().split('T')[0];
    const today = new Date();

    switch (dateFilterOption) {
      case 'today': {
        const todayStr = toYyyyMmDd(today);
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      }
      case 'thisWeek': {
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay())); 
        const lastDay = new Date(firstDay);
        lastDay.setDate(lastDay.getDate() + 6);
        setStartDate(toYyyyMmDd(firstDay));
        setEndDate(toYyyyMmDd(lastDay));
        break;
      }
      case 'thisMonth': {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(toYyyyMmDd(firstDayOfMonth));
        setEndDate(toYyyyMmDd(lastDayOfMonth));
        break;
      }
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      case 'custom':
        break;
    }
  }, [dateFilterOption]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate, dateFilterOption]);


  const handleInitiateFulfillment = (form: RequisitionForm) => {
    setFormToFulfill(form);
  };

  const handleConfirmFulfillment = (details: { notes: string; fulfillerName: string }) => {
    if (formToFulfill) {
        onFulfill(formToFulfill.id, details);
    }
    setFormToFulfill(null); 
  };

  const handleOpenGallery = (images: string[], startIndex: number) => {
    setGalleryImages(images);
    setGalleryStartIndex(startIndex);
    setIsGalleryOpen(true);
  };

  const userFilteredForms = currentUser.role === 'manager'
    ? forms
    : forms.filter(form => form.requesterName === currentUser.name);

  const finalFilteredForms = userFilteredForms.filter(form => {
    if (statusFilter !== 'Tất cả' && form.status !== statusFilter) {
      return false;
    }

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
    
    return true;
  });

  const sortedForms = [...finalFilteredForms].sort((a, b) => {
    if (a.status === 'Đang chờ xử lý' && b.status !== 'Đang chờ xử lý') return -1;
    if (a.status !== 'Đang chờ xử lý' && b.status === 'Đang chờ xử lý') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const totalPages = Math.ceil(sortedForms.length / REQUISITIONS_PER_PAGE);
  const paginatedForms = sortedForms.slice(
      (currentPage - 1) * REQUISITIONS_PER_PAGE,
      currentPage * REQUISITIONS_PER_PAGE
  );


  const filterOptions: StatusFilter[] = ['Tất cả', 'Đang chờ xử lý', 'Đã hoàn thành'];

  const renderEmptyState = () => {
    const hasFormsOverall = userFilteredForms.length > 0;
    
    let message = '';
    let subMessage = '';

    if (hasFormsOverall) {
      if (startDate || endDate) {
        message = `Không có phiếu nào phù hợp với bộ lọc trạng thái và ngày đã chọn.`;
      } else {
        message = `Không có phiếu nào với trạng thái "${statusFilter}"`;
      }
      subMessage = 'Vui lòng thay đổi bộ lọc của bạn hoặc kiểm tra lại sau.';
    } else {
      message = currentUser.role === 'manager'
        ? "Chưa có Phiếu yêu cầu nào trong hệ thống."
        : "Bạn chưa tạo phiếu yêu cầu nào.";
      subMessage = currentUser.role === 'manager'
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

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Danh sách Phiếu Yêu cầu</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái</label>
                <div className="flex flex-wrap items-center gap-2">
                    {filterOptions.map(option => (
                        <button
                            key={option}
                            onClick={() => setStatusFilter(option)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                statusFilter === option
                                    ? 'bg-yellow-500 text-white shadow'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

             <div className="lg:col-span-3">
                <label htmlFor="date-filter-select" className="block text-sm font-medium text-gray-700 mb-2">Lọc theo ngày tạo phiếu</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <select
                        id="date-filter-select"
                        value={dateFilterOption}
                        onChange={(e) => setDateFilterOption(e.target.value as DateFilterOption)}
                        className="block w-full sm:w-auto flex-grow rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                    >
                        <option value="all">Mọi lúc</option>
                        <option value="today">Hôm nay</option>
                        <option value="thisWeek">Tuần này</option>
                        <option value="thisMonth">Tháng này</option>
                        <option value="custom">Tùy chỉnh...</option>
                    </select>

                    {dateFilterOption === 'custom' && (
                        <>
                            <div className="flex-1">
                                <label htmlFor="start-date" className="sr-only">Từ ngày</label>
                                <input
                                    type="date"
                                    id="start-date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                    max={endDate || undefined}
                                />
                            </div>
                            <span className="text-gray-500 text-sm hidden sm:inline">đến</span>
                            <div className="flex-1">
                                <label htmlFor="end-date" className="sr-only">Đến ngày</label>
                                <input
                                    type="date"
                                    id="end-date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                                    min={startDate || undefined}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>


      {sortedForms.length > 0 ? (
        <>
          <div className="space-y-6">
            {paginatedForms.map((form) => (
              <RequisitionCard 
                key={form.id} 
                form={form} 
                onInitiateFulfillment={handleInitiateFulfillment}
                userRole={currentUser.role}
                onImageClick={handleOpenGallery}
              />
            ))}
          </div>
          <div className="mt-8">
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

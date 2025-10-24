import React, { useState } from 'react';
import { RequisitionForm, User } from '../types';
import RequisitionCard from './RequisitionCard';
import RequisitionDetailModal from './RequisitionDetailModal';
import FulfillRequisitionModal from './FulfillRequisitionModal';

interface RequisitionListPageProps {
  forms: RequisitionForm[];
  onFulfill: (formId: string, notes: string) => void;
  currentUser: User;
}

type StatusFilter = 'Tất cả' | 'Đang chờ xử lý' | 'Đã hoàn thành';

const RequisitionListPage: React.FC<RequisitionListPageProps> = ({ forms, onFulfill, currentUser }) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<RequisitionForm | null>(null);
  const [formToFulfill, setFormToFulfill] = useState<RequisitionForm | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Tất cả');

  const handleViewDetails = (form: RequisitionForm) => {
    setSelectedForm(form);
    setIsDetailModalOpen(true);
  };

  const handleInitiateFulfillment = (form: RequisitionForm) => {
    // Nếu đang mở modal chi tiết, đóng nó trước
    if (isDetailModalOpen) {
        setIsDetailModalOpen(false);
    }
    setFormToFulfill(form);
  };

  const handleConfirmFulfillment = (notes: string) => {
    if (formToFulfill) {
        onFulfill(formToFulfill.id, notes);
    }
    setFormToFulfill(null); // Đóng modal sau khi gửi
  };

  const userFilteredForms = currentUser.role === 'manager'
    ? forms
    : forms.filter(form => form.requesterName === currentUser.name);

  const finalFilteredForms = statusFilter === 'Tất cả'
    ? userFilteredForms
    : userFilteredForms.filter(form => form.status === statusFilter);

  // Sort forms so that "Đang chờ xử lý" are first
  const sortedForms = [...finalFilteredForms].sort((a, b) => {
    if (a.status === 'Đang chờ xử lý' && b.status !== 'Đang chờ xử lý') return -1;
    if (a.status !== 'Đang chờ xử lý' && b.status === 'Đang chờ xử lý') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filterOptions: StatusFilter[] = ['Tất cả', 'Đang chờ xử lý', 'Đã hoàn thành'];

  const renderEmptyState = () => {
    const hasFormsOverall = userFilteredForms.length > 0;
    
    let message = '';
    let subMessage = '';

    if (hasFormsOverall) {
      message = `Không có phiếu nào với trạng thái "${statusFilter}"`;
      subMessage = 'Vui lòng chọn một bộ lọc khác hoặc kiểm tra lại sau.';
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">Lọc theo trạng thái:</span>
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map(option => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                  statusFilter === option
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedForms.length > 0 ? (
        <div className="space-y-6">
          {sortedForms.map((form) => (
            <RequisitionCard 
              key={form.id} 
              form={form} 
              onInitiateFulfillment={handleInitiateFulfillment}
              userRole={currentUser.role}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        renderEmptyState()
      )}

      <RequisitionDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        form={selectedForm}
        userRole={currentUser.role}
        onInitiateFulfillment={handleInitiateFulfillment}
      />
      <FulfillRequisitionModal
        isOpen={!!formToFulfill}
        onClose={() => setFormToFulfill(null)}
        form={formToFulfill}
        onSubmit={handleConfirmFulfillment}
        currentUser={currentUser}
      />
    </div>
  );
};

export default RequisitionListPage;

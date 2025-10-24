import React from 'react';
import { RequisitionForm } from '../types';
import RequisitionCard from './RequisitionCard';

interface RequisitionListPageProps {
  forms: RequisitionForm[];
  onFulfill: (formId: string, fulfilledBy: string) => void;
}

const RequisitionListPage: React.FC<RequisitionListPageProps> = ({ forms, onFulfill }) => {
  if (forms.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">Chưa có Phiếu yêu cầu nào</h2>
        <p className="mt-2 text-gray-500">Tạo một phiếu yêu cầu mới từ trang Kho vật tư.</p>
      </div>
    );
  }

  // Sort forms so that "Đang chờ xử lý" are first
  const sortedForms = [...forms].sort((a, b) => {
    if (a.status === 'Đang chờ xử lý' && b.status !== 'Đang chờ xử lý') return -1;
    if (a.status !== 'Đang chờ xử lý' && b.status === 'Đang chờ xử lý') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });


  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Danh sách Phiếu Yêu cầu</h1>
      <div className="space-y-6">
        {sortedForms.map((form) => (
          <RequisitionCard key={form.id} form={form} onFulfill={onFulfill} />
        ))}
      </div>
    </div>
  );
};

export default RequisitionListPage;

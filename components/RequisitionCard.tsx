import React from 'react';
import { RequisitionForm, UserRole } from '../types';

interface RequisitionCardProps {
  form: RequisitionForm;
  onInitiateFulfillment: (form: RequisitionForm) => void;
  userRole: UserRole;
  onViewDetails: (form: RequisitionForm) => void;
}

const statusStyles = {
  'Đang chờ xử lý': 'bg-yellow-100 text-yellow-800',
  'Đã hoàn thành': 'bg-green-100 text-green-800',
};

const RequisitionCard: React.FC<RequisitionCardProps> = ({ form, onInitiateFulfillment, userRole, onViewDetails }) => {

  const handleFulfillClick = () => {
    onInitiateFulfillment(form);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-600 truncate" title={form.id}>{form.id}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">Khu vực: {form.zone}</p>
          </div>
          <div className="flex flex-row-reverse justify-between items-center sm:flex-col sm:items-end sm:justify-start gap-2 mt-2 sm:mt-0 flex-shrink-0">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyles[form.status]}`}>
                {form.status}
            </span>
            <p className="text-sm text-gray-500">
              {new Date(form.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        
        <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
            <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Người yêu cầu:</span> {form.requesterName}</p>
            <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Mục đích:</span> {form.purpose}</p>
            {form.status === 'Đã hoàn thành' && form.fulfilledBy && (
                 <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Cấp phát bởi:</span> {form.fulfilledBy} lúc {new Date(form.fulfilledAt!).toLocaleString('vi-VN')}</p>
            )}
            {form.status === 'Đã hoàn thành' && form.fulfillmentNotes && (
                 <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Ghi chú cấp phát:</span> {form.fulfillmentNotes}</p>
            )}
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            onClick={() => onViewDetails(form)}
            className="w-full sm:w-auto inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Xem Chi Tiết ({form.items.length} mục)
          </button>
          {form.status === 'Đang chờ xử lý' && userRole === 'manager' && (
            <button
              onClick={handleFulfillClick}
              className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700"
            >
              Xác nhận Cung cấp
            </button>
          )}
      </div>
    </div>
  );
};

export default RequisitionCard;
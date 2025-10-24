import React, { useState } from 'react';
import { RequisitionForm } from '../types';

interface RequisitionCardProps {
  form: RequisitionForm;
  onFulfill: (formId: string, fulfilledBy: string) => void;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const statusStyles = {
  'Đang chờ xử lý': 'bg-yellow-100 text-yellow-800',
  'Đã hoàn thành': 'bg-green-100 text-green-800',
};

const RequisitionCard: React.FC<RequisitionCardProps> = ({ form, onFulfill }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFulfill = () => {
    const fulfilledBy = prompt('Vui lòng nhập tên của bạn để xác nhận cấp phát:');
    if (fulfilledBy && fulfilledBy.trim() !== '') {
      onFulfill(form.id, fulfilledBy.trim());
    } else {
        alert("Tên không được để trống.");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-600">{form.id}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">Khu vực: {form.zone}</p>
            <p className="text-sm text-gray-500">Yêu cầu bởi: {form.requesterName}</p>
          </div>
          <div className="flex flex-col items-start sm:items-end">
             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[form.status]}`}>
                {form.status}
            </span>
            <p className="text-sm text-gray-500 mt-2">
              Ngày tạo: {new Date(form.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="mt-4">
            <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Mục đích:</span> {form.purpose}</p>
            {form.status === 'Đã hoàn thành' && form.fulfilledBy && (
                 <p className="text-sm text-gray-600 mt-1"><span className="font-medium text-gray-800">Cấp phát bởi:</span> {form.fulfilledBy} lúc {new Date(form.fulfilledAt!).toLocaleString('vi-VN')}</p>
            )}
        </div>
      </div>
      <div className="border-t border-gray-200">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex justify-between items-center">
          <span>{isExpanded ? 'Ẩn' : 'Xem'} chi tiết vật tư ({form.items.length} mục)</span>
          <ChevronDownIcon className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-gray-200">
            <ul role="list" className="divide-y divide-gray-200 mt-4">
              {form.items.map(item => (
                <li key={item.product.id} className="flex py-4">
                  <img src={item.product.images[0]} alt={item.product.name} className="h-16 w-16 rounded-md object-cover"/>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {form.status === 'Đang chờ xử lý' && (
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:text-right">
          <button
            onClick={handleFulfill}
            className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Xác nhận Cung cấp
          </button>
        </div>
      )}
    </div>
  );
};

export default RequisitionCard;

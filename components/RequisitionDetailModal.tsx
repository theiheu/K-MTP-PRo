import React from 'react';
import { RequisitionForm, UserRole } from '../types';

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const statusStyles = {
  'Đang chờ xử lý': 'bg-yellow-100 text-yellow-800',
  'Đã hoàn thành': 'bg-green-100 text-green-800',
};

interface RequisitionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: RequisitionForm | null;
  userRole: UserRole;
  onInitiateFulfillment: (form: RequisitionForm) => void;
}

const RequisitionDetailModal: React.FC<RequisitionDetailModalProps> = ({ isOpen, onClose, form, userRole, onInitiateFulfillment }) => {
  if (!isOpen || !form) return null;
  
  const handleFulfillClick = () => {
    onInitiateFulfillment(form);
    // Modal xác nhận mới sẽ được mở bởi component cha, nên chúng ta không cần đóng modal này ngay lập tức.
    // Nếu muốn tự động đóng, có thể gọi onClose() ở đây.
  };

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                            Chi tiết Phiếu Yêu cầu
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{form.id}</p>
                    </div>
                    <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center" onClick={onClose}>
                        <XMarkIcon className="h-6 w-6"/>
                        <span className="sr-only">Đóng modal</span>
                    </button>
                </div>
            </div>
            
            {/* Body */}
            <div className="px-4 py-5 sm:p-6 max-h-[60vh] overflow-y-auto">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <dt className="font-medium text-gray-500">Người yêu cầu</dt>
                        <dd className="mt-1 text-gray-900">{form.requesterName}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Khu vực</dt>
                        <dd className="mt-1 text-gray-900">{form.zone}</dd>
                    </div>
                     <div className="sm:col-span-2">
                        <dt className="font-medium text-gray-500">Mục đích</dt>
                        <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{form.purpose}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Ngày tạo</dt>
                        <dd className="mt-1 text-gray-900">{new Date(form.createdAt).toLocaleString('vi-VN')}</dd>
                    </div>
                    <div>
                        <dt className="font-medium text-gray-500">Trạng thái</dt>
                        <dd className="mt-1">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[form.status]}`}>
                                {form.status}
                            </span>
                        </dd>
                    </div>
                    {form.status === 'Đã hoàn thành' && form.fulfilledBy && (
                        <>
                            <div>
                                <dt className="font-medium text-gray-500">Cấp phát bởi</dt>
                                <dd className="mt-1 text-gray-900">{form.fulfilledBy}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-gray-500">Thời gian cấp phát</dt>
                                <dd className="mt-1 text-gray-900">{new Date(form.fulfilledAt!).toLocaleString('vi-VN')}</dd>
                            </div>
                        </>
                    )}
                    {form.status === 'Đã hoàn thành' && form.fulfillmentNotes && (
                       <div className="sm:col-span-2">
                           <dt className="font-medium text-gray-500">Ghi chú cấp phát</dt>
                           <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{form.fulfillmentNotes}</dd>
                       </div>
                    )}
                </dl>

                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-base font-medium text-gray-900">Danh sách vật tư ({form.items.length})</h4>
                    <ul role="list" className="divide-y divide-gray-200 mt-4">
                      {form.items.map(item => (
                        <li key={item.product.id} className="flex py-4 items-center">
                          <img src={item.product.images[0]} alt={item.product.name} className="h-16 w-16 rounded-md object-cover flex-shrink-0"/>
                          <div className="ml-4 flex-1">
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-500">{item.product.category}</p>
                          </div>
                           <div className="text-right">
                                <p className="font-medium text-gray-900">SL: {item.quantity}</p>
                           </div>
                        </li>
                      ))}
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              {form.status === 'Đang chờ xử lý' && userRole === 'manager' && (
                  <button
                    onClick={handleFulfillClick}
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto"
                  >
                    Xác nhận Cung cấp
                  </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionDetailModal;
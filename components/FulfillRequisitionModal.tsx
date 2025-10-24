import React, { useState, useEffect } from 'react';
import { RequisitionForm, User } from '../types';

interface FulfillRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  form: RequisitionForm | null;
  currentUser: User;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const FulfillRequisitionModal: React.FC<FulfillRequisitionModalProps> = ({ isOpen, onClose, onSubmit, form, currentUser }) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNotes(''); // Đặt lại ghi chú mỗi khi mở modal
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(notes);
  };

  if (!isOpen || !form) return null;

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <form onSubmit={handleSubmit} className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Xác nhận Cung cấp Phiếu</h3>
                  <p className="text-sm text-gray-500 mt-1">Bạn sắp hoàn thành phiếu yêu cầu <span className="font-medium text-gray-700">{form.id}</span>.</p>
                  <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center" onClick={onClose}>
                    <XMarkIcon className="h-6 w-6"/>
                    <span className="sr-only">Đóng modal</span>
                  </button>
                  <div className="mt-4 space-y-4">
                     <div>
                        <label htmlFor="fulfillerName" className="block text-sm font-medium leading-6 text-gray-900">Người cấp phát</label>
                        <div className="mt-2">
                          <input
                            type="text"
                            name="fulfillerName"
                            id="fulfillerName"
                            value={currentUser.name}
                            readOnly
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">Ghi chú (tùy chọn)</label>
                        <div className="mt-2">
                          <textarea
                            rows={4}
                            name="notes"
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Vd: Đã thay thế vật tư X bằng Y theo thỏa thuận."
                          ></textarea>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 sm:ml-3 sm:w-auto"
              >
                Xác nhận và Hoàn thành
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FulfillRequisitionModal;

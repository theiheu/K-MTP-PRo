import React, { useState } from 'react';

interface RequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { requesterName: string; zone: string; purpose: string }) => void;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const RequisitionModal: React.FC<RequisitionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [requesterName, setRequesterName] = useState('');
  const [zone, setZone] = useState('Khu 1');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim() || !purpose.trim()) {
      alert('Vui lòng điền đầy đủ Tên người yêu cầu và Mục đích.');
      return;
    }
    onSubmit({ requesterName, zone, purpose });
    // Reset form
    setRequesterName('');
    setZone('Khu 1');
    setPurpose('');
  };

  if (!isOpen) return null;

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">Chi tiết Phiếu Yêu cầu</h3>
                  <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center" onClick={onClose}>
                    <XMarkIcon className="h-6 w-6"/>
                    <span className="sr-only">Đóng modal</span>
                  </button>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} id="requisitionForm" className="space-y-4">
                      <div>
                        <label htmlFor="requesterName" className="block text-sm font-medium leading-6 text-gray-900">Tên người yêu cầu</label>
                        <div className="mt-2">
                          <input
                            type="text"
                            name="requesterName"
                            id="requesterName"
                            value={requesterName}
                            onChange={(e) => setRequesterName(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Vd: Nguyễn Văn A"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="zone" className="block text-sm font-medium leading-6 text-gray-900">Khu vực</label>
                        <div className="mt-2">
                          <select
                            id="zone"
                            name="zone"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          >
                            <option>Khu 1</option>
                            <option>Khu 2</option>
                            <option>Khu 3</option>
                            <option>Khu 4</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="purpose" className="block text-sm font-medium leading-6 text-gray-900">Mục đích</label>
                        <div className="mt-2">
                          <textarea
                            rows={3}
                            name="purpose"
                            id="purpose"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Vd: Sửa chữa máy cho gà ăn"
                            required
                          ></textarea>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                form="requisitionForm"
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
              >
                Gửi Phiếu Yêu cầu
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionModal;

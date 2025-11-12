import React, { useState } from 'react';
import { RequisitionForm, UserRole } from '../types';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import ConfirmationModal from './ConfirmationModal';

interface RequisitionCardProps {
  form: RequisitionForm;
  onInitiateFulfillment: (form: RequisitionForm) => void;
  userRole: UserRole;
  onImageClick: (images: string[], startIndex: number) => void;
  onEdit: (form: RequisitionForm) => void;
  onDelete: (formId: string) => void;
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

const RequisitionCard: React.FC<RequisitionCardProps> = ({ form, onInitiateFulfillment, userRole, onImageClick, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleFulfillClick = () => {
    onInitiateFulfillment(form);
  };

  const uniqueCategories = [...new Set(form.items.map(item => item.product.category))];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-600 truncate" title={form.id}>{form.id}</p>
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

        <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Người yêu cầu:</span> {form.requesterName}</p>
            <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Mục đích:</span> {form.purpose}</p>
            {uniqueCategories.length > 0 && (
                <div className="flex items-start">
                    <span className="font-medium text-gray-800 text-sm flex-shrink-0 mr-2">Danh mục:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {uniqueCategories.map(category => (
                            <span key={category} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {category}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {form.status === 'Đã hoàn thành' && form.fulfilledBy && (
                 <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Cấp phát bởi:</span> {form.fulfilledBy} lúc {new Date(form.fulfilledAt!).toLocaleString('vi-VN')}</p>
            )}
            {form.status === 'Đã hoàn thành' && form.fulfillmentNotes && (
                 <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Ghi chú cấp phát:</span> {form.fulfillmentNotes}</p>
            )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-base font-medium text-gray-900 pt-4 pb-2">Danh sách vật tư ({form.items.length})</h4>
          <ul role="list" className="divide-y divide-gray-200">
            {form.items.map(item => {
              const variantAttributes = Object.entries(item.variant.attributes)
                .map(([, value]) => value)
                .join(' / ');

              const variantImages = item.variant.images;
              // Use variant images if available, otherwise fall back to general product images
              const galleryImages = (variantImages && variantImages.length > 0) ? variantImages : item.product.images;
              const displayImage = galleryImages[0];

              return (
                <li key={`${item.product.id}-${item.variant.id}`} className="flex py-4 items-start">
                   <div
                    className="h-16 w-16 rounded-md flex-shrink-0 cursor-pointer overflow-hidden"
                    onClick={(e) => {
                        e.stopPropagation();
                        onImageClick(galleryImages, 0);
                    }}
                  >
                    <ImageWithPlaceholder
                        src={displayImage}
                        alt={`${item.product.name}${variantAttributes ? ` - ${variantAttributes}` : ''}`}
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>

                  <div className="ml-4 flex-1">
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    {variantAttributes && <p className="text-sm text-gray-500">{variantAttributes}</p>}
                     {item.variant.components && item.variant.components.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <ul className="list-disc list-inside">
                            {item.variant.components.map(comp => {
                                const componentVariant = item.product.variants.find(v => v.id === comp.variantId);
                                const variantName = componentVariant ? (Object.values(componentVariant.attributes).join(' / ') || 'Thành phần') : `ID ${comp.variantId}`;
                                return (
                                    <li key={comp.variantId}>{comp.quantity} x {variantName}</li>
                                );
                            })}
                          </ul>
                        </div>
                      )}
                  </div>
                  <div className="text-right flex-shrink-0">
                      <p className="font-medium text-gray-900">SL: {item.quantity} {item.variant.unit}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            {isExpanded ? 'Ẩn chi tiết' : `Xem Chi Tiết (${form.items.length} mục)`}
            <ChevronDownIcon className={`w-5 h-5 ml-2 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {userRole === 'manager' && (
            <>
              <button
                onClick={() => onEdit(form)}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Chỉnh sửa
              </button>
              {form.status === 'Đang chờ xử lý' && (
                <button
                  onClick={handleFulfillClick}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                >
                  Xác nhận Cung cấp
                </button>
              )}
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700"
              >
                Xoá
              </button>
            </>
          )}
      </div>
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            onDelete(form.id);
            setIsDeleteModalOpen(false);
          }}
          title="Xác nhận xoá phiếu yêu cầu"
          message={`Bạn có chắc chắn muốn xoá phiếu yêu cầu này không? ID: ${form.id}. Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
};

export default RequisitionCard;

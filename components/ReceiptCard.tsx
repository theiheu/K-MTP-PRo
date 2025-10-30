
import React, { useState } from 'react';
import { GoodsReceiptNote, Product } from '../types';

interface ReceiptCardProps {
  receipt: GoodsReceiptNote;
  allProducts: Product[];
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, allProducts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map product/variant details to items for easier display
  const itemsWithDetails = receipt.items.map(item => {
    const product = allProducts.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    const variantAttributes = variant ? Object.values(variant.attributes).join(' / ') : 'Không rõ';
    return {
      ...item,
      productName: product?.name || 'Không rõ',
      variantName: variantAttributes || 'Mặc định',
      unit: variant?.unit || 'đơn vị'
    };
  });
  
  const totalItems = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-600 truncate" title={receipt.id}>{receipt.id}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              Nhà cung cấp: <span className="font-normal">{receipt.supplier || 'Không rõ'}</span>
            </p>
          </div>
          <div className="flex flex-row-reverse justify-between items-center sm:flex-col sm:items-end sm:justify-start gap-2 mt-2 sm:mt-0 flex-shrink-0">
             <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Tổng số lượng: {totalItems}
            </span>
            <p className="text-sm text-gray-500">
              {new Date(receipt.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        
        <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Người tạo:</span> {receipt.createdBy}</p>
            {receipt.notes && <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Ghi chú:</span> {receipt.notes}</p>}
            {receipt.linkedRequisitionIds && receipt.linkedRequisitionIds.length > 0 && (
                 <p className="text-sm text-green-700 bg-green-50 p-2 rounded-md"><span className="font-medium">Tự động cấp phát cho phiếu:</span> {receipt.linkedRequisitionIds.join(', ')}</p>
            )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-base font-medium text-gray-900 pt-4 pb-2">Danh sách vật tư nhập ({receipt.items.length})</h4>
          <ul role="list" className="divide-y divide-gray-200">
            {itemsWithDetails.map((item, index) => (
                <li key={`${item.variantId}-${index}`} className="flex py-3 items-center">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">{item.variantName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                      <p className="font-medium text-gray-900">SL: {item.quantity} {item.unit}</p>
                  </div>
                </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            {isExpanded ? 'Ẩn chi tiết' : `Xem Chi Tiết (${receipt.items.length} mục)`}
            <ChevronDownIcon className={`w-5 h-5 ml-2 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
      </div>
    </div>
  );
};

export default ReceiptCard;

import React, { useState } from 'react';
import { CartItem as CartItemType } from '../types';
import CartItem from './CartItem';
import ConfirmationModal from './ConfirmationModal';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemType[];
  onRemove: (variantId: number) => void;
  onUpdateItem: (variantId: number, quantity: number) => void;
  onCreateRequisition: () => void;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);


const Cart: React.FC<CartProps> = ({ isOpen, onClose, cartItems, onRemove, onUpdateItem, onCreateRequisition }) => {
  const [itemToRemove, setItemToRemove] = useState<CartItemType | null>(null);

  const handleRequestRemove = (variantId: number) => {
    const item = cartItems.find(i => i.variant.id === variantId);
    if (item) {
      setItemToRemove(item);
    }
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      onRemove(itemToRemove.variant.id);
    }
    setItemToRemove(null);
  };

  return (
    <>
      <div className={`relative z-50 ${isOpen ? '' : 'hidden'}`} aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${isOpen ? 'ease-in-out duration-500 opacity-100' : 'ease-in-out duration-500 opacity-0'}`}></div>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 transform transition ${isOpen ? 'ease-in-out duration-500 sm:duration-700 translate-x-0' : 'translate-x-full'}`}>
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">Phiếu Yêu Cầu Tạm Thời</h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500" onClick={onClose}>
                          <span className="sr-only">Đóng bảng</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flow-root">
                        {cartItems.length > 0 ? (
                          <ul role="list" className="-my-6 divide-y divide-gray-200">
                            {cartItems.map((item) => (
                              <CartItem 
                                key={item.variant.id}
                                item={item}
                                onRemove={handleRequestRemove}
                                onUpdateItem={onUpdateItem}
                              />
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center">
                            <p className="text-gray-500">Chưa có vật tư nào trong phiếu.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {cartItems.length > 0 && (
                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="mt-6">
                        <button 
                          onClick={onCreateRequisition}
                          className="w-full flex items-center justify-center rounded-md border border-transparent bg-yellow-500 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-yellow-600">
                          Tạo Phiếu Yêu cầu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Xóa Vật tư khỏi Phiếu"
        message={`Bạn có chắc chắn muốn xóa "${itemToRemove?.product.name}" khỏi phiếu yêu cầu tạm thời không?`}
        confirmButtonText="Xóa"
        confirmButtonClass="bg-red-600 hover:bg-red-500"
      />
    </>
  );
};

export default Cart;

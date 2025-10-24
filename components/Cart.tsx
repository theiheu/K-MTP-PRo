import React, { Fragment } from 'react';
import { CartItem as CartItemType } from '../types';
import CartItem from './CartItem';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemType[];
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);


const Cart: React.FC<CartProps> = ({ isOpen, onClose, cartItems, onRemove, onUpdateQuantity }) => {

  return (
    <div className={`relative z-50 ${isOpen ? '' : 'hidden'}`} aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${isOpen ? 'ease-in-out duration-500 opacity-100' : 'ease-in-out duration-500 opacity-0'}`}></div>

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className={`pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 transform transition ${isOpen ? 'ease-in-out duration-500 sm:duration-700 translate-x-0' : 'translate-x-full'}`}>
            <div className="pointer-events-auto w-screen max-w-md">
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">Danh sách Yêu cầu</h2>
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
                              key={item.product.id}
                              item={item}
                              onRemove={onRemove}
                              onUpdateQuantity={onUpdateQuantity}
                            />
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-500">Danh sách yêu cầu của bạn đang trống.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                    <div className="mt-6">
                      <a href="#" className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700">Gửi Yêu cầu</a>
                    </div>
                    <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                      <p>
                        hoặc{' '}
                        <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={onClose}>
                          Tiếp tục tìm kiếm
                          <span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
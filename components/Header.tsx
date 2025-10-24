import React from 'react';
import { User } from '../types';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: 'shop' | 'requisitions' | 'create-requisition' | 'admin') => void;
  currentView: string;
  user: User;
  onResetUser: () => void;
}

const ShoppingBagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const StoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h.75c.414 0 .75.336.75.75v7.5m0 0H18A2.25 2.25 0 0 0 20.25 18v-7.5a2.25 2.25 0 0 0-2.25-2.25H15M13.5 21H3.75A2.25 2.25 0 0 1 1.5 18.75V8.25A2.25 2.25 0 0 1 3.75 6h16.5a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 21h-4.5m-4.5 0H9.75c-.414 0-.75-.336-.75-.75V13.5c0-.414.336-.75.75-.75h.75c.414 0 .75.336.75.75v7.5m0 0H12m0-9.75h.008v.008H12V11.25Z" />
  </svg>
);

const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992m0 0h-4.992m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 16.951" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ cartItemCount, onCartClick, onNavigate, currentView, user, onResetUser }) => {
  const isNavEnabled = currentView === 'shop' || currentView === 'requisitions' || currentView === 'admin';
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex-1 flex justify-start items-center space-x-4">
            <button onClick={() => onNavigate('shop')} className="flex items-center space-x-2 text-xl sm:text-2xl font-bold text-gray-800">
              <StoreIcon className="h-8 w-8 text-indigo-600" />
              <span className="sm:inline">Vật tư Trại Gà</span>
            </button>
             <div className="hidden sm:block border-l border-gray-300 pl-4 ml-4">
                <div className="text-sm font-medium text-gray-800">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role === 'manager' ? 'Quản lý kho' : `Người yêu cầu (Khu: ${user.zone})`}</div>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center">
            <nav className="hidden sm:flex items-center space-x-4">
                <button onClick={() => onNavigate('requisitions')} disabled={!isNavEnabled} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'requisitions' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'} disabled:text-gray-300 disabled:bg-transparent disabled:cursor-not-allowed`}>
                    Danh sách Phiếu
                </button>
                <button onClick={() => onNavigate('shop')} disabled={!isNavEnabled} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'shop' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'} disabled:text-gray-300 disabled:bg-transparent disabled:cursor-not-allowed`}>
                    Kho vật tư
                </button>
                {user.role === 'manager' && (
                    <button onClick={() => onNavigate('admin')} disabled={!isNavEnabled} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'} disabled:text-gray-300 disabled:bg-transparent disabled:cursor-not-allowed`}>
                        Quản lý Vật tư
                    </button>
                )}
            </nav>
          </div>

          <div className="flex-1 flex justify-end items-center space-x-4">
            {currentView === 'shop' && (
              <div className="flow-root">
                <button onClick={onCartClick} className="group -m-2 p-2 flex items-center relative">
                  <ShoppingBagIcon className="flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  {cartItemCount > 0 && (
                    <>
                      {/* Mobile: Red dot indicator */}
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white sm:hidden" />
                      
                      {/* Desktop: Item count */}
                      <span className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white sm:flex">
                        {cartItemCount}
                      </span>
                    </>
                  )}
                  <span className="sr-only">vật tư trong danh sách, xem danh sách</span>
                </button>
              </div>
            )}
             <button onClick={onResetUser} title="Thiết lập lại người dùng" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <ArrowPathIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
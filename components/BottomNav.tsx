import React from 'react';
import { User } from '../types';

interface BottomNavProps {
  onNavigate: (view: 'shop' | 'requisitions' | 'admin') => void;
  currentView: 'shop' | 'requisitions' | 'create-requisition' | 'admin';
  user: User;
}

const StoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h.75c.414 0 .75.336.75.75v7.5m0 0H18A2.25 2.25 0 0 0 20.25 18v-7.5a2.25 2.25 0 0 0-2.25-2.25H15M13.5 21H3.75A2.25 2.25 0 0 1 1.5 18.75V8.25A2.25 2.25 0 0 1 3.75 6h16.5a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 21h-4.5m-4.5 0H9.75c-.414 0-.75-.336-.75-.75V13.5c0-.414.336-.75.75-.75h.75c.414 0 .75.336.75.75v7.5m0 0H12m0-9.75h.008v.008H12V11.25Z" />
  </svg>
);

const ListBulletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
    </svg>
);

const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.495-2.495a1.125 1.125 0 0 1 1.591 0l3.026 3.026a1.125 1.125 0 0 1 0 1.591l-2.495 2.495M11.42 15.17 8.617 12.364a1.125 1.125 0 0 1 0-1.591l6.061-6.061a1.125 1.125 0 0 1 1.591 0l.441.442a1.125 1.125 0 0 1 0 1.591l-5.59 5.59M11.42 15.17l-2.17-2.17m0 0a1.125 1.125 0 0 1 1.591 0L12 14.5m-3.879-3.879a1.125 1.125 0 0 1 0-1.591l2.17-2.17" />
    </svg>
);


const BottomNav: React.FC<BottomNavProps> = ({ onNavigate, currentView, user }) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] z-40">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => onNavigate('requisitions')} 
          className={`flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors ${currentView === 'requisitions' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
        >
          <ListBulletIcon className="w-6 h-6 mb-1" />
          Danh sách Phiếu
        </button>
        <button 
          onClick={() => onNavigate('shop')} 
          className={`flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors ${currentView === 'shop' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
        >
          <StoreIcon className="w-6 h-6 mb-1" />
          Kho vật tư
        </button>
        {user.role === 'manager' && (
            <button 
            onClick={() => onNavigate('admin')} 
            className={`flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors ${currentView === 'admin' ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
            >
            <WrenchScrewdriverIcon className="w-6 h-6 mb-1" />
            Quản lý
            </button>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
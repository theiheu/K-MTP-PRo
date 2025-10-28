import React from 'react';
import { User } from '../types';

interface DesktopNavProps {
  onNavigate: (view: 'shop' | 'requisitions' | 'admin') => void;
  currentView: string;
  user: User;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ onNavigate, currentView, user }) => {
  return (
    <nav className="hidden sm:block bg-white shadow-sm sticky top-16 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center space-x-4 h-12">
          <button onClick={() => onNavigate('shop')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'shop' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`}>
              Kho vật tư
          </button>
          <button onClick={() => onNavigate('requisitions')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'requisitions' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`}>
              Danh sách Phiếu
          </button>
          {user.role === 'manager' && (
              <button onClick={() => onNavigate('admin')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                  Quản lý
              </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;
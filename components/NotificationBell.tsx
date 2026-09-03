import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { UserRole } from '../types';

interface NotificationBellProps {
  userRole: UserRole;
  onNavigateToRequisitions: () => void;
  onNavigateToInventory: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userRole, onNavigateToRequisitions, onNavigateToInventory }) => {
  const { products, requisitions } = useDataStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lowStockItems = useMemo(() => {
    const items: { name: string; stock: number; unit: string }[] = [];
    if (userRole !== 'manager') return items; // Only managers care about low stock globally here
    
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.stock < 20) {
          items.push({
            name: `${p.name} ${Object.values(v.attributes).length > 0 ? '(' + Object.values(v.attributes).join(' / ') + ')' : ''}`,
            stock: v.stock,
            unit: v.unit || 'cái'
          });
        }
      });
    });
    return items;
  }, [products, userRole]);

  const pendingReqs = useMemo(() => {
    if (userRole === 'manager') {
      return requisitions.filter(r => r.status === 'Đang chờ xử lý');
    }
    return []; // Requesters don't need a bell for their own pending reqs, they know they made them. Or we could show their approved ones.
  }, [requisitions, userRole]);

  // Compute expiring batches (within 30 days)
  const expiringBatches = useMemo(() => {
    const items: { name: string; batchCode: string; expiryDate: string; stock: number; daysLeft: number }[] = [];
    if (userRole !== 'manager') return items;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.batches) {
          v.batches.forEach(b => {
            if (b.expiryDate && b.stock > 0) {
              const expDate = new Date(b.expiryDate);
              if (expDate <= thirtyDaysFromNow) {
                const diffTime = expDate.getTime() - today.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                items.push({
                  name: `${p.name} ${Object.values(v.attributes).length > 0 ? '(' + Object.values(v.attributes).join(' / ') + ')' : ''}`,
                  batchCode: b.batchCode || 'DEFAULT',
                  expiryDate: b.expiryDate,
                  stock: b.stock,
                  daysLeft
                });
              }
            }
          });
        }
      });
    });
    return items.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [products, userRole]);

  const totalNotifications = lowStockItems.length + pendingReqs.length + expiringBatches.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
        aria-label="Thông báo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>

        {totalNotifications > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 transform -translate-y-1/2 translate-x-1/4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none text-center flex items-center justify-center ring-2 ring-white">
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Thông báo ({totalNotifications})</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="px-4 py-6 text-sm text-center text-gray-500">
                Không có thông báo mới.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingReqs.length > 0 && (
                  <div 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => { setIsOpen(false); onNavigateToRequisitions(); }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {pendingReqs.length} Phiếu yêu cầu đang chờ duyệt
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Bấm vào để xem và xử lý các phiếu xuất kho mới.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {lowStockItems.length > 0 && (
                  <div 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => { setIsOpen(false); onNavigateToInventory(); }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500"></div>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Cảnh báo: {lowStockItems.length} vật tư sắp hết hàng
                        </p>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          {lowStockItems.slice(0, 3).map((item, idx) => (
                            <p key={idx} className="truncate">• {item.name}: Còn {item.stock} {item.unit}</p>
                          ))}
                          {lowStockItems.length > 3 && (
                            <p className="italic">...và {lowStockItems.length - 3} mục khác</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {expiringBatches.length > 0 && (
                  <div 
                    className="p-4 hover:bg-amber-50 cursor-pointer transition-colors"
                    onClick={() => { setIsOpen(false); onNavigateToInventory(); }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-2 w-2 mt-1.5 rounded-full bg-amber-500"></div>
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Cảnh báo: {expiringBatches.length} lô vật tư sắp hết hạn
                        </p>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          {expiringBatches.slice(0, 3).map((item, idx) => (
                            <p key={idx} className="truncate">• {item.name} (Lô {item.batchCode}): Hết hạn sau {item.daysLeft} ngày (còn {item.stock})</p>
                          ))}
                          {expiringBatches.length > 3 && (
                            <p className="italic">...và {expiringBatches.length - 3} lô khác</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

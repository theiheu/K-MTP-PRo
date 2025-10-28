import React from 'react';
import { Category } from '../types';

interface MobileFilterSortDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onApply: () => void;
  productCount: number;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);


const MobileFilterSortDrawer: React.FC<MobileFilterSortDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  onApply,
  productCount,
}) => {

  const handleApply = () => {
    onApply();
    onClose();
  }

  return (
    <>
      <div className={`relative z-50 sm:hidden ${isOpen ? '' : 'hidden'}`} aria-labelledby="filter-drawer-title" role="dialog" aria-modal="true">
        <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${isOpen ? 'ease-in-out duration-300 opacity-100' : 'ease-in-out duration-300 opacity-0 pointer-events-none'}`}></div>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={`pointer-events-none fixed inset-x-0 bottom-0 flex max-h-[85vh] transform transition ${isOpen ? 'ease-in-out duration-300 translate-y-0' : 'translate-y-full'}`}>
              <div className="pointer-events-auto w-screen">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl rounded-t-lg">
                  <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    <div className="flex items-start justify-between border-b pb-4">
                      <h2 className="text-lg font-medium text-gray-900" id="filter-drawer-title">Lọc</h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button type="button" className="-m-2 p-2 text-gray-400 hover:text-gray-500" onClick={onClose}>
                          <span className="sr-only">Đóng bảng</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-8">
                        {/* Category Section */}
                        <div>
                            <h3 className="text-base font-medium text-gray-800">Danh mục</h3>
                            <div className="mt-4 space-y-4">
                                {categories.map(cat => (
                                    <div key={cat.name} className="flex items-center">
                                        <input id={`filter-category-${cat.name}`} name="category" type="radio" value={cat.name} checked={selectedCategory === cat.name} onChange={(e) => onCategoryChange(e.target.value)} className="h-4 w-4 border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                                        <label htmlFor={`filter-category-${cat.name}`} className="ml-3 text-sm text-gray-600">{cat.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                    <button 
                        onClick={handleApply}
                        className="w-full flex items-center justify-center rounded-md border border-transparent bg-yellow-500 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-yellow-600"
                    >
                        Xem {productCount} vật tư
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileFilterSortDrawer;
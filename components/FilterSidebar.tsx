import React from 'react';
import { Category } from '../types';

interface FilterSidebarProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const AllIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-2.25ZM13.5 6A2.25 2.25 0 0 1 15.75 3.75h2.25A2.25 2.25 0 0 1 20.25 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
);
  

const FilterSidebar: React.FC<FilterSidebarProps> = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto pr-4 -mr-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh mục</h2>
          <ul className="space-y-2">
            {categories.map((category) => (
                <li key={category.name}>
                    <button
                        onClick={() => onSelectCategory(category.name)}
                        aria-pressed={activeCategory === category.name}
                        className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 ease-in-out ${
                            activeCategory === category.name
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        {category.name === 'Tất cả' ? (
                            <AllIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                        ) : (
                            <img src={category.icon} alt={category.name} className="w-5 h-5 mr-3 object-contain flex-shrink-0" />
                        )}
                        <span className="truncate">{category.name}</span>
                    </button>
                </li>
            ))}
          </ul>
      </div>
    </aside>
  );
};

export default FilterSidebar;

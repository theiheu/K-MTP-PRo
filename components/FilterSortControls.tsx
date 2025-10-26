import React from 'react';

interface FilterSortControlsProps {
  categories: string[];
  onFilterChange: (category: string) => void;
  onSortChange: (sortOption: string) => void;
  selectedCategory: string;
  selectedSort: string;
}

const FilterSortControls: React.FC<FilterSortControlsProps> = ({ categories, onFilterChange, onSortChange, selectedCategory, selectedSort }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
          <select
            id="sort-by"
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
          >
            <option value="default">Default</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterSortControls;
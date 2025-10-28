import React from 'react';

interface SortControlsProps {
  onSortChange: (sortOption: string) => void;
  selectedSort: string;
}

const SortControls: React.FC<SortControlsProps> = ({ onSortChange, selectedSort }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">Sắp xếp theo:</label>
      <select
        id="sort-by"
        value={selectedSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
      >
        <option value="default">Mặc định</option>
        <option value="name-asc">Tên: A đến Z</option>
        <option value="name-desc">Tên: Z đến A</option>
      </select>
    </div>
  );
};

export default SortControls;

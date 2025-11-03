import React, { useEffect, useState } from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, placeholder = "Tìm kiếm theo tên hoặc mô tả vật tư..." }) => {
  const [value, setValue] = useState(searchTerm);

  useEffect(() => {
    setValue(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (value !== searchTerm) {
        onSearchChange(value);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [value, searchTerm, onSearchChange]);

  return (
    <div className="w-full">
      <label htmlFor="search" className="sr-only">Tìm kiếm</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="search"
          name="search"
          id="search"
          className="block w-full rounded-md border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SearchBar;
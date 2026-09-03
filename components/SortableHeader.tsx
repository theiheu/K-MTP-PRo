import React from 'react';
import { SortDirection } from '../hooks/useSortableData';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection };
  onRequestSort: (key: string) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  onRequestSort,
  className = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none",
}) => {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th className={className} onClick={() => onRequestSort(sortKey)}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col w-3 h-3 text-gray-400">
          <svg
            className={`w-3 h-3 -mb-1 ${direction === 'asc' ? 'text-gray-900' : 'opacity-50'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <svg
            className={`w-3 h-3 -mt-1 ${direction === 'desc' ? 'text-gray-900' : 'opacity-50'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </th>
  );
};

export default SortableHeader;

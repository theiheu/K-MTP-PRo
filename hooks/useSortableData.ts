import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useSortableData<T>(items: T[], initialConfig: SortConfig = { key: '', direction: null }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialConfig);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    if (sortConfig.key && sortConfig.direction !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties if key has dots (e.g. 'product.name')
        if (sortConfig.key.includes('.')) {
          aValue = sortConfig.key.split('.').reduce((obj: any, p: string) => (obj ? obj[p] : undefined), a);
          bValue = sortConfig.key.split('.').reduce((obj: any, p: string) => (obj ? obj[p] : undefined), b);
        } else if (sortConfig.key === 'totalStock' && a.variants && b.variants) {
          aValue = a.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
          bValue = b.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        }

        // Handle string comparison for Vietnamese
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'vi') 
            : bValue.localeCompare(aValue, 'vi');
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
}

import { useMemo, useState } from 'react';

// Encapsulates search, filter, sort, and view switch logic for inventory (React JSX)
export function useInventoryControls(items) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    let next = items || [];

    if (normalizedQuery) {
      next = next.filter((v) =>
        String(v.id).toLowerCase().includes(normalizedQuery) ||
        String(v.model).toLowerCase().includes(normalizedQuery) ||
        String(v.variant || '').toLowerCase().includes(normalizedQuery)
      );
    }

    if (statusFilter) {
      next = next.filter((v) => v.status === statusFilter);
    }

    if (locationFilter) {
      next = next.filter(
        (v) => String(v.location).toLowerCase() === String(locationFilter).toLowerCase()
      );
    }

    const sorters = {
      recent: () => 0, // keep original order
      priceAsc: (a, b) => (a.price || 0) - (b.price || 0),
      priceDesc: (a, b) => (b.price || 0) - (a.price || 0),
      modelAZ: (a, b) => String(a.model).localeCompare(String(b.model)),
      modelZA: (a, b) => String(b.model).localeCompare(String(a.model)),
      status: (a, b) => String(a.status).localeCompare(String(b.status)),
    };

    const sorter = sorters[sortKey] || sorters["recent"];
    return [...next].sort(sorter);
  }, [items, searchQuery, statusFilter, locationFilter, sortKey]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    sortKey,
    setSortKey,
    viewMode,
    setViewMode,
    data: filteredAndSorted,
  };
}

export function formatCurrencyVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}



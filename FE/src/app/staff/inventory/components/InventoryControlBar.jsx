import React from 'react';
import { Search as SearchIcon, Filter as FilterIcon, LayoutGrid, Table } from 'lucide-react';

const ControlSelect = ({ value, onChange, children, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
  >
    {children}
  </select>
);

export default function InventoryControlBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortKey,
  setSortKey,
  viewMode,
  setViewMode,
  extraFilters,
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sticky top-0 z-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search by model, vehicle ID..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <ControlSelect value={statusFilter} onChange={setStatusFilter} className="text-sm">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="maintenance">Maintenance</option>
          </ControlSelect>

          {extraFilters}

          {/* Sort */}
          <ControlSelect value={sortKey} onChange={setSortKey} className="text-sm">
            <option value="recent">Sort ▼ Default</option>
            <option value="priceAsc">Price: Low → High</option>
            <option value="priceDesc">Price: High → Low</option>
            <option value="modelAZ">Model: A → Z</option>
            <option value="modelZA">Model: Z → A</option>
            <option value="status">Status</option>
          </ControlSelect>

          {/* View Switch */}
          <div className="flex items-center gap-0" role="group" aria-label="Switch view">
            <button
              type="button"
              onClick={() => setViewMode && setViewMode('grid')}
              className={`px-3 py-2 border rounded-l-lg text-sm ${
                viewMode === 'grid' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode && setViewMode('table')}
              className={`px-3 py-2 border rounded-r-lg text-sm ${
                viewMode === 'table' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Table view"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



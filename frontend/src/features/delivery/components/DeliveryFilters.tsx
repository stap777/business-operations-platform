import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface DeliveryFiltersProps {
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  initialQuery?: string;
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  onSearchChange,
  selectedStatus,
  onStatusChange,
  initialQuery = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
  ];

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order # or customer name..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] rounded-xl text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors shadow-2xs"
        />
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#111111] text-white dark:bg-[#FAFAFA] dark:text-[#111111] shadow-2xs'
                  : 'bg-white dark:bg-[#0F0F0F] border border-[#ECECEC] dark:border-[#232323] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

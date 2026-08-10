import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../../customers/customerService';
import type { CustomerResponse } from '../../../customers/customer.types';
import { Search, UserCheck, ChevronDown } from 'lucide-react';

interface CustomerSelectorProps {
  selectedCustomer: CustomerResponse | null;
  onSelectCustomer: (customer: CustomerResponse | null) => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search query for customers
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', 'search', debouncedQuery],
    queryFn: () => customerService.getCustomers({ query: debouncedQuery, page: 0, size: 50 }),
    enabled: isOpen,
    staleTime: 60_000,
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const customersList = customersData?.content || [];

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA] block">
        Customer <span className="text-red-500">*</span>
      </label>

      {selectedCustomer ? (
        /* Selected Customer Card */
        <div className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] flex items-center justify-between shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-[#151515] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA] border border-[#ECECEC] dark:border-[#232323]">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#111111] dark:text-[#FAFAFA]">
                  {selectedCustomer.fullName}
                </span>
                {selectedCustomer.customerCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#151515] text-[#71717A] dark:text-[#A1A1AA] border border-[#ECECEC] dark:border-[#232323]">
                    {selectedCustomer.customerCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                {selectedCustomer.phoneNumber}
                {selectedCustomer.address && ` • ${selectedCustomer.address}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectCustomer(null)}
            className="text-xs text-[#71717A] hover:text-[#111111] dark:hover:text-[#FAFAFA] px-2.5 py-1 rounded-lg border border-[#ECECEC] dark:border-[#232323] hover:bg-[#FAFAFA] dark:hover:bg-[#151515] transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        /* Search Combobox Input */
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2.5 flex-1 pr-2">
              <Search className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search customer by name or phone..."
                className="w-full bg-transparent text-xs text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none"
              />
            </div>
            <ChevronDown className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
          </div>

          {/* Combobox Dropdown Results */}
          {isOpen && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95">
              {isLoading ? (
                <div className="p-3 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  Loading customers...
                </div>
              ) : customersList.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  No customers found matching &quot;{searchTerm}&quot;
                </div>
              ) : (
                customersList.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      onSelectCustomer(customer);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="p-2.5 rounded-lg hover:bg-[#FAFAFA] dark:hover:bg-[#151515] cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                        {customer.fullName}
                      </div>
                      <div className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                        {customer.phoneNumber} {customer.customerCode && `(${customer.customerCode})`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

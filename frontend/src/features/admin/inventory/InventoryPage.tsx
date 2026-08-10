import React, { useState } from 'react';
import type { ProductResponse } from '../../products/product.types';
import type { StockAdjustmentRequest } from './inventory.types';
import { useInventoryProducts, useStockAdjustmentsHistory, useCreateStockAdjustment } from './hooks/useInventory';
import { InventoryFilters } from './components/InventoryFilters';
import { InventoryTable } from './components/InventoryTable';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { StockAdjustmentHistoryTable } from './components/StockAdjustmentHistoryTable';
import { Button } from '../../../components/ui/button';
import { Sliders, Boxes, History, ChevronLeft, ChevronRight } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Filters for Current Inventory tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [inventoryPage, setInventoryPage] = useState<number>(0);

  // Filters for History tab
  const [historyPage, setHistoryPage] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductResponse | null>(null);

  // React Query Hooks
  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useInventoryProducts({
    name: searchQuery,
    categoryId: selectedCategory,
    lowStockOnly,
    page: inventoryPage,
    size: 20,
  });

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useStockAdjustmentsHistory({
    page: historyPage,
    size: 20,
  });

  const createAdjustmentMutation = useCreateStockAdjustment();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setInventoryPage(0);
  };

  const handleCategoryChange = (catId?: number) => {
    setSelectedCategory(catId);
    setInventoryPage(0);
  };

  const handleLowStockToggle = (lowStock: boolean) => {
    setLowStockOnly(lowStock);
    setInventoryPage(0);
  };

  const handleOpenModal = (product?: ProductResponse) => {
    setSelectedProductForModal(product || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductForModal(null);
  };

  const handleSubmitAdjustment = (payload: StockAdjustmentRequest) => {
    createAdjustmentMutation.mutate(payload, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const products = inventoryData?.content || [];
  const inventoryTotalPages = inventoryData?.totalPages || 0;

  const historyLogs = historyData?.content || [];
  const historyTotalPages = historyData?.totalPages || 0;

  return (
    <>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECECEC] dark:border-[#232323]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
            Inventory
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Monitor and adjust stock levels.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => handleOpenModal()}
          className="bg-[#111111] dark:bg-[#FAFAFA] text-white dark:text-[#111111] hover:opacity-90 text-xs font-medium gap-1.5 self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4" />
          Adjust Stock
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#ECECEC] dark:border-[#232323] pt-1">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-[#111111] dark:border-[#FAFAFA] text-[#111111] dark:text-[#FAFAFA]'
              : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          Stock Inventory
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[#111111] dark:border-[#FAFAFA] text-[#111111] dark:text-[#FAFAFA]'
              : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Adjustment Audit History
        </button>
      </div>

      {/* Tab 1: Stock Inventory */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <InventoryFilters
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onLowStockToggle={handleLowStockToggle}
            initialQuery={searchQuery}
            initialCategoryId={selectedCategory}
            initialLowStockOnly={lowStockOnly}
          />

          {isInventoryError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
              <span>Unable to load inventory data.</span>
              <Button variant="outline" size="sm" onClick={() => refetchInventory()} className="text-xs h-7">
                Retry
              </Button>
            </div>
          )}

          <InventoryTable
            products={products}
            isLoading={isInventoryLoading}
            onAdjustStock={(prod) => handleOpenModal(prod)}
          />

          {inventoryData && inventoryTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{inventoryData.number + 1}</span> of{' '}
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{inventoryData.totalPages}</span> ({inventoryData.totalElements} records)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inventoryData.first || isInventoryLoading}
                  onClick={() => setInventoryPage((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inventoryData.last || isInventoryLoading}
                  onClick={() => setInventoryPage((prev) => prev + 1)}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Adjustment History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {isHistoryError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
              <span>Unable to load adjustment history.</span>
              <Button variant="outline" size="sm" onClick={() => refetchHistory()} className="text-xs h-7">
                Retry
              </Button>
            </div>
          )}

          <StockAdjustmentHistoryTable
            adjustments={historyLogs}
            isLoading={isHistoryLoading}
          />

          {historyData && historyTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{historyData.number + 1}</span> of{' '}
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{historyData.totalPages}</span> ({historyData.totalElements} records)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyData.number === 0 || isHistoryLoading}
                  onClick={() => setHistoryPage((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={historyData.number >= historyData.totalPages - 1 || isHistoryLoading}
                  onClick={() => setHistoryPage((prev) => prev + 1)}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAdjustment}
        isSubmitting={createAdjustmentMutation.isPending}
        products={products}
        selectedProduct={selectedProductForModal}
      />
    </>
  );
};

export default InventoryPage;

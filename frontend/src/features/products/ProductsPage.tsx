import React, { useState } from 'react';
import { useProducts, useDeactivateProduct, useRestoreProduct, useDeleteProduct } from './hooks/useProducts';
import { useCategories, useDeleteCategory } from './hooks/useCategories';
import { ProductFilters } from './components/ProductFilters';
import { ProductTable } from './components/ProductTable';
import { ProductForm } from './components/ProductForm';
import { ProductDetails } from './components/ProductDetails';
import { StockUpdateModal } from './components/StockUpdateModal';
import { CategoryTable } from './components/CategoryTable';
import { CategoryForm } from './components/CategoryForm';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { Plus, Package, FolderTree, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { ProductResponse, CategoryResponse, ProductStatus } from './product.types';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // Product filters & pagination
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [productStatus, setProductStatus] = useState<ProductStatus | undefined>(undefined);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [productPage, setProductPage] = useState(0);

  // Category filters & pagination
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(0);

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductResponse | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<ProductResponse | null>(null);

  // Queries
  const productsQuery = useProducts({
    name: productSearch,
    categoryId: selectedCategoryId,
    status: productStatus,
    lowStockOnly,
    page: productPage,
    size: 20,
  });

  const categoriesQuery = useCategories({
    query: categorySearch,
    page: categoryPage,
    size: 20,
  });

  // Mutations
  const deactivateProductMutation = useDeactivateProduct();
  const restoreProductMutation = useRestoreProduct();
  const deleteProductMutation = useDeleteProduct();
  const deleteCategoryMutation = useDeleteCategory();

  const handleViewProduct = (id: number) => {
    setSelectedProductId(id);
    setIsDetailsOpen(true);
  };

  return (
    <>
      {/* Header Bar */}
      <PageHeader
        title="Products & Inventory"
        description="Manage inventory, catalog items, categories, and stock availability."
        action={
          activeTab === 'products' ? (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsAddProductOpen(true);
              }}
              size="sm"
              className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-medium gap-1.5 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingCategory(null);
                setIsAddCategoryOpen(true);
              }}
              size="sm"
              className="bg-[#09090B] dark:bg-[#FAFAFA] text-white dark:text-[#09090B] hover:bg-[#27272A] dark:hover:bg-[#E4E4E7] text-xs font-medium gap-1.5 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          )
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#ECECEC] dark:border-[#232323] pt-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-[#111111] dark:border-[#FAFAFA] text-[#111111] dark:text-[#FAFAFA]'
              : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Products Catalog
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-[#111111] dark:border-[#FAFAFA] text-[#111111] dark:text-[#FAFAFA]'
              : 'border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Categories
        </button>
      </div>

      {/* Products Tab View */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Toolbar Filters */}
          <ProductFilters
            searchQuery={productSearch}
            onSearchChange={(q) => {
              setProductSearch(q);
              setProductPage(0);
            }}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={(catId) => {
              setSelectedCategoryId(catId);
              setProductPage(0);
            }}
            selectedStatus={productStatus}
            onStatusChange={(status) => {
              setProductStatus(status);
              setProductPage(0);
            }}
            lowStockOnly={lowStockOnly}
            onLowStockToggle={(low) => {
              setLowStockOnly(low);
              setProductPage(0);
            }}
          />

          {/* Product Data Table */}
          <ProductTable
            products={productsQuery.data?.content || []}
            isLoading={productsQuery.isLoading}
            isError={productsQuery.isError}
            errorMessage={
              productsQuery.error instanceof Error
                ? productsQuery.error.message
                : undefined
            }
            onRetry={() => productsQuery.refetch()}
            onViewProduct={handleViewProduct}
            onAddProductClick={() => {
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setIsAddProductOpen(true);
            }}
            onDeactivateProduct={(id) => deactivateProductMutation.mutate(id)}
            onRestoreProduct={(id) => restoreProductMutation.mutate(id)}
            onDeleteProduct={(product) => setDeletingProduct(product)}
            onUpdateStock={(product) => setStockProduct(product)}
          />

          {/* Pagination Controls */}
          {productsQuery.data && productsQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{productsQuery.data.number + 1}</span> of{' '}
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{productsQuery.data.totalPages}</span> ({productsQuery.data.totalElements} records)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={productsQuery.data.first || productsQuery.isFetching}
                  onClick={() => setProductPage((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={productsQuery.data.last || productsQuery.isFetching}
                  onClick={() => setProductPage((prev) => prev + 1)}
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

      {/* Categories Tab View */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Category Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0F0F0F] p-3 rounded-xl border border-[#ECECEC] dark:border-[#232323] shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setCategoryPage(0);
                }}
                placeholder="Search categories..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAFAFA] dark:bg-[#151515] border border-[#ECECEC] dark:border-[#232323] rounded-lg text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA]"
              />
            </div>
          </div>

          {/* Category Data Table */}
          <CategoryTable
            categories={categoriesQuery.data?.content || []}
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            errorMessage={
              categoriesQuery.error instanceof Error
                ? categoriesQuery.error.message
                : undefined
            }
            onRetry={() => categoriesQuery.refetch()}
            onAddCategoryClick={() => {
              setEditingCategory(null);
              setIsAddCategoryOpen(true);
            }}
            onEditCategory={(cat) => {
              setEditingCategory(cat);
              setIsAddCategoryOpen(true);
            }}
            onDeleteCategory={(cat) => setDeletingCategory(cat)}
          />

          {/* Pagination Controls */}
          {categoriesQuery.data && categoriesQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
              <div>
                Showing page <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{categoriesQuery.data.number + 1}</span> of{' '}
                <span className="font-semibold text-[#111111] dark:text-[#FAFAFA]">{categoriesQuery.data.totalPages}</span> ({categoriesQuery.data.totalElements} records)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={categoriesQuery.data.first || categoriesQuery.isFetching}
                  onClick={() => setCategoryPage((prev) => Math.max(0, prev - 1))}
                  className="h-8 text-xs font-medium gap-1 border-[#ECECEC] dark:border-[#232323]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={categoriesQuery.data.last || categoriesQuery.isFetching}
                  onClick={() => setCategoryPage((prev) => prev + 1)}
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

      {/* Modals & Drawers */}
      <ProductForm
        open={isAddProductOpen}
        onOpenChange={(open) => {
          setIsAddProductOpen(open);
          if (!open) setEditingProduct(null);
        }}
        initialData={editingProduct}
      />
      <CategoryForm
        open={isAddCategoryOpen}
        onOpenChange={(open) => {
          setIsAddCategoryOpen(open);
          if (!open) setEditingCategory(null);
        }}
        initialData={editingCategory}
      />
      <ProductDetails
        productId={selectedProductId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
      <StockUpdateModal
        product={stockProduct}
        isOpen={!!stockProduct}
        onClose={() => setStockProduct(null)}
      />

      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <ConfirmDeleteModal
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          entityType="Product"
          entityName={deletingProduct.name}
          isDeleting={deleteProductMutation.isPending}
          onConfirm={() => {
            deleteProductMutation.mutate(deletingProduct.id, {
              onSuccess: () => setDeletingProduct(null),
            });
          }}
        />
      )}

      {/* Delete Category Confirmation Modal */}
      {deletingCategory && (
        <ConfirmDeleteModal
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          entityType="Category"
          entityName={deletingCategory.name}
          isDeleting={deleteCategoryMutation.isPending}
          warningText="Categories containing active products cannot be deleted."
          onConfirm={() => {
            deleteCategoryMutation.mutate(deletingCategory.id, {
              onSuccess: () => setDeletingCategory(null),
            });
          }}
        />
      )}
    </>
  );
};

export default ProductsPage;

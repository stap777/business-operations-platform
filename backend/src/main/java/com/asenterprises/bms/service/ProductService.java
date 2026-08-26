package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.ProductDropdownResponse;
import com.asenterprises.bms.dto.ProductRequest;
import com.asenterprises.bms.dto.ProductResponse;
import com.asenterprises.bms.dto.StockUpdateRequest;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.exception.ResourceAlreadyExistsException;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service managing product operations: creation, updates, stock updates, filtering,
 * status changes, and business rule validations (price thresholds, stock non-negativity, duplicate check per category).
 *
 * TODO (V2): Inventory Transaction History - Audit log for stock movements
 * TODO (V2): Reserved Stock - Track stock reserved in pending orders before fulfillment
 * TODO (V2): Automatic Low Stock Notifications - Trigger alerts when availableStock <= minimumStock
 * TODO (V2): Barcode Support - Add SKU/Barcode scanning capability
 * TODO (V2): Batch Stock Import - Support bulk CSV/Excel stock updates
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        validatePricesAndStock(request.getPurchasePrice(), request.getSellingPrice(), request.getAvailableStock(), request.getMinimumStock());

        String trimmedName = trim(request.getName());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign product to an inactive category");
        }

        if (productRepository.existsByNameAndCategoryId(trimmedName, request.getCategoryId())) {
            throw new ResourceAlreadyExistsException("Product with name '" + trimmedName + "' already exists in this category");
        }

        Product product = Product.builder()
                .name(trimmedName)
                .category(category)
                .purchasePrice(request.getPurchasePrice())
                .sellingPrice(request.getSellingPrice())
                .availableStock(request.getAvailableStock())
                .minimumStock(request.getMinimumStock())
                .unit(request.getUnit())
                .trackInventory(request.getTrackInventory() != null ? request.getTrackInventory() : true)
                .status(ProductStatus.ACTIVE)
                .build();

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        validatePricesAndStock(request.getPurchasePrice(), request.getSellingPrice(), request.getAvailableStock(), request.getMinimumStock());

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        String trimmedName = trim(request.getName());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign product to an inactive category");
        }

        if (productRepository.existsByNameAndCategoryIdAndIdNot(trimmedName, request.getCategoryId(), id)) {
            throw new ResourceAlreadyExistsException("Product with name '" + trimmedName + "' already exists in this category");
        }

        product.setName(trimmedName);
        product.setCategory(category);
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setMinimumStock(request.getMinimumStock());
        product.setUnit(request.getUnit());
        product.setTrackInventory(request.getTrackInventory() != null ? request.getTrackInventory() : true);

        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String name, Long categoryId, Boolean lowStockOnly, Pageable pageable) {
        return searchProducts(name, categoryId, null, lowStockOnly, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String name, Long categoryId, ProductStatus status, Boolean lowStockOnly, Pageable pageable) {
        String searchName = name != null && !name.trim().isEmpty() ? name.trim() : null;
        boolean isLowStock = lowStockOnly != null && lowStockOnly;
        return productRepository.searchProducts(searchName, categoryId, status, isLowStock, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductDropdownResponse> getProductDropdown() {
        return productRepository.findByStatusOrderByNameAsc(ProductStatus.ACTIVE)
                .stream()
                .map(this::mapToDropdownResponse)
                .toList();
    }

    @Transactional
    public ProductResponse deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setStatus(ProductStatus.INACTIVE);
        Product deactivatedProduct = productRepository.save(product);
        return mapToResponse(deactivatedProduct);
    }

    @Transactional
    public ProductResponse restoreProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setStatus(ProductStatus.ACTIVE);
        Product restoredProduct = productRepository.save(product);
        return mapToResponse(restoredProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, StockUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (request.getAvailableStock() < 0) {
            throw new IllegalArgumentException("Available stock cannot be negative");
        }

        product.setAvailableStock(request.getAvailableStock());
        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }

    private void validatePricesAndStock(BigDecimal purchasePrice, BigDecimal sellingPrice, Integer availableStock, Integer minimumStock) {
        if (purchasePrice == null || purchasePrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Purchase price must be non-negative");
        }
        if (sellingPrice == null || sellingPrice.compareTo(purchasePrice) < 0) {
            throw new IllegalArgumentException("Selling price (" + sellingPrice +
                    ") must be greater than or equal to purchase price (" + purchasePrice + ")");
        }
        if (availableStock == null || availableStock < 0) {
            throw new IllegalArgumentException("Available stock must be non-negative");
        }
        if (minimumStock == null || minimumStock < 0) {
            throw new IllegalArgumentException("Minimum stock must be non-negative");
        }
    }

    private String trim(String input) {
        return input != null ? input.trim() : null;
    }

    public ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getId() != null ? "PROD-" + product.getId() : null)
                .name(product.getName())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .purchasePrice(product.getPurchasePrice())
                .sellingPrice(product.getSellingPrice())
                .availableStock(product.getAvailableStock())
                .minimumStock(product.getMinimumStock())
                .unit(product.getUnit())
                .trackInventory(product.getTrackInventory())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductDropdownResponse mapToDropdownResponse(Product product) {
        return ProductDropdownResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sellingPrice(product.getSellingPrice())
                .availableStock(product.getAvailableStock())
                .unit(product.getUnit())
                .build();
    }
}

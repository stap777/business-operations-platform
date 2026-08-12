package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.ProductRequest;
import com.asenterprises.bms.dto.ProductResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProductSearchAndCreationIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    private Category electronics;
    private Category hardware;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        electronics = categoryRepository.save(Category.builder()
                .name("Electronics")
                .status(CategoryStatus.ACTIVE)
                .build());

        hardware = categoryRepository.save(Category.builder()
                .name("Hardware")
                .status(CategoryStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Create Product and verify returned ProductResponse and DB persistence")
    void testCreateProductAndVerifyResponse() {
        ProductRequest request = ProductRequest.builder()
                .name("Test Industrial Switch")
                .categoryId(electronics.getId())
                .purchasePrice(new BigDecimal("1500.00"))
                .sellingPrice(new BigDecimal("2200.00"))
                .availableStock(25)
                .minimumStock(5)
                .unit(ProductUnit.PCS)
                .trackInventory(true)
                .build();

        ProductResponse response = productService.createProduct(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getSku()).isEqualTo("PROD-" + response.getId());
        assertThat(response.getName()).isEqualTo("Test Industrial Switch");
        assertThat(response.getCategoryId()).isEqualTo(electronics.getId());
        assertThat(response.getCategoryName()).isEqualTo("Electronics");
        assertThat(response.getPurchasePrice()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(response.getSellingPrice()).isEqualByComparingTo(new BigDecimal("2200.00"));
        assertThat(response.getAvailableStock()).isEqualTo(25);
        assertThat(response.getMinimumStock()).isEqualTo(5);
        assertThat(response.getUnit()).isEqualTo(ProductUnit.PCS);

        // Verify product followed by search
        Page<ProductResponse> searchResult = productService.searchProducts("Industrial", null, null, PageRequest.of(0, 10));
        assertThat(searchResult.getTotalElements()).isEqualTo(1);
        assertThat(searchResult.getContent().get(0).getName()).isEqualTo("Test Industrial Switch");
    }

    @Test
    @DisplayName("Search products with various filter combinations: no filters, name, categoryId, lowStockOnly, pagination")
    void testSearchProductsWithFilters() {
        // Create 3 products
        // Product 1: High stock, Electronics
        productService.createProduct(ProductRequest.builder()
                .name("Alpha Router")
                .categoryId(electronics.getId())
                .purchasePrice(new BigDecimal("100.00"))
                .sellingPrice(new BigDecimal("150.00"))
                .availableStock(50)
                .minimumStock(10)
                .unit(ProductUnit.PCS)
                .trackInventory(true)
                .build());

        // Product 2: Low stock (2 <= 5), Electronics
        productService.createProduct(ProductRequest.builder()
                .name("Alpha Cable")
                .categoryId(electronics.getId())
                .purchasePrice(new BigDecimal("10.00"))
                .sellingPrice(new BigDecimal("20.00"))
                .availableStock(2)
                .minimumStock(5)
                .unit(ProductUnit.PCS)
                .trackInventory(true)
                .build());

        // Product 3: Normal stock, Hardware
        productService.createProduct(ProductRequest.builder()
                .name("Beta Drill")
                .categoryId(hardware.getId())
                .purchasePrice(new BigDecimal("500.00"))
                .sellingPrice(new BigDecimal("750.00"))
                .availableStock(15)
                .minimumStock(3)
                .unit(ProductUnit.PCS)
                .trackInventory(true)
                .build());

        // 1. Search with no filters
        Page<ProductResponse> noFilters = productService.searchProducts(null, null, null, PageRequest.of(0, 20));
        assertThat(noFilters.getTotalElements()).isEqualTo(3);

        // 2. Search with name
        Page<ProductResponse> byName = productService.searchProducts("Alpha", null, null, PageRequest.of(0, 20));
        assertThat(byName.getTotalElements()).isEqualTo(2);

        // 3. Search with categoryId
        Page<ProductResponse> byCategory = productService.searchProducts(null, electronics.getId(), null, PageRequest.of(0, 20));
        assertThat(byCategory.getTotalElements()).isEqualTo(2);

        // 4. Search lowStockOnly = true
        Page<ProductResponse> lowStockTrue = productService.searchProducts(null, null, true, PageRequest.of(0, 20));
        assertThat(lowStockTrue.getTotalElements()).isEqualTo(1);
        assertThat(lowStockTrue.getContent().get(0).getName()).isEqualTo("Alpha Cable");

        // 5. Search lowStockOnly = false (all items)
        Page<ProductResponse> lowStockFalse = productService.searchProducts(null, null, false, PageRequest.of(0, 20));
        assertThat(lowStockFalse.getTotalElements()).isEqualTo(3);

        // 6. Pagination check (size 2)
        Page<ProductResponse> page0 = productService.searchProducts(null, null, null, PageRequest.of(0, 2));
        assertThat(page0.getContent().size()).isEqualTo(2);
        assertThat(page0.getTotalPages()).isEqualTo(2);
        assertThat(page0.getTotalElements()).isEqualTo(3);
    }
}

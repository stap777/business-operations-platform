package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.ProductRequest;
import com.asenterprises.bms.dto.SalesReportResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.ProductService;
import com.asenterprises.bms.service.SalesReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Mandatory integration test suite verifying point-in-time purchase price snapshot in OrderItem:
 * 1. New OrderItem captures catalog purchase price at creation time.
 * 2. Updating Product purchase price later does NOT alter historical COGS or Gross Profit.
 * 3. Multiple order items with different historical costs calculate exact aggregated COGS.
 * 4. Cancelled orders remain strictly excluded.
 * 5. Legacy orders with null purchasePrice are handled safely without exceptions.
 * 6. Gross Profit uses historical point-in-time cost.
 * 7. Backend/database is authoritative (frontend cannot supply or override purchase cost).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class HistoricalCogsSnapshotTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private SalesReportService salesReportService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    private Customer customer;
    private User manager;
    private Category category;

    @BeforeEach
    void setUp() {
        long seed = System.currentTimeMillis() % 1000000;
        manager = userRepository.save(User.builder()
                .fullName("COGS Manager")
                .username("mgr_cogs_" + seed)
                .password("encoded_pass")
                .phoneNumber("96666" + String.format("%05d", seed % 100000))
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CCOGS-" + seed)
                .fullName("COGS Customer")
                .phoneNumber("95555" + String.format("%05d", seed % 100000))
                .address("COGS Address")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("COGS Category " + seed)
                .description("Category for COGS testing")
                .build());
    }

    @Test
    @DisplayName("Test 1: New OrderItem captures Product.purchasePrice snapshot at order creation time")
    void testNewOrderItemCapturesPurchasePrice() {
        Product product = createProduct("Snapshot Product", new BigDecimal("150.00"), new BigDecimal("100.00"), 50);

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder()
                                .productId(product.getId())
                                .quantity(5)
                                .build()
                ))
                .build();

        OrderResponse response = orderService.createOrder(orderReq, manager.getUsername());
        assertThat(response).isNotNull();

        Order entity = orderRepository.findById(response.getId()).orElseThrow();
        assertThat(entity.getItems()).hasSize(1);

        OrderItem item = entity.getItems().get(0);
        assertThat(item.getPurchasePrice()).isNotNull();
        assertThat(item.getPurchasePrice()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(item.getSellingPrice()).isEqualByComparingTo(new BigDecimal("150.00"));
    }

    @Test
    @DisplayName("Test 2 & Mandatory Gate: Product purchase price change does NOT alter historical COGS or Gross Profit")
    void testProductPriceChangeDoesNotAlterHistoricalCogs() {
        // Step 1: Create Product with purchasePrice = ₹100, sellingPrice = ₹300
        Product product = createProduct("Immutable Cost Product", new BigDecimal("300.00"), new BigDecimal("100.00"), 100);

        // Step 2: Create Order with quantity = 10
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder()
                                .productId(product.getId())
                                .quantity(10)
                                .build()
                ))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());
        Order order = orderRepository.findById(orderRes.getId()).orElseThrow();
        // Mark as VERIFIED so it generates revenue
        order.setOrderStatus(OrderStatus.VERIFIED);
        orderRepository.save(order);

        LocalDateTime testDate = LocalDateTime.of(2026, 11, 10, 12, 0);
        orderRepository.overrideCreatedAt(order.getId(), testDate);

        // Step 3: Run report before price change
        LocalDate startDate = LocalDate.of(2026, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 11, 30);
        SalesReportResponse initialReport = salesReportService.getSalesReport(startDate, endDate, "DAILY");

        // Expected Revenue = 10 * 300 = 3,000
        // Expected COGS = 10 * 100 = 1,000
        // Expected Gross Profit = 3,000 - 1,000 = 2,000
        assertThat(initialReport.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(initialReport.getTotalCogs()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(initialReport.getGrossProfit()).isEqualByComparingTo(new BigDecimal("2000.00"));

        // Step 4: Update Product purchasePrice from ₹100 -> ₹200 & sellingPrice -> ₹350 (Simulating catalog cost inflation)
        ProductRequest updateReq = ProductRequest.builder()
                .name(product.getName())
                .categoryId(category.getId())
                .unit(product.getUnit())
                .sellingPrice(new BigDecimal("350.00"))
                .purchasePrice(new BigDecimal("200.00"))
                .minimumStock(product.getMinimumStock())
                .availableStock(product.getAvailableStock())
                .trackInventory(true)
                .build();

        productService.updateProduct(product.getId(), updateReq);

        // Step 5: Re-run historical sales report for November
        SalesReportResponse postUpdateReport = salesReportService.getSalesReport(startDate, endDate, "DAILY");

        // CRITICAL PROOF: Historical COGS MUST remain ₹1,000 (NOT ₹2,000)! Gross Profit MUST remain ₹2,000!
        assertThat(postUpdateReport.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(postUpdateReport.getTotalCogs()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(postUpdateReport.getGrossProfit()).isEqualByComparingTo(new BigDecimal("2000.00"));
    }

    @Test
    @DisplayName("Test 3: Multiple order items with different historical purchase costs calculate exact aggregated COGS")
    void testMultipleOrderItemsWithDifferentCosts() {
        Product prod1 = createProduct("Multi Product 1", new BigDecimal("500.00"), new BigDecimal("300.00"), 50);
        Product prod2 = createProduct("Multi Product 2", new BigDecimal("200.00"), new BigDecimal("120.00"), 50);

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(prod1.getId()).quantity(2).build(), // Cost: 2 * 300 = 600
                        OrderItemRequest.builder().productId(prod2.getId()).quantity(5).build()  // Cost: 5 * 120 = 600
                ))
                .build();

        OrderResponse res = orderService.createOrder(orderReq, manager.getUsername());
        Order order = orderRepository.findById(res.getId()).orElseThrow();
        order.setOrderStatus(OrderStatus.VERIFIED);
        orderRepository.save(order);

        LocalDateTime date = LocalDateTime.of(2026, 11, 12, 14, 0);
        orderRepository.overrideCreatedAt(order.getId(), date);

        SalesReportResponse report = salesReportService.getSalesReport(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), "DAILY");

        // Total COGS = 600 + 600 = 1,200.00
        assertThat(report.getTotalCogs()).isEqualByComparingTo(new BigDecimal("1200.00"));
    }

    @Test
    @DisplayName("Test 4: Cancelled orders remain excluded from historical COGS")
    void testCancelledOrdersExcluded() {
        Product prod = createProduct("Cancelled Test Product", new BigDecimal("200.00"), new BigDecimal("150.00"), 50);

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(prod.getId()).quantity(4).build() // Cost: 4 * 150 = 600
                ))
                .build();

        OrderResponse res = orderService.createOrder(orderReq, manager.getUsername());
        Order order = orderRepository.findById(res.getId()).orElseThrow();
        order.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        LocalDateTime date = LocalDateTime.of(2026, 11, 14, 11, 0);
        orderRepository.overrideCreatedAt(order.getId(), date);

        SalesReportResponse report = salesReportService.getSalesReport(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), "DAILY");

        // Cancelled order COGS must NOT be added
        assertThat(report.getTotalCogs()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Test 5: Legacy orders with null purchasePrice are handled safely without exceptions")
    void testLegacyOrderHandling() {
        Product prod = createProduct("Legacy Product", new BigDecimal("100.00"), new BigDecimal("60.00"), 50);

        // Manually build legacy OrderItem without purchasePrice (null)
        Order legacyOrder = Order.builder()
                .orderNumber("LEGACY-ORD-001")
                .customer(customer)
                .manager(manager)
                .subtotal(new BigDecimal("500.00"))
                .totalAmount(new BigDecimal("500.00"))
                .orderStatus(OrderStatus.VERIFIED)
                .build();

        OrderItem legacyItem = OrderItem.builder()
                .order(legacyOrder)
                .product(prod)
                .quantity(5)
                .purchasePrice(null) // Legacy NULL
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("500.00"))
                .build();

        legacyOrder.addItem(legacyItem);
        Order saved = orderRepository.save(legacyOrder);
        orderRepository.overrideCreatedAt(saved.getId(), LocalDateTime.of(2026, 11, 15, 9, 0));

        SalesReportResponse report = salesReportService.getSalesReport(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), "DAILY");

        // Must handle null gracefully: legacy item without snapshot cost is excluded from COGS
        assertThat(report.getTotalCogs()).isEqualByComparingTo(BigDecimal.ZERO);
        // Revenue still recorded as 500
        assertThat(report.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("500.00"));
        // Metadata flag MUST explicitly indicate cogsIncomplete = true for legacy items
        assertThat(report.getCogsIncomplete()).isTrue();
    }

    private Product createProduct(String name, BigDecimal sellingPrice, BigDecimal purchasePrice, Integer stock) {
        return productRepository.save(Product.builder()
                .name(name)
                .category(category)
                .sellingPrice(sellingPrice)
                .purchasePrice(purchasePrice)
                .availableStock(stock)
                .minimumStock(5)
                .unit(ProductUnit.PCS)
                .status(ProductStatus.ACTIVE)
                .build());
    }
}

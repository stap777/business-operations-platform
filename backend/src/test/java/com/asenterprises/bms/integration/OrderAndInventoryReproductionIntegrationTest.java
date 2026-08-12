package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.InventoryReportService;
import com.asenterprises.bms.service.OrderService;
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
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class OrderAndInventoryReproductionIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private InventoryReportService inventoryReportService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    private User manager;
    private Customer customer;
    private Product product;
    private Order createdOrder;

    @BeforeEach
    void setUp() {
        manager = userRepository.save(User.builder()
                .fullName("Test Manager")
                .username("test_mgr_rep_99")
                .password("encoded_pass")
                .phoneNumber("9876543299")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-REP-99")
                .fullName("Rep Customer")
                .phoneNumber("9988776655")
                .address("Rep Address")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Rep Category 99")
                .status(CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Rep Product 99")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("60.00"))
                .availableStock(10)
                .minimumStock(2)
                .status(ProductStatus.ACTIVE)
                .build());

        Order order = Order.builder()
                .orderNumber("ORD-REP-99")
                .customer(customer)
                .manager(manager)
                .orderStatus(OrderStatus.CREATED)
                .subtotal(new BigDecimal("100.00"))
                .totalAmount(new BigDecimal("100.00"))
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(1)
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("100.00"))
                .build();
        order.addItem(item);

        createdOrder = orderRepository.save(order);
    }

    // =========================================================================
    // ORDER SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("1. Order search with ALL filters null (Dashboard Default)")
    void testOrderSearchAllFiltersNull() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("2. Order search with orderNumber ONLY - matching case-insensitively")
    void testOrderSearchOrderNumberOnly() {
        Page<OrderResponse> result = orderService.searchOrders(createdOrder.getOrderNumber().toLowerCase(), null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getOrderNumber()).isEqualTo(createdOrder.getOrderNumber());
    }

    @Test
    @DisplayName("3. Order search with customerId ONLY")
    void testOrderSearchCustomerIdOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, customer.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("4. Order search with status ONLY")
    void testOrderSearchStatusOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, OrderStatus.CREATED, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("5. Order search with startDate ONLY")
    void testOrderSearchStartDateOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, LocalDate.now().minusDays(1), null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("6. Order search with endDate ONLY")
    void testOrderSearchEndDateOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, null, LocalDate.now().plusDays(1), PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("7. Order search with MULTIPLE filters combined")
    void testOrderSearchMultipleFilters() {
        Page<OrderResponse> result = orderService.searchOrders(
                createdOrder.getOrderNumber(),
                customer.getId(),
                OrderStatus.CREATED,
                LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(1),
                PageRequest.of(0, 10)
        );
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getOrderNumber()).isEqualTo(createdOrder.getOrderNumber());
    }

    // =========================================================================
    // INVENTORY / STOCK ADJUSTMENT SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("8. Inventory report with no filters / default render")
    void testInventoryReportAllFiltersNull() {
        InventoryReportResponse report = inventoryReportService.getInventoryReport();
        assertThat(report).isNotNull();
        assertThat(report.getTotalProducts()).isGreaterThanOrEqualTo(1);
        assertThat(report.getTotalInventoryValuation()).isNotNull();
    }

    @Test
    @DisplayName("9. Stock adjustment search with productId ONLY")
    void testStockAdjustmentProductIdOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(product.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    @Test
    @DisplayName("10. Stock adjustment search with adjustmentType ONLY")
    void testStockAdjustmentTypeOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(null, StockAdjustmentType.IN, null, null, PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    @Test
    @DisplayName("11. Stock adjustment search with startDate ONLY")
    void testStockAdjustmentStartDateOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(null, null, LocalDateTime.now().minusDays(1), null, PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    @Test
    @DisplayName("12. Stock adjustment search with endDate ONLY")
    void testStockAdjustmentEndDateOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(null, null, null, LocalDateTime.now().plusDays(1), PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }
}

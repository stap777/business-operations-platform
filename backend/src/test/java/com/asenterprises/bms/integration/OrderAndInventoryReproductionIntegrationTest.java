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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

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

    @PersistenceContext
    private EntityManager entityManager;

    private User manager;
    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        manager = userRepository.save(User.builder()
                .fullName("Test Manager")
                .username("test_mgr_rep")
                .password("encoded_pass")
                .phoneNumber("9876543299")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-REP-001")
                .fullName("Rep Customer")
                .phoneNumber("9988776655")
                .address("Rep Address")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Rep Category")
                .status(CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Rep Product")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("60.00"))
                .availableStock(10)
                .minimumStock(2)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    // =========================================================================
    // ORDER SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("Order search with ALL filters null")
    void testOrderSearchAllFiltersNull() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Order search with orderNumber ONLY")
    void testOrderSearchOrderNumberOnly() {
        Page<OrderResponse> result = orderService.searchOrders("ORD", null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Order search with customerId ONLY")
    void testOrderSearchCustomerIdOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, customer.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Order search with status ONLY")
    void testOrderSearchStatusOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, OrderStatus.CREATED, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Order search with startDate ONLY")
    void testOrderSearchStartDateOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, LocalDate.now().minusDays(1), null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Order search with endDate ONLY")
    void testOrderSearchEndDateOnly() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, null, LocalDate.now(), PageRequest.of(0, 10));
        assertThat(result).isNotNull();
    }

    // =========================================================================
    // INVENTORY / STOCK ADJUSTMENT SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("Inventory report / search with ALL filters null")
    void testInventoryReportAllFiltersNull() {
        InventoryReportResponse report = inventoryReportService.getInventoryReport();
        assertThat(report).isNotNull();
    }

    @Test
    @DisplayName("Stock adjustment search with productId ONLY")
    void testStockAdjustmentProductIdOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(product.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    @Test
    @DisplayName("Stock adjustment search with adjustmentType ONLY")
    void testStockAdjustmentTypeOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(null, StockAdjustmentType.IN, null, null, PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    @Test
    @DisplayName("Stock adjustment search with startDate ONLY")
    void testStockAdjustmentStartDateOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(null, null, LocalDateTime.now().minusDays(1), null, PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    @Test
    @DisplayName("Stock adjustment search with endDate ONLY")
    void testStockAdjustmentEndDateOnly() {
        var page = stockAdjustmentRepository.searchStockAdjustments(null, null, null, LocalDateTime.now(), PageRequest.of(0, 10));
        assertThat(page).isNotNull();
    }

    // =========================================================================
    // HIBERNATE 6 AST CAST COMPATIBILITY TEST
    // =========================================================================

    @Test
    @DisplayName("Verify Hibernate 6 HQL syntax compatibility for CAST expressions")
    void testHibernate6CastSyntax() {
        String hqlOrder = "SELECT COUNT(o) FROM Order o " +
                "WHERE (cast(:orderNumber as String) IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :orderNumber, '%'))) " +
                "AND (cast(:customerId as Long) IS NULL OR o.customer.id = :customerId) " +
                "AND (cast(:status as String) IS NULL OR o.orderStatus = :status) " +
                "AND (cast(:startDate as LocalDateTime) IS NULL OR o.createdAt >= :startDate) " +
                "AND (cast(:endDate as LocalDateTime) IS NULL OR o.createdAt <= :endDate)";

        var query = entityManager.createQuery(hqlOrder, Long.class);
        query.setParameter("orderNumber", null);
        query.setParameter("customerId", null);
        query.setParameter("status", null);
        query.setParameter("startDate", null);
        query.setParameter("endDate", null);

        Long count = query.getSingleResult();
        assertThat(count).isNotNull();
    }
}

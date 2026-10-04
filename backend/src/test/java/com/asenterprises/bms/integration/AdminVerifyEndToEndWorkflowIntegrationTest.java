package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.AuditLogRepository;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
import com.asenterprises.bms.service.BusinessSettingsService;
import com.asenterprises.bms.service.DeliveryService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import java.time.LocalDate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminVerifyEndToEndWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private com.asenterprises.bms.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private BusinessSettingsService businessSettingsService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private User adminUser;
    private User managerUser;
    private User deliveryUser;
    private Customer customer;
    private Product product;

    @BeforeEach
    void setUp() {
        transactionTemplate.execute(status -> {
            auditLogRepository.deleteAll();
            passwordResetTokenRepository.deleteAll();
            userSessionRepository.deleteAll();
            paymentAllocationRepository.deleteAll();
            paymentRepository.deleteAll();
            invoiceRepository.deleteAll();
            orderRepository.deleteAll();
            stockAdjustmentRepository.deleteAll();
            productRepository.deleteAll();
            categoryRepository.deleteAll();
            couponRepository.deleteAll();
            customerRepository.deleteAll();
            userRepository.deleteAll();

            long seed = System.nanoTime();
            long uniqueSuffix = Math.abs((System.currentTimeMillis() * 1000 + (seed % 1000)) % 100000000L);

            adminUser = userRepository.save(User.builder()
                    .fullName("E2E Admin")
                    .username("e2e_admin")
                    .password("encoded_pass")
                    .phoneNumber(String.format("91%08d", uniqueSuffix))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            managerUser = userRepository.save(User.builder()
                    .fullName("E2E Manager")
                    .username("e2e_manager")
                    .password("encoded_pass")
                    .phoneNumber(String.format("92%08d", uniqueSuffix))
                    .role(Role.MANAGER)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            deliveryUser = userRepository.save(User.builder()
                    .fullName("E2E Delivery")
                    .username("e2e_delivery")
                    .password("encoded_pass")
                    .phoneNumber(String.format("93%08d", uniqueSuffix))
                    .role(Role.DELIVERY)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            customer = customerRepository.save(Customer.builder()
                    .customerCode(String.format("E2E-%08d", uniqueSuffix))
                    .fullName("E2E Client Retailer")
                    .phoneNumber(String.format("94%08d", uniqueSuffix))
                    .address("500 E2E Industrial Expressway")
                    .status(CustomerStatus.ACTIVE)
                    .build());

            Category category = categoryRepository.save(Category.builder()
                    .name("E2E Category " + uniqueSuffix)
                    .description("Category")
                    .status(CategoryStatus.ACTIVE)
                    .build());

            product = productRepository.save(Product.builder()
                    .name("E2E Product " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.PCS)
                    .sellingPrice(new BigDecimal("250.00"))
                    .purchasePrice(new BigDecimal("150.00"))
                    .availableStock(100)
                    .minimumStock(10)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            businessSettingsService.updateBusinessSettings(BusinessSettingsRequest.builder()
                    .businessName("A.S. Enterprises")
                    .phone("+91-9988776655")
                    .address("Main Warehouse")
                    .invoicePrefix("INV-E2E")
                    .currency("INR")
                    .invoiceFooter("Verified Tax Invoice")
                    .build());

            return null;
        });
    }

    @AfterEach
    void tearDown() {
        transactionTemplate.execute(status -> {
            auditLogRepository.deleteAll();
            passwordResetTokenRepository.deleteAll();
            userSessionRepository.deleteAll();
            paymentAllocationRepository.deleteAll();
            paymentRepository.deleteAll();
            invoiceRepository.deleteAll();
            orderRepository.deleteAll();
            stockAdjustmentRepository.deleteAll();
            productRepository.deleteAll();
            categoryRepository.deleteAll();
            couponRepository.deleteAll();
            customerRepository.deleteAll();
            userRepository.deleteAll();
            return null;
        });
    }

    private Long createPaidOrder(OrderStatus status, DeliveryStatus delStatus, boolean assignDelivery) {
        OrderResponse resp = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(managerUser.getId())
                .deliveryPersonId(assignDelivery ? deliveryUser.getId() : null)
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .build()))
                .notes("E2E order")
                .build(), managerUser.getUsername());

        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(resp.getTotalAmount())
                .paymentMethod(PaymentMethod.CASH)
                .remarks("Full payment for order " + resp.getOrderNumber())
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(resp.getId())
                        .allocatedAmount(resp.getTotalAmount())
                        .build()))
                .build(), adminUser.getUsername());

        transactionTemplate.execute(txStatus -> {
            Order o = orderRepository.findById(resp.getId()).orElseThrow();
            o.setOrderStatus(status);
            o.setDeliveryStatus(delStatus);
            orderRepository.save(o);
            return null;
        });

        return resp.getId();
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("Entrypoint 1 (Dashboard Flow): Admin verifies eligible PAID order -> Returns 201, orderStatus VERIFIED, deliveryStatus DELIVERED")
    void testDashboardVerifyOrderFlow() throws Exception {
        Long orderId = createPaidOrder(OrderStatus.CREATED, DeliveryStatus.PENDING, false);

        mockMvc.perform(post("/admin/orders/" + orderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.invoiceNumber").isString())
                .andExpect(jsonPath("$.orderId").value(orderId))
                .andExpect(jsonPath("$.orderStatus").value("VERIFIED"));

        // Confirm database state and persistence
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(order.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // Confirm removed from active delivery queue
        var assigned = deliveryService.getAssignedOrdersForDeliveryPerson("e2e_delivery", PageRequest.of(0, 10));
        assertThat(assigned.getContent()).noneMatch(o -> o.getId().equals(orderId));

        var pending = orderRepository.findPendingVerificationOrders(PageRequest.of(0, 10));
        assertThat(pending.getContent()).noneMatch(o -> o.getOrderId().equals(orderId));
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("Entrypoint 2 (Orders Flow): Admin verifies ASSIGNED / OUT_FOR_DELIVERY order -> Returns 201, orderStatus VERIFIED, deliveryStatus DELIVERED")
    void testOrdersSectionVerifyOrderFlow() throws Exception {
        Long orderId = createPaidOrder(OrderStatus.ASSIGNED, DeliveryStatus.PENDING, true);

        mockMvc.perform(post("/admin/orders/" + orderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderStatus").value("VERIFIED"));

        // Persisted state check
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(order.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("Negative Check 1: PENDING payment order verification is rejected with 409 Conflict, NOT 500")
    void testUnpaidOrderVerificationRejectedWith409() throws Exception {
        OrderResponse unpaid = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(managerUser.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(1)
                        .build()))
                .build(), managerUser.getUsername());

        mockMvc.perform(post("/admin/orders/" + unpaid.getId() + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("cannot be verified until it is fully paid")));
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("Negative Check 2: Already VERIFIED order cannot be verified again (409 Conflict)")
    void testDoubleVerificationRejectedWith409() throws Exception {
        Long orderId = createPaidOrder(OrderStatus.CREATED, DeliveryStatus.PENDING, false);

        // First verification succeeds
        mockMvc.perform(post("/admin/orders/" + orderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        // Second verification rejected with 409 Conflict
        mockMvc.perform(post("/admin/orders/" + orderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("is already verified")));
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("Negative Check 3: CANCELLED and VOIDED orders rejected with 409 Conflict")
    void testCancelledAndVoidedOrdersRejectedWith409() throws Exception {
        Long cancelledOrderId = createPaidOrder(OrderStatus.CANCELLED, DeliveryStatus.PENDING, false);
        mockMvc.perform(post("/admin/orders/" + cancelledOrderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cannot verify a CANCELLED order")));

        Long voidedOrderId = createPaidOrder(OrderStatus.VOIDED, DeliveryStatus.PENDING, false);
        mockMvc.perform(post("/admin/orders/" + voidedOrderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cannot verify a VOIDED order")));
    }

    @Test
    @WithMockUser(username = "e2e_manager", roles = {"MANAGER"})
    @DisplayName("Negative Check 4: Non-ADMIN user verification attempt rejected with 403 Forbidden")
    void testNonAdminUserVerificationRejectedWith403() throws Exception {
        Long orderId = createPaidOrder(OrderStatus.CREATED, DeliveryStatus.PENDING, false);

        mockMvc.perform(post("/admin/orders/" + orderId + "/verify")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("OrdersPage Queries: Test all requests made by Orders page on load and filtering")
    void testAllOrdersPageQueries() throws Exception {
        Long createdOrderId = createPaidOrder(OrderStatus.CREATED, DeliveryStatus.PENDING, false);
        Long assignedOrderId = createPaidOrder(OrderStatus.ASSIGNED, DeliveryStatus.PENDING, true);
        Long deliveredOrderId = createPaidOrder(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, true);
        Long verifiedOrderId = createPaidOrder(OrderStatus.VERIFIED, DeliveryStatus.DELIVERED, true);

        // 1. Initial load: GET /orders/search?page=0&size=50
        mockMvc.perform(get("/orders/search")
                        .param("page", "0")
                        .param("size", "50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(4));

        // 2. Pending verification: GET /admin/orders/pending-verification?page=0&size=50
        mockMvc.perform(get("/admin/orders/pending-verification")
                        .param("page", "0")
                        .param("size", "50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(3));

        // 3. Delivered filter: GET /orders/search?status=DELIVERED&page=0&size=50 (should match DELIVERED and VERIFIED with deliveryStatus=DELIVERED)
        mockMvc.perform(get("/orders/search")
                        .param("status", "DELIVERED")
                        .param("page", "0")
                        .param("size", "50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // 4. Status filter: GET /orders/search?status=CREATED&page=0&size=50
        mockMvc.perform(get("/orders/search")
                        .param("status", "CREATED")
                        .param("page", "0")
                        .param("size", "50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        // 5. Status filter: GET /orders/search?status=VERIFIED&page=0&size=50
        mockMvc.perform(get("/orders/search")
                        .param("status", "VERIFIED")
                        .param("page", "0")
                        .param("size", "50")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        // 6. Date filter: GET /orders/search?startDate=2026-10-04&endDate=2026-10-04
        mockMvc.perform(get("/orders/search")
                        .param("startDate", LocalDate.now().toString())
                        .param("endDate", LocalDate.now().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // 7. Search query: GET /orders/search?orderNumber=ORD
        mockMvc.perform(get("/orders/search")
                        .param("orderNumber", "ORD")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4));
    }

    @Test
    @WithMockUser(username = "e2e_admin", roles = {"ADMIN"})
    @DisplayName("Pending Verification: Projection returns exact item counts, excludes verified orders, and paginates cleanly")
    void testPendingVerificationProjectionAndItemCounts() throws Exception {
        // Order 1: DELIVERED with 1 item
        Long order1Id = createPaidOrder(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, true);

        // Order 2: DELIVERED with 2 items
        OrderResponse order2Resp = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(managerUser.getId())
                .deliveryPersonId(deliveryUser.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(product.getId()).quantity(1).build(),
                        OrderItemRequest.builder().productId(product.getId()).quantity(2).build()
                ))
                .notes("Two items order")
                .build(), managerUser.getUsername());

        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(order2Resp.getTotalAmount())
                .paymentMethod(PaymentMethod.CASH)
                .remarks("Payment for order 2")
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(order2Resp.getId())
                        .allocatedAmount(order2Resp.getTotalAmount())
                        .build()))
                .build(), adminUser.getUsername());

        transactionTemplate.execute(txStatus -> {
            Order o = orderRepository.findById(order2Resp.getId()).orElseThrow();
            o.setOrderStatus(OrderStatus.DELIVERED);
            o.setDeliveryStatus(DeliveryStatus.DELIVERED);
            orderRepository.save(o);
            return null;
        });

        // Order 3: VERIFIED (should NOT appear in pending verification)
        Long order3Id = createPaidOrder(OrderStatus.VERIFIED, DeliveryStatus.DELIVERED, true);

        // Fetch pending verification page 0, size 10
        mockMvc.perform(get("/admin/orders/pending-verification")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content[0].orderId").value(order1Id))
                .andExpect(jsonPath("$.content[0].itemCount").value(1))
                .andExpect(jsonPath("$.content[0].customerName").value("E2E Client Retailer"))
                .andExpect(jsonPath("$.content[0].customerPhone").isString())
                .andExpect(jsonPath("$.content[0].deliveryPersonName").value("E2E Delivery"))
                .andExpect(jsonPath("$.content[0].orderStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.content[0].deliveryStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.content[1].orderId").value(order2Resp.getId()))
                .andExpect(jsonPath("$.content[1].itemCount").value(2));

        // Pagination test: page 0, size 1
        mockMvc.perform(get("/admin/orders/pending-verification")
                        .param("page", "0")
                        .param("size", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].orderId").value(order1Id));

        // Pagination test: page 1, size 1
        mockMvc.perform(get("/admin/orders/pending-verification")
                        .param("page", "1")
                        .param("size", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].orderId").value(order2Resp.getId()));
    }

    @Test
    @WithMockUser(username = "e2e_manager", roles = {"MANAGER"})
    @DisplayName("Non-ADMIN user cannot access pending-verification endpoint (403 Forbidden)")
    void testNonAdminCannotAccessPendingVerification() throws Exception {
        mockMvc.perform(get("/admin/orders/pending-verification")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}

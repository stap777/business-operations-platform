package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.entity.AuditLog;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.StockAdjustment;
import com.asenterprises.bms.entity.StockAdjustmentType;
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
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class AdminVerifyFallbackIntegrationTest {

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
    private DeliveryService deliveryService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private BusinessSettingsService businessSettingsService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private User adminUser;
    private User managerUser;
    private User deliveryUser;
    private Customer customer;
    private Product product;
    private Coupon coupon;

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
                    .fullName("Admin User")
                    .username("fb_admin_" + uniqueSuffix)
                    .password("encoded_pass")
                    .phoneNumber(String.format("91%08d", uniqueSuffix))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            managerUser = userRepository.save(User.builder()
                    .fullName("Manager User")
                    .username("fb_mgr_" + uniqueSuffix)
                    .password("encoded_pass")
                    .phoneNumber(String.format("92%08d", uniqueSuffix))
                    .role(Role.MANAGER)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            deliveryUser = userRepository.save(User.builder()
                    .fullName("Delivery Person")
                    .username("fb_del_" + uniqueSuffix)
                    .password("encoded_pass")
                    .phoneNumber(String.format("93%08d", uniqueSuffix))
                    .role(Role.DELIVERY)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            customer = customerRepository.save(Customer.builder()
                    .customerCode(String.format("FB-%08d", uniqueSuffix))
                    .fullName("Fallback Retail Store")
                    .phoneNumber(String.format("94%08d", uniqueSuffix))
                    .address("100 Industrial Lane")
                    .status(CustomerStatus.ACTIVE)
                    .build());

            Category category = categoryRepository.save(Category.builder()
                    .name("General Category " + uniqueSuffix)
                    .description("Category description")
                    .status(CategoryStatus.ACTIVE)
                    .build());

            product = productRepository.save(Product.builder()
                    .name("Widget Box " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.BOX)
                    .sellingPrice(new BigDecimal("200.00"))
                    .purchasePrice(new BigDecimal("120.00"))
                    .availableStock(100)
                    .minimumStock(10)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            coupon = couponRepository.save(Coupon.builder()
                    .code("SAVE50_" + uniqueSuffix)
                    .description("Save 50 Rs")
                    .discountType(DiscountType.FLAT)
                    .discountValue(new BigDecimal("50.00"))
                    .minimumOrderAmount(new BigDecimal("200.00"))
                    .startDate(LocalDateTime.now().minusDays(1))
                    .endDate(LocalDateTime.now().plusDays(30))
                    .usageLimit(100)
                    .usedCount(0)
                    .active(true)
                    .build());

            businessSettingsService.updateBusinessSettings(BusinessSettingsRequest.builder()
                    .businessName("A.S. Enterprises")
                    .phone("+91-9988776655")
                    .address("Main Warehouse")
                    .invoicePrefix("INV-FB")
                    .currency("INR")
                    .invoiceFooter("Verified Tax Invoice")
                    .build());

            return null;
        });
    }

    @org.junit.jupiter.api.AfterEach
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

    private Long createPaidOrderWithStatus(OrderStatus initialStatus, DeliveryStatus initialDeliveryStatus, boolean assignDeliveryPerson, boolean useCoupon) {
        OrderResponse orderResp = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(managerUser.getId())
                .deliveryPersonId(assignDeliveryPerson ? deliveryUser.getId() : null)
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .build()))
                .couponCode(useCoupon ? coupon.getCode() : null)
                .notes("Fallback test order")
                .build(), managerUser.getUsername());

        // Pay the order in full using canonical PaymentService
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(orderResp.getTotalAmount())
                .paymentMethod(PaymentMethod.CASH)
                .remarks("Full payment for order " + orderResp.getOrderNumber())
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderResp.getId())
                        .allocatedAmount(orderResp.getTotalAmount())
                        .build()))
                .build(), adminUser.getUsername());

        // Update target status for specific test scenario
        transactionTemplate.execute(status -> {
            Order order = orderRepository.findById(orderResp.getId()).orElseThrow();
            order.setOrderStatus(initialStatus);
            order.setDeliveryStatus(initialDeliveryStatus);
            orderRepository.save(order);
            return null;
        });

        return orderResp.getId();
    }

    @Test
    @DisplayName("Scenario A: CREATED order -> Admin Verify")
    void testAdminVerifyFromCreatedState() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.CREATED, DeliveryStatus.PENDING, false, true);

        // Verify stock is not yet deducted prior to verification
        Product initialProd = productRepository.findById(product.getId()).orElseThrow();
        assertThat(initialProd.getAvailableStock()).isEqualTo(100);

        Coupon initialCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(initialCoupon.getUsedCount()).isEqualTo(1); // incremented once on createOrder

        // Admin verifies
        InvoiceResponse response = verificationService.verifyOrder(orderId, adminUser.getUsername());

        assertThat(response).isNotNull();
        assertThat(response.getInvoiceNumber()).startsWith("INV-");

        // Assert database state
        Order verifiedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verifiedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        Product updatedProd = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProd.getAvailableStock()).isEqualTo(98); // 100 - 2

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);
        assertThat(adjustments.get(0).getAdjustmentType()).isEqualTo(StockAdjustmentType.OUT);
        assertThat(adjustments.get(0).getQuantity()).isEqualTo(2);
        assertThat(adjustments.get(0).getReason()).isEqualTo("ORDER_FULFILLMENT");
        assertThat(adjustments.get(0).getReferenceNumber()).isEqualTo(verifiedOrder.getOrderNumber());

        List<Invoice> invoices = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getOrder().getId().equals(orderId))
                .toList();
        assertThat(invoices).hasSize(1);

        Coupon finalCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(finalCoupon.getUsedCount()).isEqualTo(1); // not duplicated

        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndAction("ORDER", "ORDER_VERIFIED");
        assertThat(auditLogs).anyMatch(log -> log.getEntityId().equals(orderId));
    }

    @Test
    @DisplayName("Scenario B: ASSIGNED order -> Admin Verify")
    void testAdminVerifyFromAssignedState() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.ASSIGNED, DeliveryStatus.PENDING, true, false);

        InvoiceResponse response = verificationService.verifyOrder(orderId, adminUser.getUsername());

        assertThat(response).isNotNull();
        Order verifiedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verifiedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        Product updatedProd = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProd.getAvailableStock()).isEqualTo(98);

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);

        List<Invoice> invoices = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getOrder().getId().equals(orderId))
                .toList();
        assertThat(invoices).hasSize(1);
    }

    @Test
    @DisplayName("Scenario C: OUT_FOR_DELIVERY order -> Admin Verify")
    void testAdminVerifyFromOutForDeliveryState() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.OUT_FOR_DELIVERY, DeliveryStatus.OUT_FOR_DELIVERY, true, false);

        InvoiceResponse response = verificationService.verifyOrder(orderId, adminUser.getUsername());

        assertThat(response).isNotNull();
        Order verifiedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verifiedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        Product updatedProd = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProd.getAvailableStock()).isEqualTo(98);

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);

        List<Invoice> invoices = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getOrder().getId().equals(orderId))
                .toList();
        assertThat(invoices).hasSize(1);
    }

    @Test
    @DisplayName("Scenario D: DELIVERED order -> Admin Verify")
    void testAdminVerifyFromDeliveredState() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, true, false);

        InvoiceResponse response = verificationService.verifyOrder(orderId, adminUser.getUsername());

        assertThat(response).isNotNull();
        Order verifiedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verifiedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        Product updatedProd = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProd.getAvailableStock()).isEqualTo(98);

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);

        List<Invoice> invoices = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getOrder().getId().equals(orderId))
                .toList();
        assertThat(invoices).hasSize(1);
    }

    @Test
    @DisplayName("Scenario E: VERIFIED order -> Verify again must be rejected without side effects")
    void testDoubleVerificationRejected() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.CREATED, DeliveryStatus.PENDING, false, true);

        // First verification succeeds
        verificationService.verifyOrder(orderId, adminUser.getUsername());
        Product prodAfterFirst = productRepository.findById(product.getId()).orElseThrow();
        assertThat(prodAfterFirst.getAvailableStock()).isEqualTo(98);

        // Second verification must throw IllegalStateException
        assertThatThrownBy(() -> verificationService.verifyOrder(orderId, adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("is already verified");

        // Assert no double deduction or duplicate records
        Product prodAfterSecond = productRepository.findById(product.getId()).orElseThrow();
        assertThat(prodAfterSecond.getAvailableStock()).isEqualTo(98);

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);

        List<Invoice> invoices = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getOrder().getId().equals(orderId))
                .toList();
        assertThat(invoices).hasSize(1);

        Coupon finalCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(finalCoupon.getUsedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Scenario F: CANCELLED order -> Verify must be rejected")
    void testVerifyCancelledOrderRejected() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.CANCELLED, DeliveryStatus.PENDING, false, false);

        assertThatThrownBy(() -> verificationService.verifyOrder(orderId, adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot verify a CANCELLED order");

        Product prod = productRepository.findById(product.getId()).orElseThrow();
        assertThat(prod.getAvailableStock()).isEqualTo(100);
    }

    @Test
    @DisplayName("Scenario G: VOIDED order -> Verify must be rejected")
    void testVerifyVoidedOrderRejected() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.VOIDED, DeliveryStatus.PENDING, false, false);

        assertThatThrownBy(() -> verificationService.verifyOrder(orderId, adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot verify a VOIDED order");

        Product prod = productRepository.findById(product.getId()).orElseThrow();
        assertThat(prod.getAvailableStock()).isEqualTo(100);
    }

    @Test
    @DisplayName("Scenario H: COMPLETED order -> Verify must be rejected")
    void testVerifyCompletedOrderRejected() {
        Long orderId = createPaidOrderWithStatus(OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, false, false);

        assertThatThrownBy(() -> verificationService.verifyOrder(orderId, adminUser.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("is already verified");

        Product prod = productRepository.findById(product.getId()).orElseThrow();
        assertThat(prod.getAvailableStock()).isEqualTo(100);
    }

    @Test
    @DisplayName("Normal Delivery Person Workflow: Preserves delivery workflow and does not double-deduct inventory")
    void testNormalDeliveryPersonWorkflowUnchanged() {
        // Step 1: Order created in ASSIGNED state
        OrderResponse resp = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(managerUser.getId())
                .deliveryPersonId(deliveryUser.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(3)
                        .build()))
                .build(), managerUser.getUsername());

        Long orderId = resp.getId();

        // Stock before delivery
        assertThat(productRepository.findById(product.getId()).orElseThrow().getAvailableStock()).isEqualTo(100);

        // Step 2: Delivery Person starts delivery
        deliveryService.startDelivery(orderId, deliveryUser.getUsername());
        Order outForDel = orderRepository.findById(orderId).orElseThrow();
        assertThat(outForDel.getOrderStatus()).isEqualTo(OrderStatus.OUT_FOR_DELIVERY);
        assertThat(outForDel.getDeliveryStatus()).isEqualTo(DeliveryStatus.OUT_FOR_DELIVERY);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getAvailableStock()).isEqualTo(100);

        // Step 3: Delivery Person marks delivered with full payment
        deliveryService.markDelivered(orderId, DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("600.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryUser.getUsername());

        Order delivered = orderRepository.findById(orderId).orElseThrow();
        assertThat(delivered.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(delivered.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        assertThat(delivered.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        // Crucial verification: Delivery Person action must NOT deduct stock or create stock adjustment
        assertThat(productRepository.findById(product.getId()).orElseThrow().getAvailableStock()).isEqualTo(100);
        assertThat(stockAdjustmentRepository.findByProductId(product.getId())).isEmpty();

        // Step 4: Admin verifies the delivered order
        verificationService.verifyOrder(orderId, adminUser.getUsername());

        Order verified = orderRepository.findById(orderId).orElseThrow();
        assertThat(verified.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verified.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // Inventory is deducted exactly once (100 - 3 = 97)
        assertThat(productRepository.findById(product.getId()).orElseThrow().getAvailableStock()).isEqualTo(97);
        assertThat(stockAdjustmentRepository.findByProductId(product.getId())).hasSize(1);
    }
}

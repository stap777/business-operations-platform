package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.VoidOrderRequest;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class OrderDeliveryAndInventoryIntegrationTest {

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

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private User admin;
    private User manager;
    private User driver;
    private Customer customer;
    private Category category;
    private Product trackedProduct;
    private String uniqueSuffix;

    @BeforeEach
    void setUp() {
        transactionTemplate.execute(status -> {
            auditLogRepository.deleteAll();
            userSessionRepository.deleteAll();
            paymentAllocationRepository.deleteAll();
            paymentRepository.deleteAll();
            invoiceRepository.deleteAll();
            stockAdjustmentRepository.deleteAll();
            orderRepository.deleteAll();
            couponRepository.deleteAll();
            productRepository.deleteAll();
            categoryRepository.deleteAll();
            customerRepository.deleteAll();
            userRepository.deleteAll();

            long seed = System.nanoTime();
            long numSuffix = Math.abs((System.currentTimeMillis() * 1000 + (seed % 1000)) % 100000000L);
            uniqueSuffix = String.valueOf(numSuffix);

            admin = userRepository.save(User.builder()
                    .username("adm_" + uniqueSuffix)
                    .fullName("Admin User")
                    .password("encoded_pass")
                    .phoneNumber(String.format("91%08d", numSuffix))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            manager = userRepository.save(User.builder()
                    .username("mgr_" + uniqueSuffix)
                    .fullName("Manager User")
                    .password("encoded_pass")
                    .phoneNumber(String.format("92%08d", numSuffix))
                    .role(Role.MANAGER)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            driver = userRepository.save(User.builder()
                    .username("drv_" + uniqueSuffix)
                    .fullName("Delivery Driver")
                    .password("encoded_pass")
                    .phoneNumber(String.format("93%08d", numSuffix))
                    .role(Role.DELIVERY)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            customer = customerRepository.save(Customer.builder()
                    .customerCode("CUST-" + uniqueSuffix)
                    .fullName("Retail Store " + uniqueSuffix)
                    .phoneNumber(String.format("94%08d", numSuffix))
                    .address("Industrial Estate Phase 1")
                    .status(CustomerStatus.ACTIVE)
                    .build());

            category = categoryRepository.save(Category.builder()
                    .name("Category " + uniqueSuffix)
                    .status(CategoryStatus.ACTIVE)
                    .build());

            trackedProduct = productRepository.save(Product.builder()
                    .name("Tracked Item " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.PCS)
                    .sellingPrice(new BigDecimal("100.00"))
                    .purchasePrice(new BigDecimal("50.00"))
                    .availableStock(50)
                    .minimumStock(5)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            return null;
        });
    }

    private OrderResponse createTestOrder(int quantity, User assignedDriver) {
        return orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(assignedDriver != null ? assignedDriver.getId() : null)
                .items(List.of(OrderItemRequest.builder()
                        .productId(trackedProduct.getId())
                        .quantity(quantity)
                        .build()))
                .notes("Delivery test order")
                .build(), manager.getUsername());
    }

    @Test
    @DisplayName("1. Unpaid order transitions to DELIVERED and deducts inventory independently of payment")
    void testUnpaidOrderDeliveryDeductsStock() {
        OrderResponse createdOrder = createTestOrder(5, null);

        // Preconditions: newly created order is PENDING delivery, stock is 50, payment is PENDING
        assertThat(createdOrder.getOrderStatus()).isIn(OrderStatus.CREATED, OrderStatus.ASSIGNED);
        assertThat(createdOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);
        assertThat(createdOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);

        // Admin marks order DELIVERED with null paymentRequest (no delivery-time payment)
        OrderResponse delivered = deliveryService.markDeliveredByAdmin(createdOrder.getId(), null, admin.getUsername());

        // Assert Order state
        assertThat(delivered.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(delivered.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        assertThat(delivered.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        // Assert Stock deducted atomically (50 - 5 = 45)
        Product reloadedProduct = productRepository.findById(trackedProduct.getId()).orElseThrow();
        assertThat(reloadedProduct.getAvailableStock()).isEqualTo(45);

        // Assert StockAdjustment created with OUT, reason ORDER_DELIVERED, and order reference
        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(trackedProduct.getId());
        assertThat(adjustments).hasSize(1);
        StockAdjustment adj = adjustments.get(0);
        assertThat(adj.getAdjustmentType()).isEqualTo(StockAdjustmentType.OUT);
        assertThat(adj.getQuantity()).isEqualTo(5);
        assertThat(adj.getReason()).isEqualTo("ORDER_DELIVERED");
        assertThat(adj.getReferenceNumber()).isEqualTo(createdOrder.getOrderNumber());
        assertThat(adj.getAdjustedBy().getId()).isEqualTo(admin.getId());

        // No payments created
        assertThat(paymentRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("2. Delivery with payment records payment through canonical service and deducts stock")
    void testDeliveryWithPaymentRecordsPaymentAndDeductsStock() {
        OrderResponse createdOrder = createTestOrder(4, driver);

        // Driver starts delivery
        deliveryService.startDelivery(createdOrder.getId(), driver.getUsername());

        // Driver marks delivered with full payment collection
        DeliveryPaymentRequest pReq = DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("400.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build();

        OrderResponse delivered = deliveryService.markDelivered(createdOrder.getId(), pReq, driver.getUsername());

        assertThat(delivered.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(delivered.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        assertThat(delivered.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        // Stock deducted (50 - 4 = 46)
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(46);

        // Payment record exists
        assertThat(paymentRepository.findAll()).hasSize(1);
        assertThat(paymentAllocationRepository.findByOrderId(createdOrder.getId())).hasSize(1);
    }

    @Test
    @DisplayName("3. Admin marking order Delivered works across CREATED, ASSIGNED, and OUT_FOR_DELIVERY")
    void testAdminDeliveryFromAllNonTerminalStates() {
        // A. From CREATED state (no driver assigned)
        OrderResponse order1 = createTestOrder(2, null);
        deliveryService.markDeliveredByAdmin(order1.getId(), null, admin.getUsername());
        assertThat(orderRepository.findById(order1.getId()).orElseThrow().getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);

        // B. From ASSIGNED state
        OrderResponse order2 = createTestOrder(3, driver);
        deliveryService.markDeliveredByAdmin(order2.getId(), null, manager.getUsername());
        assertThat(orderRepository.findById(order2.getId()).orElseThrow().getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);

        // C. From OUT_FOR_DELIVERY state
        OrderResponse order3 = createTestOrder(1, driver);
        deliveryService.startDelivery(order3.getId(), driver.getUsername());
        deliveryService.markDeliveredByAdmin(order3.getId(), null, admin.getUsername());
        assertThat(orderRepository.findById(order3.getId()).orElseThrow().getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);

        // Total stock deducted: 50 - 2 - 3 - 1 = 44
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(44);
    }

    @Test
    @DisplayName("4. Repeated delivery requests are rejected without double-deduction")
    void testRepeatedDeliveryRequestsRejectedWithoutDoubleDeduction() {
        OrderResponse order = createTestOrder(5, null);
        deliveryService.markDeliveredByAdmin(order.getId(), null, admin.getUsername());

        // Stock decreased to 45
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).hasSize(1);

        // Second delivery request must throw IllegalStateException
        assertThatThrownBy(() -> deliveryService.markDeliveredByAdmin(order.getId(), null, admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("is already delivered");

        // Stock remains 45, adjustments remain 1
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).hasSize(1);
    }

    @Test
    @DisplayName("5. Verification after delivery preserves financial workflow and does NOT double-deduct stock")
    void testVerificationAfterDeliveryDoesNotDoubleDeductStock() {
        OrderResponse order = createTestOrder(5, null);

        // Mark DELIVERED while unpaid -> Stock drops from 50 to 45
        deliveryService.markDeliveredByAdmin(order.getId(), null, admin.getUsername());
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).hasSize(1);

        // Pay order in full after delivery
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(order.getId())
                        .allocatedAmount(order.getTotalAmount())
                        .build()))
                .build(), admin.getUsername());

        // Admin verifies the order
        InvoiceResponse invoiceRes = verificationService.verifyOrder(order.getId(), admin.getUsername());
        assertThat(invoiceRes).isNotNull();

        Order verifiedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verifiedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // CRUCIAL: Stock remains 45 (NOT double-deducted to 40)
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);

        // Exactly one stock adjustment exists (from delivery)
        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(trackedProduct.getId());
        assertThat(adjustments).hasSize(1);
        assertThat(adjustments.get(0).getReason()).isEqualTo("ORDER_DELIVERED");
    }

    @Test
    @DisplayName("6. Voiding a delivered order restores stock atomically and logs IN stock adjustment")
    void testVoidingDeliveredOrderRestoresStock() {
        OrderResponse order = createTestOrder(10, null);
        deliveryService.markDeliveredByAdmin(order.getId(), null, admin.getUsername());

        // Stock dropped to 40
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(40);

        // Void the delivered order
        orderService.voidOrder(order.getId(), VoidOrderRequest.builder()
                .reason("Customer rejected goods upon delivery")
                .notes("Returned in full")
                .build(), admin.getUsername());

        Order voidedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(voidedOrder.getOrderStatus()).isEqualTo(OrderStatus.VOIDED);

        // Stock is restored back to 50
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);

        // Exactly two adjustments: OUT for delivery, IN for void
        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(trackedProduct.getId());
        assertThat(adjustments).hasSize(2);
        assertThat(adjustments).anyMatch(a -> a.getAdjustmentType() == StockAdjustmentType.OUT && "ORDER_DELIVERED".equals(a.getReason()));
        assertThat(adjustments).anyMatch(a -> a.getAdjustmentType() == StockAdjustmentType.IN && "ORDER_VOIDED".equals(a.getReason()));
    }

    @Test
    @DisplayName("7. Voiding an undelivered order does NOT restore stock that was never deducted")
    void testVoidingUndeliveredOrderDoesNotRestoreStock() {
        OrderResponse order = createTestOrder(10, null);

        // Order is in CREATED status, stock is 50
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);

        // Void the order before delivery
        orderService.voidOrder(order.getId(), VoidOrderRequest.builder()
                .reason("Order cancelled by customer before dispatch")
                .build(), admin.getUsername());

        // Stock MUST remain 50 (NOT phantom increase to 60)
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);

        // No stock adjustments exist
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).isEmpty();
    }

    @Test
    @DisplayName("8. Voiding historical DELIVERED order without deduction record does NOT restore phantom stock")
    void testHistoricalDeliveredOrderWithoutDeductionDoesNotRestorePhantomStockOnVoid() {
        // Simulate historical order in DELIVERED state without any OUT stock adjustments
        Order historicalOrder = transactionTemplate.execute(status -> {
            Order o = Order.builder()
                    .orderNumber("ORD-HISTORICAL-001")
                    .customer(customer)
                    .manager(manager)
                    .orderStatus(OrderStatus.DELIVERED)
                    .deliveryStatus(DeliveryStatus.DELIVERED)
                    .paymentStatus(PaymentStatus.PENDING)
                    .subtotal(new BigDecimal("500.00"))
                    .totalAmount(new BigDecimal("500.00"))
                    .build();
            o.addItem(OrderItem.builder()
                    .product(trackedProduct)
                    .quantity(5)
                    .sellingPrice(new BigDecimal("100.00"))
                    .lineTotal(new BigDecimal("500.00"))
                    .build());
            return orderRepository.save(o);
        });

        // Current stock is 50
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).isEmpty();

        // Void historical order
        orderService.voidOrder(historicalOrder.getId(), VoidOrderRequest.builder()
                .reason("Historical test void")
                .build(), admin.getUsername());

        // Stock MUST NOT increase to 55
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).isEmpty();
    }

    @Test
    @DisplayName("9. Insufficient stock rejects delivery and rolls back transaction atomically")
    void testInsufficientStockRejectsDeliveryAndRollsBack() {
        // Product has 50 stock, order requires 60
        OrderResponse order = createTestOrder(60, null);

        assertThatThrownBy(() -> deliveryService.markDeliveredByAdmin(order.getId(), null, admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient available stock for product");

        // Order status remains unchanged in pre-delivery state (CREATED or ASSIGNED)
        Order refreshedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(refreshedOrder.getOrderStatus()).isIn(OrderStatus.CREATED, OrderStatus.ASSIGNED);
        assertThat(refreshedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);

        // Stock untouched
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);

        // No stock adjustments created
        assertThat(stockAdjustmentRepository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("10. Concurrent delivery requests are serialized by pessimistic write lock (exactly one succeeds)")
    void testConcurrentDeliveryRequestsSerialization() throws Exception {
        OrderResponse order = createTestOrder(5, null);
        Long orderId = order.getId();

        int numThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch readyLatch = new CountDownLatch(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        List<Callable<Void>> tasks = new ArrayList<>();
        for (int i = 0; i < numThreads; i++) {
            tasks.add(() -> {
                readyLatch.countDown();
                startLatch.await(5, TimeUnit.SECONDS);
                try {
                    deliveryService.markDeliveredByAdmin(orderId, null, admin.getUsername());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                }
                return null;
            });
        }

        List<Future<Void>> futures = new ArrayList<>();
        for (Callable<Void> task : tasks) {
            futures.add(executor.submit(task));
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Release both threads simultaneously

        for (Future<Void> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        // Exactly one delivery succeeds, the other fails due to state check / lock
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(1);

        // Stock is deducted exactly once (50 - 5 = 45)
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);

        // Exactly one stock adjustment record created
        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(trackedProduct.getId());
        assertThat(adjustments).hasSize(1);
    }

    @Test
    @DisplayName("11. When order payment becomes fully PAID in one payment, delivery status automatically transitions to DELIVERED without stock deduction")
    void testFullPaymentAutomaticallySetsDeliveryStatusToDelivered() {
        OrderResponse order = createTestOrder(5, null);
        assertThat(order.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        // Record full payment
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(PaymentMethod.UPI)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(order.getId())
                        .allocatedAmount(order.getTotalAmount())
                        .build()))
                .build(), admin.getUsername());

        Order paidOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(paidOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(paidOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // Inventory is NOT deducted upon payment (remains 50)
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).isEmpty();
    }

    @Test
    @DisplayName("12. Final installment completing payment automatically transitions delivery status to DELIVERED")
    void testFinalInstallmentCompletingPaymentAutomaticallySetsDeliveryStatusToDelivered() {
        OrderResponse order = createTestOrder(5, null);
        assertThat(order.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);

        BigDecimal halfAmount = order.getTotalAmount().divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal remainingAmount = order.getTotalAmount().subtract(halfAmount);

        // Installment 1: Partial payment -> Remains undelivered
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(halfAmount)
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(order.getId())
                        .allocatedAmount(halfAmount)
                        .build()))
                .build(), admin.getUsername());

        Order partialOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(partialOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(partialOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);

        // Installment 2: Final payment completing order -> Automatically transitions to DELIVERED
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(remainingAmount)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(order.getId())
                        .allocatedAmount(remainingAmount)
                        .build()))
                .build(), admin.getUsername());

        Order completedPaymentOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(completedPaymentOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(completedPaymentOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // Stock deduction behavior preserved: payment does not deduct stock
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);
    }

    @Test
    @DisplayName("13. Unpaid order can be delivered (with stock deduction) and subsequent payment preserves DELIVERED status without double-deduction")
    void testUnpaidOrderCanBeDeliveredAndSubsequentPaymentPreservesDeliveredStatus() {
        OrderResponse order = createTestOrder(5, null);

        // Deliver while unpaid
        deliveryService.markDeliveredByAdmin(order.getId(), null, admin.getUsername());

        Order deliveredOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(deliveredOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        assertThat(deliveredOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).hasSize(1);

        // Subsequent full payment
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(order.getId())
                        .allocatedAmount(order.getTotalAmount())
                        .build()))
                .build(), admin.getUsername());

        Order paidDeliveredOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(paidDeliveredOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        assertThat(paidDeliveredOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        // Stock is NOT deducted again (remains 45)
        assertThat(productRepository.findById(trackedProduct.getId()).orElseThrow().getAvailableStock()).isEqualTo(45);
        assertThat(stockAdjustmentRepository.findByProductId(trackedProduct.getId())).hasSize(1);
    }
}

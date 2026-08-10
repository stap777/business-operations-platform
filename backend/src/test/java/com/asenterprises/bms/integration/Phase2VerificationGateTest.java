package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.ProductRequest;
import com.asenterprises.bms.dto.ProductResponse;
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
import com.asenterprises.bms.entity.Payment;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.StockAdjustment;
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
import com.asenterprises.bms.service.DeliveryService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.service.ProductService;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
public class Phase2VerificationGateTest {

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
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private ProductService productService;

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    private User admin;
    private User manager;
    private User deliveryPerson;
    private Customer customer;
    private Category category;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
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

        admin = userRepository.save(User.builder()
                .fullName("Gate Admin")
                .username("gate_admin")
                .password("encoded_pass")
                .phoneNumber("9000000001")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        manager = userRepository.save(User.builder()
                .fullName("Gate Manager")
                .username("gate_manager")
                .password("encoded_pass")
                .phoneNumber("9000000002")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryPerson = userRepository.save(User.builder()
                .fullName("Gate Delivery")
                .username("gate_delivery")
                .password("encoded_pass")
                .phoneNumber("9000000003")
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-GATE-01")
                .fullName("Gate Client")
                .phoneNumber("9988001122")
                .address("500 Verification Gate Way")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Gate Category")
                .status(CategoryStatus.ACTIVE)
                .build());
    }

    // =========================================================================
    // 2. COUPON CONCURRENCY
    // =========================================================================
    @Test
    @DisplayName("Gate #2: Atomic Coupon Concurrency - DB decides usage limit slot")
    void testCouponConcurrency() throws Exception {
        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("CONCUR1")
                .description("Limit 1 Coupon")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("10.00"))
                .minimumOrderAmount(new BigDecimal("10.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .usageLimit(1)
                .usedCount(0)
                .active(true)
                .build());

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);

        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                latch.await();
                return transactionTemplate.execute(status -> couponRepository.incrementUsedCount(coupon.getId()));
            });
        }

        latch.countDown();
        List<Future<Integer>> results = executor.invokeAll(tasks);
        executor.shutdown();

        int successCount = 0;
        for (Future<Integer> res : results) {
            successCount += res.get();
        }

        assertThat(successCount).isEqualTo(1);
        Coupon updatedCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(updatedCoupon.getUsedCount()).isEqualTo(1);
    }

    // =========================================================================
    // 3. PAYMENT CONCURRENCY
    // =========================================================================
    @Test
    @DisplayName("Gate #3: Concurrent Payment Requests - Exactly ONE succeeds")
    void testPaymentConcurrency() throws Exception {
        Product prod = productRepository.save(Product.builder()
                .name("Payment Prod")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("5000.00"))
                .purchasePrice(new BigDecimal("3000.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(prod.getId())
                        .quantity(1)
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);

        List<Callable<Boolean>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                latch.await();
                try {
                    PaymentRequest pReq = PaymentRequest.builder()
                            .customerId(customer.getId())
                            .totalAmount(new BigDecimal("5000.00"))
                            .paymentMethod(PaymentMethod.BANK_TRANSFER)
                            .allocations(List.of(PaymentAllocationRequest.builder()
                                    .orderId(orderRes.getId())
                                    .allocatedAmount(new BigDecimal("5000.00"))
                                    .build()))
                            .build();
                    paymentService.createPayment(pReq, admin.getUsername());
                    return true;
                } catch (IllegalStateException e) {
                    return false;
                }
            });
        }

        latch.countDown();
        List<Future<Boolean>> results = executor.invokeAll(tasks);
        executor.shutdown();

        int successCount = 0;
        int failCount = 0;
        for (Future<Boolean> f : results) {
            if (f.get()) successCount++;
            else failCount++;
        }

        assertThat(successCount).isEqualTo(1);
        assertThat(failCount).isEqualTo(1);

        Order finalOrder = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(finalOrder.getAmountReceived()).isEqualByComparingTo("5000.00");
        assertThat(finalOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        List<Payment> payments = paymentRepository.findAll();
        assertThat(payments).hasSize(1);
        List<PaymentAllocation> allocations = paymentAllocationRepository.findByOrderId(orderRes.getId());
        assertThat(allocations).hasSize(1);
    }

    // =========================================================================
    // 4. STOCK CONCURRENCY
    // =========================================================================
    @Test
    @DisplayName("Gate #4: Concurrent Stock Verification - Exactly ONE succeeds")
    void testStockConcurrency() throws Exception {
        Product product = productRepository.save(Product.builder()
                .name("Stock Test Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(5)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderRequest reqA = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(4).build()))
                .build();

        OrderRequest reqB = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(4).build()))
                .build();

        OrderResponse orderA = orderService.createOrder(reqA, manager.getUsername());
        OrderResponse orderB = orderService.createOrder(reqB, manager.getUsername());

        deliveryService.startDelivery(orderA.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderA.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("400.00")).paymentMethod(PaymentMethod.CASH).build(), deliveryPerson.getUsername());

        deliveryService.startDelivery(orderB.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderB.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("400.00")).paymentMethod(PaymentMethod.CASH).build(), deliveryPerson.getUsername());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);

        Callable<Boolean> taskA = () -> {
            latch.await();
            try {
                verificationService.verifyOrder(orderA.getId(), admin.getUsername());
                return true;
            } catch (IllegalStateException e) {
                return false;
            }
        };

        Callable<Boolean> taskB = () -> {
            latch.await();
            try {
                verificationService.verifyOrder(orderB.getId(), admin.getUsername());
                return true;
            } catch (IllegalStateException e) {
                return false;
            }
        };

        latch.countDown();
        Future<Boolean> futA = executor.submit(taskA);
        Future<Boolean> futB = executor.submit(taskB);
        executor.shutdown();

        boolean aSuccess = futA.get();
        boolean bSuccess = futB.get();

        assertThat(aSuccess ^ bSuccess).isTrue(); // Exactly ONE succeeded

        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getAvailableStock()).isEqualTo(1); // 5 - 4

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findAll();
        assertThat(adjustments).hasSize(1);
    }

    // =========================================================================
    // 5. VERIFICATION CONCURRENCY
    // =========================================================================
    @Test
    @DisplayName("Gate #5: Concurrent Verification of Same Order - Exactly ONE succeeds")
    void testVerificationConcurrency() throws Exception {
        Product product = productRepository.save(Product.builder()
                .name("Verif Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderRequest req = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(2).build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(req, manager.getUsername());
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("200.00")).paymentMethod(PaymentMethod.CASH).build(), deliveryPerson.getUsername());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);

        Callable<Boolean> task1 = () -> {
            latch.await();
            try {
                verificationService.verifyOrder(orderRes.getId(), admin.getUsername());
                return true;
            } catch (IllegalStateException e) {
                return false;
            }
        };

        Callable<Boolean> task2 = () -> {
            latch.await();
            try {
                verificationService.verifyOrder(orderRes.getId(), admin.getUsername());
                return true;
            } catch (IllegalStateException e) {
                return false;
            }
        };

        latch.countDown();
        Future<Boolean> res1 = executor.submit(task1);
        Future<Boolean> res2 = executor.submit(task2);
        executor.shutdown();

        assertThat(res1.get() ^ res2.get()).isTrue();

        List<Invoice> invoices = invoiceRepository.findAll();
        assertThat(invoices).hasSize(1);
    }

    // =========================================================================
    // 6. VERIFICATION TRANSACTION ATOMICITY & ROLLBACK
    // =========================================================================
    @Test
    @DisplayName("Gate #6: Verification Transaction Atomicity & Rollback")
    void testVerificationTransactionRollback() {
        Product product = productRepository.save(Product.builder()
                .name("Rollback Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(1) // Stock is 1, but order requires 5
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        Order order = Order.builder()
                .orderNumber("ORD-ROLLBACK-01")
                .customer(customer)
                .manager(manager)
                .orderStatus(OrderStatus.DELIVERED)
                .deliveryStatus(DeliveryStatus.DELIVERED)
                .paymentStatus(PaymentStatus.PAID)
                .subtotal(new BigDecimal("500.00"))
                .totalAmount(new BigDecimal("500.00"))
                .build();

        order.addItem(com.asenterprises.bms.entity.OrderItem.builder()
                .product(product)
                .quantity(5)
                .sellingPrice(new BigDecimal("100.00"))
                .lineTotal(new BigDecimal("500.00"))
                .build());

        Order savedOrder = orderRepository.save(order);

        assertThatThrownBy(() -> verificationService.verifyOrder(savedOrder.getId(), admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient stock for product");

        // Assert full transaction rollback
        assertThat(invoiceRepository.findAll()).isEmpty();
        assertThat(stockAdjustmentRepository.findAll()).isEmpty();
        Order refreshedOrder = orderRepository.findById(savedOrder.getId()).orElseThrow();
        assertThat(refreshedOrder.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
    }

    // =========================================================================
    // 7. DELIVERY ASSIGNMENT VALIDATION
    // =========================================================================
    @Test
    @DisplayName("Gate #7: Delivery Assignment Role & Status Validation")
    void testDeliveryAssignmentValidation() {
        User inactiveDelivery = userRepository.save(User.builder()
                .fullName("Inactive Delivery")
                .username("inactive_delivery")
                .password("encoded_pass")
                .phoneNumber("9000000099")
                .role(Role.DELIVERY)
                .status(UserStatus.INACTIVE)
                .firstLogin(false)
                .build());

        Product product = productRepository.save(Product.builder()
                .name("Delivery Validation Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        // Assign Admin -> Rejected
        assertThatThrownBy(() -> orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).deliveryPersonId(admin.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build())).build(), manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DELIVERY role");

        // Assign Manager -> Rejected
        assertThatThrownBy(() -> orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).deliveryPersonId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build())).build(), manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DELIVERY role");

        // Assign Inactive Delivery -> Rejected
        assertThatThrownBy(() -> orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).deliveryPersonId(inactiveDelivery.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build())).build(), manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inactive delivery person");

        // Assign Active Delivery -> Accepted
        OrderResponse validOrder = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build())).build(), manager.getUsername());

        assertThat(validOrder.getDeliveryPersonId()).isEqualTo(deliveryPerson.getId());
    }

    // =========================================================================
    // 8. MANAGER ASSIGNMENT VALIDATION
    // =========================================================================
    @Test
    @DisplayName("Gate #8: Manager Assignment Validation & JWT Principal Binding")
    void testManagerAssignmentValidation() {
        User otherManager = userRepository.save(User.builder()
                .fullName("Other Manager")
                .username("other_manager")
                .password("encoded_pass")
                .phoneNumber("9000000004")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        Product product = productRepository.save(Product.builder()
                .name("Manager Validation Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        // MANAGER created order MUST be assigned to authenticated principal (manager)
        OrderResponse mgrOrder = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(otherManager.getId()) // Passed other manager
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build(), manager.getUsername());

        // Derived from JWT principal manager, NOT otherManager
        assertThat(mgrOrder.getManagerId()).isEqualTo(manager.getId());
    }

    // =========================================================================
    // 9. SERVER-SIDE ORDER TOTAL AUDIT
    // =========================================================================
    @Test
    @DisplayName("Gate #9: Server-side Pricing Audit - Forged Values Ignored")
    void testServerSidePricingAudit() {
        Product product = productRepository.save(Product.builder()
                .name("Pricing Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("250.00"))
                .purchasePrice(new BigDecimal("150.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderRequest forgedReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .build()))
                .discountAmount(new BigDecimal("9999.00")) // Forged discount
                .build();

        // Forged discount exceeding subtotal -> Request rejected with IllegalArgumentException
        assertThatThrownBy(() -> orderService.createOrder(forgedReq, manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot exceed order subtotal");
    }

    // =========================================================================
    // 10. COUPON FORGERY & EXPIRATION TEST
    // =========================================================================
    @Test
    @DisplayName("Gate #10: Coupon Forgery & Validation Gates")
    void testCouponForgeryAndValidation() {
        Coupon expiredCoupon = couponRepository.save(Coupon.builder()
                .code("EXPIRED")
                .description("Expired Coupon")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(new BigDecimal("100.00"))
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().minusDays(1))
                .usageLimit(10)
                .usedCount(0)
                .active(true)
                .build());

        Product product = productRepository.save(Product.builder()
                .name("Coupon Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("200.00"))
                .purchasePrice(new BigDecimal("100.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        // Forged fake coupon code -> Request rejected with ResourceNotFoundException
        assertThatThrownBy(() -> orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).couponCode("FAKECODE")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build(), manager.getUsername()))
                .isInstanceOf(com.asenterprises.bms.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Coupon not found");

        // Expired coupon code -> Rejected with IllegalArgumentException
        assertThatThrownBy(() -> orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).couponCode("EXPIRED")
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build(), manager.getUsername()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired or not yet valid");
    }

    // =========================================================================
    // 11. TRACK INVENTORY TEST
    // =========================================================================
    @Test
    @org.springframework.transaction.annotation.Transactional
    @DisplayName("Gate #11: TrackInventory True vs False Handling")
    void testTrackInventoryTrueVsFalse() {
        Product trackedProd = productRepository.save(Product.builder()
                .name("Tracked Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(5)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        Product untrackedProd = productRepository.save(Product.builder()
                .name("Untracked Digital Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("0.00"))
                .availableStock(0)
                .minimumStock(0)
                .trackInventory(false)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderRequest req = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(trackedProd.getId()).quantity(2).build(),
                        OrderItemRequest.builder().productId(untrackedProd.getId()).quantity(10).build()
                ))
                .build();

        OrderResponse orderRes = orderService.createOrder(req, manager.getUsername());
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("1200.00")).paymentMethod(PaymentMethod.CASH).build(), deliveryPerson.getUsername());

        verificationService.verifyOrder(orderRes.getId(), admin.getUsername());

        Product updatedTracked = productRepository.findById(trackedProd.getId()).orElseThrow();
        assertThat(updatedTracked.getAvailableStock()).isEqualTo(3); // 5 - 2

        Product updatedUntracked = productRepository.findById(untrackedProd.getId()).orElseThrow();
        assertThat(updatedUntracked.getAvailableStock()).isEqualTo(0); // Unchanged

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findAll();
        assertThat(adjustments).hasSize(1);
        assertThat(adjustments.get(0).getProduct().getId()).isEqualTo(trackedProd.getId());
    }

    // =========================================================================
    // 12. PRODUCT STOCK PROFILE TEST
    // =========================================================================
    @Test
    @DisplayName("Gate #12: Product Profile Update Does Not Reset Stock")
    void testProductProfileStockIsolation() {
        Product prod = productRepository.save(Product.builder()
                .name("Original Name")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(42)
                .minimumStock(5)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        ProductResponse updated = productService.updateProduct(prod.getId(), ProductRequest.builder()
                .name("New Name")
                .categoryId(category.getId())
                .purchasePrice(new BigDecimal("60.00"))
                .sellingPrice(new BigDecimal("120.00"))
                .availableStock(9999) // Attempt override
                .minimumStock(10)
                .unit(ProductUnit.PCS)
                .trackInventory(true)
                .build());

        assertThat(updated.getAvailableStock()).isEqualTo(42);
    }

    // =========================================================================
    // 13. DUPLICATE PAYMENT & STATE MACHINE
    // =========================================================================
    @Test
    @DisplayName("Gate #13 & 14: Duplicate Delivery Payment Rejection & State Machine Illegal Transitions")
    void testDuplicatePaymentAndStateMachine() {
        Product prod = productRepository.save(Product.builder()
                .name("State Machine Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(10)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderResponse orderRes = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId()).deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder().productId(prod.getId()).quantity(1).build())).build(), manager.getUsername());

        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("100.00")).paymentMethod(PaymentMethod.CASH).build(), deliveryPerson.getUsername());

        // Attempt second delivery payment on DELIVERED order -> Invalid state transition 409
        assertThatThrownBy(() -> deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("100.00")).paymentMethod(PaymentMethod.CASH).build(), deliveryPerson.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Invalid order state transition");

        // Attempt cancel on DELIVERED order -> IllegalStateException 409
        assertThatThrownBy(() -> orderService.cancelOrder(orderRes.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel order in DELIVERED state");
    }
}

package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.PaymentResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.DeliveryService;
import com.asenterprises.bms.service.InvoiceService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class Phase7TransactionIntegrityTest {

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
    private OrderService orderService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private DeliveryService deliveryService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private User admin;
    private User manager;
    private User deliveryPerson;
    private Customer customer;
    private Category category;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        admin = userRepository.save(User.builder()
                .fullName("Phase7 Admin")
                .username("p7_admin")
                .password("encoded_pass")
                .phoneNumber("9000000001")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        manager = userRepository.save(User.builder()
                .fullName("Phase7 Manager")
                .username("p7_manager")
                .password("encoded_pass")
                .phoneNumber("9000000002")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryPerson = userRepository.save(User.builder()
                .fullName("Phase7 Delivery")
                .username("p7_delivery")
                .password("encoded_pass")
                .phoneNumber("9000000003")
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-P7-01")
                .fullName("Phase 7 Customer")
                .phoneNumber("9876543210")
                .address("77 Transaction Way")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Phase 7 Hardware")
                .status(CategoryStatus.ACTIVE)
                .build());

        product1 = productRepository.save(Product.builder()
                .name("Phase 7 Gadget")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("1000.00"))
                .purchasePrice(new BigDecimal("600.00"))
                .availableStock(50)
                .minimumStock(5)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        product2 = productRepository.save(Product.builder()
                .name("Phase 7 Widget")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("500.00"))
                .purchasePrice(new BigDecimal("300.00"))
                .availableStock(100)
                .minimumStock(10)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    // ============================================================
    // 1 & 2. REAL COUPON END-TO-END REGRESSION TEST
    // ============================================================
    @Test
    @DisplayName("Coupon E2E: Order creation increments usage to 1; Verification MUST NOT increment it to 2")
    void testCouponUsageSingleIncrementThroughVerification() {
        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("P7COUPON100")
                .description("100 Off Flat")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("100.00"))
                .minimumOrderAmount(new BigDecimal("500.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(1)
                .usedCount(0)
                .active(true)
                .build());

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .couponCode("P7COUPON100")
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1) // 1000.00
                        .build()))
                .build();

        // 1. Create order using coupon
        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        // 2. Confirm creation succeeded & discount is correct
        assertThat(orderRes.getDiscountAmount()).isEqualByComparingTo("100.00");
        assertThat(orderRes.getTotalAmount()).isEqualByComparingTo("900.00");

        // 3. Read coupon usage count after order creation -> MUST BE 1
        Coupon couponAfterCreation = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(couponAfterCreation.getUsedCount()).isEqualTo(1);

        // 4. Perform Delivery Workflow
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("900.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryPerson.getUsername());

        // 5. Verify order through real VerificationService workflow
        InvoiceResponse invoiceRes = verificationService.verifyOrder(orderRes.getId(), admin.getUsername());
        assertThat(invoiceRes).isNotNull();

        // 6. Read coupon usage count after verification -> MUST REMAIN 1 (NOT 2)
        Coupon couponAfterVerification = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(couponAfterVerification.getUsedCount()).isEqualTo(1);

        // 7. Attempt second order with same coupon -> MUST FAIL due to usage limit
        OrderRequest secondOrderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("P7COUPON100")
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1)
                        .build()))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(secondOrderReq, manager.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("usage limit has been reached");
    }

    // ============================================================
    // 3. ORDER → INVOICE LIFECYCLE TESTS (TESTS A, B, C, D, E)
    // ============================================================
    @Test
    @DisplayName("Invoice Lifecycle: Test A & B - Order creation auto-generates 1 invoice; Verification reuses same invoice")
    void testOrderToInvoiceLifecycleSingleInvoice() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1)
                        .build()))
                .build();

        // TEST A: Create order -> exactly one invoice exists
        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());
        List<Invoice> invoicesAfterCreation = invoiceRepository.findAll().stream()
                .filter(i -> i.getOrder().getId().equals(orderRes.getId()))
                .toList();
        assertThat(invoicesAfterCreation).hasSize(1);
        Invoice initialInvoice = invoicesAfterCreation.get(0);
        assertThat(initialInvoice.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        // TEST B: Deliver & Verify order -> still exactly one invoice exists
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("0.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryPerson.getUsername());

        InvoiceResponse verifiedInvoice = verificationService.verifyOrder(orderRes.getId(), admin.getUsername());

        List<Invoice> invoicesAfterVerification = invoiceRepository.findAll().stream()
                .filter(i -> i.getOrder().getId().equals(orderRes.getId()))
                .toList();
        assertThat(invoicesAfterVerification).hasSize(1);
        assertThat(verifiedInvoice.getId()).isEqualTo(initialInvoice.getId());
    }

    @Test
    @DisplayName("Invoice Lifecycle: Test C & D - Payments synchronize invoice paymentStatus (PARTIAL -> PAID)")
    void testInvoicePaymentStatusSynchronization() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1) // Total = 1000.00
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        // TEST C: Partial payment -> same invoice becomes PARTIAL
        PaymentRequest partialReq = PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("400.00"))
                .paymentMethod(PaymentMethod.UPI)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("400.00"))
                        .build()))
                .build();

        paymentService.createPayment(partialReq, admin.getUsername());

        Invoice invoicePartial = invoiceRepository.findByOrderId(orderRes.getId()).orElseThrow();
        assertThat(invoicePartial.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // TEST D: Full payment -> same invoice becomes PAID
        PaymentRequest finalReq = PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("600.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("600.00"))
                        .build()))
                .build();

        paymentService.createPayment(finalReq, admin.getUsername());

        Invoice invoicePaid = invoiceRepository.findByOrderId(orderRes.getId()).orElseThrow();
        assertThat(invoicePaid.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    // ============================================================
    // 4 & 5. PAYMENT STATE MACHINE & MULTIPLE PAYMENTS REGRESSION TEST
    // ============================================================
    @Test
    @DisplayName("Multiple Payment Regression: ₹10,000 order with ₹2,000 + ₹3,000 + ₹5,000 payments")
    void testMultiplePaymentCumulativeState() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(10) // 10 * 1000.00 = 10,000.00 total
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        // Scenario 1: Initial state = PENDING
        Order orderInitial = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(orderInitial.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(orderInitial.getAmountReceived()).isEqualByComparingTo("0.00");

        // Payment 1: ₹2,000
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("2000.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("2000.00"))
                        .build()))
                .build(), admin.getUsername());

        Order orderP1 = orderRepository.findById(orderRes.getId()).orElseThrow();
        Invoice invoiceP1 = invoiceRepository.findByOrderId(orderRes.getId()).orElseThrow();
        assertThat(orderP1.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(orderP1.getAmountReceived()).isEqualByComparingTo("2000.00");
        assertThat(invoiceP1.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // Payment 2: ₹3,000
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("3000.00"))
                .paymentMethod(PaymentMethod.UPI)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("3000.00"))
                        .build()))
                .build(), admin.getUsername());

        Order orderP2 = orderRepository.findById(orderRes.getId()).orElseThrow();
        Invoice invoiceP2 = invoiceRepository.findByOrderId(orderRes.getId()).orElseThrow();
        assertThat(orderP2.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(orderP2.getAmountReceived()).isEqualByComparingTo("5000.00");
        assertThat(invoiceP2.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // Payment 3: ₹5,000
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("5000.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("5000.00"))
                        .build()))
                .build(), admin.getUsername());

        // Final assertions
        Order orderFinal = orderRepository.findById(orderRes.getId()).orElseThrow();
        Invoice invoiceFinal = invoiceRepository.findByOrderId(orderRes.getId()).orElseThrow();
        List<PaymentAllocation> allocations = paymentAllocationRepository.findByOrderId(orderRes.getId());

        assertThat(orderFinal.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(orderFinal.getAmountReceived()).isEqualByComparingTo("10000.00");
        assertThat(invoiceFinal.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(allocations).hasSize(3);

        // Verify single invoice still exists
        long invoiceCount = invoiceRepository.findAll().stream()
                .filter(i -> i.getOrder().getId().equals(orderRes.getId()))
                .count();
        assertThat(invoiceCount).isEqualTo(1);
    }

    @Test
    @DisplayName("Payment State Machine: Overpayment is explicitly rejected")
    void testOverpaymentRejected() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1) // 1000.00
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        PaymentRequest overpaymentReq = PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("1200.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("1200.00"))
                        .build()))
                .build();

        assertThatThrownBy(() -> paymentService.createPayment(overpaymentReq, admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exceeds outstanding balance");
    }

    // ============================================================
    // 6. ORDER CANCELLATION AUDIT TESTS
    // ============================================================
    @Test
    @DisplayName("Cancellation Audit: Unpaid order with coupon can be cancelled & restores coupon usage")
    void testCancelOrderRestoresCouponUsage() {
        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("RESTORE50")
                .description("50 Off")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(new BigDecimal("100.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(1)
                .usedCount(0)
                .active(true)
                .build());

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .couponCode("RESTORE50")
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1)
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        Coupon couponUsed = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(couponUsed.getUsedCount()).isEqualTo(1);

        // Cancel order
        OrderResponse cancelledOrder = orderService.cancelOrder(orderRes.getId());
        assertThat(cancelledOrder.getOrderStatus()).isEqualTo(OrderStatus.CANCELLED);

        // Verify coupon usage is restored to 0
        Coupon couponRestored = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(couponRestored.getUsedCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("Cancellation Audit: Order with allocated payments CANNOT be cancelled")
    void testCancelOrderWithPaymentsProhibited() {
        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(1)
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());

        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("500.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("500.00"))
                        .build()))
                .build(), admin.getUsername());

        assertThatThrownBy(() -> orderService.cancelOrder(orderRes.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel order")
                .hasMessageContaining("allocated payments");
    }

    // ============================================================
    // 7. INVENTORY / VERIFICATION INTEGRITY TESTS
    // ============================================================
    @Test
    @DisplayName("Inventory Integrity: Verification deducts stock once; repeated verification is idempotent (rejected)")
    void testVerificationInventoryDeductionIdempotency() {
        int initialStock = product1.getAvailableStock();

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product1.getId())
                        .quantity(5)
                        .build()))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("5000.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryPerson.getUsername());

        // First verification -> Stock decreases by 5
        verificationService.verifyOrder(orderRes.getId(), admin.getUsername());

        Product productAfterFirstVerify = productRepository.findById(product1.getId()).orElseThrow();
        assertThat(productAfterFirstVerify.getAvailableStock()).isEqualTo(initialStock - 5);

        // Repeated verification on VERIFIED order -> Throws IllegalStateException, stock remains unchanged
        assertThatThrownBy(() -> verificationService.verifyOrder(orderRes.getId(), admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only orders with status DELIVERED can be verified");

        Product productAfterSecondVerify = productRepository.findById(product1.getId()).orElseThrow();
        assertThat(productAfterSecondVerify.getAvailableStock()).isEqualTo(initialStock - 5);
    }

    @Test
    @DisplayName("Inventory Integrity: Insufficient stock rolls back verification transaction atomically")
    void testInsufficientStockVerificationRollback() {
        // Create product with low stock (2 units available)
        Product lowStockProduct = productRepository.save(Product.builder()
                .name("Low Stock Item")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(2)
                .minimumStock(1)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        OrderRequest orderReq = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .deliveryPersonId(deliveryPerson.getId())
                .items(List.of(
                        OrderItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(2) // Stock available = 50
                                .build(),
                        OrderItemRequest.builder()
                                .productId(lowStockProduct.getId())
                                .quantity(10) // Stock available = 2 (Insufficient!)
                                .build()
                ))
                .build();

        OrderResponse orderRes = orderService.createOrder(orderReq, manager.getUsername());
        deliveryService.startDelivery(orderRes.getId(), deliveryPerson.getUsername());
        deliveryService.markDelivered(orderRes.getId(), DeliveryPaymentRequest.builder()
                .amountReceived(new BigDecimal("3000.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build(), deliveryPerson.getUsername());

        // Verification must fail due to insufficient stock on lowStockProduct
        assertThatThrownBy(() -> verificationService.verifyOrder(orderRes.getId(), admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insufficient stock for product 'Low Stock Item'");

        // Order status MUST remain DELIVERED (verification was rejected)
        Order orderAfterFailedVerify = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(orderAfterFailedVerify.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
    }
}

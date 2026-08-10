package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.*;
import com.asenterprises.bms.entity.*;
import com.asenterprises.bms.repository.*;
import com.asenterprises.bms.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class CreditAndPaymentReconciliationIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerLedgerService customerLedgerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    private User admin;
    private User manager;
    private Customer customer;
    private Category category;
    private Product product1;
    private Product product2;

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
                .fullName("Test Admin")
                .username("test_admin")
                .password("encoded_pass")
                .phoneNumber("9876543210")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        manager = userRepository.save(User.builder()
                .fullName("Test Manager")
                .username("test_manager")
                .password("encoded_pass")
                .phoneNumber("9876543211")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-REC-01")
                .fullName("Udhar Client Corp")
                .phoneNumber("9123456789")
                .address("100 Enterprise Way")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Industrial Goods")
                .status(CategoryStatus.ACTIVE)
                .build());

        product1 = productRepository.save(Product.builder()
                .name("Item Alpha")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("5000.00"))
                .purchasePrice(new BigDecimal("3000.00"))
                .availableStock(100)
                .minimumStock(5)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());

        product2 = productRepository.save(Product.builder()
                .name("Item Beta")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("4000.00"))
                .purchasePrice(new BigDecimal("2000.00"))
                .availableStock(100)
                .minimumStock(5)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Test 1-4: Single Order Flow - PENDING -> PARTIAL -> PAID with Ledger Settlement")
    void testSingleOrderPaymentLifecycleAndLedger() {
        // 1. Create PENDING order for ₹5,000
        OrderResponse orderRes = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product1.getId()).quantity(1).build()))
                .build(), manager.getUsername());

        assertThat(orderRes.getTotalAmount()).isEqualByComparingTo("5000.00");
        assertThat(orderRes.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(orderRes.getAmountReceived()).isEqualByComparingTo("0.00");

        // Verify Pending Orders API
        List<PendingOrderResponse> pendingList1 = paymentService.getPendingOrdersForCustomer(customer.getId());
        assertThat(pendingList1).hasSize(1);
        assertThat(pendingList1.get(0).getOutstandingAmount()).isEqualByComparingTo("5000.00");

        // Verify Ledger
        CustomerLedgerResponse ledger1 = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledger1.getOutstandingBalance()).isEqualByComparingTo("5000.00");

        // 2. Partial Payment of ₹2,000
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("2000.00"))
                .paymentMethod(PaymentMethod.CASH)
                .remarks("First installment")
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("2000.00"))
                        .build()))
                .build(), admin.getUsername());

        Order updatedOrder1 = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(updatedOrder1.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(updatedOrder1.getAmountReceived()).isEqualByComparingTo("2000.00");

        CustomerLedgerResponse ledger2 = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledger2.getOutstandingBalance()).isEqualByComparingTo("3000.00");

        // 3. Final Payment of ₹3,000
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("3000.00"))
                .paymentMethod(PaymentMethod.UPI)
                .remarks("Final settlement")
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderRes.getId())
                        .allocatedAmount(new BigDecimal("3000.00"))
                        .build()))
                .build(), admin.getUsername());

        Order finalOrder = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(finalOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(finalOrder.getAmountReceived()).isEqualByComparingTo("5000.00");

        // 4. Verify Credit Cleared in Ledger & Pending Orders List
        List<PendingOrderResponse> pendingList2 = paymentService.getPendingOrdersForCustomer(customer.getId());
        assertThat(pendingList2).isEmpty();

        CustomerLedgerResponse ledger3 = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledger3.getOutstandingBalance()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Test 5-7 & 13: Multiple Credit Orders - Independent Order Settlement")
    void testMultipleOrdersCreditIsolation() {
        // Order 1: ₹5,000, Paid ₹2,000 -> Outstanding ₹3,000
        OrderResponse order1 = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product1.getId()).quantity(1).build()))
                .build(), manager.getUsername());

        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId()).totalAmount(new BigDecimal("2000.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder().orderId(order1.getId()).allocatedAmount(new BigDecimal("2000.00")).build()))
                .build(), admin.getUsername());

        // Order 2: ₹4,000, Paid ₹0 -> Outstanding ₹4,000
        OrderResponse order2 = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product2.getId()).quantity(1).build()))
                .build(), manager.getUsername());

        // Initial Customer Credit must be ₹7,000 (₹3,000 + ₹4,000)
        CustomerLedgerResponse ledgerInitial = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledgerInitial.getOutstandingBalance()).isEqualByComparingTo("7000.00");

        List<PendingOrderResponse> pendingOrders = paymentService.getPendingOrdersForCustomer(customer.getId());
        assertThat(pendingOrders).hasSize(2);

        // Pay remaining ₹3,000 against Order 1 only
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId()).totalAmount(new BigDecimal("3000.00"))
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .allocations(List.of(PaymentAllocationRequest.builder().orderId(order1.getId()).allocatedAmount(new BigDecimal("3000.00")).build()))
                .build(), admin.getUsername());

        // Expected: Order 1 -> PAID, Order 2 -> PENDING (₹4,000 outstanding), Customer Total Credit -> ₹4,000
        Order updatedOrder1 = orderRepository.findById(order1.getId()).orElseThrow();
        Order updatedOrder2 = orderRepository.findById(order2.getId()).orElseThrow();

        assertThat(updatedOrder1.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updatedOrder2.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        CustomerLedgerResponse ledgerMid = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledgerMid.getOutstandingBalance()).isEqualByComparingTo("4000.00");

        // Pay remaining ₹4,000 against Order 2
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId()).totalAmount(new BigDecimal("4000.00"))
                .paymentMethod(PaymentMethod.UPI)
                .allocations(List.of(PaymentAllocationRequest.builder().orderId(order2.getId()).allocatedAmount(new BigDecimal("4000.00")).build()))
                .build(), admin.getUsername());

        // Expected: Customer total credit -> ₹0
        Order finalOrder2 = orderRepository.findById(order2.getId()).orElseThrow();
        assertThat(finalOrder2.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);

        CustomerLedgerResponse ledgerFinal = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledgerFinal.getOutstandingBalance()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Test 7 & 8: Overpayment Rejection & Transactional Rollback on Failure")
    void testOverpaymentRejectionAndRollback() {
        OrderResponse orderRes = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product1.getId()).quantity(1).build()))
                .build(), manager.getUsername());

        // Attempt overpayment of ₹6,000 on a ₹5,000 order
        assertThatThrownBy(() -> paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("6000.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder().orderId(orderRes.getId()).allocatedAmount(new BigDecimal("6000.00")).build()))
                .build(), admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exceeds outstanding balance");

        // Verify state remains completely unchanged (0 payments, order still PENDING, ₹5000 outstanding)
        Order unmodifiedOrder = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(unmodifiedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(unmodifiedOrder.getAmountReceived()).isEqualByComparingTo("0.00");
        assertThat(paymentRepository.count()).isEqualTo(0);

        CustomerLedgerResponse ledger = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledger.getOutstandingBalance()).isEqualByComparingTo("5000.00");
    }

    @Test
    @DisplayName("Test 9-10 & 15: Payment Concurrency Protection - DB Locking Prevents Over-Allocation")
    void testPaymentConcurrencyProtection() throws Exception {
        OrderResponse orderRes = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId()).managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(product1.getId()).quantity(1).build()))
                .build(), manager.getUsername());

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);

        List<Callable<Boolean>> tasks = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            tasks.add(() -> {
                latch.await();
                try {
                    return transactionTemplate.execute(status -> {
                        paymentService.createPayment(PaymentRequest.builder()
                                .customerId(customer.getId())
                                .totalAmount(new BigDecimal("5000.00"))
                                .paymentMethod(PaymentMethod.CASH)
                                .allocations(List.of(PaymentAllocationRequest.builder()
                                        .orderId(orderRes.getId())
                                        .allocatedAmount(new BigDecimal("5000.00"))
                                        .build()))
                                .build(), admin.getUsername());
                        return true;
                    });
                } catch (Exception e) {
                    return false;
                }
            });
        }

        latch.countDown();
        List<Future<Boolean>> results = executor.invokeAll(tasks);
        executor.shutdown();

        int successCount = 0;
        int failureCount = 0;
        for (Future<Boolean> f : results) {
            if (Boolean.TRUE.equals(f.get())) {
                successCount++;
            } else {
                failureCount++;
            }
        }

        assertThat(successCount).isEqualTo(1);
        assertThat(failureCount).isEqualTo(1);

        Order finalOrder = orderRepository.findById(orderRes.getId()).orElseThrow();
        assertThat(finalOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(finalOrder.getAmountReceived()).isEqualByComparingTo("5000.00");
        assertThat(paymentRepository.count()).isEqualTo(1);
    }
}

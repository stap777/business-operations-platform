package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.InvoiceItem;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
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
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
public class OrderEditInvoiceSyncIntegrationTest {

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
    private InvoiceService invoiceService;

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
    private Customer customer;
    private Category category;
    private Product productA;
    private Product productB;
    private Product productC;

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
            String uniqueSuffix = String.valueOf(numSuffix);

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

            customer = customerRepository.save(Customer.builder()
                    .customerCode("CUST-" + uniqueSuffix)
                    .fullName("Test Customer")
                    .phoneNumber(String.format("93%08d", numSuffix))
                    .address("123 Market Street")
                    .status(CustomerStatus.ACTIVE)
                    .build());

            category = categoryRepository.save(Category.builder()
                    .name("Beverages " + uniqueSuffix)
                    .status(CategoryStatus.ACTIVE)
                    .build());

            productA = productRepository.save(Product.builder()
                    .name("Product A " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.PCS)
                    .purchasePrice(new BigDecimal("60.00"))
                    .sellingPrice(new BigDecimal("100.00"))
                    .availableStock(100)
                    .minimumStock(10)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            productB = productRepository.save(Product.builder()
                    .name("Product B " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.PCS)
                    .purchasePrice(new BigDecimal("120.00"))
                    .sellingPrice(new BigDecimal("200.00"))
                    .availableStock(100)
                    .minimumStock(10)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            productC = productRepository.save(Product.builder()
                    .name("Product C " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.PCS)
                    .purchasePrice(new BigDecimal("30.00"))
                    .sellingPrice(new BigDecimal("50.00"))
                    .availableStock(100)
                    .minimumStock(10)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            return null;
        });
    }

    @Test
    @DisplayName("Test 1: Editing quantities, adding/removing products, and changing discounts updates invoice items and totals")
    void testOrderEditUpdatesInvoiceItemsAndTotals() {
        // Create initial order: Product A x 2 ($200) + Product B x 1 ($200) - $50 discount = $350 total
        OrderRequest createRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .discountAmount(new BigDecimal("50.00"))
                .items(List.of(
                        OrderItemRequest.builder().productId(productA.getId()).quantity(2).build(),
                        OrderItemRequest.builder().productId(productB.getId()).quantity(1).build()
                ))
                .build();

        OrderResponse createdOrder = orderService.createOrder(createRequest, manager.getUsername());

        // Verify initial invoice
        Invoice initialInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        assertThat(initialInvoice.getSubtotal()).isEqualByComparingTo(new BigDecimal("400.00"));
        assertThat(initialInvoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(initialInvoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("350.00"));
        assertThat(initialInvoice.getItems()).hasSize(2);

        // Edit order: Product A x 1 ($100), remove Product B, add Product C x 3 ($150) - $20 discount = $230 total
        OrderRequest updateRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .discountAmount(new BigDecimal("20.00"))
                .items(List.of(
                        OrderItemRequest.builder().productId(productA.getId()).quantity(1).build(),
                        OrderItemRequest.builder().productId(productC.getId()).quantity(3).build()
                ))
                .build();

        OrderResponse updatedOrder = orderService.updateOrder(createdOrder.getId(), updateRequest);
        assertThat(updatedOrder.getSubtotal()).isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(updatedOrder.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(updatedOrder.getTotalAmount()).isEqualByComparingTo(new BigDecimal("230.00"));

        // Verify invoice was synchronized in-place
        Invoice updatedInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        assertThat(updatedInvoice.getSubtotal()).isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(updatedInvoice.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(updatedInvoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("230.00"));

        // Verify invoice line items match the edited order items
        assertThat(updatedInvoice.getItems()).hasSize(2);
        InvoiceItem itemA = updatedInvoice.getItems().stream()
                .filter(i -> i.getProductNameSnapshot().equals(productA.getName()))
                .findFirst().orElseThrow();
        assertThat(itemA.getQuantity()).isEqualTo(1);
        assertThat(itemA.getSellingPriceSnapshot()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(itemA.getLineTotal()).isEqualByComparingTo(new BigDecimal("100.00"));

        InvoiceItem itemC = updatedInvoice.getItems().stream()
                .filter(i -> i.getProductNameSnapshot().equals(productC.getName()))
                .findFirst().orElseThrow();
        assertThat(itemC.getQuantity()).isEqualTo(3);
        assertThat(itemC.getSellingPriceSnapshot()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(itemC.getLineTotal()).isEqualByComparingTo(new BigDecimal("150.00"));

        // Verify invoice response DTO mapping
        InvoiceResponse response = invoiceService.getInvoiceByOrderId(createdOrder.getId());
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(response.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("230.00"));
        assertThat(response.getItems()).hasSize(2);
    }

    @Test
    @DisplayName("Test 2: Invoice ID, invoice number, and invoice date remain unchanged after order edit")
    void testInvoiceIdentityPreservedAcrossOrderEdit() {
        OrderRequest createRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productA.getId()).quantity(1).build()
                ))
                .build();

        OrderResponse createdOrder = orderService.createOrder(createRequest, manager.getUsername());

        Invoice initialInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        Long initialInvoiceId = initialInvoice.getId();
        String initialInvoiceNumber = initialInvoice.getInvoiceNumber();
        LocalDateTime initialInvoiceDate = initialInvoice.getInvoiceDate();
        Long initialGeneratedById = initialInvoice.getGeneratedBy().getId();

        // Edit order
        OrderRequest updateRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productB.getId()).quantity(2).build()
                ))
                .build();

        orderService.updateOrder(createdOrder.getId(), updateRequest);

        Invoice updatedInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        assertThat(updatedInvoice.getId()).isEqualTo(initialInvoiceId);
        assertThat(updatedInvoice.getInvoiceNumber()).isEqualTo(initialInvoiceNumber);
        assertThat(updatedInvoice.getInvoiceDate()).isEqualTo(initialInvoiceDate);
        assertThat(updatedInvoice.getGeneratedBy().getId()).isEqualTo(initialGeneratedById);
    }

    @Test
    @DisplayName("Test 3: An existing partial payment remains recorded with correct outstanding balance after total change")
    void testPartialPaymentPreservedAndBalanceRecalculated() {
        // Initial order: Product B x 2 = $400, Product A x 1 = $100 -> Total $500
        OrderRequest createRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productB.getId()).quantity(2).build(),
                        OrderItemRequest.builder().productId(productA.getId()).quantity(1).build()
                ))
                .build();

        OrderResponse createdOrder = orderService.createOrder(createRequest, manager.getUsername());

        // Record partial payment of $200
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("200.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(createdOrder.getId())
                        .allocatedAmount(new BigDecimal("200.00"))
                        .build()))
                .build(), admin.getUsername());

        InvoiceResponse initialRes = invoiceService.getInvoiceByOrderId(createdOrder.getId());
        assertThat(initialRes.getTotalAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(initialRes.getPaidAmount()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(initialRes.getCreditRemaining()).isEqualByComparingTo(new BigDecimal("300.00"));
        assertThat(initialRes.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // Edit order: Increase Product B from 2 to 3 -> Total becomes $700
        OrderRequest updateRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productB.getId()).quantity(3).build(),
                        OrderItemRequest.builder().productId(productA.getId()).quantity(1).build()
                ))
                .build();

        OrderResponse updatedOrder = orderService.updateOrder(createdOrder.getId(), updateRequest);
        assertThat(updatedOrder.getTotalAmount()).isEqualByComparingTo(new BigDecimal("700.00"));
        assertThat(updatedOrder.getAmountReceived()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(updatedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // Verify invoice shows updated total and recalculates creditRemaining correctly
        InvoiceResponse updatedRes = invoiceService.getInvoiceByOrderId(createdOrder.getId());
        assertThat(updatedRes.getTotalAmount()).isEqualByComparingTo(new BigDecimal("700.00"));
        assertThat(updatedRes.getPaidAmount()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(updatedRes.getCreditRemaining()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(updatedRes.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // Verify payment allocations remain intact
        BigDecimal totalAllocated = paymentAllocationRepository.sumAllocatedAmountByOrderId(createdOrder.getId());
        assertThat(totalAllocated).isEqualByComparingTo(new BigDecimal("200.00"));
    }

    @Test
    @DisplayName("Test 4: A rejected edit to a locked order leaves its invoice unchanged")
    void testRejectedEditToLockedOrderLeavesInvoiceUnchanged() {
        // Create and pay order in full
        OrderRequest createRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productA.getId()).quantity(2).build()
                ))
                .build();

        OrderResponse createdOrder = orderService.createOrder(createRequest, manager.getUsername());

        // Mark Delivered while unpaid, then pay in full prior to verification
        deliveryService.markDeliveredByAdmin(createdOrder.getId(), null, admin.getUsername());

        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("200.00"))
                .paymentMethod(PaymentMethod.UPI)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(createdOrder.getId())
                        .allocatedAmount(new BigDecimal("200.00"))
                        .build()))
                .build(), admin.getUsername());

        verificationService.verifyOrder(createdOrder.getId(), admin.getUsername());

        Invoice preEditInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        BigDecimal preEditTotal = preEditInvoice.getTotalAmount();
        int preEditItemCount = preEditInvoice.getItems().size();

        // Attempt edit on locked (VERIFIED) order
        OrderRequest updateRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productA.getId()).quantity(5).build()
                ))
                .build();

        assertThatThrownBy(() -> orderService.updateOrder(createdOrder.getId(), updateRequest))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot edit an order that is already VERIFIED");

        // Verify invoice is completely unchanged
        Invoice postAttemptInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        assertThat(postAttemptInvoice.getTotalAmount()).isEqualByComparingTo(preEditTotal);
        assertThat(postAttemptInvoice.getItems()).hasSize(preEditItemCount);
    }

    @Test
    @DisplayName("Test 5: A failure during synchronization rolls back both order and invoice changes")
    void testOverpaymentFailureDuringSyncRollsBackOrderAndInvoice() {
        // Create order with Total $500 (Product B x 2 + Product A x 1)
        OrderRequest createRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productB.getId()).quantity(2).build(),
                        OrderItemRequest.builder().productId(productA.getId()).quantity(1).build()
                ))
                .build();

        OrderResponse createdOrder = orderService.createOrder(createRequest, manager.getUsername());

        // Allocate $400 payment to this order
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(new BigDecimal("400.00"))
                .paymentMethod(PaymentMethod.CASH)
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(createdOrder.getId())
                        .allocatedAmount(new BigDecimal("400.00"))
                        .build()))
                .build(), admin.getUsername());

        // Attempt edit with total = $200 (Product A x 2), which is less than the $400 already paid
        OrderRequest reducingRequest = OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(
                        OrderItemRequest.builder().productId(productA.getId()).quantity(2).build()
                ))
                .build();

        assertThatThrownBy(() -> orderService.updateOrder(createdOrder.getId(), reducingRequest))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Overpayment error");

        // Verify order changes were rolled back
        OrderResponse rolledBackOrder = orderService.getOrderById(createdOrder.getId());
        assertThat(rolledBackOrder.getTotalAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(rolledBackOrder.getItems()).hasSize(2);

        // Verify invoice changes were also rolled back
        Invoice rolledBackInvoice = invoiceRepository.findByOrderIdWithDetails(createdOrder.getId()).orElseThrow();
        assertThat(rolledBackInvoice.getTotalAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(rolledBackInvoice.getItems()).hasSize(2);
    }
}

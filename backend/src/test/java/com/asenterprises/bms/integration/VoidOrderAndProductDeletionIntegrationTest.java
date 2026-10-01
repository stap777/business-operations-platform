package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.ProductDeletionCheckResponse;
import com.asenterprises.bms.dto.ProductRequest;
import com.asenterprises.bms.dto.ProductResponse;
import com.asenterprises.bms.dto.VoidOrderRequest;
import com.asenterprises.bms.entity.AuditLog;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
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
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.AuditLogRepository;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
import com.asenterprises.bms.service.CustomerLedgerService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.ProductService;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class VoidOrderAndProductDeletionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private CustomerLedgerService customerLedgerService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private User admin;
    private User manager;
    private Customer customer;
    private Category beverageCategory;
    private Product standardProduct;

    @BeforeEach
    void setUp() {
        // Clean test database tables in proper foreign key order
        auditLogRepository.deleteAll();
        paymentAllocationRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        orderRepository.deleteAll();
        stockAdjustmentRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        customerRepository.deleteAll();
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        long phoneSuffix = Math.abs(suffix.hashCode() % 100000000L);
        String phone1 = String.format("98%08d", phoneSuffix);
        String phone2 = String.format("97%08d", phoneSuffix);
        String phone3 = String.format("96%08d", phoneSuffix);

        admin = userRepository.save(User.builder()
                .username("admin_" + suffix)
                .password("$2a$10$dummyHashForTestingPurposes1234567890")
                .fullName("System Administrator")
                .phoneNumber(phone1)
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build());

        manager = userRepository.save(User.builder()
                .username("manager_" + suffix)
                .password("$2a$10$dummyHashForTestingPurposes1234567890")
                .fullName("Branch Manager")
                .phoneNumber(phone2)
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-" + suffix)
                .fullName("Gokul Sweets & Snacks")
                .phoneNumber(phone3)
                .address("123 MG Road, Pune")
                .status(CustomerStatus.ACTIVE)
                .build());

        beverageCategory = categoryRepository.save(Category.builder()
                .name("Beverages " + suffix)
                .status(CategoryStatus.ACTIVE)
                .build());

        standardProduct = productRepository.save(Product.builder()
                .name("Mango Juice 500ml " + suffix)
                .category(beverageCategory)
                .purchasePrice(new BigDecimal("40.00"))
                .sellingPrice(new BigDecimal("60.00"))
                .availableStock(100)
                .minimumStock(10)
                .unit(ProductUnit.BOTTLE)
                .trackInventory(true)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Feature 1: Paid and verified order can be voided, inventory restored, payment preserved, audit recorded")
    void testPaidOrderCanBeVoidedAndRetainsAuditHistoryAndReference() {
        // 1. Create order
        OrderResponse createdOrder = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(standardProduct.getId())
                        .quantity(10)
                        .build()))
                .build(), manager.getUsername());

        assertThat(createdOrder).isNotNull();
        String originalOrderNumber = createdOrder.getOrderNumber();

        // 2. Record payment so it becomes PAID
        Payment payment = Payment.builder()
                .paymentNumber("PAY-TEST-0001")
                .customer(customer)
                .receivedBy(admin)
                .paymentDate(LocalDateTime.now())
                .totalAmount(createdOrder.getTotalAmount())
                .paymentMethod(PaymentMethod.CASH)
                .build();
        payment = paymentRepository.save(payment);

        PaymentAllocation allocation = PaymentAllocation.builder()
                .payment(payment)
                .order(orderRepository.findById(createdOrder.getId()).orElseThrow())
                .allocatedAmount(createdOrder.getTotalAmount())
                .build();
        paymentAllocationRepository.save(allocation);

        Order orderToPay = orderRepository.findById(createdOrder.getId()).orElseThrow();
        orderToPay.setPaymentStatus(PaymentStatus.PAID);
        orderToPay.setOrderStatus(OrderStatus.DELIVERED);
        orderRepository.save(orderToPay);

        // 3. Verify order (this deducts inventory by 10)
        verificationService.verifyOrder(createdOrder.getId(), admin.getUsername());

        Product productAfterVerify = productRepository.findById(standardProduct.getId()).orElseThrow();
        assertThat(productAfterVerify.getAvailableStock()).isEqualTo(90);

        // Verify invoice was created
        Invoice invoice = invoiceRepository.findByOrderId(createdOrder.getId()).orElse(null);
        assertThat(invoice).isNotNull();
        String originalInvoiceNumber = invoice.getInvoiceNumber();

        // 4. Void the order
        VoidOrderRequest voidRequest = VoidOrderRequest.builder()
                .reason("Wrong customer")
                .notes("Delivery personnel mistakenly assigned order to Gokul Sweets")
                .build();

        OrderResponse voidedOrder = orderService.voidOrder(createdOrder.getId(), voidRequest, admin.getUsername());

        // 5. Verify order properties
        assertThat(voidedOrder.getOrderStatus()).isEqualTo(OrderStatus.VOIDED);
        assertThat(voidedOrder.getOrderNumber()).isEqualTo(originalOrderNumber);
        assertThat(voidedOrder.getVoidReason()).isEqualTo("Wrong customer");
        assertThat(voidedOrder.getVoidNotes()).isEqualTo("Delivery personnel mistakenly assigned order to Gokul Sweets");
        assertThat(voidedOrder.getVoidedByName()).isEqualTo(admin.getFullName());
        assertThat(voidedOrder.getVoidedAt()).isNotNull();
        assertThat(voidedOrder.isLocked()).isTrue();

        // 6. Verify inventory was restored back to 100
        Product productAfterVoid = productRepository.findById(standardProduct.getId()).orElseThrow();
        assertThat(productAfterVoid.getAvailableStock()).isEqualTo(100);

        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(standardProduct.getId());
        assertThat(adjustments).anyMatch(adj -> adj.getAdjustmentType() == StockAdjustmentType.IN && "ORDER_VOIDED".equals(adj.getReason()));

        // 7. Verify payment is NOT marked refunded (payment and allocation remain intact)
        Payment reloadedPayment = paymentRepository.findById(payment.getId()).orElseThrow();
        assertThat(reloadedPayment).isNotNull();
        assertThat(reloadedPayment.getTotalAmount()).isEqualByComparingTo(createdOrder.getTotalAmount());

        Order reloadedOrder = orderRepository.findById(createdOrder.getId()).orElseThrow();
        assertThat(reloadedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reloadedOrder.getOrderStatus()).isEqualTo(OrderStatus.VOIDED);

        // 8. Verify invoice remains traceable
        Invoice reloadedInvoice = invoiceRepository.findByOrderId(createdOrder.getId()).orElseThrow();
        assertThat(reloadedInvoice.getInvoiceNumber()).isEqualTo(originalInvoiceNumber);

        // 9. Centralized audit log verification
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndAction("ORDER", "ORDER_VOIDED");
        assertThat(auditLogs).isNotEmpty();
        assertThat(auditLogs.get(0).getEntityId()).isEqualTo(createdOrder.getId());
        assertThat(auditLogs.get(0).getPerformedBy().getId()).isEqualTo(admin.getId());
        assertThat(auditLogs.get(0).getRemarks()).contains("Wrong customer");
    }

    @Test
    @DisplayName("Feature 1: Voided orders are excluded from active sales calculations and customer ledger")
    void testVoidedOrderExcludedFromSalesCalculations() {
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now().plusDays(1);

        // Create Order 1 (valid)
        OrderResponse order1 = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(standardProduct.getId())
                        .quantity(5)
                        .build()))
                .build(), manager.getUsername());

        // Create Order 2 (will be voided)
        OrderResponse order2 = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(standardProduct.getId())
                        .quantity(3)
                        .build()))
                .build(), manager.getUsername());

        BigDecimal order1Total = order1.getTotalAmount();
        BigDecimal order2Total = order2.getTotalAmount();

        // Void Order 2
        orderService.voidOrder(order2.getId(), VoidOrderRequest.builder()
                .reason("Duplicate order")
                .notes("Accidentally entered twice")
                .build(), admin.getUsername());

        // Assert OrderRepository calculations exclude Order 2
        BigDecimal totalRevenue = orderRepository.sumRevenueBetween(start, end);
        assertThat(totalRevenue).isEqualByComparingTo(order1Total);

        long validOrdersCount = orderRepository.countValidOrdersBetween(start, end);
        assertThat(validOrdersCount).isEqualTo(1);

        // Customer Ledger calculation excludes Order 2
        var ledger = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledger.getTotalOrderAmount()).isEqualByComparingTo(order1Total);
    }

    @Test
    @DisplayName("Feature 1: Invalid order states cannot be voided")
    void testInvalidOrderStatesCannotBeVoided() {
        OrderResponse order = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(standardProduct.getId())
                        .quantity(2)
                        .build()))
                .build(), manager.getUsername());

        // Void the order
        orderService.voidOrder(order.getId(), VoidOrderRequest.builder()
                .reason("Wrong price")
                .build(), admin.getUsername());

        // Attempting to void again should fail
        assertThatThrownBy(() -> orderService.voidOrder(order.getId(), VoidOrderRequest.builder().reason("Other").build(), admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already voided");

        // Attempting to delete a voided order should fail
        assertThatThrownBy(() -> orderService.deleteOrder(order.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Verified or voided orders cannot be deleted");

        // Attempting to edit a voided order should fail
        assertThatThrownBy(() -> orderService.updateOrder(order.getId(), OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder().productId(standardProduct.getId()).quantity(1).build()))
                .build()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("voided");
    }

    @Test
    @DisplayName("Feature 2: Newly created unused product can be permanently deleted and checked")
    void testNewlyCreatedUnusedProductCanBePermanentlyDeleted() {
        ProductResponse testProduct = productService.createProduct(ProductRequest.builder()
                .name("Pepsi 500ml Test")
                .categoryId(beverageCategory.getId())
                .purchasePrice(new BigDecimal("30.00"))
                .sellingPrice(new BigDecimal("50.00"))
                .availableStock(50)
                .minimumStock(5)
                .unit(ProductUnit.BOTTLE)
                .trackInventory(true)
                .build());

        assertThat(testProduct).isNotNull();

        // 1. Check deletion status
        ProductDeletionCheckResponse check = productService.checkProductDeletion(testProduct.getId());
        assertThat(check.isCanDelete()).isTrue();
        assertThat(check.getOrderItemCount()).isEqualTo(0);
        assertThat(check.getStockAdjustmentCount()).isEqualTo(0);

        // 2. Perform permanent deletion
        productService.deleteProduct(testProduct.getId(), admin.getUsername());

        // 3. Confirm permanently removed from database
        assertThat(productRepository.findById(testProduct.getId())).isEmpty();

        // 4. Confirm no longer in dropdown
        var dropdown = productService.getProductDropdown();
        assertThat(dropdown).noneMatch(p -> p.getId().equals(testProduct.getId()));

        // 5. Confirm audit log recorded
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndAction("PRODUCT", "PRODUCT_DELETED");
        assertThat(auditLogs).isNotEmpty();
        assertThat(auditLogs.get(0).getEntityId()).isEqualTo(testProduct.getId());
        assertThat(auditLogs.get(0).getRemarks()).contains("Pepsi 500ml Test");
    }

    @Test
    @DisplayName("Feature 2: Product with existing order references cannot be hard-deleted")
    void testProductWithExistingOrderReferencesCannotBeHardDeleted() {
        // Create an order referencing standardProduct
        orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(manager.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(standardProduct.getId())
                        .quantity(2)
                        .build()))
                .build(), manager.getUsername());

        // 1. Check deletion status
        ProductDeletionCheckResponse check = productService.checkProductDeletion(standardProduct.getId());
        assertThat(check.isCanDelete()).isFalse();
        assertThat(check.getOrderItemCount()).isGreaterThan(0);
        assertThat(check.getMessage()).contains("cannot be permanently deleted");

        // 2. Attempt hard delete -> must throw IllegalStateException
        assertThatThrownBy(() -> productService.deleteProduct(standardProduct.getId(), admin.getUsername()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot be permanently deleted because it is used in existing orders");

        // 3. Confirm product still intact in database
        assertThat(productRepository.findById(standardProduct.getId())).isPresent();
    }

    @Test
    @WithMockUser(username = "delivery_user", roles = {"DELIVERY"})
    @DisplayName("Security: Unauthorized roles cannot void orders or delete products")
    void testUnauthorizedRolesPrevented() throws Exception {
        // Delivery user cannot void order
        mockMvc.perform(patch("/orders/1/void")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"Wrong customer\"}"))
                .andExpect(status().isForbidden());

        // Delivery user cannot check product deletion
        mockMvc.perform(get("/products/1/deletion-check"))
                .andExpect(status().isForbidden());

        // Delivery user cannot delete product
        mockMvc.perform(delete("/products/1"))
                .andExpect(status().isForbidden());
    }
}

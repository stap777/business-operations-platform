package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.entity.AuditLog;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
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
import com.asenterprises.bms.service.InvoiceService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.AfterEach;
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

@SpringBootTest
@ActiveProfiles("test")
public class AdminVerifyNullGeneratedByRegressionTest {

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
    private InvoiceService invoiceService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private BusinessSettingsService businessSettingsService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private User adminUser;
    private User managerUser;
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
                    .fullName("Regression Admin")
                    .username("reg_admin_" + uniqueSuffix)
                    .password("encoded_pass")
                    .phoneNumber(String.format("91%08d", uniqueSuffix))
                    .role(Role.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            managerUser = userRepository.save(User.builder()
                    .fullName("Regression Manager")
                    .username("reg_mgr_" + uniqueSuffix)
                    .password("encoded_pass")
                    .phoneNumber(String.format("92%08d", uniqueSuffix))
                    .role(Role.MANAGER)
                    .status(UserStatus.ACTIVE)
                    .firstLogin(false)
                    .build());

            customer = customerRepository.save(Customer.builder()
                    .customerCode(String.format("REG-%08d", uniqueSuffix))
                    .fullName("Regression Customer Co")
                    .phoneNumber(String.format("94%08d", uniqueSuffix))
                    .address("200 Test Warehouse Road")
                    .status(CustomerStatus.ACTIVE)
                    .build());

            Category category = categoryRepository.save(Category.builder()
                    .name("Reg Category " + uniqueSuffix)
                    .description("Category desc")
                    .status(CategoryStatus.ACTIVE)
                    .build());

            product = productRepository.save(Product.builder()
                    .name("Reg Product " + uniqueSuffix)
                    .category(category)
                    .unit(ProductUnit.PCS)
                    .sellingPrice(new BigDecimal("100.00"))
                    .purchasePrice(new BigDecimal("60.00"))
                    .availableStock(50)
                    .minimumStock(5)
                    .trackInventory(true)
                    .status(ProductStatus.ACTIVE)
                    .build());

            businessSettingsService.updateBusinessSettings(BusinessSettingsRequest.builder()
                    .businessName("A.S. Enterprises")
                    .phone("+91-9988776655")
                    .address("Main Warehouse")
                    .invoicePrefix("INV-REG")
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

    @Test
    @DisplayName("Regression: Admin Verify Order when Invoice.generatedBy is null succeeds without 500 NPE/LazyInitializationException")
    void testAdminVerifyWithNullGeneratedByInvoice() {
        // 1. Create order
        OrderResponse orderResp = orderService.createOrder(OrderRequest.builder()
                .customerId(customer.getId())
                .managerId(managerUser.getId())
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .build()))
                .notes("Regression order with null generatedBy")
                .build(), managerUser.getUsername());

        Long orderId = orderResp.getId();

        // 2. Pay order in full to satisfy PAID requirement
        paymentService.createPayment(PaymentRequest.builder()
                .customerId(customer.getId())
                .totalAmount(orderResp.getTotalAmount())
                .paymentMethod(PaymentMethod.CASH)
                .remarks("Full payment for regression order")
                .allocations(List.of(PaymentAllocationRequest.builder()
                        .orderId(orderId)
                        .allocatedAmount(orderResp.getTotalAmount())
                        .build()))
                .build(), adminUser.getUsername());

        // 3. Manually simulate legacy production state where generatedBy is NULL
        transactionTemplate.execute(status -> {
            Invoice inv = invoiceRepository.findByOrderId(orderId).orElseThrow();
            inv.setGeneratedBy(null);
            invoiceRepository.saveAndFlush(inv);
            return null;
        });

        // Verify initial stock before verification
        assertThat(productRepository.findById(product.getId()).orElseThrow().getAvailableStock()).isEqualTo(50);

        // 4. Admin verifies the order -> Must succeed without NPE
        InvoiceResponse verifiedInvoiceResponse = verificationService.verifyOrder(orderId, adminUser.getUsername());

        // 5. Assert DTO Response
        assertThat(verifiedInvoiceResponse).isNotNull();
        assertThat(verifiedInvoiceResponse.getGeneratedById()).isNull();
        assertThat(verifiedInvoiceResponse.getGeneratedByName()).isEqualTo("System");
        assertThat(verifiedInvoiceResponse.getOrderId()).isEqualTo(orderId);
        assertThat(verifiedInvoiceResponse.getInvoiceNumber()).isNotBlank();
        assertThat(verifiedInvoiceResponse.getItems()).hasSize(1);
        assertThat(verifiedInvoiceResponse.getItems().get(0).getQuantity()).isEqualTo(2);

        // 6. Assert Database State
        Order verifiedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(verifiedOrder.getOrderStatus()).isEqualTo(OrderStatus.VERIFIED);
        assertThat(verifiedOrder.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);

        // Inventory deducted exactly once (50 - 2 = 48)
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getAvailableStock()).isEqualTo(48);

        // Exactly one stock adjustment
        List<StockAdjustment> adjustments = stockAdjustmentRepository.findByProductId(product.getId());
        assertThat(adjustments).hasSize(1);
        assertThat(adjustments.get(0).getAdjustmentType()).isEqualTo(StockAdjustmentType.OUT);
        assertThat(adjustments.get(0).getQuantity()).isEqualTo(2);
        assertThat(adjustments.get(0).getReason()).isEqualTo("ORDER_FULFILLMENT");

        // Exactly one invoice
        List<Invoice> invoices = invoiceRepository.findAll().stream()
                .filter(i -> i.getOrder().getId().equals(orderId))
                .toList();
        assertThat(invoices).hasSize(1);

        // Audit log created
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndAction("ORDER", "ORDER_VERIFIED");
        assertThat(auditLogs).anyMatch(l -> l.getEntityId().equals(orderId));

        // 7. Verify invoice query methods with null generatedBy
        InvoiceResponse byIdResponse = invoiceService.getInvoiceById(invoices.get(0).getId());
        assertThat(byIdResponse.getGeneratedById()).isNull();
        assertThat(byIdResponse.getGeneratedByName()).isEqualTo("System");

        InvoiceResponse byOrderIdResponse = invoiceService.getInvoiceByOrderId(orderId);
        assertThat(byOrderIdResponse.getGeneratedById()).isNull();
        assertThat(byOrderIdResponse.getGeneratedByName()).isEqualTo("System");

        InvoiceResponse verifyServiceByIdResponse = verificationService.getInvoiceById(invoices.get(0).getId());
        assertThat(verifyServiceByIdResponse.getGeneratedById()).isNull();
        assertThat(verifyServiceByIdResponse.getGeneratedByName()).isEqualTo("System");
    }
}

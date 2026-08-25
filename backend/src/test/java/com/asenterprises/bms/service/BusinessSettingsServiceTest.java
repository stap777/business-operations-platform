package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.ResetWorkspaceRequest;
import com.asenterprises.bms.entity.*;
import com.asenterprises.bms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class BusinessSettingsServiceTest {

    @Autowired
    private BusinessSettingsService businessSettingsService;

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
    private OperatingExpenseRepository operatingExpenseRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private BusinessSettingsRepository businessSettingsRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User adminUser;
    private User managerUser;

    @BeforeEach
    void setUp() {
        // Clean database before test setup
        paymentAllocationRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        orderRepository.deleteAll();
        stockAdjustmentRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        customerRepository.deleteAll();
        couponRepository.deleteAll();
        operatingExpenseRepository.deleteAll();
        auditLogRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userSessionRepository.deleteAll();
        businessSettingsRepository.deleteAll();
        userRepository.deleteAll();

        // Create Admin User
        adminUser = userRepository.save(User.builder()
                .fullName("System Admin")
                .username("admin_reset_test")
                .password(passwordEncoder.encode("SecretPass123!"))
                .phoneNumber("9998887770")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        // Create Non-Admin User
        managerUser = userRepository.save(User.builder()
                .fullName("Branch Manager")
                .username("manager_test")
                .password(passwordEncoder.encode("ManagerPass123!"))
                .phoneNumber("9998887771")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        // Seed Business Settings
        businessSettingsRepository.save(BusinessSettings.builder()
                .businessName("A.S. Enterprises")
                .phone("+91-9876543210")
                .address("123 Test Street")
                .invoicePrefix("INV")
                .currency("INR")
                .logoUrl("http://example.com/logo.png")
                .defaultPaymentTerms("Net 30")
                .invoiceFooter("Thank you")
                .build());

        // Set Authentication Security Context
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                adminUser.getUsername(),
                null,
                java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("resetWorkspace - Successfully purges operational data via TRUNCATE CASCADE and preserves owner & settings")
    void testResetWorkspaceSuccess() {
        // 1. Seed Operational Data
        Customer customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-001")
                .fullName("Test Customer")
                .phoneNumber("9876543210")
                .address("123 Main Street")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Electronics")
                .status(CategoryStatus.ACTIVE)
                .build());

        Product product = productRepository.save(Product.builder()
                .name("Test Product")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("100.00"))
                .purchasePrice(new BigDecimal("50.00"))
                .availableStock(20)
                .minimumStock(5)
                .status(ProductStatus.ACTIVE)
                .build());

        Coupon coupon = couponRepository.save(Coupon.builder()
                .code("DISCOUNT10")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("10.00"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(10)
                .usedCount(0)
                .active(true)
                .build());

        Order order = Order.builder()
                .orderNumber("ORD-001")
                .customer(customer)
                .manager(adminUser)
                .orderStatus(OrderStatus.CREATED)
                .paymentStatus(PaymentStatus.PENDING)
                .deliveryStatus(DeliveryStatus.PENDING)
                .subtotal(new BigDecimal("100.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("100.00"))
                .build();
        orderRepository.save(order);

        stockAdjustmentRepository.save(StockAdjustment.builder()
                .product(product)
                .adjustmentType(StockAdjustmentType.IN)
                .quantity(10)
                .reason("Initial Stock")
                .adjustedBy(adminUser)
                .adjustmentDate(LocalDateTime.now())
                .build());

        operatingExpenseRepository.save(OperatingExpense.builder()
                .category("Office Rent")
                .description("Monthly office rental fee")
                .amount(new BigDecimal("5000.00"))
                .expenseDate(LocalDate.now())
                .createdBy(adminUser)
                .build());

        auditLogRepository.save(AuditLog.builder()
                .entityType("Product")
                .entityId(product.getId())
                .action("CREATE_PRODUCT")
                .performedBy(adminUser)
                .performedAt(LocalDateTime.now())
                .remarks("Created initial product")
                .build());

        // 2. Perform Workspace Reset
        ResetWorkspaceRequest request = ResetWorkspaceRequest.builder()
                .adminPassword("SecretPass123!")
                .confirmationText("DELETE MY WORKSPACE")
                .build();

        Map<String, Object> result = businessSettingsService.resetWorkspace(request);

        // 3. Verify Response Payload
        assertThat(result.get("message")).isEqualTo("Workspace reset completed successfully.");
        assertThat(result.get("preserved")).isNotNull();
        @SuppressWarnings("unchecked")
        Map<String, Object> preserved = (Map<String, Object>) result.get("preserved");
        assertThat(preserved.get("adminAccount")).isEqualTo(true);
        assertThat(preserved.get("businessSettings")).isEqualTo(true);

        // 4. Verify Operational Data Purged
        assertThat(orderRepository.count()).isEqualTo(0);
        assertThat(customerRepository.count()).isEqualTo(0);
        assertThat(productRepository.count()).isEqualTo(0);
        assertThat(categoryRepository.count()).isEqualTo(0);
        assertThat(couponRepository.count()).isEqualTo(0);
        assertThat(stockAdjustmentRepository.count()).isEqualTo(0);
        assertThat(operatingExpenseRepository.count()).isEqualTo(0);
        assertThat(auditLogRepository.count()).isEqualTo(0);
        assertThat(invoiceRepository.count()).isEqualTo(0);
        assertThat(paymentRepository.count()).isEqualTo(0);
        assertThat(paymentAllocationRepository.count()).isEqualTo(0);
        assertThat(userSessionRepository.count()).isEqualTo(0);

        // 5. Verify Non-Admin Users Removed and Owner Preserved
        assertThat(userRepository.count()).isEqualTo(1);
        User preservedUser = userRepository.findById(adminUser.getId()).orElse(null);
        assertThat(preservedUser).isNotNull();
        assertThat(preservedUser.getUsername()).isEqualTo("admin_reset_test");
        assertThat(userRepository.findByUsername("manager_test")).isEmpty();

        // 6. Verify Business Settings Preserved
        BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc().orElse(null);
        assertThat(settings).isNotNull();
        assertThat(settings.getBusinessName()).isEqualTo("A.S. Enterprises");
        assertThat(settings.getPhone()).isEqualTo("+91-9876543210");
        assertThat(settings.getLogoUrl()).isEqualTo("http://example.com/logo.png");

        // 7. Verify PK Sequence Restart / ID Generation
        Customer newCustomer = customerRepository.save(Customer.builder()
                .customerCode("CUST-NEW-1")
                .fullName("Fresh Customer")
                .phoneNumber("9111111111")
                .address("456 New Road")
                .status(CustomerStatus.ACTIVE)
                .build());
        assertThat(newCustomer.getId()).isNotNull();
    }

    @Test
    @DisplayName("resetWorkspace - Fails on invalid admin password")
    void testResetWorkspaceInvalidPassword() {
        ResetWorkspaceRequest request = ResetWorkspaceRequest.builder()
                .adminPassword("WrongPassword")
                .confirmationText("DELETE MY WORKSPACE")
                .build();

        assertThatThrownBy(() -> businessSettingsService.resetWorkspace(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid administrator password");
    }

    @Test
    @DisplayName("resetWorkspace - Fails on invalid confirmation phrase")
    void testResetWorkspaceInvalidConfirmationText() {
        ResetWorkspaceRequest request = ResetWorkspaceRequest.builder()
                .adminPassword("SecretPass123!")
                .confirmationText("delete workspace")
                .build();

        assertThatThrownBy(() -> businessSettingsService.resetWorkspace(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Confirmation phrase does not match 'DELETE MY WORKSPACE' exactly");
    }
}

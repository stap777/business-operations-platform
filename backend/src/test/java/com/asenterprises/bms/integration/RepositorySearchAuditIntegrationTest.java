package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.CouponResponse;
import com.asenterprises.bms.dto.CustomerResponse;
import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.dto.PaymentResponse;
import com.asenterprises.bms.dto.ProductResponse;
import com.asenterprises.bms.dto.UserResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.CategoryStatus;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.InvoiceItem;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Payment;
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
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.AdminUserService;
import com.asenterprises.bms.service.CouponService;
import com.asenterprises.bms.service.CustomerService;
import com.asenterprises.bms.service.InventoryReportService;
import com.asenterprises.bms.service.OrderService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.service.ProductService;
import com.asenterprises.bms.service.VerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class RepositorySearchAuditIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private InventoryReportService inventoryReportService;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private CouponService couponService;

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
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CouponRepository couponRepository;

    private User manager;
    private Customer customer;
    private Category category;
    private Product product;
    private Order order;
    private Invoice invoice;
    private Payment payment;
    private Coupon coupon;

    @BeforeEach
    void setUp() {
        manager = userRepository.save(User.builder()
                .fullName("Audit Manager")
                .username("audit_mgr_" + System.currentTimeMillis())
                .password("encoded_pass")
                .phoneNumber("9876500001")
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("AUDIT-01")
                .fullName("Audit Customer")
                .phoneNumber("9988770001")
                .address("Audit Address 123")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("Audit Category " + System.currentTimeMillis())
                .status(CategoryStatus.ACTIVE)
                .build());

        product = productRepository.save(Product.builder()
                .name("Audit Product Alpha")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("150.00"))
                .purchasePrice(new BigDecimal("90.00"))
                .availableStock(25)
                .minimumStock(5)
                .status(ProductStatus.ACTIVE)
                .trackInventory(true)
                .build());

        order = Order.builder()
                .orderNumber("AUDIT-ORD-101")
                .customer(customer)
                .manager(manager)
                .orderStatus(OrderStatus.VERIFIED)
                .paymentStatus(PaymentStatus.PARTIAL)
                .subtotal(new BigDecimal("150.00"))
                .totalAmount(new BigDecimal("150.00"))
                .build();

        OrderItem item = OrderItem.builder()
                .product(product)
                .quantity(1)
                .purchasePrice(new BigDecimal("90.00"))
                .sellingPrice(new BigDecimal("150.00"))
                .lineTotal(new BigDecimal("150.00"))
                .build();
        order.addItem(item);
        order = orderRepository.save(order);

        invoice = Invoice.builder()
                .invoiceNumber("AUDIT-INV-101")
                .order(order)
                .invoiceDate(LocalDateTime.now())
                .customerNameSnapshot(customer.getFullName())
                .customerPhoneSnapshot(customer.getPhone())
                .customerAddressSnapshot(customer.getAddress())
                .subtotal(new BigDecimal("150.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("150.00"))
                .paymentReceivedAtGeneration(BigDecimal.ZERO)
                .paymentStatus(PaymentStatus.PARTIAL)
                .generatedBy(manager)
                .build();

        InvoiceItem invItem = InvoiceItem.builder()
                .productNameSnapshot(product.getName())
                .quantity(1)
                .sellingPriceSnapshot(product.getSellingPrice())
                .lineTotal(new BigDecimal("150.00"))
                .build();
        invoice.addItem(invItem);
        invoice = invoiceRepository.save(invoice);

        payment = Payment.builder()
                .paymentNumber("AUDIT-PAY-101")
                .customer(customer)
                .receivedBy(manager)
                .paymentDate(LocalDateTime.now())
                .totalAmount(new BigDecimal("50.00"))
                .paymentMethod(PaymentMethod.CASH)
                .build();

        PaymentAllocation alloc = PaymentAllocation.builder()
                .order(order)
                .allocatedAmount(new BigDecimal("50.00"))
                .build();
        payment.addAllocation(alloc);
        payment = paymentRepository.save(payment);

        coupon = Coupon.builder()
                .code("AUDIT50")
                .description("Audit discount coupon")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(new BigDecimal("100.00"))
                .startDate(LocalDateTime.now().minusDays(5))
                .endDate(LocalDateTime.now().plusDays(30))
                .usageLimit(100)
                .usedCount(0)
                .active(true)
                .build();
        coupon = couponRepository.save(coupon);
    }

    // =========================================================================
    // 1-3. PRODUCT SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("1. Product search with no filters")
    void testProductSearchNoFilters() {
        Page<ProductResponse> result = productService.searchProducts(null, null, false, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("2. Product search with name filter")
    void testProductSearchWithName() {
        Page<ProductResponse> result = productService.searchProducts("Alpha", null, false, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
        assertThat(result.getContent().get(0).getName()).contains("Alpha");
    }

    @Test
    @DisplayName("3. Product search with null name filter")
    void testProductSearchWithNullName() {
        Page<ProductResponse> result = productService.searchProducts(null, category.getId(), false, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    // =========================================================================
    // 4-9. ORDER SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("4. Order search with no filters")
    void testOrderSearchNoFilters() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("5. Order search with order number")
    void testOrderSearchWithOrderNumber() {
        Page<OrderResponse> result = orderService.searchOrders("AUDIT-ORD-101", null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("6. Order search with null order number")
    void testOrderSearchWithNullOrderNumber() {
        Page<OrderResponse> result = orderService.searchOrders(null, customer.getId(), OrderStatus.VERIFIED, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("7. Order search with customer filter")
    void testOrderSearchWithCustomerFilter() {
        Page<OrderResponse> result = orderService.searchOrders(null, customer.getId(), null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("8. Order search with status filter")
    void testOrderSearchWithStatusFilter() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, OrderStatus.VERIFIED, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("9. Order search with date filters")
    void testOrderSearchWithDateFilters() {
        Page<OrderResponse> result = orderService.searchOrders(null, null, null, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    // =========================================================================
    // 10-11. INVENTORY REPORT TESTS
    // =========================================================================

    @Test
    @DisplayName("10. Inventory report with no filters")
    void testInventoryReportNoFilters() {
        InventoryReportResponse report = inventoryReportService.getInventoryReport();
        assertThat(report).isNotNull();
        assertThat(report.getTotalProducts()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("11. Inventory report valuation check")
    void testInventoryReportValuation() {
        InventoryReportResponse report = inventoryReportService.getInventoryReport();
        assertThat(report.getTotalInventoryValuation()).isNotNull();
    }

    // =========================================================================
    // 12. INVOICE SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("12a. Invoice search with no filters (null parameters)")
    void testInvoiceSearchNoFilters() {
        Page<InvoiceResponse> result = verificationService.searchInvoices(null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("12b. Invoice search with actual filter values")
    void testInvoiceSearchWithActualValues() {
        Page<InvoiceResponse> result = verificationService.searchInvoices("AUDIT-INV-101", LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    // =========================================================================
    // 13. PAYMENT SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("13a. Payment search with no filters (null parameters)")
    void testPaymentSearchNoFilters() {
        Page<PaymentResponse> result = paymentService.searchPayments(null, null, null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("13b. Payment search with actual filter values")
    void testPaymentSearchWithActualValues() {
        Page<PaymentResponse> result = paymentService.searchPayments("AUDIT-PAY-101", customer.getId(), PaymentMethod.CASH, LocalDate.now().minusDays(1), LocalDate.now().plusDays(1), PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    // =========================================================================
    // 14. CUSTOMER SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("14. Customer search with no filters")
    void testCustomerSearchNoFilters() {
        Page<CustomerResponse> result = customerService.searchCustomers(null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    // =========================================================================
    // 15. USER SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("15a. User search with no filters (null parameters)")
    void testUserSearchNoFilters() {
        Page<UserResponse> result = adminUserService.searchUsers(null, null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("15b. User search with actual filter values")
    void testUserSearchWithActualValues() {
        Page<UserResponse> result = adminUserService.searchUsers("audit_mgr", Role.MANAGER, UserStatus.ACTIVE, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    // =========================================================================
    // 16. COUPON SEARCH TESTS
    // =========================================================================

    @Test
    @DisplayName("16a. Coupon search with no filters (null parameters)")
    void testCouponSearchNoFilters() {
        Page<CouponResponse> result = couponService.searchCoupons(null, null, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("16b. Coupon search with actual filter values")
    void testCouponSearchWithActualValues() {
        Page<CouponResponse> result = couponService.searchCoupons("AUDIT50", true, PageRequest.of(0, 10));
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
    }
}

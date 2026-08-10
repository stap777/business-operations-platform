package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.SalesReportResponse;
import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Invoice;
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
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.InventoryReportService;
import com.asenterprises.bms.service.PaymentReportService;
import com.asenterprises.bms.service.PaymentService;
import com.asenterprises.bms.service.SalesReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test suite verifying Reporting P1 Fix Batch 2:
 * 1. AOV calculation excluding CANCELLED orders from denominator.
 * 2. Inventory Valuation using purchase cost (purchasePrice * availableStock).
 * 3. Historical COGS catalog purchase cost reporting.
 * 4. Period Outstanding derivation backed by PaymentAllocation.
 * 5. Payment allocation isolation across multiple customer orders.
 * 6. Order & Invoice payment status consistency (PENDING -> PARTIAL -> PAID).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ReportingP1FixBatch2Test {

    @Autowired
    private SalesReportService salesReportService;

    @Autowired
    private InventoryReportService inventoryReportService;

    @Autowired
    private PaymentReportService paymentReportService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    private Customer customer;
    private User admin;
    private Category category;

    @BeforeEach
    void setUp() {
        long seed = System.currentTimeMillis() % 1000000;
        admin = userRepository.save(User.builder()
                .fullName("P1 Admin")
                .username("admin_p1_" + seed)
                .password("encoded_pass")
                .phoneNumber("98888" + String.format("%05d", seed % 100000))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CP1-" + seed)
                .fullName("P1 Test Customer")
                .phoneNumber("97777" + String.format("%05d", seed % 100000))
                .address("P1 Address")
                .status(CustomerStatus.ACTIVE)
                .build());

        category = categoryRepository.save(Category.builder()
                .name("P1 Category " + seed)
                .description("Category for P1 tests")
                .build());
    }

    @Test
    @DisplayName("P1 Fix 1: AOV excludes CANCELLED orders from denominator population")
    void testAovExcludesCancelledOrders() {
        LocalDateTime date = LocalDateTime.of(2026, 8, 15, 10, 0);

        // Order A: ₹10,000 VERIFIED
        createOrder("ORD-AOV-1", customer, new BigDecimal("10000.00"), OrderStatus.VERIFIED, date);
        // Order B: ₹5,000 COMPLETED
        createOrder("ORD-AOV-2", customer, new BigDecimal("5000.00"), OrderStatus.COMPLETED, date);
        // Order C: ₹8,000 CANCELLED
        createOrder("ORD-AOV-3", customer, new BigDecimal("8000.00"), OrderStatus.CANCELLED, date);

        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);

        SalesReportResponse report = salesReportService.getSalesReport(startDate, endDate, "DAILY");

        assertThat(report).isNotNull();
        // Total Orders = 3 (includes CANCELLED)
        assertThat(report.getTotalOrders()).isEqualTo(3);
        // Total Revenue = 10,000 + 5,000 = 15,000 (excludes CANCELLED 8,000)
        assertThat(report.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("15000.00"));
        // Valid Orders = 2
        // AOV MUST BE 15,000 / 2 = 7,500.00 (NOT 15,000 / 3 = 5,000.00)
        assertThat(report.getAverageOrderValue()).isEqualByComparingTo(new BigDecimal("7500.00"));
    }

    @Test
    @DisplayName("P1 Fix 1 Edge Cases: AOV handles zero valid orders, single order, and only cancelled orders without division-by-zero")
    void testAovZeroAndEdgeCases() {
        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);

        // Case 1: Zero orders
        SalesReportResponse emptyReport = salesReportService.getSalesReport(startDate, endDate, "DAILY");
        assertThat(emptyReport.getAverageOrderValue()).isEqualByComparingTo(BigDecimal.ZERO);

        // Case 2: Only cancelled orders
        createOrder("ORD-CANCELLED-ONLY", customer, new BigDecimal("12000.00"), OrderStatus.CANCELLED, LocalDateTime.of(2026, 8, 10, 10, 0));
        SalesReportResponse cancelledOnlyReport = salesReportService.getSalesReport(startDate, endDate, "DAILY");
        assertThat(cancelledOnlyReport.getTotalOrders()).isEqualTo(1);
        assertThat(cancelledOnlyReport.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(cancelledOnlyReport.getAverageOrderValue()).isEqualByComparingTo(BigDecimal.ZERO);

        // Case 3: 1 valid order
        createOrder("ORD-VALID-SINGLE", customer, new BigDecimal("6400.00"), OrderStatus.VERIFIED, LocalDateTime.of(2026, 8, 12, 10, 0));
        SalesReportResponse singleValidReport = salesReportService.getSalesReport(startDate, endDate, "DAILY");
        assertThat(singleValidReport.getTotalOrders()).isEqualTo(2);
        assertThat(singleValidReport.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("6400.00"));
        assertThat(singleValidReport.getAverageOrderValue()).isEqualByComparingTo(new BigDecimal("6400.00"));
    }

    @Test
    @DisplayName("P1 Fix 2: Inventory Valuation uses Purchase Cost (purchasePrice * availableStock)")
    void testInventoryValuationUsesPurchasePrice() {
        BigDecimal baselineValuation = inventoryReportService.getInventoryReport().getTotalInventoryValuation();
        if (baselineValuation == null) {
            baselineValuation = BigDecimal.ZERO;
        }

        // Product 1: 100 stock @ selling ₹500, purchase ₹300 -> Cost = ₹30,000 (Selling = ₹50,000)
        createProduct("Prod 1", 100, new BigDecimal("500.00"), new BigDecimal("300.00"));

        // Product 2: 50 stock @ selling ₹200, purchase ₹100 -> Cost = ₹5,000 (Selling = ₹10,000)
        createProduct("Prod 2", 50, new BigDecimal("200.00"), new BigDecimal("100.00"));

        InventoryReportResponse report = inventoryReportService.getInventoryReport();

        assertThat(report).isNotNull();
        // Asset Cost Valuation MUST BE baseline + 30,000 + 5,000 = baseline + 35,000.00
        BigDecimal expectedValuation = baselineValuation.add(new BigDecimal("35000.00"));
        assertThat(report.getTotalInventoryValuation()).isEqualByComparingTo(expectedValuation);
    }

    @Test
    @DisplayName("P1 Fix 3: COGS calculates using product catalog purchase price")
    void testHistoricalCogsBehavior() {
        Product prod = createProduct("COGS Prod", 20, new BigDecimal("150.00"), new BigDecimal("100.00"));

        Order order = Order.builder()
                .orderNumber("ORD-COGS-1")
                .customer(customer)
                .manager(admin)
                .subtotal(new BigDecimal("1500.00"))
                .totalAmount(new BigDecimal("1500.00"))
                .orderStatus(OrderStatus.VERIFIED)
                .build();

        OrderItem item = OrderItem.builder()
                .order(order)
                .product(prod)
                .quantity(10)
                .purchasePrice(new BigDecimal("100.00"))
                .sellingPrice(new BigDecimal("150.00"))
                .lineTotal(new BigDecimal("1500.00"))
                .build();

        order.addItem(item);
        Order savedOrder = orderRepository.save(order);
        orderRepository.overrideCreatedAt(savedOrder.getId(), LocalDateTime.of(2026, 8, 10, 10, 0));

        SalesReportResponse report = salesReportService.getSalesReport(
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31), "DAILY");

        // COGS = 10 qty * ₹100 purchasePrice = ₹1,000.00
        assertThat(report.getTotalCogs()).isEqualByComparingTo(new BigDecimal("1000.00"));
        // Gross Profit = Revenue (1,500) - COGS (1,000) = 500.00
        assertThat(report.getGrossProfit()).isEqualByComparingTo(new BigDecimal("500.00"));
    }

    @Test
    @DisplayName("P1 Fix 4 & 5: Multiple credit orders calculate period outstanding and enforce allocation isolation")
    void testMultipleCustomerCreditOrdersOutstandingAndAllocationIsolation() {
        LocalDateTime date = LocalDateTime.of(2026, 8, 10, 10, 0);

        // Order A: ₹3,000
        Order orderA = createOrder("ORD-CREDIT-A", customer, new BigDecimal("3000.00"), OrderStatus.VERIFIED, date);
        // Order B: ₹2,000
        Order orderB = createOrder("ORD-CREDIT-B", customer, new BigDecimal("2000.00"), OrderStatus.VERIFIED, date);

        // Pay Order A fully (₹3,000) and Order B partially (₹500)
        PaymentRequest payRequest = PaymentRequest.builder()
                .customerId(customer.getId())
                .paymentDate(date)
                .paymentMethod(PaymentMethod.CASH)
                .totalAmount(new BigDecimal("3500.00"))
                .allocations(List.of(
                        PaymentAllocationRequest.builder().orderId(orderA.getId()).allocatedAmount(new BigDecimal("3000.00")).build(),
                        PaymentAllocationRequest.builder().orderId(orderB.getId()).allocatedAmount(new BigDecimal("500.00")).build()
                ))
                .build();

        paymentService.createPayment(payRequest, admin.getUsername());

        // Check Payment Report Outstanding
        PaymentReportResponse report = paymentReportService.getPaymentReport(
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31), null);

        // Order A: ₹3,000 - ₹3,000 = ₹0
        // Order B: ₹2,000 - ₹500 = ₹1,500
        // Expected Period Outstanding MUST BE ₹1,500.00
        assertThat(report.getTotalOutstandingAmount()).isEqualByComparingTo(new BigDecimal("1500.00"));

        // Verify isolation: Order A is fully paid (PAID), Order B is partially paid (PARTIAL)
        Order updatedA = orderRepository.findById(orderA.getId()).orElseThrow();
        Order updatedB = orderRepository.findById(orderB.getId()).orElseThrow();

        assertThat(updatedA.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(updatedA.getAmountReceived()).isEqualByComparingTo(new BigDecimal("3000.00"));

        assertThat(updatedB.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(updatedB.getAmountReceived()).isEqualByComparingTo(new BigDecimal("500.00"));
    }

    @Test
    @DisplayName("P1 Fix 6: Order and Invoice payment statuses remain strictly synchronized across payments (PENDING -> PARTIAL -> PAID)")
    void testInvoiceAndOrderPaymentStatusConsistency() {
        LocalDateTime date = LocalDateTime.of(2026, 8, 10, 10, 0);

        Order order = createOrder("ORD-INV-SYNC", customer, new BigDecimal("4000.00"), OrderStatus.VERIFIED, date);

        // Create Invoice associated with Order
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .invoiceNumber("INV-SYNC-001")
                .order(order)
                .customerNameSnapshot(customer.getFullName())
                .customerPhoneSnapshot(customer.getPhoneNumber())
                .customerAddressSnapshot(customer.getAddress())
                .subtotal(new BigDecimal("4000.00"))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("4000.00"))
                .paymentReceivedAtGeneration(BigDecimal.ZERO)
                .paymentStatus(PaymentStatus.PENDING)
                .generatedBy(admin)
                .invoiceDate(date)
                .build());

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(invoice.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);

        // 1. Partial Payment of ₹1,500
        PaymentRequest partialPay = PaymentRequest.builder()
                .customerId(customer.getId())
                .paymentDate(date)
                .paymentMethod(PaymentMethod.UPI)
                .totalAmount(new BigDecimal("1500.00"))
                .allocations(List.of(
                        PaymentAllocationRequest.builder().orderId(order.getId()).allocatedAmount(new BigDecimal("1500.00")).build()
                ))
                .build();

        paymentService.createPayment(partialPay, admin.getUsername());

        Order orderAfterPartial = orderRepository.findById(order.getId()).orElseThrow();
        Invoice invoiceAfterPartial = invoiceRepository.findById(invoice.getId()).orElseThrow();

        assertThat(orderAfterPartial.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);
        assertThat(invoiceAfterPartial.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIAL);

        // 2. Final Payment of ₹2,500
        PaymentRequest finalPay = PaymentRequest.builder()
                .customerId(customer.getId())
                .paymentDate(date)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .totalAmount(new BigDecimal("2500.00"))
                .allocations(List.of(
                        PaymentAllocationRequest.builder().orderId(order.getId()).allocatedAmount(new BigDecimal("2500.00")).build()
                ))
                .build();

        paymentService.createPayment(finalPay, admin.getUsername());

        Order orderAfterFinal = orderRepository.findById(order.getId()).orElseThrow();
        Invoice invoiceAfterFinal = invoiceRepository.findById(invoice.getId()).orElseThrow();

        assertThat(orderAfterFinal.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(invoiceAfterFinal.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    @DisplayName("P1 Fix 7: Sales Report supports WEEKLY and MONTHLY period breakdown granularity")
    void testWeeklyAndMonthlyReportGranularity() {
        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);

        createOrder("ORD-GRAN-1", customer, new BigDecimal("1000.00"), OrderStatus.VERIFIED, LocalDateTime.of(2026, 8, 2, 10, 0));
        createOrder("ORD-GRAN-2", customer, new BigDecimal("2000.00"), OrderStatus.VERIFIED, LocalDateTime.of(2026, 8, 15, 10, 0));

        // 1. Weekly breakdown for 31 days (Aug 1 to Aug 31) -> 5 weeks
        SalesReportResponse weeklyReport = salesReportService.getSalesReport(startDate, endDate, "WEEKLY");
        assertThat(weeklyReport.getGranularity()).isEqualTo("WEEKLY");
        assertThat(weeklyReport.getItems()).hasSize(5);
        assertThat(weeklyReport.getItems().get(0).getPeriodLabel()).contains("2026-08-01 to 2026-08-07");

        // 2. Monthly breakdown for August -> 1 month period
        SalesReportResponse monthlyReport = salesReportService.getSalesReport(startDate, endDate, "MONTHLY");
        assertThat(monthlyReport.getGranularity()).isEqualTo("MONTHLY");
        assertThat(monthlyReport.getItems()).hasSize(1);
        assertThat(monthlyReport.getItems().get(0).getPeriodLabel()).isEqualTo("2026-08");
    }

    private Order createOrder(String orderNumber, Customer cust, BigDecimal amount, OrderStatus status, LocalDateTime dateTime) {
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(cust)
                .manager(admin)
                .subtotal(amount)
                .totalAmount(amount)
                .amountReceived(BigDecimal.ZERO)
                .orderStatus(status)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        Order saved = orderRepository.save(order);
        orderRepository.overrideCreatedAt(saved.getId(), dateTime);
        saved.setCreatedAt(dateTime);
        return saved;
    }

    private Product createProduct(String name, Integer stock, BigDecimal sellingPrice, BigDecimal purchasePrice) {
        long nano = System.nanoTime() % 1000000;
        return productRepository.save(Product.builder()
                .name(name)
                .category(category)
                .purchasePrice(purchasePrice)
                .sellingPrice(sellingPrice)
                .availableStock(stock)
                .minimumStock(5)
                .unit(ProductUnit.PCS)
                .status(ProductStatus.ACTIVE)
                .build());
    }
}

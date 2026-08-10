package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.BatchInvoicePrintResponse;
import com.asenterprises.bms.dto.CouponReportResponse;
import com.asenterprises.bms.dto.CustomerLedgerResponse;
import com.asenterprises.bms.dto.DashboardResponse;
import com.asenterprises.bms.dto.DeliveryReportResponse;
import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.dto.SalesReportResponse;

import com.asenterprises.bms.entity.Category;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.ProductUnit;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CategoryRepository;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.CouponReportService;
import com.asenterprises.bms.service.CustomerLedgerService;
import com.asenterprises.bms.service.DashboardService;
import com.asenterprises.bms.service.DeliveryReportService;
import com.asenterprises.bms.service.ExportService;
import com.asenterprises.bms.service.InventoryReportService;
import com.asenterprises.bms.service.PaymentReportService;
import com.asenterprises.bms.service.PrintService;
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

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class Sprint9ReportingIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private SalesReportService salesReportService;

    @Autowired
    private PaymentReportService paymentReportService;

    @Autowired
    private CustomerLedgerService customerLedgerService;

    @Autowired
    private InventoryReportService inventoryReportService;

    @Autowired
    private CouponReportService couponReportService;

    @Autowired
    private DeliveryReportService deliveryReportService;

    @Autowired
    private ExportService exportService;

    @Autowired
    private PrintService printService;

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

    private Customer customer;

    @BeforeEach
    void setUp() {
        userRepository.save(User.builder()
                .fullName("Report Admin")
                .username("admin_rep")
                .password("encoded_pass")
                .phoneNumber("9876543215")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CUST-REP-001")
                .fullName("Report Customer Corp")
                .phoneNumber("8877665544")
                .address("Industrial Estate 1")
                .status(CustomerStatus.ACTIVE)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Report Category")
                .status(com.asenterprises.bms.entity.CategoryStatus.ACTIVE)
                .build());

        productRepository.save(Product.builder()
                .name("Report Product A")
                .category(category)
                .unit(ProductUnit.PCS)
                .sellingPrice(new BigDecimal("200.00"))
                .purchasePrice(new BigDecimal("120.00"))
                .availableStock(2) // Low stock threshold 5
                .minimumStock(5)
                .status(ProductStatus.ACTIVE)
                .build());

        couponRepository.save(Coupon.builder()
                .code("REP50")
                .description("Report Coupon")
                .discountType(DiscountType.FLAT)
                .discountValue(new BigDecimal("50.00"))
                .minimumOrderAmount(new BigDecimal("100.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(50)
                .usedCount(5)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Verify Dashboard Summary Metrics Generation")
    void testDashboardSummary() {
        DashboardResponse dashboard = dashboardService.getDashboardSummary();
        assertThat(dashboard).isNotNull();
        assertThat(dashboard.getTotalCustomers()).isGreaterThanOrEqualTo(1);
        assertThat(dashboard.getTotalProducts()).isGreaterThanOrEqualTo(1);
        assertThat(dashboard.getLowStockProductsCount()).isGreaterThanOrEqualTo(1);
        assertThat(dashboard.getTotalActiveCoupons()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Verify Sales, Payment, Inventory, Coupon, Delivery & Ledger Reports")
    void testReportingServices() {
        SalesReportResponse salesReport = salesReportService.getSalesReport(LocalDate.now().minusDays(7), LocalDate.now(), "DAILY");
        assertThat(salesReport).isNotNull();
        assertThat(salesReport.getItems()).isNotEmpty();
        assertThat(salesReport.getTotalCogs()).isNotNull();
        assertThat(salesReport.getGrossProfit()).isNotNull();
        assertThat(salesReport.getProfitMarginPercentage()).isNotNull();

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(LocalDate.now().minusDays(7), LocalDate.now(), null);
        assertThat(paymentReport).isNotNull();

        CustomerLedgerResponse ledger = customerLedgerService.getCustomerLedger(customer.getId());
        assertThat(ledger).isNotNull();
        assertThat(ledger.getCustomerName()).isEqualTo("Report Customer Corp");

        InventoryReportResponse inventoryReport = inventoryReportService.getInventoryReport();
        assertThat(inventoryReport).isNotNull();
        assertThat(inventoryReport.getTotalLowStockCount()).isGreaterThanOrEqualTo(1);

        CouponReportResponse couponReport = couponReportService.getCouponReport();
        assertThat(couponReport).isNotNull();
        assertThat(couponReport.getActiveCoupons()).isGreaterThanOrEqualTo(1);

        DeliveryReportResponse deliveryReport = deliveryReportService.getDeliveryReport();
        assertThat(deliveryReport).isNotNull();
    }

    @Test
    @DisplayName("Verify Export Engine and Batch Invoice Print Service")
    void testExportAndPrintServices() {
        byte[] csvBytes = exportService.exportReport("sales", "csv", LocalDate.now().minusDays(7), LocalDate.now(), null);
        assertThat(csvBytes).isNotEmpty();
        String csvString = new String(csvBytes);
        assertThat(csvString).contains("Total Orders");

        byte[] pdfBytes = exportService.exportReport("sales", "pdf", LocalDate.now().minusDays(7), LocalDate.now(), null);
        assertThat(pdfBytes).isNotEmpty();
        String pdfString = new String(pdfBytes);
        assertThat(pdfString).contains("PDF PLACEHOLDER");

        BatchInvoicePrintResponse batchPrint = printService.prepareBatchPrintQueue(LocalDate.now(), LocalDate.now(), null);
        assertThat(batchPrint).isNotNull();
    }
}

package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.DashboardResponse;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.dto.UnifiedReportResponse;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.OperatingExpense;
import com.asenterprises.bms.entity.Payment;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OperatingExpenseRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.DashboardService;
import com.asenterprises.bms.service.PaymentReportService;
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
public class CashInHandIntegrationTest {

    @Autowired
    private PaymentReportService paymentReportService;

    @Autowired
    private SalesReportService salesReportService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OperatingExpenseRepository operatingExpenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private User admin;
    private Customer customer;

    @BeforeEach
    void setUp() {
        long seed = System.currentTimeMillis() % 1000000;
        admin = userRepository.save(User.builder()
                .fullName("Cash Test Admin")
                .username("cash_admin_" + seed)
                .password("encoded_pass")
                .phoneNumber("93598" + String.format("%05d", seed % 100000))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CASH-" + seed)
                .fullName("Cash Test Customer")
                .phoneNumber("93599" + String.format("%05d", seed % 100000))
                .address("Industrial Zone 1")
                .status(CustomerStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("Requirement A: Cash in Hand when payments > OPEX")
    void testPaymentsGreaterThanOpex() {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        LocalDateTime date = LocalDateTime.of(2026, 7, 15, 10, 0);

        // Payments = 10,000.00
        paymentRepository.save(buildPayment(new BigDecimal("10000.00"), date));

        // OPEX = 3,000.00
        operatingExpenseRepository.save(buildExpense(new BigDecimal("3000.00"), date.toLocalDate()));

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(startDate, endDate, null);
        assertThat(paymentReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("10000.00"));
        assertThat(paymentReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(paymentReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("7000.00"));

        UnifiedReportResponse unifiedReport = salesReportService.getUnifiedReport(startDate, endDate, "DAILY");
        assertThat(unifiedReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("10000.00"));
        assertThat(unifiedReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(unifiedReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("7000.00"));
    }

    @Test
    @DisplayName("Requirement B: Cash in Hand when payments == OPEX")
    void testPaymentsEqualsOpex() {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        LocalDateTime date = LocalDateTime.of(2026, 7, 20, 12, 0);

        // Payments = 5,000.00
        paymentRepository.save(buildPayment(new BigDecimal("5000.00"), date));

        // OPEX = 5,000.00
        operatingExpenseRepository.save(buildExpense(new BigDecimal("5000.00"), date.toLocalDate()));

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(startDate, endDate, null);
        assertThat(paymentReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(paymentReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(paymentReport.getCashInHand()).isEqualByComparingTo(BigDecimal.ZERO);

        UnifiedReportResponse unifiedReport = salesReportService.getUnifiedReport(startDate, endDate, "DAILY");
        assertThat(unifiedReport.getCashInHand()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Requirement C: Cash in Hand when OPEX > payments (legitimately negative)")
    void testOpexGreaterThanPayments() {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        LocalDateTime date = LocalDateTime.of(2026, 7, 10, 14, 0);

        // Payments = 2,000.00
        paymentRepository.save(buildPayment(new BigDecimal("2000.00"), date));

        // OPEX = 6,000.00
        operatingExpenseRepository.save(buildExpense(new BigDecimal("6000.00"), date.toLocalDate()));

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(startDate, endDate, null);
        assertThat(paymentReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("2000.00"));
        assertThat(paymentReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("6000.00"));
        // Cash in Hand = 2,000 - 6,000 = -4,000.00
        assertThat(paymentReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("-4000.00"));

        UnifiedReportResponse unifiedReport = salesReportService.getUnifiedReport(startDate, endDate, "DAILY");
        assertThat(unifiedReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("-4000.00"));
    }

    @Test
    @DisplayName("Requirement D: Cash in Hand with zero payments")
    void testZeroPayments() {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        LocalDate expenseDate = LocalDate.of(2026, 7, 5);

        // OPEX = 1,500.00, Payments = 0
        operatingExpenseRepository.save(buildExpense(new BigDecimal("1500.00"), expenseDate));

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(startDate, endDate, null);
        assertThat(paymentReport.getTotalPaymentsReceived()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(paymentReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(paymentReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("-1500.00"));

        UnifiedReportResponse unifiedReport = salesReportService.getUnifiedReport(startDate, endDate, "DAILY");
        assertThat(unifiedReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("-1500.00"));
    }

    @Test
    @DisplayName("Requirement E: Cash in Hand with zero OPEX")
    void testZeroOpex() {
        LocalDate startDate = LocalDate.of(2026, 7, 1);
        LocalDate endDate = LocalDate.of(2026, 7, 31);
        LocalDateTime date = LocalDateTime.of(2026, 7, 12, 11, 0);

        // Payments = 4,000.00, OPEX = 0
        paymentRepository.save(buildPayment(new BigDecimal("4000.00"), date));

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(startDate, endDate, null);
        assertThat(paymentReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("4000.00"));
        assertThat(paymentReport.getTotalOperatingExpenses()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(paymentReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("4000.00"));

        UnifiedReportResponse unifiedReport = salesReportService.getUnifiedReport(startDate, endDate, "DAILY");
        assertThat(unifiedReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("4000.00"));
    }

    @Test
    @DisplayName("Requirement F: Date range filtering boundaries respected")
    void testDateRangeFiltering() {
        LocalDate targetStart = LocalDate.of(2026, 7, 10);
        LocalDate targetEnd = LocalDate.of(2026, 7, 20);

        // Out-of-range before (July 5)
        paymentRepository.save(buildPayment(new BigDecimal("1000.00"), LocalDateTime.of(2026, 7, 5, 10, 0)));
        operatingExpenseRepository.save(buildExpense(new BigDecimal("500.00"), LocalDate.of(2026, 7, 5)));

        // In-range (July 15)
        paymentRepository.save(buildPayment(new BigDecimal("8000.00"), LocalDateTime.of(2026, 7, 15, 10, 0)));
        operatingExpenseRepository.save(buildExpense(new BigDecimal("3000.00"), LocalDate.of(2026, 7, 15)));

        // Out-of-range after (July 25)
        paymentRepository.save(buildPayment(new BigDecimal("2000.00"), LocalDateTime.of(2026, 7, 25, 10, 0)));
        operatingExpenseRepository.save(buildExpense(new BigDecimal("1000.00"), LocalDate.of(2026, 7, 25)));

        PaymentReportResponse paymentReport = paymentReportService.getPaymentReport(targetStart, targetEnd, null);
        assertThat(paymentReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("8000.00"));
        assertThat(paymentReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(paymentReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("5000.00"));

        UnifiedReportResponse unifiedReport = salesReportService.getUnifiedReport(targetStart, targetEnd, "DAILY");
        assertThat(unifiedReport.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("8000.00"));
        assertThat(unifiedReport.getTotalOperatingExpenses()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(unifiedReport.getCashInHand()).isEqualByComparingTo(new BigDecimal("5000.00"));
    }

    @Test
    @DisplayName("Requirement G: Dashboard calculation equals today's payments minus today's OPEX")
    void testDashboardCashInHand() {
        LocalDateTime now = LocalDateTime.now();

        paymentRepository.save(buildPayment(new BigDecimal("12000.00"), now));
        operatingExpenseRepository.save(buildExpense(new BigDecimal("4500.00"), now.toLocalDate()));

        DashboardResponse dashboard = dashboardService.getDashboardSummary();
        assertThat(dashboard.getTodaysPaymentsReceived()).isGreaterThanOrEqualTo(new BigDecimal("12000.00"));
        assertThat(dashboard.getTodaysOperatingExpenses()).isGreaterThanOrEqualTo(new BigDecimal("4500.00"));
        assertThat(dashboard.getCashInHand()).isEqualTo(
                dashboard.getTodaysPaymentsReceived().subtract(dashboard.getTodaysOperatingExpenses())
        );
    }

    private Payment buildPayment(BigDecimal amount, LocalDateTime dateTime) {
        return Payment.builder()
                .paymentNumber("PAY-CASH-" + (System.nanoTime() % 100000000))
                .customer(customer)
                .receivedBy(admin)
                .paymentMethod(PaymentMethod.CASH)
                .totalAmount(amount)
                .paymentDate(dateTime)
                .createdAt(dateTime)
                .build();
    }

    private OperatingExpense buildExpense(BigDecimal amount, LocalDate date) {
        return OperatingExpense.builder()
                .category("TEST_OPEX")
                .description("Test expense for cash in hand verification")
                .amount(amount)
                .expenseDate(date)
                .createdBy(admin)
                .build();
    }
}

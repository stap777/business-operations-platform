package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.DeliveryReportResponse;
import com.asenterprises.bms.dto.PaymentMethodSummaryResponse;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Payment;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.DeliveryReportService;
import com.asenterprises.bms.service.PaymentReportService;
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
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression test suite verifying Reporting P0 Fix Batch 1:
 * 1. Delivery report date filtering accuracy.
 * 2. Payment method reporting > 1,000 record database aggregation.
 * 3. Payment transaction count removing 50 limit.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ReportingP0FixBatch1Test {

    @Autowired
    private DeliveryReportService deliveryReportService;

    @Autowired
    private PaymentReportService paymentReportService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private Customer customer;
    private User agent;

    @BeforeEach
    void setUp() {
        long seed = System.currentTimeMillis() % 1000000;
        agent = userRepository.save(User.builder()
                .fullName("Delivery Agent P0")
                .username("agent_p0_" + seed)
                .password("encoded_pass")
                .phoneNumber("90000" + String.format("%05d", seed % 100000))
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        customer = customerRepository.save(Customer.builder()
                .customerCode("CP0-" + seed)
                .fullName("P0 Test Customer")
                .phoneNumber("91111" + String.format("%05d", seed % 100000))
                .address("P0 Suite Address")
                .status(CustomerStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("P0 Fix 1: Delivery report correctly filters by requested date range")
    void testDeliveryReportDateRangeFiltering() {
        createOrderAt(LocalDateTime.of(2026, 8, 1, 10, 0), DeliveryStatus.DELIVERED);
        createOrderAt(LocalDateTime.of(2026, 8, 15, 14, 30), DeliveryStatus.DELIVERED);
        createOrderAt(LocalDateTime.of(2026, 8, 31, 23, 45), DeliveryStatus.DELIVERED);
        createOrderAt(LocalDateTime.of(2026, 9, 1, 8, 0), DeliveryStatus.DELIVERED);

        LocalDate startDate = LocalDate.of(2026, 8, 1);
        LocalDate endDate = LocalDate.of(2026, 8, 31);

        DeliveryReportResponse AugustReport = deliveryReportService.getDeliveryReport(startDate, endDate);

        assertThat(AugustReport).isNotNull();
        assertThat(AugustReport.getDeliveriesToday()).isEqualTo(3);
        assertThat(AugustReport.getCompletedDeliveries()).isEqualTo(3);

        DeliveryReportResponse singleDayReport = deliveryReportService.getDeliveryReport(
                LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 15));

        assertThat(singleDayReport).isNotNull();
        assertThat(singleDayReport.getDeliveriesToday()).isEqualTo(1);
    }

    @Test
    @DisplayName("P0 Fix 3: Payment method reporting includes 1,001st transaction in aggregate totals")
    void testPaymentMethodAggregationBeyond1000Records() {
        LocalDateTime testStart = LocalDateTime.of(2026, 8, 1, 0, 0);

        List<Payment> paymentList = new ArrayList<>();

        // 500 CASH payments @ ₹100
        for (int i = 0; i < 500; i++) {
            paymentList.add(buildPayment(PaymentMethod.CASH, new BigDecimal("100.00"), testStart.plusMinutes(i)));
        }
        // 400 UPI payments @ ₹100
        for (int i = 0; i < 400; i++) {
            paymentList.add(buildPayment(PaymentMethod.UPI, new BigDecimal("100.00"), testStart.plusMinutes(500 + i)));
        }
        // 100 BANK_TRANSFER payments @ ₹100
        for (int i = 0; i < 100; i++) {
            paymentList.add(buildPayment(PaymentMethod.BANK_TRANSFER, new BigDecimal("100.00"), testStart.plusMinutes(900 + i)));
        }
        // 1,001st BANK_TRANSFER payment @ ₹5,000 (The crucial 1,001st item)
        paymentList.add(buildPayment(PaymentMethod.BANK_TRANSFER, new BigDecimal("5000.00"), testStart.plusMinutes(1001)));

        paymentRepository.saveAll(paymentList);

        PaymentReportResponse report = paymentReportService.getPaymentReport(
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31), null);

        assertThat(report).isNotNull();
        // Total = (500*100) + (400*100) + (100*100) + 5000 = 50000 + 40000 + 10000 + 5000 = 105,000
        assertThat(report.getTotalPaymentsReceived()).isEqualByComparingTo(new BigDecimal("105000.00"));

        List<PaymentMethodSummaryResponse> summaries = report.getMethodSummaries();
        assertThat(summaries).isNotEmpty();

        PaymentMethodSummaryResponse cashSummary = findSummary(summaries, PaymentMethod.CASH);
        assertThat(cashSummary).isNotNull();
        assertThat(cashSummary.getTransactionCount()).isEqualTo(500);
        assertThat(cashSummary.getTotalAmount()).isEqualByComparingTo(new BigDecimal("50000.00"));

        PaymentMethodSummaryResponse upiSummary = findSummary(summaries, PaymentMethod.UPI);
        assertThat(upiSummary).isNotNull();
        assertThat(upiSummary.getTransactionCount()).isEqualTo(400);
        assertThat(upiSummary.getTotalAmount()).isEqualByComparingTo(new BigDecimal("40000.00"));

        PaymentMethodSummaryResponse bankSummary = findSummary(summaries, PaymentMethod.BANK_TRANSFER);
        assertThat(bankSummary).isNotNull();
        assertThat(bankSummary.getTransactionCount()).isEqualTo(101);
        assertThat(bankSummary.getTotalAmount()).isEqualByComparingTo(new BigDecimal("15000.00"));
    }

    @Test
    @DisplayName("P0 Fix 4: Transaction count reflects exact total count and removes 50 record cap")
    void testTransactionCountExact() {
        LocalDateTime testStart = LocalDateTime.of(2026, 8, 10, 0, 0);

        // Verify 0 transactions count
        PaymentReportResponse emptyReport = paymentReportService.getPaymentReport(
                LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 10), null);
        assertThat(emptyReport.getTotalTransactions()).isEqualTo(0);

        // Create 100 payments
        List<Payment> paymentList = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            paymentList.add(buildPayment(PaymentMethod.CASH, new BigDecimal("250.00"), testStart.plusMinutes(i)));
        }
        paymentRepository.saveAll(paymentList);

        PaymentReportResponse hundredReport = paymentReportService.getPaymentReport(
                LocalDate.of(2026, 8, 10), LocalDate.of(2026, 8, 10), null);

        assertThat(hundredReport.getTotalTransactions()).isEqualTo(100);
    }

    private Order createOrderAt(LocalDateTime dateTime, DeliveryStatus deliveryStatus) {
        Order order = Order.builder()
                .orderNumber("OP0-" + (System.nanoTime() % 100000000))
                .customer(customer)
                .manager(agent)
                .deliveryPerson(agent)
                .subtotal(new BigDecimal("500.00"))
                .totalAmount(new BigDecimal("500.00"))
                .orderStatus(OrderStatus.DELIVERED)
                .deliveryStatus(deliveryStatus)
                .build();
        Order saved = orderRepository.save(order);
        orderRepository.overrideCreatedAt(saved.getId(), dateTime);
        saved.setCreatedAt(dateTime);
        return saved;
    }

    private Payment buildPayment(PaymentMethod method, BigDecimal amount, LocalDateTime dateTime) {
        return Payment.builder()
                .paymentNumber("PP0-" + (System.nanoTime() % 100000000))
                .customer(customer)
                .receivedBy(agent)
                .paymentMethod(method)
                .totalAmount(amount)
                .paymentDate(dateTime)
                .createdAt(dateTime)
                .build();
    }

    private PaymentMethodSummaryResponse findSummary(List<PaymentMethodSummaryResponse> list, PaymentMethod method) {
        return list.stream()
                .filter(s -> s.getPaymentMethod() == method)
                .findFirst()
                .orElse(null);
    }
}

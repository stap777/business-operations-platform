package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.DashboardResponse;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Service aggregating high-level real-time operational and financial metrics for the Business Dashboard.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardSummary() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long todaysOrders = orderRepository.countOrdersBetween(startOfDay, endOfDay);
        BigDecimal todaysRevenue = orderRepository.sumRevenueBetween(startOfDay, endOfDay);
        if (todaysRevenue == null) {
            todaysRevenue = BigDecimal.ZERO;
        }

        BigDecimal todaysPaymentsReceived = paymentRepository.sumPaymentsBetween(startOfDay, endOfDay);
        if (todaysPaymentsReceived == null) {
            todaysPaymentsReceived = BigDecimal.ZERO;
        }

        BigDecimal todaysOutstandingAmount = todaysRevenue.subtract(todaysPaymentsReceived);
        if (todaysOutstandingAmount.compareTo(BigDecimal.ZERO) < 0) {
            todaysOutstandingAmount = BigDecimal.ZERO;
        }

        long pendingDeliveries = orderRepository.countDeliveriesPendingBetween(startOfDay, endOfDay);
        long completedDeliveries = orderRepository.countDeliveriesCompletedBetween(startOfDay, endOfDay);
        long verifiedOrders = orderRepository.countOrdersBetweenAndStatus(startOfDay, endOfDay, OrderStatus.VERIFIED);
        long generatedInvoices = invoiceRepository.countInvoicesForDate(startOfDay, endOfDay);

        long lowStockCount = productRepository.countLowStockProducts();
        long totalCustomers = customerRepository.count();
        long totalProducts = productRepository.count();
        long totalActiveCoupons = couponRepository.countByActiveTrue();

        log.info("Aggregated dashboard metrics for date {}", LocalDate.now());

        return DashboardResponse.builder()
                .todaysOrders(todaysOrders)
                .todaysRevenue(todaysRevenue)
                .todaysPaymentsReceived(todaysPaymentsReceived)
                .todaysOutstandingAmount(todaysOutstandingAmount)
                .todaysDeliveriesPending(pendingDeliveries)
                .todaysDeliveriesCompleted(completedDeliveries)
                .todaysVerifiedOrders(verifiedOrders)
                .todaysGeneratedInvoices(generatedInvoices)
                .lowStockProductsCount(lowStockCount)
                .totalCustomers(totalCustomers)
                .totalProducts(totalProducts)
                .totalActiveCoupons(totalActiveCoupons)
                .build();
    }
}

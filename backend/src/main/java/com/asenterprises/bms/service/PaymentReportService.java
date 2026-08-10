package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.PaymentMethodSummaryResponse;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.dto.PaymentResponse;
import com.asenterprises.bms.entity.PaymentMethod;

import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service managing financial collection analytics, payment method breakdowns, and outstanding balance tracking.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentReportService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;

    @Transactional(readOnly = true)
    public PaymentReportResponse getPaymentReport(LocalDate startDate, LocalDate endDate, PaymentMethod paymentMethod) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        BigDecimal totalPayments = paymentRepository.sumPaymentsBetween(startDateTime, endDateTime);
        if (totalPayments == null) totalPayments = BigDecimal.ZERO;

        BigDecimal totalRevenue = orderRepository.sumRevenueBetween(startDateTime, endDateTime);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        BigDecimal outstandingAmount = totalRevenue.subtract(totalPayments);
        if (outstandingAmount.compareTo(BigDecimal.ZERO) < 0) {
            outstandingAmount = BigDecimal.ZERO;
        }

        List<PaymentResponse> recentPayments = paymentService.searchPayments(null, null, paymentMethod, start, end, Pageable.ofSize(50))
                .getContent();

        long totalTransactions = recentPayments.size();

        List<PaymentMethodSummaryResponse> methodSummaries = new ArrayList<>();
        for (PaymentMethod method : PaymentMethod.values()) {
            List<PaymentResponse> methodPayments = paymentService.searchPayments(null, null, method, start, end, Pageable.ofSize(1000))
                    .getContent();
            BigDecimal methodTotal = methodPayments.stream()
                    .map(PaymentResponse::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (methodPayments.size() > 0) {
                methodSummaries.add(PaymentMethodSummaryResponse.builder()
                        .paymentMethod(method)
                        .transactionCount(methodPayments.size())
                        .totalAmount(methodTotal)
                        .build());
            }
        }

        log.info("Generated payment report from {} to {}", start, end);

        return PaymentReportResponse.builder()
                .totalPaymentsReceived(totalPayments)
                .totalOutstandingAmount(outstandingAmount)
                .totalTransactions(totalTransactions)
                .methodSummaries(methodSummaries)
                .recentPayments(recentPayments)
                .build();
    }
}

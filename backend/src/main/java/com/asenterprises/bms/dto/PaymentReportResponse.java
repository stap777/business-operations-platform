package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated response DTO for payment collection metrics, method breakdowns, and outstanding customer balances.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReportResponse {

    private BigDecimal totalPaymentsReceived;
    private BigDecimal totalOutstandingAmount;
    private long totalTransactions;
    private List<PaymentMethodSummaryResponse> methodSummaries;
    private List<PaymentResponse> recentPayments;
}

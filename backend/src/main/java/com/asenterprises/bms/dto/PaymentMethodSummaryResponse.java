package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Breakdown DTO summarizing total payment amounts by payment method.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodSummaryResponse {

    private PaymentMethod paymentMethod;
    private long transactionCount;
    private BigDecimal totalAmount;
}

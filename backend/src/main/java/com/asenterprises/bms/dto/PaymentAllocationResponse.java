package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO representing an allocation detail of a payment to an order.
 * Exposes dynamic outstanding balances before and after allocation for UI display without duplicating database values.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocationResponse {

    private Long id;
    private Long orderId;
    private String orderNumber;
    private BigDecimal allocatedAmount;

    /** Dynamic field: Order outstanding balance before applying this allocation */
    private BigDecimal outstandingBefore;

    /** Dynamic field: Order outstanding balance after applying this allocation */
    private BigDecimal outstandingAfter;
}

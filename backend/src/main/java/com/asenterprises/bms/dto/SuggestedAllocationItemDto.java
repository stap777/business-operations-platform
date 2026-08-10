package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Item level DTO for suggested allocation on an individual order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedAllocationItemDto {

    private Long orderId;
    private String orderNumber;
    private LocalDateTime orderDate;
    private BigDecimal orderTotalAmount;
    private BigDecimal alreadyPaidAmount;
    private BigDecimal outstandingAmount;
    private BigDecimal suggestedAllocationAmount;
}

package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Breakdown DTO representing sales metric aggregates for a specific time period (day, week, or month).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesPeriodItemResponse {

    private String periodLabel;
    private long totalOrders;
    private BigDecimal revenue;
    private BigDecimal discountGiven;
    private BigDecimal averageOrderValue;
    private BigDecimal cogs;
    private BigDecimal grossProfit;
    private BigDecimal profitMarginPercentage;
    private long completedOrders;
    private long cancelledOrders;
}

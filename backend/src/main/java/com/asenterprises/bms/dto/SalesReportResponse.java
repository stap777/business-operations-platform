package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated sales report response including total metrics and periodic breakdown items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReportResponse {

    private String granularity;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal totalDiscountGiven;
    private BigDecimal averageOrderValue;
    private BigDecimal totalCogs;
    private BigDecimal grossProfit;
    private BigDecimal profitMarginPercentage;
    private long completedOrders;
    private long cancelledOrders;
    private Boolean cogsIncomplete;
    private List<SalesPeriodItemResponse> items;
}

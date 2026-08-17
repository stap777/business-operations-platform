package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedReportResponse {

    private String granularity;
    private String startDate;
    private String endDate;

    // Sales Overview
    private long totalOrders;
    private long validOrders;
    private long completedOrders;
    private long cancelledOrders;

    // Financial Metrics
    private BigDecimal totalRevenue;
    private BigDecimal totalDiscountGiven;
    private BigDecimal averageOrderValue;
    private BigDecimal totalCogs;
    private BigDecimal grossProfit;
    private BigDecimal grossMarginPercentage;

    // Operating Expenses & Net Metrics
    private BigDecimal totalOperatingExpenses;
    private BigDecimal netProfit;
    private BigDecimal netMarginPercentage;

    private boolean cogsIncomplete;

    // Period breakdown
    private List<SalesPeriodItemResponse> periodItems;
}

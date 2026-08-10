package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single aggregated DTO response providing high-level operational and financial KPIs for the Business Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private long todaysOrders;
    private BigDecimal todaysRevenue;
    private BigDecimal todaysPaymentsReceived;
    private BigDecimal todaysOutstandingAmount;
    private long todaysDeliveriesPending;
    private long todaysDeliveriesCompleted;
    private long todaysVerifiedOrders;
    private long todaysGeneratedInvoices;
    private long lowStockProductsCount;
    private long totalCustomers;
    private long totalProducts;
    private long totalActiveCoupons;
}

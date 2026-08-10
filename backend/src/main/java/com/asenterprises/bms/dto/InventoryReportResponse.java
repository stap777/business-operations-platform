package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated response DTO for inventory valuation, low stock, out of stock, and stock adjustment stats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReportResponse {

    private long totalProducts;
    private long totalLowStockCount;
    private long totalOutOfStockCount;
    private BigDecimal totalInventoryValuation;
    private List<ProductResponse> lowStockProducts;
    private List<ProductResponse> outOfStockProducts;
    private List<StockAdjustmentResponse> recentAdjustments;
}

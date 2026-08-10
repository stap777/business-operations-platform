package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.StockAdjustmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Outbound response DTO for stock adjustment audit log entries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentResponse {

    private Long id;
    private Long productId;
    private String productName;
    private StockAdjustmentType adjustmentType;
    private Integer quantity;
    private String reason;
    private String referenceNumber;
    private Long adjustedById;
    private String adjustedByName;
    private LocalDateTime adjustmentDate;
    private LocalDateTime createdAt;
}

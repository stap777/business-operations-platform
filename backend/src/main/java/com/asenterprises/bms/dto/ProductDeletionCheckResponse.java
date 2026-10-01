package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDeletionCheckResponse {

    private Long productId;
    private String productName;
    private boolean canDelete;
    private long orderItemCount;
    private long stockAdjustmentCount;
    private String message;
}

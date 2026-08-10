package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Outbound DTO representing individual invoice line items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemResponse {

    private Long id;
    private String productNameSnapshot;
    private Integer quantity;
    private BigDecimal sellingPriceSnapshot;
    private BigDecimal lineTotal;
}

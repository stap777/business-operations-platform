package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Line item payload formatted for invoice printing.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrintableInvoiceItemDto {

    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}

package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.ProductUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Lightweight Data Transfer Object for populating product selection dropdowns in sales/orders.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDropdownResponse {

    private Long id;
    private String name;
    private BigDecimal sellingPrice;
    private Integer availableStock;
    private ProductUnit unit;
}

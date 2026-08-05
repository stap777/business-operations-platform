package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.ProductUnit;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Data Transfer Object for creating and updating product details.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.0", message = "Purchase price must be non-negative")
    private BigDecimal purchasePrice;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.0", message = "Selling price must be non-negative")
    private BigDecimal sellingPrice;

    @NotNull(message = "Available stock is required")
    @Min(value = 0, message = "Available stock must be non-negative")
    private Integer availableStock;

    @NotNull(message = "Minimum stock is required")
    @Min(value = 0, message = "Minimum stock must be non-negative")
    private Integer minimumStock;

    @NotNull(message = "Product unit is required")
    private ProductUnit unit;

    @NotNull(message = "Track inventory flag is required")
    @Builder.Default
    private Boolean trackInventory = true;
}

package com.asenterprises.bms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

/**
 * Data Transfer Object for creating a new sales order.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Manager ID is required")
    private Long managerId;

    private Long deliveryPersonId;

    @NotEmpty(message = "Order must contain at least one line item")
    @Valid
    private List<OrderItemRequest> items;

    @DecimalMin(value = "0.0", message = "Discount amount must be greater than or equal to 0")
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Size(max = 500, message = "Delivery instructions cannot exceed 500 characters")
    private String deliveryInstructions;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}

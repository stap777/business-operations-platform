package com.asenterprises.bms.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Data Transfer Object for validating a coupon code against an order subtotal on the backend.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @DecimalMin(value = "0.0", message = "Order subtotal must be greater than or equal to 0")
    private BigDecimal subtotal;
}

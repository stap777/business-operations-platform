package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request payload for creating a new payment and allocating funds to orders.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private LocalDateTime paymentDate;

    @NotNull(message = "Total payment amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    private BigDecimal totalAmount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private java.time.LocalDate chequeDate;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    private String remarks;

    @NotEmpty(message = "Payment must have at least one order allocation")
    @Valid
    private List<PaymentAllocationRequest> allocations;
}

package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO for recording payment collection details during order delivery completion.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPaymentRequest {

    @NotNull(message = "Amount received is required")
    @DecimalMin(value = "0.0", message = "Amount received must be greater than or equal to 0")
    private BigDecimal amountReceived;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
}

package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO representing payment details and allocated order breakdowns.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private String paymentNumber;
    private Long customerId;
    private String customerName;
    private Long receivedById;
    private String receivedByName;
    private LocalDateTime paymentDate;
    private BigDecimal totalAmount;
    private PaymentMethod paymentMethod;
    private java.time.LocalDate chequeDate;
    private String remarks;
    private List<PaymentAllocationResponse> allocations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Outbound DTO representing orders that are DELIVERED and awaiting admin verification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingVerificationResponse {

    private Long orderId;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long deliveryPersonId;
    private String deliveryPersonName;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private DeliveryStatus deliveryStatus;
    private Integer itemCount;
    private LocalDateTime deliveredAt;
}

package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Outbound DTO representing verified invoice details and line items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private Long orderId;
    private String orderNumber;
    private LocalDateTime invoiceDate;
    private String customerNameSnapshot;
    private String customerPhoneSnapshot;
    private String customerAddressSnapshot;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private BigDecimal paymentReceivedAtGeneration;
    private BigDecimal paidAmount;
    private BigDecimal creditRemaining;
    private String paymentMethod;
    private String logoUrl;
    private String enterpriseName;
    private String enterpriseAddress;
    private String enterprisePhone;
    private String invoiceFooter;
    private Long generatedById;
    private String generatedByName;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdAt;
}

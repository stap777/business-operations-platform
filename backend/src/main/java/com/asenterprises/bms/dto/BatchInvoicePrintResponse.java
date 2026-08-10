package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Aggregated print payload DTO containing printable invoices ready for batch document rendering.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchInvoicePrintResponse {

    private int totalInvoices;
    private LocalDateTime generatedAt;
    private List<PrintableInvoiceData> invoices;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrintableInvoiceData {
        private String invoiceNumber;
        private String orderNumber;
        private LocalDateTime invoiceDate;
        private String enterpriseName;
        private String enterpriseAddress;
        private String enterprisePhone;
        private String customerName;
        private String customerPhone;
        private String customerAddress;
        private BigDecimal subtotal;
        private BigDecimal discountAmount;
        private BigDecimal totalAmount;
        private String paymentStatus;
        private String invoiceFooter;
        private List<PrintableInvoiceItemDto> items;
    }
}

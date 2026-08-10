package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Outbound response DTO for global business settings details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessSettingsResponse {

    private Long id;
    private String businessName;
    private String phone;
    private String address;
    private String invoicePrefix;
    private String currency;
    private String logoUrl;
    private String defaultPaymentTerms;
    private String invoiceFooter;
    private LocalDateTime updatedAt;
}

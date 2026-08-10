package com.asenterprises.bms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Inbound request payload for updating global business settings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessSettingsRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name cannot exceed 150 characters")
    private String businessName;

    @NotBlank(message = "Phone is required")
    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    private String phone;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @NotBlank(message = "Invoice prefix is required")
    @Size(max = 15, message = "Invoice prefix cannot exceed 15 characters")
    private String invoicePrefix;

    @NotBlank(message = "Currency is required")
    @Size(max = 10, message = "Currency cannot exceed 10 characters")
    private String currency;

    @Size(max = 500, message = "Logo URL cannot exceed 500 characters")
    private String logoUrl;

    @Size(max = 500, message = "Default payment terms cannot exceed 500 characters")
    private String defaultPaymentTerms;

    @Size(max = 500, message = "Invoice footer cannot exceed 500 characters")
    private String invoiceFooter;
}

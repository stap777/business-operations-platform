package com.asenterprises.bms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

/**
 * BusinessSettings entity storing global enterprise settings, branding, and billing terms.
 */
@Entity
@Table(name = "business_settings")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class BusinessSettings extends BaseEntity {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name cannot exceed 150 characters")
    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @NotBlank(message = "Phone is required")
    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @NotBlank(message = "Invoice prefix is required")
    @Size(max = 15, message = "Invoice prefix cannot exceed 15 characters")
    @Column(name = "invoice_prefix", nullable = false, length = 15)
    private String invoicePrefix;

    @NotBlank(message = "Currency is required")
    @Size(max = 10, message = "Currency cannot exceed 10 characters")
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Size(max = 500, message = "Logo URL cannot exceed 500 characters")
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @jakarta.persistence.Lob
    @Column(name = "logo_data")
    private byte[] logoData;

    @Column(name = "logo_content_type", length = 100)
    private String logoContentType;

    @Size(max = 500, message = "Default payment terms cannot exceed 500 characters")
    @Column(name = "default_payment_terms", length = 500)
    private String defaultPaymentTerms;

    @Size(max = 500, message = "Invoice footer cannot exceed 500 characters")
    @Column(name = "invoice_footer", length = 500)
    private String invoiceFooter;
}

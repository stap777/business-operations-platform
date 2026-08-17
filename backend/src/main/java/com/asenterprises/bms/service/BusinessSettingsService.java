package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.entity.BusinessSettings;
import com.asenterprises.bms.repository.BusinessSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing singleton global business settings, enterprise metadata, and invoicing terms.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessSettingsService {

    private final BusinessSettingsRepository businessSettingsRepository;

    @Transactional
    public BusinessSettingsResponse getBusinessSettings() {
        BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::seedDefaultBusinessSettings);

        return mapToResponse(settings);
    }

    @Transactional
    public BusinessSettingsResponse updateBusinessSettings(BusinessSettingsRequest request) {
        BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::seedDefaultBusinessSettings);

        settings.setBusinessName(request.getBusinessName().trim());
        settings.setPhone(request.getPhone().trim());
        settings.setAddress(request.getAddress().trim());
        settings.setInvoicePrefix(request.getInvoicePrefix().trim());
        settings.setCurrency(request.getCurrency().trim());
        settings.setLogoUrl(trim(request.getLogoUrl()));
        settings.setDefaultPaymentTerms(trim(request.getDefaultPaymentTerms()));
        settings.setInvoiceFooter(trim(request.getInvoiceFooter()));

        BusinessSettings updatedSettings = businessSettingsRepository.save(settings);
        log.info("Updated global business settings for enterprise: {}", updatedSettings.getBusinessName());
        return mapToResponse(updatedSettings);
    }

    @Transactional
    public BusinessSettingsResponse uploadLogo(org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Logo file cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/"))) {
            throw new IllegalArgumentException("Uploaded file must be a valid image (PNG, JPEG, WEBP)");
        }

        try {
            String uploadDirStr = "./uploads/logos";
            java.io.File uploadDir = new java.io.File(uploadDirStr);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = ".png";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = "company_logo_" + System.currentTimeMillis() + extension;
            java.io.File destFile = new java.io.File(uploadDir, filename);
            file.transferTo(destFile);

            String logoUrl = "/uploads/logos/" + filename;

            BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                    .orElseGet(this::seedDefaultBusinessSettings);
            settings.setLogoUrl(logoUrl);

            BusinessSettings updated = businessSettingsRepository.save(settings);
            log.info("Uploaded new company logo: {}", logoUrl);
            return mapToResponse(updated);
        } catch (java.io.IOException e) {
            log.error("Failed to save logo file: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to save company logo image", e);
        }
    }

    @Transactional
    public BusinessSettingsResponse removeLogo() {
        BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::seedDefaultBusinessSettings);
        settings.setLogoUrl(null);
        BusinessSettings updated = businessSettingsRepository.save(settings);
        log.info("Removed company logo");
        return mapToResponse(updated);
    }

    private synchronized BusinessSettings seedDefaultBusinessSettings() {
        if (businessSettingsRepository.count() > 0) {
            return businessSettingsRepository.findFirstByOrderByIdAsc()
                    .orElseThrow(() -> new IllegalStateException("Business settings record exists but could not be retrieved"));
        }

        log.info("Seeding default singleton BusinessSettings record...");
        BusinessSettings defaultSettings = BusinessSettings.builder()
                .businessName("A.S. Enterprises")
                .phone("+91-9876543210")
                .address("123 Business Park, Main Street, Industrial Zone")
                .invoicePrefix("INV")
                .currency("INR")
                .logoUrl("https://asenterprises.com/logo.png")
                .defaultPaymentTerms("Payment due within 30 days of invoice issuance.")
                .invoiceFooter("Thank you for your business! For queries, contact support@asenterprises.com")
                .build();

        return businessSettingsRepository.save(defaultSettings);
    }

    private String trim(String input) {
        return input != null ? input.trim() : null;
    }

    public BusinessSettingsResponse mapToResponse(BusinessSettings settings) {
        return BusinessSettingsResponse.builder()
                .id(settings.getId())
                .businessName(settings.getBusinessName())
                .phone(settings.getPhone())
                .address(settings.getAddress())
                .invoicePrefix(settings.getInvoicePrefix())
                .currency(settings.getCurrency())
                .logoUrl(settings.getLogoUrl())
                .defaultPaymentTerms(settings.getDefaultPaymentTerms())
                .invoiceFooter(settings.getInvoiceFooter())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}

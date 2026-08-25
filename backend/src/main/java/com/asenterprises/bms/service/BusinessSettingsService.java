package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.dto.ResetWorkspaceRequest;
import com.asenterprises.bms.entity.BusinessSettings;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.BusinessSettingsRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

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
            byte[] logoBytes = file.getBytes();

            BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                    .orElseGet(this::seedDefaultBusinessSettings);

            settings.setLogoData(logoBytes);
            settings.setLogoContentType(contentType);
            settings.setLogoUrl("/api/v1/business-settings/logo");

            BusinessSettings updated = businessSettingsRepository.save(settings);
            log.info("Uploaded new company logo to PostgreSQL (size: {} bytes, type: {})", logoBytes.length, contentType);
            return mapToResponse(updated);
        } catch (java.io.IOException e) {
            log.error("Failed to read logo file bytes: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to save company logo image", e);
        }
    }

    @Transactional
    public BusinessSettingsResponse removeLogo() {
        BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::seedDefaultBusinessSettings);
        settings.setLogoData(null);
        settings.setLogoContentType(null);
        settings.setLogoUrl(null);
        BusinessSettings updated = businessSettingsRepository.save(settings);
        log.info("Removed company logo");
        return mapToResponse(updated);
    }

    @Transactional
    public java.util.Map<String, Object> resetWorkspace(ResetWorkspaceRequest request) {
        // 1. Resolve authenticated user
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Authentication required to reset workspace.");
        }

        String username = auth.getName();
        User currentAdmin = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated administrator account not found."));

        if (currentAdmin.getRole() != Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Only Administrators can perform a full workspace reset.");
        }

        // 2. Strictly authenticate password
        if (!passwordEncoder.matches(request.getAdminPassword(), currentAdmin.getPassword())) {
            throw new IllegalArgumentException("Invalid administrator password. Workspace reset operation canceled.");
        }

        // 3. Strictly verify confirmation phrase
        String confirmation = request.getConfirmationText() != null ? request.getConfirmationText().trim() : "";
        if (!"DELETE MY WORKSPACE".equals(confirmation)) {
            throw new IllegalArgumentException("Confirmation phrase does not match 'DELETE MY WORKSPACE' exactly.");
        }

        log.warn("CRITICAL WORKSPACE RESET INITIATED BY ADMIN: {}", currentAdmin.getUsername());

        // 4. Perform PostgreSQL-native TRUNCATE CASCADE
        try {
            jdbcTemplate.execute("""
                TRUNCATE TABLE
                    payment_allocations,
                    payments,
                    invoice_items,
                    invoices,
                    order_items,
                    orders,
                    stock_adjustments,
                    products,
                    categories,
                    customers,
                    coupons,
                    operating_expenses,
                    audit_logs,
                    password_reset_tokens,
                    user_sessions
                RESTART IDENTITY CASCADE;
            """);
        } catch (Exception e) {
            log.warn("PostgreSQL multi-table TRUNCATE CASCADE failed (likely H2 test environment), executing H2 fallback: {}", e.getMessage());
            jdbcTemplate.execute("DELETE FROM payment_allocations");
            jdbcTemplate.execute("DELETE FROM payments");
            jdbcTemplate.execute("DELETE FROM invoice_items");
            jdbcTemplate.execute("DELETE FROM invoices");
            jdbcTemplate.execute("DELETE FROM order_items");
            jdbcTemplate.execute("DELETE FROM orders");
            jdbcTemplate.execute("DELETE FROM stock_adjustments");
            jdbcTemplate.execute("DELETE FROM products");
            jdbcTemplate.execute("DELETE FROM categories");
            jdbcTemplate.execute("DELETE FROM customers");
            jdbcTemplate.execute("DELETE FROM coupons");
            jdbcTemplate.execute("DELETE FROM operating_expenses");
            jdbcTemplate.execute("DELETE FROM audit_logs");
            jdbcTemplate.execute("DELETE FROM password_reset_tokens");
            jdbcTemplate.execute("DELETE FROM user_sessions");
        }

        // 5. Remove all users except current authenticated admin (owner)
        userRepository.deleteByIdNot(currentAdmin.getId());

        // DO NOT delete businessSettingsRepository (Preserves branding, logo, and printer settings)

        log.info("WORKSPACE DATA PURGE COMPLETED SUCCESSFULLY BY ADMIN {}", currentAdmin.getUsername());

        return java.util.Map.of(
                "message", "Workspace reset completed successfully.",
                "preserved", java.util.Map.of(
                        "adminAccount", true,
                        "businessSettings", true
                )
        );
    }

    @Transactional(readOnly = true)
    public byte[] getLogoData() {
        return businessSettingsRepository.findFirstByOrderByIdAsc()
                .map(BusinessSettings::getLogoData)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public String getLogoContentType() {
        return businessSettingsRepository.findFirstByOrderByIdAsc()
                .map(BusinessSettings::getLogoContentType)
                .orElse("image/png");
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

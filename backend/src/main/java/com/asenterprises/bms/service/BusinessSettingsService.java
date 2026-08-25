package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.dto.ResetWorkspaceRequest;
import com.asenterprises.bms.entity.BusinessSettings;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final UserSessionRepository userSessionRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final PaymentRepository paymentRepository;
    private final OrderItemRepository orderItemRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CustomerRepository customerRepository;
    private final CouponRepository couponRepository;
    private final OperatingExpenseRepository operatingExpenseRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

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

        // Capture counts before deletion for audit summary
        long orderCount = orderRepository.count();
        long customerCount = customerRepository.count();
        long productCount = productRepository.count();
        long paymentCount = paymentRepository.count();

        // 4. Perform full entity data purge in exact reverse foreign-key dependency order
        paymentAllocationRepository.deleteAllInBatch();
        paymentRepository.deleteAllInBatch();
        invoiceItemRepository.deleteAllInBatch();
        invoiceRepository.deleteAllInBatch();
        orderItemRepository.deleteAllInBatch();
        orderRepository.deleteAllInBatch();
        stockAdjustmentRepository.deleteAllInBatch();
        productRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
        customerRepository.deleteAllInBatch();
        couponRepository.deleteAllInBatch();
        operatingExpenseRepository.deleteAllInBatch();
        auditLogRepository.deleteAllInBatch();
        passwordResetTokenRepository.deleteAllInBatch();
        userSessionRepository.deleteAllInBatch();

        // 5. Safe User Cleanup: Remove non-admin users, keep authenticated Admin owner
        userRepository.deleteByRoleNot(Role.ADMIN);

        // DO NOT delete businessSettingsRepository (Preserves branding, logo, and printer settings)

        log.info("WORKSPACE DATA PURGE COMPLETED SUCCESSFULLY BY ADMIN {}", currentAdmin.getUsername());

        return java.util.Map.of(
                "message", "Workspace reset completed successfully.",
                "deleted", java.util.Map.of(
                        "orders", orderCount,
                        "customers", customerCount,
                        "products", productCount,
                        "payments", paymentCount
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

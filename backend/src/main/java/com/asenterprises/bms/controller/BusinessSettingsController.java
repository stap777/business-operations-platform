package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.BusinessSettingsRequest;
import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.service.BusinessSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller exposing endpoints for managing global business settings (/business-settings).
 */
@RestController
@RequestMapping("/business-settings")
@RequiredArgsConstructor
public class BusinessSettingsController {

    private final BusinessSettingsService businessSettingsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BusinessSettingsResponse> getBusinessSettings() {
        return ResponseEntity.ok(businessSettingsService.getBusinessSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BusinessSettingsResponse> updateBusinessSettings(
            @Valid @RequestBody BusinessSettingsRequest request) {
        return ResponseEntity.ok(businessSettingsService.updateBusinessSettings(request));
    }

    @GetMapping("/logo")
    public ResponseEntity<byte[]> getLogo() {
        byte[] logoData = businessSettingsService.getLogoData();
        if (logoData == null || logoData.length == 0) {
            return ResponseEntity.notFound().build();
        }
        String contentType = businessSettingsService.getLogoContentType();
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType != null ? contentType : "image/png"))
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                .body(logoData);
    }

    @org.springframework.web.bind.annotation.PostMapping(value = "/logo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BusinessSettingsResponse> uploadLogo(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(businessSettingsService.uploadLogo(file));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BusinessSettingsResponse> removeLogo() {
        return ResponseEntity.ok(businessSettingsService.removeLogo());
    }

    @org.springframework.web.bind.annotation.PostMapping("/reset-workspace")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> resetWorkspace(
            @Valid @RequestBody com.asenterprises.bms.dto.ResetWorkspaceRequest request) {
        return ResponseEntity.ok(businessSettingsService.resetWorkspace(request));
    }
}

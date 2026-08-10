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
}

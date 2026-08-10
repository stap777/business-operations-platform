package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.DeliveryReportResponse;
import com.asenterprises.bms.service.DeliveryReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for Delivery Operations Reports (/api/v1/reports/deliveries).
 */
@RestController
@RequestMapping("/reports/deliveries")
@RequiredArgsConstructor
public class DeliveryReportController {

    private final DeliveryReportService deliveryReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<DeliveryReportResponse> getDeliveryReport() {
        return ResponseEntity.ok(deliveryReportService.getDeliveryReport());
    }
}

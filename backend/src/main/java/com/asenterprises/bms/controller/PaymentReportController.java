package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.service.PaymentReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * REST controller for Payment Reports analytics (/api/v1/reports/payments).
 */
@RestController
@RequestMapping("/reports/payments")
@RequiredArgsConstructor
public class PaymentReportController {

    private final PaymentReportService paymentReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PaymentReportResponse> getPaymentReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) PaymentMethod paymentMethod) {
        return ResponseEntity.ok(paymentReportService.getPaymentReport(startDate, endDate, paymentMethod));
    }
}

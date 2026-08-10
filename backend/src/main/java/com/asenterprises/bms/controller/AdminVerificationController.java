package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.PendingVerificationResponse;
import com.asenterprises.bms.service.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDate;

import org.springframework.security.access.prepost.PreAuthorize;

/**
 * REST controller for administrative order verification, invoice generation, and invoice queries (/api/v1/admin).
 */
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminVerificationController {

    private final VerificationService verificationService;

    @GetMapping("/orders/pending-verification")
    public ResponseEntity<Page<PendingVerificationResponse>> getPendingVerificationOrders(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(verificationService.getPendingVerificationOrders(pageable));
    }

    @PostMapping("/orders/{id}/verify")
    public ResponseEntity<InvoiceResponse> verifyOrder(
            @PathVariable Long id,
            Principal principal) {
        String adminUsername = principal.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(verificationService.verifyOrder(id, adminUsername));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(verificationService.getInvoiceById(id));
    }

    @GetMapping("/invoices/search")
    public ResponseEntity<Page<InvoiceResponse>> searchInvoices(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(verificationService.searchInvoices(query, startDate, endDate, pageable));
    }
}

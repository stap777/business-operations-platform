package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.BatchInvoicePrintResponse;
import com.asenterprises.bms.service.PrintService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller preparing batch printable invoice queues (/api/v1/print).
 */
@RestController
@RequestMapping("/print")
@RequiredArgsConstructor
public class PrintController {

    private final PrintService printService;

    @GetMapping("/invoices/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BatchInvoicePrintResponse> prepareBatchPrintQueue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<Long> invoiceIds) {
        return ResponseEntity.ok(printService.prepareBatchPrintQueue(startDate, endDate, invoiceIds));
    }
}

package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.CustomerLedgerResponse;
import com.asenterprises.bms.service.CustomerLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for Customer Ledger statements (/api/v1/reports/customer-ledger).
 */
@RestController
@RequestMapping("/reports/customer-ledger")
@RequiredArgsConstructor
public class CustomerLedgerController {

    private final CustomerLedgerService customerLedgerService;

    @GetMapping("/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CustomerLedgerResponse> getCustomerLedger(@PathVariable Long customerId) {
        return ResponseEntity.ok(customerLedgerService.getCustomerLedger(customerId));
    }
}

package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.CustomerDropdownResponse;
import com.asenterprises.bms.dto.CustomerRequest;
import com.asenterprises.bms.dto.CustomerResponse;
import com.asenterprises.bms.dto.PendingOrderResponse;
import com.asenterprises.bms.service.CustomerService;
import com.asenterprises.bms.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller exposing endpoints for customer operations (/api/v1/customers).
 */
@RestController
@RequestMapping("/customers")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomer(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<CustomerResponse>> searchCustomers(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(customerService.searchCustomers(query, pageable));
    }

    @GetMapping("/dropdown")
    public ResponseEntity<List<CustomerDropdownResponse>> getCustomerDropdown() {
        return ResponseEntity.ok(customerService.getCustomerDropdown());
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerResponse> deactivateCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.deactivateCustomer(id));
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerResponse> restoreCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.restoreCustomer(id));
    }

    @GetMapping("/{id}/pending-orders")
    public ResponseEntity<List<PendingOrderResponse>> getPendingOrdersForCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPendingOrdersForCustomer(id));
    }
}

package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.PaymentResponse;
import com.asenterprises.bms.dto.PaymentSuggestionResponse;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;

/**
 * REST controller exposing endpoints for payment lifecycle management and auto-allocation suggestions (/api/v1/payments).
 */
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody PaymentRequest request,
            Principal principal) {
        String username = principal.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(request, username));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<PaymentResponse>> searchPayments(
            @RequestParam(required = false) String paymentNumber,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(paymentService.searchPayments(paymentNumber, customerId, paymentMethod, startDate, endDate, pageable));
    }

    @GetMapping("/suggest")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PaymentSuggestionResponse> suggestAllocations(
            @RequestParam Long customerId,
            @RequestParam BigDecimal amount) {

        return ResponseEntity.ok(paymentService.suggestAllocations(customerId, amount));
    }
}

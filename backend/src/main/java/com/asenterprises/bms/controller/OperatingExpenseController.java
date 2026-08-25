package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.OperatingExpenseRequest;
import com.asenterprises.bms.dto.OperatingExpenseResponse;
import com.asenterprises.bms.service.OperatingExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/operating-expenses")
@RequiredArgsConstructor
public class OperatingExpenseController {

    private final OperatingExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<OperatingExpenseResponse> createExpense(
            @Valid @RequestBody OperatingExpenseRequest request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : "system";
        OperatingExpenseResponse response = expenseService.createExpense(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<OperatingExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody OperatingExpenseRequest request
    ) {
        OperatingExpenseResponse response = expenseService.updateExpense(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<OperatingExpenseResponse>> getExpenses(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<OperatingExpenseResponse> page = expenseService.searchExpenses(category, startDate, endDate, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(expenseService.getCategories());
    }
}

package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.StockAdjustmentRequest;
import com.asenterprises.bms.dto.StockAdjustmentResponse;
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.service.StockAdjustmentService;
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

import java.security.Principal;
import java.time.LocalDate;

/**
 * REST controller exposing endpoints for inventory stock adjustments (/stock-adjustments).
 */
@RestController
@RequestMapping("/stock-adjustments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class StockAdjustmentController {

    private final StockAdjustmentService stockAdjustmentService;

    @PostMapping
    public ResponseEntity<StockAdjustmentResponse> createStockAdjustment(
            @Valid @RequestBody StockAdjustmentRequest request,
            Principal principal) {
        String username = principal.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(stockAdjustmentService.createStockAdjustment(request, username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockAdjustmentResponse> getStockAdjustmentById(@PathVariable Long id) {
        return ResponseEntity.ok(stockAdjustmentService.getStockAdjustmentById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<StockAdjustmentResponse>> searchStockAdjustments(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockAdjustmentType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(stockAdjustmentService.searchStockAdjustments(productId, type, startDate, endDate, pageable));
    }
}

package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.CouponReportResponse;
import com.asenterprises.bms.service.CouponReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for Coupon Reports analytics (/api/v1/reports/coupons).
 */
@RestController
@RequestMapping("/reports/coupons")
@RequiredArgsConstructor
public class CouponReportController {

    private final CouponReportService couponReportService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponReportResponse> getCouponReport() {
        return ResponseEntity.ok(couponReportService.getCouponReport());
    }
}

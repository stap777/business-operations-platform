package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated report DTO for coupon redemption statistics, active/expired counts, and upcoming expiries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponReportResponse {

    private long totalCoupons;
    private long activeCoupons;
    private long expiredCoupons;
    private long totalRedemptions;
    private List<CouponSummaryResponse> couponSummaries;
    private List<CouponSummaryResponse> upcomingExpiries;
}

package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CouponReportResponse;
import com.asenterprises.bms.dto.CouponSummaryResponse;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service producing coupon redemption performance and status reporting.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CouponReportService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public CouponReportResponse getCouponReport() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(7);

        long totalCoupons = couponRepository.count();
        long activeCoupons = couponRepository.countByActiveTrue();
        long expiredCoupons = couponRepository.countExpiredCoupons(now);
        Long totalRedemptionsSum = couponRepository.sumTotalRedemptions();
        long totalRedemptions = totalRedemptionsSum != null ? totalRedemptionsSum : 0L;

        List<CouponSummaryResponse> couponSummaries = couponRepository.findAll().stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());

        List<CouponSummaryResponse> upcomingExpiries = couponRepository.findUpcomingExpiries(now, threshold).stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());

        log.info("Generated coupon report: {} total coupons, {} redemptions", totalCoupons, totalRedemptions);

        return CouponReportResponse.builder()
                .totalCoupons(totalCoupons)
                .activeCoupons(activeCoupons)
                .expiredCoupons(expiredCoupons)
                .totalRedemptions(totalRedemptions)
                .couponSummaries(couponSummaries)
                .upcomingExpiries(upcomingExpiries)
                .build();
    }

    private CouponSummaryResponse mapToSummary(Coupon coupon) {
        return CouponSummaryResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .startDate(coupon.getStartDate())
                .endDate(coupon.getEndDate())
                .active(coupon.isActive())
                .build();
    }
}

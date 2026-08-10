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
        List<Coupon> coupons = couponRepository.findAll();

        long totalCoupons = coupons.size();
        long activeCoupons = coupons.stream().filter(Coupon::isActive).count();
        long expiredCoupons = coupons.stream().filter(c -> LocalDateTime.now().isAfter(c.getEndDate())).count();
        long totalRedemptions = coupons.stream().mapToLong(c -> c.getUsedCount() != null ? c.getUsedCount() : 0).sum();

        List<CouponSummaryResponse> couponSummaries = coupons.stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(7);
        List<CouponSummaryResponse> upcomingExpiries = coupons.stream()
                .filter(c -> c.isActive() && c.getEndDate().isAfter(now) && c.getEndDate().isBefore(threshold))
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

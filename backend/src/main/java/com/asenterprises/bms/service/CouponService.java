package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CouponRequest;
import com.asenterprises.bms.dto.CouponResponse;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.DiscountType;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service managing coupon lifecycle, discount validations, date window verifications, and usage cap logic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        String code = trim(request.getCode()).toUpperCase();

        if (couponRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Coupon code '" + code + "' already exists");
        }

        validateCouponBusinessRules(request);

        Coupon coupon = Coupon.builder()
                .code(code)
                .description(trim(request.getDescription()))
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minimumOrderAmount(request.getMinimumOrderAmount() != null ? request.getMinimumOrderAmount() : BigDecimal.ZERO)
                .maximumDiscount(request.getMaximumDiscount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Coupon savedCoupon = couponRepository.save(coupon);
        log.info("Created coupon {} with discount {} {}", savedCoupon.getCode(), savedCoupon.getDiscountType(), savedCoupon.getDiscountValue());
        return mapToResponse(savedCoupon);
    }

    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));

        String newCode = trim(request.getCode()).toUpperCase();
        if (!coupon.getCode().equalsIgnoreCase(newCode) && couponRepository.existsByCode(newCode)) {
            throw new IllegalArgumentException("Coupon code '" + newCode + "' already exists");
        }

        validateCouponBusinessRules(request);

        coupon.setCode(newCode);
        coupon.setDescription(trim(request.getDescription()));
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinimumOrderAmount(request.getMinimumOrderAmount() != null ? request.getMinimumOrderAmount() : BigDecimal.ZERO);
        coupon.setMaximumDiscount(request.getMaximumDiscount());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setUsageLimit(request.getUsageLimit());
        if (request.getActive() != null) {
            coupon.setActive(request.getActive());
        }

        Coupon updatedCoupon = couponRepository.save(coupon);
        log.info("Updated coupon {}", updatedCoupon.getCode());
        return mapToResponse(updatedCoupon);
    }

    @Transactional
    public CouponResponse toggleCouponStatus(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));

        coupon.setActive(!coupon.isActive());
        Coupon updatedCoupon = couponRepository.save(coupon);
        log.info("Toggled status for coupon {} to active={}", updatedCoupon.getCode(), updatedCoupon.isActive());
        return mapToResponse(updatedCoupon);
    }

    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        return mapToResponse(coupon);
    }

    @Transactional(readOnly = true)
    public CouponResponse getCouponByCode(String code) {
        String trimmedCode = trim(code).toUpperCase();
        Coupon coupon = couponRepository.findByCode(trimmedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with code: " + trimmedCode));

        LocalDateTime now = LocalDateTime.now();

        // Business Rule: Coupon must be active
        if (!coupon.isActive()) {
            throw new IllegalArgumentException("Coupon '" + trimmedCode + "' is inactive");
        }

        // Business Rule: Current date must be within validity window
        if (now.isBefore(coupon.getStartDate()) || now.isAfter(coupon.getEndDate())) {
            throw new IllegalArgumentException("Coupon '" + trimmedCode + "' is expired or not yet valid");
        }

        // Business Rule: usedCount cannot exceed usageLimit
        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new IllegalArgumentException("Coupon '" + trimmedCode + "' has reached its maximum usage limit");
        }

        return mapToResponse(coupon);
    }

    @Transactional(readOnly = true)
    public Page<CouponResponse> searchCoupons(String query, Boolean active, Pageable pageable) {
        String trimmedQuery = trim(query);
        return couponRepository.searchCoupons(trimmedQuery, active, pageable)
                .map(this::mapToResponse);
    }

    private void validateCouponBusinessRules(CouponRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Coupon start date must be before end date");
        }

        if (request.getDiscountType() == DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException("Percentage discount cannot exceed 100%");
            }
        }
    }

    private String trim(String input) {
        return input != null ? input.trim() : null;
    }

    public CouponResponse mapToResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minimumOrderAmount(coupon.getMinimumOrderAmount())
                .maximumDiscount(coupon.getMaximumDiscount())
                .startDate(coupon.getStartDate())
                .endDate(coupon.getEndDate())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .active(coupon.isActive())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }
}

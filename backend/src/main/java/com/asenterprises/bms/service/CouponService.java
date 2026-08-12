package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CouponRequest;
import com.asenterprises.bms.dto.CouponResponse;
import com.asenterprises.bms.dto.CouponValidationRequest;
import com.asenterprises.bms.dto.CouponValidationResponse;
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
import java.util.Optional;

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
        String trimmedCode = trim(code);
        if (trimmedCode == null || trimmedCode.isEmpty()) {
            throw new IllegalArgumentException("Coupon code cannot be empty");
        }
        final String searchCode = trimmedCode.toUpperCase();

        Coupon coupon = couponRepository.findByCode(searchCode)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with code: " + searchCode));

        LocalDateTime now = LocalDateTime.now();

        if (!coupon.isActive()) {
            throw new IllegalArgumentException("Coupon '" + searchCode + "' is inactive");
        }

        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            throw new IllegalArgumentException("Coupon '" + searchCode + "' is not yet valid");
        }

        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            throw new IllegalArgumentException("Coupon '" + searchCode + "' is expired");
        }

        int used = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
        int limit = coupon.getUsageLimit() != null ? coupon.getUsageLimit() : Integer.MAX_VALUE;

        if (used >= limit) {
            throw new IllegalArgumentException("Coupon '" + searchCode + "' has reached its maximum usage limit");
        }

        return mapToResponse(coupon);
    }

    @Transactional(readOnly = true)
    public Page<CouponResponse> searchCoupons(String query, Boolean active, Pageable pageable) {
        String trimmedQuery = trim(query);
        return couponRepository.searchCoupons(trimmedQuery, active, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public CouponValidationResponse validateCouponForOrder(CouponValidationRequest request) {
        try {
            String trimmedCode = trim(request.getCode());
            if (trimmedCode == null || trimmedCode.isEmpty()) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Coupon code cannot be empty")
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            trimmedCode = trimmedCode.toUpperCase();
            Optional<Coupon> couponOptional = couponRepository.findByCode(trimmedCode);
            if (couponOptional.isEmpty()) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Coupon code '" + trimmedCode + "' not found")
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            Coupon coupon = couponOptional.get();

            if (!coupon.isActive()) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Coupon '" + trimmedCode + "' is inactive")
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            LocalDateTime now = LocalDateTime.now();
            if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Coupon '" + trimmedCode + "' is not yet valid")
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Coupon '" + trimmedCode + "' is expired")
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            int used = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            int limit = coupon.getUsageLimit() != null ? coupon.getUsageLimit() : Integer.MAX_VALUE;

            if (used >= limit) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Coupon '" + trimmedCode + "' has reached its maximum usage limit")
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            BigDecimal subtotal = request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO;
            BigDecimal minOrder = coupon.getMinimumOrderAmount() != null ? coupon.getMinimumOrderAmount() : BigDecimal.ZERO;

            if (subtotal.compareTo(minOrder) < 0) {
                return CouponValidationResponse.builder()
                        .valid(false)
                        .message("Order subtotal (₹" + subtotal + ") does not meet coupon minimum requirement of ₹" + minOrder)
                        .calculatedDiscount(BigDecimal.ZERO)
                        .build();
            }

            BigDecimal discountAmount = BigDecimal.ZERO;
            BigDecimal discountValue = coupon.getDiscountValue() != null ? coupon.getDiscountValue() : BigDecimal.ZERO;

            if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
                discountAmount = subtotal.multiply(discountValue).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                if (coupon.getMaximumDiscount() != null) {
                    discountAmount = discountAmount.min(coupon.getMaximumDiscount());
                }
            } else if (coupon.getDiscountType() == DiscountType.FLAT) {
                discountAmount = discountValue.min(subtotal);
            }

            return CouponValidationResponse.builder()
                    .valid(true)
                    .message("Coupon '" + coupon.getCode() + "' applied successfully!")
                    .coupon(mapToResponse(coupon))
                    .calculatedDiscount(discountAmount)
                    .build();
        } catch (Exception ex) {
            log.error("Unexpected error validating coupon: ", ex);
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("Failed to validate coupon: " + ex.getMessage())
                    .calculatedDiscount(BigDecimal.ZERO)
                    .build();
        }
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
        return (input != null && !input.trim().isEmpty()) ? input.trim() : null;
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

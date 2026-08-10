package com.asenterprises.bms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Coupon entity representing promotional discount codes with validity periods and usage caps.
 *
 * TODO (Version 2 Roadmap): Create CouponUsage entity to track per-customer coupon usage history and prevent multi-use per user.
 */
@Entity
@Table(
    name = "coupons",
    indexes = {
        @Index(name = "idx_coupons_code", columnList = "code", unique = true),
        @Index(name = "idx_coupons_active", columnList = "active"),
        @Index(name = "idx_coupons_dates", columnList = "start_date, end_date")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class Coupon extends BaseEntity {

    @NotBlank(message = "Coupon code is required")
    @Size(max = 30, message = "Coupon code cannot exceed 30 characters")
    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @Column(name = "description", length = 500)
    private String description;

    @NotNull(message = "Discount type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be greater than 0")
    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @NotNull(message = "Minimum order amount is required")
    @DecimalMin(value = "0.00", message = "Minimum order amount cannot be negative")
    @Builder.Default
    @Column(name = "minimum_order_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumOrderAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.01", message = "Maximum discount must be greater than 0")
    @Column(name = "maximum_discount", precision = 12, scale = 2)
    private BigDecimal maximumDiscount;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @NotNull(message = "Usage limit is required")
    @Min(value = 1, message = "Usage limit must be at least 1")
    @Column(name = "usage_limit", nullable = false)
    private Integer usageLimit;

    @NotNull(message = "Used count is required")
    @Min(value = 0, message = "Used count cannot be negative")
    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @NotNull(message = "Active flag is required")
    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;
}

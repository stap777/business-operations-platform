package com.asenterprises.bms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * StockAdjustment entity logging non-sales inventory changes with audit details.
 */
@Entity
@Table(
    name = "stock_adjustments",
    indexes = {
        @Index(name = "idx_stock_adj_product_id", columnList = "product_id"),
        @Index(name = "idx_stock_adj_type", columnList = "adjustment_type"),
        @Index(name = "idx_stock_adj_date", columnList = "adjustment_date")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true, exclude = {"product", "adjustedBy"})
@EqualsAndHashCode(callSuper = true, exclude = {"product", "adjustedBy"})
public class StockAdjustment extends BaseEntity {

    @NotNull(message = "Product is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull(message = "Adjustment type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false, length = 20)
    private StockAdjustmentType adjustmentType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be greater than 0")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotBlank(message = "Reason for adjustment is required")
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Size(max = 50, message = "Reference number cannot exceed 50 characters")
    @Column(name = "reference_number", length = 50)
    private String referenceNumber;

    @NotNull(message = "Adjusted by user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjusted_by_id", nullable = false)
    private User adjustedBy;

    @NotNull(message = "Adjustment date is required")
    @Column(name = "adjustment_date", nullable = false)
    private LocalDateTime adjustmentDate;
}

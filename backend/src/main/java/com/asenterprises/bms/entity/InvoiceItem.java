package com.asenterprises.bms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
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

import java.math.BigDecimal;

/**
 * InvoiceItem entity capturing immutable snapshots of purchased products, quantities, and prices.
 */
@Entity
@Table(
    name = "invoice_items",
    indexes = {
        @Index(name = "idx_invoice_items_invoice_id", columnList = "invoice_id")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true, exclude = {"invoice"})
@EqualsAndHashCode(callSuper = true, exclude = {"invoice"})
public class InvoiceItem extends BaseEntity {

    @NotNull(message = "Invoice reference is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @NotBlank(message = "Product name snapshot is required")
    @Size(max = 150, message = "Product name snapshot cannot exceed 150 characters")
    @Column(name = "product_name_snapshot", nullable = false, length = 150)
    private String productNameSnapshot;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull(message = "Selling price snapshot is required")
    @DecimalMin(value = "0.0", message = "Selling price snapshot cannot be negative")
    @Column(name = "selling_price_snapshot", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPriceSnapshot;

    @NotNull(message = "Line total is required")
    @DecimalMin(value = "0.0", message = "Line total cannot be negative")
    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}

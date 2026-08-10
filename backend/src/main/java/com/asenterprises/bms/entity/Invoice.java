package com.asenterprises.bms.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
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
import java.util.ArrayList;
import java.util.List;

/**
 * Invoice entity storing verified order billing metadata and customer snapshots.
 *
 * TODO (Version 2 Roadmap): Replace sequential count generation with PostgreSQL Sequence.
 */
@Entity
@Table(
    name = "invoices",
    indexes = {
        @Index(name = "idx_invoices_number", columnList = "invoice_number", unique = true),
        @Index(name = "idx_invoices_order_id", columnList = "order_id", unique = true),
        @Index(name = "idx_invoices_date", columnList = "invoice_date"),
        @Index(name = "idx_invoices_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true, exclude = {"order", "generatedBy", "items"})
@EqualsAndHashCode(callSuper = true, exclude = {"order", "generatedBy", "items"})
public class Invoice extends BaseEntity {

    @NotBlank(message = "Invoice number is required")
    @Size(max = 30, message = "Invoice number cannot exceed 30 characters")
    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @NotNull(message = "Order reference is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @NotNull(message = "Invoice date is required")
    @Column(name = "invoice_date", nullable = false)
    private LocalDateTime invoiceDate;

    @NotBlank(message = "Customer name snapshot is required")
    @Size(max = 100, message = "Customer name snapshot cannot exceed 100 characters")
    @Column(name = "customer_name_snapshot", nullable = false, length = 100)
    private String customerNameSnapshot;

    @NotBlank(message = "Customer phone snapshot is required")
    @Size(max = 20, message = "Customer phone snapshot cannot exceed 20 characters")
    @Column(name = "customer_phone_snapshot", nullable = false, length = 20)
    private String customerPhoneSnapshot;

    @NotBlank(message = "Customer address snapshot is required")
    @Size(max = 500, message = "Customer address snapshot cannot exceed 500 characters")
    @Column(name = "customer_address_snapshot", nullable = false, length = 500)
    private String customerAddressSnapshot;

    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.0", message = "Subtotal cannot be negative")
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.0", message = "Discount amount cannot be negative")
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", message = "Total amount cannot be negative")
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @NotNull(message = "Payment received at generation is required")
    @DecimalMin(value = "0.0", message = "Payment received at generation cannot be negative")
    @Column(name = "payment_received_at_generation", nullable = false, precision = 12, scale = 2)
    private BigDecimal paymentReceivedAtGeneration;

    @NotNull(message = "Generating admin user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id", nullable = false)
    private User generatedBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }
}

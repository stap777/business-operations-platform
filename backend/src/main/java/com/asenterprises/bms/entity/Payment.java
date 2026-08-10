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
 * Payment entity representing financial payment received from a customer.
 *
 * TODO (Version 2 Roadmap): Replace sequential count generation with PostgreSQL Sequence to avoid concurrency issues under high load.
 * TODO (Version 2 Roadmap): Implement Customer Refund handling & credit memo processing.
 * TODO (Version 2 Roadmap): Support Payment Reversals and voiding allocation transactions.
 * TODO (Version 2 Roadmap): Support Unallocated Advance Payments and Customer Account Credit balances.
 * TODO (Version 2 Roadmap): Integrate with Customer Account Ledger for real-time balance auditing.
 */
@Entity
@Table(
    name = "payments",
    indexes = {
        @Index(name = "idx_payments_payment_number", columnList = "payment_number", unique = true),
        @Index(name = "idx_payments_customer_id", columnList = "customer_id"),
        @Index(name = "idx_payments_received_by_id", columnList = "received_by_id"),
        @Index(name = "idx_payments_payment_date", columnList = "payment_date")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true, exclude = {"customer", "receivedBy", "allocations"})
@EqualsAndHashCode(callSuper = true, exclude = {"customer", "receivedBy", "allocations"})
public class Payment extends BaseEntity {

    @NotBlank(message = "Payment number is required")
    @Size(max = 30, message = "Payment number cannot exceed 30 characters")
    @Column(name = "payment_number", nullable = false, unique = true, length = 30)
    private String paymentNumber;

    @NotNull(message = "Customer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @NotNull(message = "Received by user is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by_id", nullable = false)
    private User receivedBy;

    @NotNull(message = "Payment date is required")
    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @NotNull(message = "Payment method is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Size(max = 500, message = "Remarks cannot exceed 500 characters")
    @Column(name = "remarks", length = 500)
    private String remarks;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PaymentAllocation> allocations = new ArrayList<>();

    public void addAllocation(PaymentAllocation allocation) {
        allocations.add(allocation);
        allocation.setPayment(this);
    }

    public void removeAllocation(PaymentAllocation allocation) {
        allocations.remove(allocation);
        allocation.setPayment(null);
    }
}

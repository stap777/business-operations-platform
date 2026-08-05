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
import java.util.ArrayList;
import java.util.List;

/**
 * Order entity representing a sales order header.
 *
 * TODO (V2 Improvement): Future versions should snapshot delivery address instead of referencing Customer address directly.
 */
@Entity
@Table(
    name = "orders",
    indexes = {
        @Index(name = "idx_orders_order_number", columnList = "order_number", unique = true),
        @Index(name = "idx_orders_customer_id", columnList = "customer_id"),
        @Index(name = "idx_orders_manager_id", columnList = "manager_id"),
        @Index(name = "idx_orders_delivery_person_id", columnList = "delivery_person_id"),
        @Index(name = "idx_orders_order_status", columnList = "order_status"),
        @Index(name = "idx_orders_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true, exclude = {"customer", "manager", "deliveryPerson", "items"})
@EqualsAndHashCode(callSuper = true, exclude = {"customer", "manager", "deliveryPerson", "items"})
public class Order extends BaseEntity {

    @NotBlank(message = "Order number is required")
    @Size(max = 30, message = "Order number cannot exceed 30 characters")
    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @NotNull(message = "Customer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @NotNull(message = "Manager is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_person_id")
    private User deliveryPerson;

    @NotNull(message = "Order status is required")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "order_status", nullable = false, length = 20)
    private OrderStatus orderStatus = OrderStatus.CREATED;

    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @NotNull(message = "Delivery status is required")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "delivery_status", nullable = false, length = 20)
    private DeliveryStatus deliveryStatus = DeliveryStatus.PENDING;

    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.0", message = "Subtotal must be greater than or equal to 0")
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.0", message = "Discount amount must be greater than or equal to 0")
    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", message = "Total amount must be greater than or equal to 0")
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Size(max = 500, message = "Delivery instructions cannot exceed 500 characters")
    @Column(name = "delivery_instructions", length = 500)
    private String deliveryInstructions;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}

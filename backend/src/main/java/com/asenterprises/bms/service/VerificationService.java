package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.InvoiceItemResponse;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.PendingVerificationResponse;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.InvoiceItem;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.StockAdjustment;
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CouponRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Core Verification Engine managing the complete admin order verification workflow:
 * order status validation, stock checks, invoice generation, inventory deduction,
 * stock adjustment audit log creation, coupon usage increment, and order verification status update.
 *
 * TODO (Version 2 Roadmap): Replace sequential count invoice number generation with PostgreSQL Sequence.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private static final List<OrderStatus> ALLOWED_VERIFICATION_STATUSES = List.of(
            OrderStatus.CREATED,
            OrderStatus.ASSIGNED,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED
    );

    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final CouponRepository couponRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final AuditLogService auditLogService;
    private final InvoiceService invoiceService;

    /**
     * Executes the complete admin order verification workflow within a single atomic transaction.
     */
    @Transactional
    public InvoiceResponse verifyOrder(Long orderId, String adminUsername) {
        User adminUser = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + adminUsername));

        if (adminUser.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Admin user account is inactive");
        }

        Order order = orderRepository.findWithLockById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Step 1 & 2: Validate Order Status (explicit allow-list) and Payment Status
        if (!ALLOWED_VERIFICATION_STATUSES.contains(order.getOrderStatus())) {
            if (order.getOrderStatus() == OrderStatus.VERIFIED || order.getOrderStatus() == OrderStatus.COMPLETED) {
                throw new IllegalStateException("Order #" + order.getOrderNumber() + " is already verified.");
            }
            if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                throw new IllegalStateException("Cannot verify a CANCELLED order.");
            }
            if (order.getOrderStatus() == OrderStatus.VOIDED) {
                throw new IllegalStateException("Cannot verify a VOIDED order.");
            }
            throw new IllegalStateException("Cannot verify order in " + order.getOrderStatus() + " state.");
        }
        if (order.getPaymentStatus() != com.asenterprises.bms.entity.PaymentStatus.PAID) {
            throw new IllegalStateException("Order #" + order.getOrderNumber() + " cannot be verified until it is fully paid. Current payment status: " + order.getPaymentStatus());
        }

        // Step 3: Validate Customer status
        if (order.getCustomer().getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot verify order for an inactive customer");
        }

        // Step 4: Get existing invoice or auto-create if absent
        Invoice invoice = invoiceRepository.findByOrderId(orderId).orElse(null);
        if (invoice == null) {
            invoice = invoiceService.createInvoiceForOrder(order, adminUser);
        }

        // Step 5: Validate & Deduct Product Stock atomically for tracked products
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw new IllegalArgumentException("Product '" + product.getName() + "' is inactive");
            }
            if (Boolean.TRUE.equals(product.getTrackInventory())) {
                int updated = productRepository.deductStock(product.getId(), item.getQuantity());
                if (updated == 0) {
                    throw new IllegalStateException("Insufficient stock for product '" + product.getName() + "'");
                }
            }
        }

        Invoice savedInvoice = invoice;

        // Reload managed actor and order references after persistence-context eviction from deductStock()
        User reloadedAdmin = userRepository.findByUsername(adminUsername).orElse(adminUser);
        Order reloadedOrder = orderRepository.findById(orderId).orElse(order);

        // Step 9: Create StockAdjustment history records for tracked products
        for (OrderItem item : reloadedOrder.getItems()) {
            Product product = item.getProduct();
            if (Boolean.TRUE.equals(product.getTrackInventory())) {
                Product reloadedProduct = productRepository.findById(product.getId()).orElse(product);
                StockAdjustment adjustment = StockAdjustment.builder()
                        .product(reloadedProduct)
                        .adjustmentType(StockAdjustmentType.OUT)
                        .quantity(item.getQuantity())
                        .reason("ORDER_FULFILLMENT")
                        .referenceNumber(reloadedOrder.getOrderNumber())
                        .adjustedBy(reloadedAdmin)
                        .adjustmentDate(LocalDateTime.now())
                        .build();
                stockAdjustmentRepository.save(adjustment);
                log.info("Stock deducted for product '{}' by quantity {}.", product.getName(), item.getQuantity());
            }
        }

        // Step 10: Audit Log Coupon Verification if coupon was applied at order placement
        if (reloadedOrder.getCoupon() != null) {
            Coupon coupon = couponRepository.findById(reloadedOrder.getCoupon().getId()).orElse(reloadedOrder.getCoupon());
            auditLogService.recordAuditLog(
                    "COUPON",
                    coupon.getId(),
                    "COUPON_VERIFIED",
                    reloadedAdmin,
                    "Coupon '" + coupon.getCode() + "' verified for Order #" + reloadedOrder.getOrderNumber()
            );
        }

        // Step 11: Audit Logging
        auditLogService.recordAuditLog(
                "ORDER",
                reloadedOrder.getId(),
                "ORDER_VERIFIED",
                reloadedAdmin,
                "Order #" + reloadedOrder.getOrderNumber() + " verified by admin " + reloadedAdmin.getUsername() +
                        ". Invoice #" + (savedInvoice != null ? savedInvoice.getInvoiceNumber() : "N/A") + " generated."
        );

        // Step 12: Update Order Status to VERIFIED and Delivery Status to DELIVERED
        reloadedOrder.setOrderStatus(OrderStatus.VERIFIED);
        reloadedOrder.setDeliveryStatus(DeliveryStatus.DELIVERED);
        orderRepository.save(reloadedOrder);

        // Ensure invoice items, order, and generatedBy are fully loaded within session before mapping
        Invoice reloadedInvoice = invoiceRepository.findByIdWithDetails(savedInvoice.getId())
                .orElseGet(() -> invoiceRepository.findByOrderIdWithDetails(orderId)
                        .orElse(savedInvoice));

        return mapToResponse(reloadedInvoice);
    }

    @Transactional(readOnly = true)
    public Page<PendingVerificationResponse> getPendingVerificationOrders(Pageable pageable) {
        return orderRepository.findPendingVerificationOrders(pageable)
                .map(order -> PendingVerificationResponse.builder()
                        .orderId(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .customerId(order.getCustomer().getId())
                        .customerName(order.getCustomer().getFullName())
                        .customerPhone(order.getCustomer().getPhone())
                        .deliveryPersonId(order.getDeliveryPerson() != null ? order.getDeliveryPerson().getId() : null)
                        .deliveryPersonName(order.getDeliveryPerson() != null ? order.getDeliveryPerson().getFullName() : null)
                        .totalAmount(order.getTotalAmount())
                        .orderStatus(order.getOrderStatus())
                        .paymentStatus(order.getPaymentStatus())
                        .deliveryStatus(order.getDeliveryStatus())
                        .itemCount(order.getItems().size())
                        .deliveredAt(order.getUpdatedAt())
                        .build());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> searchInvoices(String query, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        String trimmedQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return invoiceRepository.searchInvoices(trimmedQuery, startDateTime, endDateTime, pageable)
                .map(this::mapToResponse);
    }

    public synchronized String generateInvoiceNumber() {
        return invoiceService.generateInvoiceNumber();
    }

    public InvoiceResponse mapToResponse(Invoice invoice) {
        List<InvoiceItemResponse> itemResponses = (invoice.getItems() != null ? invoice.getItems() : List.<InvoiceItem>of()).stream()
                .map(item -> InvoiceItemResponse.builder()
                        .id(item.getId())
                        .productNameSnapshot(item.getProductNameSnapshot())
                        .quantity(item.getQuantity())
                        .sellingPriceSnapshot(item.getSellingPriceSnapshot())
                        .lineTotal(item.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        Long orderId = invoice.getOrder() != null ? invoice.getOrder().getId() : null;
        String orderNumber = invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null;
        OrderStatus orderStatus = invoice.getOrder() != null ? invoice.getOrder().getOrderStatus() : null;

        Long generatedById = invoice.getGeneratedBy() != null ? invoice.getGeneratedBy().getId() : null;
        String generatedByName = invoice.getGeneratedBy() != null ? invoice.getGeneratedBy().getFullName() : "System";

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(orderId)
                .orderNumber(orderNumber)
                .orderStatus(orderStatus)
                .invoiceDate(invoice.getInvoiceDate())
                .customerNameSnapshot(invoice.getCustomerNameSnapshot())
                .customerPhoneSnapshot(invoice.getCustomerPhoneSnapshot())
                .customerAddressSnapshot(invoice.getCustomerAddressSnapshot())
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .totalAmount(invoice.getTotalAmount())
                .paymentStatus(invoice.getPaymentStatus())
                .paymentReceivedAtGeneration(invoice.getPaymentReceivedAtGeneration())
                .generatedById(generatedById)
                .generatedByName(generatedByName)
                .items(itemResponses)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}

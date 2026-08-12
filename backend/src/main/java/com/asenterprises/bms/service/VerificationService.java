package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.InvoiceItemResponse;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.dto.PendingVerificationResponse;
import com.asenterprises.bms.entity.Coupon;
import com.asenterprises.bms.entity.CustomerStatus;
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

    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final CouponRepository couponRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

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

        // Step 1 & 2: Validate Order Status
        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot verify order with status '" + order.getOrderStatus() +
                    "'. Only orders with status DELIVERED can be verified.");
        }

        // Step 3: Validate Customer status
        if (order.getCustomer().getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot verify order for an inactive customer");
        }

        // Step 4: Ensure Invoice does NOT already exist
        if (invoiceRepository.existsByOrderId(orderId)) {
            throw new IllegalStateException("Invoice already exists for order id: " + orderId);
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

        // Step 6: Calculate Payment Received at Generation
        BigDecimal paymentReceived = paymentAllocationRepository.sumAllocatedAmountByOrderId(orderId);
        if (paymentReceived == null) {
            paymentReceived = BigDecimal.ZERO;
        }

        // Step 7: Create Invoice Header & Snapshots
        String invoiceNumber = generateInvoiceNumber();
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .order(order)
                .invoiceDate(LocalDateTime.now())
                .customerNameSnapshot(order.getCustomer().getFullName())
                .customerPhoneSnapshot(order.getCustomer().getPhone())
                .customerAddressSnapshot(order.getCustomer().getAddress())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .paymentStatus(order.getPaymentStatus())
                .paymentReceivedAtGeneration(paymentReceived)
                .generatedBy(adminUser)
                .build();

        // Step 8: Create Invoice Item Snapshots
        for (OrderItem item : order.getItems()) {
            InvoiceItem invoiceItem = InvoiceItem.builder()
                    .productNameSnapshot(item.getProduct().getName())
                    .quantity(item.getQuantity())
                    .sellingPriceSnapshot(item.getSellingPrice())
                    .lineTotal(item.getLineTotal())
                    .build();
            invoice.addItem(invoiceItem);
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Step 9: Create StockAdjustment history records for tracked products
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (Boolean.TRUE.equals(product.getTrackInventory())) {
                StockAdjustment adjustment = StockAdjustment.builder()
                        .product(product)
                        .adjustmentType(StockAdjustmentType.OUT)
                        .quantity(item.getQuantity())
                        .reason("ORDER_FULFILLMENT")
                        .referenceNumber(order.getOrderNumber())
                        .adjustedBy(adminUser)
                        .adjustmentDate(LocalDateTime.now())
                        .build();
                stockAdjustmentRepository.save(adjustment);
                log.info("Stock deducted for product '{}' by quantity {}.", product.getName(), item.getQuantity());
            }
        }

        // Step 10: Increment Coupon Usage atomically if coupon applied
        if (order.getCoupon() != null) {
            Coupon coupon = order.getCoupon();
            int updated = couponRepository.incrementUsedCount(coupon.getId());
            if (updated == 0) {
                throw new IllegalStateException("Coupon '" + coupon.getCode() + "' usage limit has been reached");
            }

            auditLogService.recordAuditLog(
                    "COUPON",
                    coupon.getId(),
                    "COUPON_USED",
                    adminUser,
                    "Coupon '" + coupon.getCode() + "' used for Order #" + order.getOrderNumber()
            );
        }

        // Step 11: Audit Logging
        auditLogService.recordAuditLog(
                "ORDER",
                order.getId(),
                "ORDER_VERIFIED",
                adminUser,
                "Order #" + order.getOrderNumber() + " verified by admin " + adminUser.getUsername() +
                        ". Invoice #" + savedInvoice.getInvoiceNumber() + " generated."
        );

        // Step 12: Update Order Status to VERIFIED
        order.setOrderStatus(OrderStatus.VERIFIED);
        orderRepository.save(order);

        log.info("Order #{} successfully verified by admin {}. Invoice #{} generated.",
                order.getOrderNumber(), adminUser.getUsername(), savedInvoice.getInvoiceNumber());

        return mapToResponse(savedInvoice);
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
        Invoice invoice = invoiceRepository.findById(id)
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

    private synchronized String generateInvoiceNumber() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);

        long countToday = invoiceRepository.countInvoicesForDate(startOfDay, endOfDay) + 1;
        String datePart = now.format(DATE_FORMATTER);
        return String.format("INV-%s-%04d", datePart, countToday);
    }

    public InvoiceResponse mapToResponse(Invoice invoice) {
        List<InvoiceItemResponse> itemResponses = invoice.getItems().stream()
                .map(item -> InvoiceItemResponse.builder()
                        .id(item.getId())
                        .productNameSnapshot(item.getProductNameSnapshot())
                        .quantity(item.getQuantity())
                        .sellingPriceSnapshot(item.getSellingPriceSnapshot())
                        .lineTotal(item.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(invoice.getOrder().getId())
                .orderNumber(invoice.getOrder().getOrderNumber())
                .invoiceDate(invoice.getInvoiceDate())
                .customerNameSnapshot(invoice.getCustomerNameSnapshot())
                .customerPhoneSnapshot(invoice.getCustomerPhoneSnapshot())
                .customerAddressSnapshot(invoice.getCustomerAddressSnapshot())
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .totalAmount(invoice.getTotalAmount())
                .paymentStatus(invoice.getPaymentStatus())
                .paymentReceivedAtGeneration(invoice.getPaymentReceivedAtGeneration())
                .generatedById(invoice.getGeneratedBy().getId())
                .generatedByName(invoice.getGeneratedBy().getFullName())
                .items(itemResponses)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}

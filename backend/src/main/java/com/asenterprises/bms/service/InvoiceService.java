package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.InvoiceItemResponse;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.InvoiceItem;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
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
 * Core Invoice Service managing immediate order-to-invoice auto-generation,
 * snapshot creation, payment state synchronizations, and invoice queries.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Automatically creates and persists a retail/business invoice immediately when an order is created.
     */
    @Transactional
    public Invoice createInvoiceForOrder(Order order, User creator) {
        if (order == null) {
            throw new IllegalArgumentException("Order reference cannot be null for invoice generation");
        }
        if (creator == null) {
            throw new IllegalArgumentException("Creator user cannot be null for invoice generation");
        }

        if (invoiceRepository.existsByOrderId(order.getId())) {
            return invoiceRepository.findByOrderId(order.getId())
                    .orElseThrow(() -> new IllegalStateException("Invoice exists but could not be retrieved for order: " + order.getId()));
        }

        BigDecimal paymentReceived = paymentAllocationRepository.sumAllocatedAmountByOrderId(order.getId());
        if (paymentReceived == null) {
            paymentReceived = BigDecimal.ZERO;
        }

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
                .generatedBy(creator)
                .build();

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
        log.info("Invoice #{} automatically created for Order #{}", savedInvoice.getInvoiceNumber(), order.getOrderNumber());
        return savedInvoice;
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for order id: " + orderId));
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

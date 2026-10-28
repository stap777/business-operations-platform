package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.dto.InvoiceItemResponse;
import com.asenterprises.bms.dto.InvoiceResponse;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.InvoiceItem;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * Core Invoice Service managing immediate order-to-invoice auto-generation,
 * snapshot creation, payment state synchronizations, and invoice queries.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    public static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int MAX_CREATION_RETRIES = 5;

    private final InvoiceRepository invoiceRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final BusinessSettingsService businessSettingsService;
    private final InvoiceCalculationService invoiceCalculationService;
    private final TransactionTemplate transactionTemplate;

    /**
     * Automatically creates and persists a retail/business invoice immediately when an order is created.
     */
    public Invoice createInvoiceForOrder(Order order, User creator) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            return executeCreateInvoiceInternal(order, creator);
        }

        for (int attempt = 1; attempt <= MAX_CREATION_RETRIES; attempt++) {
            try {
                return transactionTemplate.execute(status -> executeCreateInvoiceInternal(order, creator));
            } catch (DataIntegrityViolationException ex) {
                if (isUniqueConstraintViolation(ex) && attempt < MAX_CREATION_RETRIES) {
                    log.warn("Unique constraint collision during invoice creation on attempt {}/{}. Regenerating reference and retrying...",
                            attempt, MAX_CREATION_RETRIES);
                    try {
                        Thread.sleep(10L * attempt + ThreadLocalRandom.current().nextInt(20));
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw ex;
                    }
                    continue;
                }
                throw ex;
            }
        }
        throw new IllegalStateException("Failed to create invoice after " + MAX_CREATION_RETRIES + " attempts due to reference collisions.");
    }

    @Transactional
    public Invoice executeCreateInvoiceInternal(Order order, User creator) {
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
                .customerAddressSnapshot(order.getCustomer().getAddress() != null && !order.getCustomer().getAddress().trim().isEmpty() 
                        ? order.getCustomer().getAddress().trim() 
                        : "N/A")
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

        Invoice savedInvoice = invoiceRepository.saveAndFlush(invoice);
        log.info("Invoice #{} automatically created for Order #{}", savedInvoice.getInvoiceNumber(), order.getOrderNumber());
        return savedInvoice;
    }

    /**
     * Synchronizes an existing invoice with an updated order in place.
     * Preserves invoice ID, invoice number, invoice date, and generated-by metadata.
     * Updates customer snapshots, financial totals, line items, and payment status.
     *
     * @param order the updated order entity containing new items, customer, and totals
     * @return the synchronized invoice entity
     */
    @Transactional
    public Invoice syncInvoiceWithOrder(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order reference cannot be null for invoice synchronization");
        }

        Invoice invoice = invoiceRepository.findByOrderIdWithDetails(order.getId()).orElse(null);
        if (invoice == null) {
            log.info("No existing invoice found for Order #{}, creating new invoice", order.getOrderNumber());
            User creator = order.getManager();
            if (creator != null) {
                return createInvoiceForOrder(order, creator);
            }
            log.warn("Cannot create missing invoice for Order #{} because manager/creator is null", order.getOrderNumber());
            return null;
        }

        // Calculate allocated payments according to existing business rules
        BigDecimal totalAllocated = paymentAllocationRepository.sumAllocatedAmountByOrderId(order.getId());
        if (totalAllocated == null) {
            totalAllocated = BigDecimal.ZERO;
        }
        BigDecimal totalAmount = order.getTotalAmount();

        if (totalAllocated.compareTo(totalAmount) > 0) {
            throw new IllegalStateException("Overpayment error for order " + order.getOrderNumber() +
                    ": Total allocated (" + totalAllocated + ") exceeds order total amount (" + totalAmount + ")");
        }

        PaymentStatus newStatus;
        BigDecimal outstanding = totalAmount.subtract(totalAllocated);

        if (outstanding.compareTo(totalAmount) == 0 || totalAllocated.compareTo(BigDecimal.ZERO) == 0) {
            newStatus = PaymentStatus.PENDING;
        } else if (outstanding.compareTo(BigDecimal.ZERO) == 0) {
            newStatus = PaymentStatus.PAID;
        } else {
            newStatus = PaymentStatus.PARTIAL;
        }

        // Update Order amountReceived and paymentStatus to match
        order.setAmountReceived(totalAllocated);
        if (order.getPaymentStatus() != newStatus) {
            order.setPaymentStatus(newStatus);
        }
        if (newStatus == PaymentStatus.PAID && order.getDeliveryStatus() != DeliveryStatus.DELIVERED) {
            order.setDeliveryStatus(DeliveryStatus.DELIVERED);
            log.info("Automatically updated Order {} delivery status to DELIVERED upon order edit reaching full payment", order.getOrderNumber());
        }

        // Synchronize Customer snapshots
        if (order.getCustomer() != null) {
            invoice.setCustomerNameSnapshot(order.getCustomer().getFullName());
            invoice.setCustomerPhoneSnapshot(order.getCustomer().getPhone());
            String address = order.getCustomer().getAddress();
            invoice.setCustomerAddressSnapshot(address != null && !address.trim().isEmpty() ? address.trim() : "N/A");
        }

        // Synchronize Totals and Payment
        invoice.setSubtotal(order.getSubtotal());
        invoice.setDiscountAmount(order.getDiscountAmount());
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setPaymentReceivedAtGeneration(totalAllocated);
        invoice.setPaymentStatus(newStatus);

        // Synchronize Line Items
        invoice.getItems().clear();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String productName = item.getProduct() != null ? item.getProduct().getName() : "Unknown Product";
                InvoiceItem invoiceItem = InvoiceItem.builder()
                        .productNameSnapshot(productName)
                        .quantity(item.getQuantity())
                        .sellingPriceSnapshot(item.getSellingPrice())
                        .lineTotal(item.getLineTotal())
                        .build();
                invoice.addItem(invoiceItem);
            }
        }

        Invoice savedInvoice = invoiceRepository.saveAndFlush(invoice);
        log.info("Invoice #{} successfully synchronized with updated Order #{}", savedInvoice.getInvoiceNumber(), order.getOrderNumber());
        return savedInvoice;
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return mapToResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderIdWithDetails(orderId)
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

    public synchronized String generateInvoiceNumber() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        String datePart = today.format(DATE_FORMATTER);
        String prefix = "INV-" + datePart + "-";

        List<String> latest = invoiceRepository.findLatestInvoiceNumberByPrefixPattern(prefix + "%", PageRequest.of(0, 1));
        long nextSequence = 1;
        if (latest != null && !latest.isEmpty()) {
            String latestNumber = latest.get(0);
            if (latestNumber != null && latestNumber.startsWith(prefix)) {
                String suffix = latestNumber.substring(prefix.length());
                try {
                    nextSequence = Long.parseLong(suffix) + 1;
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse invoice sequence suffix from '{}': {}", latestNumber, e.getMessage());
                }
            }
        }

        String candidate = String.format("INV-%s-%04d", datePart, nextSequence);
        while (invoiceRepository.existsByInvoiceNumber(candidate)) {
            nextSequence++;
            candidate = String.format("INV-%s-%04d", datePart, nextSequence);
        }
        return candidate;
    }

    private boolean isUniqueConstraintViolation(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof java.sql.SQLException sqlEx) {
                if ("23505".equals(sqlEx.getSQLState())) {
                    return true;
                }
            }
            String msg = current.getMessage();
            if (msg != null) {
                String lower = msg.toLowerCase();
                if (lower.contains("23505") ||
                    lower.contains("duplicate key") ||
                    lower.contains("unique constraint") ||
                    lower.contains("invoices_invoice_number") ||
                    lower.contains("invoice_number")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
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
        com.asenterprises.bms.entity.OrderStatus orderStatus = invoice.getOrder() != null ? invoice.getOrder().getOrderStatus() : null;

        BigDecimal paidAmount = invoiceCalculationService.calculatePaidAmount(orderId, invoice.getPaymentReceivedAtGeneration());
        BigDecimal creditRemaining = invoiceCalculationService.calculateRemainingCredit(invoice.getTotalAmount(), paidAmount);
        List<PaymentAllocation> allocations = orderId != null ? paymentAllocationRepository.findByOrderId(orderId) : List.of();
        String paymentMethod = invoiceCalculationService.resolvePaymentMethod(invoice.getOrder(), allocations);

        BusinessSettingsResponse settings = null;
        try {
            settings = businessSettingsService.getBusinessSettings();
        } catch (Exception e) {
            log.warn("Could not load business settings for invoice response mapping: {}", e.getMessage());
        }

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
                .paidAmount(paidAmount)
                .creditRemaining(creditRemaining)
                .paymentMethod(paymentMethod)
                .logoUrl(settings != null ? settings.getLogoUrl() : null)
                .enterpriseName(settings != null ? settings.getBusinessName() : "A.S. Enterprises")
                .enterpriseAddress(settings != null ? settings.getAddress() : null)
                .enterprisePhone(settings != null ? settings.getPhone() : null)
                .invoiceFooter(settings != null ? settings.getInvoiceFooter() : "Thank You Visit Again")
                .generatedById(generatedById)
                .generatedByName(generatedByName)
                .items(itemResponses)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}

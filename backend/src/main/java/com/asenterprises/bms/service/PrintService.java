package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.BatchInvoicePrintResponse;
import com.asenterprises.bms.dto.BatchInvoicePrintResponse.PrintableInvoiceData;
import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.dto.PrintableInvoiceItemDto;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.asenterprises.bms.dto.DispatchSheetOrderDto;
import com.asenterprises.bms.dto.DispatchSheetProductDto;
import com.asenterprises.bms.dto.DispatchSheetResponse;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.repository.OrderRepository;
import java.util.Comparator;

/**
 * Service formatting batch printable invoice queues and dispatch sheet checklists.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrintService {

    private final InvoiceRepository invoiceRepository;
    private final BusinessSettingsService businessSettingsService;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final InvoiceCalculationService invoiceCalculationService;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public BatchInvoicePrintResponse prepareBatchPrintQueue(LocalDate startDate, LocalDate endDate, List<Long> invoiceIds) {
        BusinessSettingsResponse settings = businessSettingsService.getBusinessSettings();

        List<Invoice> invoicesToPrint;

        if (invoiceIds != null && !invoiceIds.isEmpty()) {
            invoicesToPrint = invoiceRepository.findAllById(invoiceIds);
        } else {
            LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().atStartOfDay();
            LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
            invoicesToPrint = invoiceRepository.searchInvoices(null, startDateTime, endDateTime, Pageable.ofSize(1000)).getContent();
        }

        List<PrintableInvoiceData> printableList = invoicesToPrint.stream().map(inv -> {
            List<PrintableInvoiceItemDto> itemDtos = inv.getItems().stream().map(item -> PrintableInvoiceItemDto.builder()
                    .productName(item.getProductNameSnapshot())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getSellingPriceSnapshot())
                    .lineTotal(item.getLineTotal())
                    .build()).collect(Collectors.toList());

            BigDecimal paidAmount = invoiceCalculationService.calculatePaidAmount(inv.getOrder().getId(), inv.getPaymentReceivedAtGeneration());
            BigDecimal creditRemaining = invoiceCalculationService.calculateRemainingCredit(inv.getTotalAmount(), paidAmount);
            List<PaymentAllocation> allocations = paymentAllocationRepository.findByOrderId(inv.getOrder().getId());
            String paymentMethod = invoiceCalculationService.resolvePaymentMethod(inv.getOrder(), allocations);

            return PrintableInvoiceData.builder()
                    .invoiceNumber(inv.getInvoiceNumber())
                    .orderNumber(inv.getOrder().getOrderNumber())
                    .invoiceDate(inv.getInvoiceDate())
                    .enterpriseName(settings.getBusinessName())
                    .enterpriseAddress(settings.getAddress())
                    .enterprisePhone(settings.getPhone())
                    .customerName(inv.getCustomerNameSnapshot())
                    .customerPhone(inv.getCustomerPhoneSnapshot())
                    .customerAddress(inv.getCustomerAddressSnapshot())
                    .subtotal(inv.getSubtotal())
                    .discountAmount(inv.getDiscountAmount())
                    .totalAmount(inv.getTotalAmount())
                    .paymentStatus(inv.getPaymentStatus().name())
                    .logoUrl(settings.getLogoUrl())
                    .paidAmount(paidAmount)
                    .creditRemaining(creditRemaining)
                    .paymentMethod(paymentMethod)
                    .invoiceFooter(settings.getInvoiceFooter())
                    .items(itemDtos)
                    .build();
        }).collect(Collectors.toList());

        log.info("Prepared batch print queue for {} invoices", printableList.size());

        return BatchInvoicePrintResponse.builder()
                .totalInvoices(printableList.size())
                .generatedAt(LocalDateTime.now())
                .invoices(printableList)
                .build();
    }

    @Transactional(readOnly = true)
    public DispatchSheetResponse generateDispatchSheet(LocalDate targetDate, String username) {
        LocalDate date = targetDate != null ? targetDate : LocalDate.now();
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        BusinessSettingsResponse settings = businessSettingsService.getBusinessSettings();
        List<Order> rawOrders = orderRepository.findOrdersForDispatchDate(startOfDay, endOfDay);

        // Deduplicate orders by ID preserving insertion order
        List<Order> uniqueOrders = new ArrayList<>(
                rawOrders.stream()
                        .collect(Collectors.toMap(Order::getId, o -> o, (e, n) -> e, java.util.LinkedHashMap::new))
                        .values()
        );

        // Sort pending deliveries first, then by creation time ASC
        List<Order> sortedOrders = uniqueOrders.stream()
                .sorted(Comparator.comparing((Order o) -> isDelivered(o) ? 1 : 0)
                        .thenComparing(Order::getCreatedAt))
                .collect(Collectors.toList());

        List<DispatchSheetOrderDto> orderDtos = sortedOrders.stream().map(order -> {
            List<DispatchSheetProductDto> productDtos = order.getItems().stream().map(item ->
                    DispatchSheetProductDto.builder()
                            .name(item.getProduct() != null ? item.getProduct().getName() : "Product")
                            .quantity(item.getQuantity())
                            .build()
            ).collect(Collectors.toList());

            List<PaymentAllocation> allocations = paymentAllocationRepository.findByOrderId(order.getId());
            String paymentMethod = invoiceCalculationService.resolvePaymentMethod(order, allocations);

            BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal amountReceived = order.getAmountReceived() != null ? order.getAmountReceived() : BigDecimal.ZERO;
            BigDecimal balanceDue = totalAmount.subtract(amountReceived).max(BigDecimal.ZERO);

            return DispatchSheetOrderDto.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : "Walk-in Customer")
                    .customerPhone(order.getCustomer() != null ? order.getCustomer().getPhoneNumber() : null)
                    .customerAddress(order.getCustomer() != null ? order.getCustomer().getAddress() : null)
                    .orderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : "PENDING")
                    .deliveryStatus(order.getDeliveryStatus() != null ? order.getDeliveryStatus().name() : "PENDING")
                    .paymentMethod(paymentMethod)
                    .totalAmount(totalAmount)
                    .amountReceived(amountReceived)
                    .balanceDue(balanceDue)
                    .notes(order.getNotes())
                    .products(productDtos)
                    .build();
        }).collect(Collectors.toList());

        log.info("Generated dispatch sheet for date: {} (total orders: {}, printedBy: {})", date, orderDtos.size(), username);

        return DispatchSheetResponse.builder()
                .businessName(settings.getBusinessName())
                .logoUrl(settings.getLogoUrl())
                .date(date)
                .printedAt(LocalDateTime.now())
                .printedByName(username != null && !username.isBlank() ? username : "Admin")
                .totalOrders(orderDtos.size())
                .orders(orderDtos)
                .build();
    }

    private boolean isDelivered(Order o) {
        return (o.getOrderStatus() != null && o.getOrderStatus().name().equalsIgnoreCase("DELIVERED"))
                || (o.getDeliveryStatus() != null && o.getDeliveryStatus().name().equalsIgnoreCase("DELIVERED"));
    }
}

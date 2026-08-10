package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.BatchInvoicePrintResponse;
import com.asenterprises.bms.dto.BatchInvoicePrintResponse.PrintableInvoiceData;
import com.asenterprises.bms.dto.BusinessSettingsResponse;
import com.asenterprises.bms.dto.PrintableInvoiceItemDto;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service formatting batch printable invoice queues for physical/digital printing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrintService {

    private final InvoiceRepository invoiceRepository;
    private final BusinessSettingsService businessSettingsService;

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
}

package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CustomerLedgerResponse;
import com.asenterprises.bms.dto.LedgerEntryResponse;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Payment;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service managing individual customer financial running balance ledgers and account statements.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerLedgerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public CustomerLedgerResponse getCustomerLedger(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        List<Order> orders = orderRepository.findByCustomerId(customerId);
        List<Payment> payments = paymentRepository.findByCustomerId(customerId);

        List<LedgerEntryResponse> rawEntries = new ArrayList<>();

        BigDecimal totalOrderAmount = BigDecimal.ZERO;
        for (Order order : orders) {
            if (order.getOrderStatus() != OrderStatus.CANCELLED) {
                totalOrderAmount = totalOrderAmount.add(order.getTotalAmount());
                rawEntries.add(LedgerEntryResponse.builder()
                        .date(order.getCreatedAt())
                        .type("ORDER")
                        .referenceNumber(order.getOrderNumber())
                        .debitAmount(order.getTotalAmount())
                        .creditAmount(BigDecimal.ZERO)
                        .remarks("Sales Order #" + order.getOrderNumber())
                        .build());
            }
        }

        BigDecimal totalPaymentAmount = BigDecimal.ZERO;
        for (Payment payment : payments) {
            totalPaymentAmount = totalPaymentAmount.add(payment.getTotalAmount());
            rawEntries.add(LedgerEntryResponse.builder()
                    .date(payment.getPaymentDate())
                    .type("PAYMENT")
                    .referenceNumber(payment.getPaymentNumber())
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(payment.getTotalAmount())
                    .remarks("Payment Receipt #" + payment.getPaymentNumber() + " via " + payment.getPaymentMethod())
                    .build());
        }

        // Sort chronologically by date
        rawEntries.sort(Comparator.comparing(LedgerEntryResponse::getDate, Comparator.nullsLast(Comparator.naturalOrder())));

        // Compute running balance
        BigDecimal runningBalance = BigDecimal.ZERO;
        for (LedgerEntryResponse entry : rawEntries) {
            runningBalance = runningBalance.add(entry.getDebitAmount()).subtract(entry.getCreditAmount());
            entry.setRunningBalance(runningBalance);
        }

        BigDecimal outstandingBalance = totalOrderAmount.subtract(totalPaymentAmount);
        if (outstandingBalance.compareTo(BigDecimal.ZERO) < 0) {
            outstandingBalance = BigDecimal.ZERO;
        }

        log.info("Generated ledger for customer id {}: total orders={}, total payments={}",
                customerId, totalOrderAmount, totalPaymentAmount);

        return CustomerLedgerResponse.builder()
                .customerId(customer.getId())
                .customerName(customer.getFullName())
                .customerPhone(customer.getPhone())
                .customerAddress(customer.getAddress())
                .totalOrderAmount(totalOrderAmount)
                .totalPaymentAmount(totalPaymentAmount)
                .outstandingBalance(outstandingBalance)
                .entries(rawEntries)
                .build();
    }
}

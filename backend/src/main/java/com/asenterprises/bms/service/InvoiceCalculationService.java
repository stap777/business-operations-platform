package com.asenterprises.bms.service;

import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Reusable helper service for invoice financial calculations, paid amount aggregation,
 * remaining credit determination, and payment method resolution (including Mixed payment support).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceCalculationService {

    private final PaymentAllocationRepository paymentAllocationRepository;

    /**
     * Calculates total paid amount for an order from database payment allocations,
     * falling back to paymentReceivedAtGeneration if allocations are zero or absent.
     */
    public BigDecimal calculatePaidAmount(Long orderId, BigDecimal fallbackAtGeneration) {
        if (orderId == null) {
            return fallbackAtGeneration != null ? fallbackAtGeneration : BigDecimal.ZERO;
        }

        BigDecimal allocatedTotal = paymentAllocationRepository.sumAllocatedAmountByOrderId(orderId);
        if (allocatedTotal != null && allocatedTotal.compareTo(BigDecimal.ZERO) > 0) {
            return allocatedTotal;
        }

        return fallbackAtGeneration != null ? fallbackAtGeneration : BigDecimal.ZERO;
    }

    /**
     * Calculates remaining credit balance (totalAmount - paidAmount, minimum 0).
     */
    public BigDecimal calculateRemainingCredit(BigDecimal totalAmount, BigDecimal paidAmount) {
        if (totalAmount == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        return totalAmount.subtract(paid).max(BigDecimal.ZERO);
    }

    /**
     * Resolves display label for payment method(s) attached to an order.
     * Rules:
     * - Multiple distinct payment methods -> "Mixed"
     * - Exactly one payment method -> "Cash", "UPI", "Credit", etc.
     * - No allocations -> order payment method or "Cash"
     */
    public String resolvePaymentMethod(Order order, List<PaymentAllocation> allocations) {
        if (allocations != null && !allocations.isEmpty()) {
            List<String> distinctMethods = allocations.stream()
                    .filter(Objects::nonNull)
                    .map(PaymentAllocation::getPayment)
                    .filter(Objects::nonNull)
                    .map(p -> p.getPaymentMethod().name())
                    .distinct()
                    .toList();

            if (distinctMethods.size() > 1) {
                return "Mixed";
            } else if (distinctMethods.size() == 1) {
                return formatMethodName(distinctMethods.get(0));
            }
        }

        if (order != null && order.getPaymentMethod() != null) {
            return formatMethodName(order.getPaymentMethod().name());
        }

        return "Cash";
    }

    private String formatMethodName(String rawName) {
        if (rawName == null) return "Cash";
        return switch (rawName.toUpperCase()) {
            case "UPI" -> "UPI";
            case "CASH" -> "Cash";
            case "CREDIT" -> "Credit";
            case "BANK_TRANSFER" -> "Bank Transfer";
            case "CHEQUE" -> "Cheque";
            default -> rawName.substring(0, 1).toUpperCase() + rawName.substring(1).toLowerCase();
        };
    }
}

package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.PaymentAllocationRequest;
import com.asenterprises.bms.dto.PaymentAllocationResponse;
import com.asenterprises.bms.dto.PaymentRequest;
import com.asenterprises.bms.dto.PaymentResponse;
import com.asenterprises.bms.dto.PaymentSuggestionResponse;
import com.asenterprises.bms.dto.PendingOrderResponse;
import com.asenterprises.bms.dto.SuggestedAllocationItemDto;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.Payment;
import com.asenterprises.bms.entity.PaymentAllocation;
import com.asenterprises.bms.entity.PaymentMethod;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.entity.Invoice;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.PaymentRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Core Payment Engine Service managing payment transactions, allocation validation across orders,
 * FIFO suggestion strategy, centralized order payment status recalculations, and pending order queries.
 *
 * TODO (Version 2 Roadmap): Replace sequential count generation with PostgreSQL Sequence to avoid concurrency issues under high load.
 * TODO (Version 2 Roadmap): Implement Customer Refund handling & credit memo processing.
 * TODO (Version 2 Roadmap): Support Payment Reversals and voiding allocation transactions.
 * TODO (Version 2 Roadmap): Support Unallocated Advance Payments and Customer Account Credit balances.
 * TODO (Version 2 Roadmap): Customer Account Ledger integration for real-time balance statement auditing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final com.asenterprises.bms.repository.InvoiceRepository invoiceRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Atomically creates a new payment record and allocates funds across one or more orders.
     * Annotated with @Transactional to guarantee complete atomic rollback if any validation or persistence step fails.
     */
    @Transactional
    public PaymentResponse createPayment(PaymentRequest request, String username) {
        if (request == null) {
            throw new IllegalArgumentException("Payment request payload cannot be null");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot process payment for an inactive customer");
        }

        User receivedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        if (receivedBy.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Payment recorder user account is not active");
        }

        // Validate payment total > 0 and reject negative amounts
        if (request.getTotalAmount() == null || request.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment total amount must be greater than 0");
        }

        // Reject empty allocation list
        if (request.getAllocations() == null || request.getAllocations().isEmpty()) {
            throw new IllegalArgumentException("Payment must contain at least one order allocation");
        }

        // Validate sum(all allocations) == payment total amount
        BigDecimal totalAllocatedInReq = request.getAllocations().stream()
                .map(PaymentAllocationRequest::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAllocatedInReq.compareTo(request.getTotalAmount()) != 0) {
            throw new IllegalArgumentException("Sum of allocations (" + totalAllocatedInReq +
                    ") does not match payment total amount (" + request.getTotalAmount() + ")");
        }

        String paymentNumber = generatePaymentNumber();
        LocalDateTime paymentDate = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now();

        Payment payment = Payment.builder()
                .paymentNumber(paymentNumber)
                .customer(customer)
                .receivedBy(receivedBy)
                .paymentDate(paymentDate)
                .totalAmount(request.getTotalAmount())
                .paymentMethod(request.getPaymentMethod())
                .remarks(trim(request.getRemarks()))
                .build();

        List<Order> ordersToRecalculate = new ArrayList<>();

        for (PaymentAllocationRequest allocReq : request.getAllocations()) {
            Order order = orderRepository.findWithLockById(allocReq.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + allocReq.getOrderId()));

            // Validation: Reject allocation if order belongs to another customer
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new IllegalArgumentException("Order '" + order.getOrderNumber() + "' does not belong to customer '" + customer.getFullName() + "'");
            }

            // Validation: Reject allocation if order is CANCELLED
            if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                throw new IllegalStateException("Cannot allocate payment to CANCELLED order: " + order.getOrderNumber());
            }

            // Validation: Reject allocation if order is COMPLETED
            if (order.getOrderStatus() == OrderStatus.COMPLETED) {
                throw new IllegalStateException("Cannot allocate payment to COMPLETED order: " + order.getOrderNumber());
            }

            BigDecimal allocAmount = allocReq.getAllocatedAmount();

            // Validation: Reject allocation when allocatedAmount <= 0
            if (allocAmount == null || allocAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Allocation amount for order '" + order.getOrderNumber() + "' must be greater than 0");
            }

            // Validation: Reject allocation when allocatedAmount > outstandingAmount
            BigDecimal existingAllocated = paymentAllocationRepository.sumAllocatedAmountByOrderId(order.getId());
            if (existingAllocated == null) {
                existingAllocated = BigDecimal.ZERO;
            }
            BigDecimal outstanding = order.getTotalAmount().subtract(existingAllocated);

            if (allocAmount.compareTo(outstanding) > 0) {
                throw new IllegalStateException("Allocation amount (" + allocAmount +
                        ") exceeds outstanding balance (" + outstanding + ") for order " + order.getOrderNumber());
            }

            PaymentAllocation allocation = PaymentAllocation.builder()
                    .order(order)
                    .allocatedAmount(allocAmount)
                    .build();

            payment.addAllocation(allocation);
            ordersToRecalculate.add(order);
        }

        Payment savedPayment = paymentRepository.save(payment);

        // Recalculate order payment statuses after saving allocations using centralized helper
        for (Order order : ordersToRecalculate) {
            recalculateOrderPaymentStatus(order);
        }

        log.info("Payment created successfully: {} with {} allocations for customer {}",
                savedPayment.getPaymentNumber(), savedPayment.getAllocations().size(), customer.getId());

        return mapToResponse(savedPayment);
    }

    /**
     * Payment Suggestion Engine implementing FIFO (First-In, First-Out) default strategy.
     * Evaluates oldest outstanding orders first, ignoring CANCELLED, COMPLETED, and fully paid orders.
     * Returns remaining unallocated amount.
     */
    @Transactional(readOnly = true)
    public PaymentSuggestionResponse suggestAllocations(Long customerId, BigDecimal paymentAmount) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0 for suggestions");
        }

        // Query oldest outstanding candidate orders for customer (FIFO by createdAt ASC)
        List<Order> candidateOrders = orderRepository.findAll().stream()
                .filter(o -> o.getCustomer().getId().equals(customerId))
                .filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED && o.getOrderStatus() != OrderStatus.COMPLETED)
                .filter(o -> o.getPaymentStatus() != PaymentStatus.PAID)
                .sorted(Comparator.comparing(Order::getCreatedAt))
                .toList();

        List<SuggestedAllocationItemDto> suggestedItems = new ArrayList<>();
        BigDecimal remainingAmount = paymentAmount;

        for (Order order : candidateOrders) {
            BigDecimal alreadyPaid = paymentAllocationRepository.sumAllocatedAmountByOrderId(order.getId());
            BigDecimal outstanding = order.getTotalAmount().subtract(alreadyPaid);

            if (outstanding.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal suggestedAlloc = remainingAmount.min(outstanding);
            remainingAmount = remainingAmount.subtract(suggestedAlloc);

            suggestedItems.add(SuggestedAllocationItemDto.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .orderDate(order.getCreatedAt())
                    .orderTotalAmount(order.getTotalAmount())
                    .alreadyPaidAmount(alreadyPaid)
                    .outstandingAmount(outstanding)
                    .suggestedAllocationAmount(suggestedAlloc)
                    .build());

            if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
        }

        return PaymentSuggestionResponse.builder()
                .customerId(customer.getId())
                .customerName(customer.getFullName())
                .paymentAmount(paymentAmount)
                .remainingUnallocatedAmount(remainingAmount)
                .suggestedAllocations(suggestedItems)
                .build();
    }

    /**
     * Retrieves a single payment detail by ID.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return mapToResponse(payment);
    }

    /**
     * Searches payments with flexible filter criteria and pagination.
     */
    @Transactional(readOnly = true)
    public Page<PaymentResponse> searchPayments(
            String paymentNumber,
            Long customerId,
            PaymentMethod paymentMethod,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        String trimmedNumber = trim(paymentNumber);
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        return paymentRepository.searchPayments(trimmedNumber, customerId, paymentMethod, startDateTime, endDateTime, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Retrieves all pending orders for a customer with positive outstanding amounts.
     */
    @Transactional(readOnly = true)
    public List<PendingOrderResponse> getPendingOrdersForCustomer(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        List<Order> candidateOrders = orderRepository.findAll().stream()
                .filter(o -> o.getCustomer().getId().equals(customer.getId()))
                .filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED && o.getOrderStatus() != OrderStatus.COMPLETED)
                .sorted(Comparator.comparing(Order::getCreatedAt))
                .toList();

        List<PendingOrderResponse> pendingOrders = new ArrayList<>();
        for (Order order : candidateOrders) {
            BigDecimal amountPaid = paymentAllocationRepository.sumAllocatedAmountByOrderId(order.getId());
            BigDecimal outstanding = order.getTotalAmount().subtract(amountPaid);

            if (outstanding.compareTo(BigDecimal.ZERO) > 0) {
                pendingOrders.add(PendingOrderResponse.builder()
                        .orderId(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .orderDate(order.getCreatedAt())
                        .orderStatus(order.getOrderStatus())
                        .paymentStatus(order.getPaymentStatus())
                        .totalAmount(order.getTotalAmount())
                        .amountPaid(amountPaid)
                        .outstandingAmount(outstanding)
                        .build());
            }
        }

        return pendingOrders;
    }

    /**
     * Centralized private helper method calculating Order Payment Status (PENDING, PARTIAL, PAID).
     * Rules:
     * - Outstanding == Total (totalAllocated == 0) -> PENDING
     * - Outstanding > 0 and Outstanding < Total -> PARTIAL
     * - Outstanding == 0 (totalAllocated == Total) -> PAID
     * - Never silently allow overpayment; throws IllegalStateException if total allocated > total order amount.
     */
    private void recalculateOrderPaymentStatus(Order order) {
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

        // Update Order amountReceived and paymentStatus
        order.setAmountReceived(totalAllocated);
        if (order.getPaymentStatus() != newStatus) {
            order.setPaymentStatus(newStatus);
            log.info("Updated Order {} payment status to {}", order.getOrderNumber(), newStatus);
        }
        orderRepository.save(order);

        // Synchronize associated Invoice paymentStatus if an invoice exists for this order
        invoiceRepository.findByOrderId(order.getId()).ifPresent(invoice -> {
            if (invoice.getPaymentStatus() != newStatus) {
                invoice.setPaymentStatus(newStatus);
                invoiceRepository.save(invoice);
                log.info("Updated Invoice {} payment status to {} for Order {}",
                        invoice.getInvoiceNumber(), newStatus, order.getOrderNumber());
            }
        });
    }

    /**
     * Generates sequential payment number format PAY-YYYYMMDD-0001 per calendar day.
     * TODO (Version 2 Roadmap): Replace sequential count generation with PostgreSQL Sequence in Version 2 to avoid concurrency issues.
     */
    private synchronized String generatePaymentNumber() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);

        long countToday = paymentRepository.countPaymentsForDate(startOfDay, endOfDay);
        String dateStr = now.format(DATE_FORMATTER);
        long nextSequence = countToday + 1;

        return String.format("PAY-%s-%04d", dateStr, nextSequence);
    }

    private String trim(String input) {
        return (input != null && !input.trim().isEmpty()) ? input.trim() : null;
    }

    public PaymentResponse mapToResponse(Payment payment) {
        List<PaymentAllocationResponse> allocationResponses = payment.getAllocations().stream()
                .map(this::mapToAllocationResponse)
                .toList();

        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .customerId(payment.getCustomer().getId())
                .customerName(payment.getCustomer().getFullName())
                .receivedById(payment.getReceivedBy().getId())
                .receivedByName(payment.getReceivedBy().getFullName())
                .paymentDate(payment.getPaymentDate())
                .totalAmount(payment.getTotalAmount())
                .paymentMethod(payment.getPaymentMethod())
                .remarks(payment.getRemarks())
                .allocations(allocationResponses)
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private PaymentAllocationResponse mapToAllocationResponse(PaymentAllocation allocation) {
        Order order = allocation.getOrder();
        BigDecimal totalAllocatedNow = paymentAllocationRepository.sumAllocatedAmountByOrderId(order.getId());
        BigDecimal totalAllocatedPrior = totalAllocatedNow.subtract(allocation.getAllocatedAmount());

        BigDecimal outstandingBefore = order.getTotalAmount().subtract(totalAllocatedPrior);
        BigDecimal outstandingAfter = outstandingBefore.subtract(allocation.getAllocatedAmount());

        return PaymentAllocationResponse.builder()
                .id(allocation.getId())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .allocatedAmount(allocation.getAllocatedAmount())
                .outstandingBefore(outstandingBefore)
                .outstandingAfter(outstandingAfter)
                .build();
    }
}

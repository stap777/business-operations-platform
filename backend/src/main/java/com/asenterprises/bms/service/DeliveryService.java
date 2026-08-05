package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service managing delivery workflow operations and state machine transitions.
 *
 * State Machine Workflow: ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED
 *
 * TODO (Sprint 7 Roadmap): Sprint 7 will migrate payment information into PaymentTransaction module.
 * TODO (Sprint 8 Roadmap): Sprint 8 will generate invoices after verification.
 * TODO (V2 Roadmap): GPS Real-Time Location Tracking
 * TODO (V2 Roadmap): Delivery Proof Photo Upload
 * TODO (V2 Roadmap): Customer Digital Signature Capture
 * TODO (V2 Roadmap): Delivery OTP Verification
 * TODO (V2 Roadmap): Estimated Time of Arrival (ETA) Calculation
 */
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    /**
     * Retrieves paginated list of orders assigned to the logged-in delivery personnel,
     * sorted by oldest assigned orders first.
     */
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAssignedOrdersForDeliveryPerson(String username, Pageable pageable) {
        List<OrderStatus> activeDeliveryStatuses = List.of(OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY);
        return orderRepository.findByDeliveryPersonUsernameAndOrderStatusInOrderByCreatedAtAsc(username, activeDeliveryStatuses, pageable)
                .map(orderService::mapToResponse);
    }

    /**
     * Initiates order delivery by transitioning status from ASSIGNED to OUT_FOR_DELIVERY.
     */
    @Transactional
    public OrderResponse startDelivery(Long orderId, String username) {
        Order order = findOrderById(orderId);

        validateAssignedDeliveryPerson(order, username);
        validateDeliveryState(order, OrderStatus.ASSIGNED);

        order.setOrderStatus(OrderStatus.OUT_FOR_DELIVERY);
        order.setDeliveryStatus(DeliveryStatus.OUT_FOR_DELIVERY);

        Order savedOrder = orderRepository.save(order);
        return orderService.mapToResponse(savedOrder);
    }

    /**
     * Marks order as delivered (OUT_FOR_DELIVERY -> DELIVERED) and records temporary payment details.
     */
    @Transactional
    public OrderResponse markDelivered(Long orderId, DeliveryPaymentRequest paymentRequest, String username) {
        Order order = findOrderById(orderId);

        validateAssignedDeliveryPerson(order, username);
        validateDeliveryState(order, OrderStatus.OUT_FOR_DELIVERY);
        validatePaymentRequest(paymentRequest, order.getTotalAmount());

        BigDecimal amountReceived = paymentRequest.getAmountReceived();
        order.setAmountReceived(amountReceived);
        order.setPaymentMethod(paymentRequest.getPaymentMethod());

        PaymentStatus calculatedPaymentStatus = evaluatePaymentStatus(amountReceived, order.getTotalAmount());
        order.setPaymentStatus(calculatedPaymentStatus);

        order.setOrderStatus(OrderStatus.DELIVERED);
        order.setDeliveryStatus(DeliveryStatus.DELIVERED);

        Order savedOrder = orderRepository.save(order);
        return orderService.mapToResponse(savedOrder);
    }

    private Order findOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }

    private void validateAssignedDeliveryPerson(Order order, String username) {
        if (order.getDeliveryPerson() == null || !order.getDeliveryPerson().getUsername().equals(username)) {
            throw new AccessDeniedException("Only the assigned delivery person may perform delivery updates for this order");
        }
    }

    private void validateDeliveryState(Order order, OrderStatus requiredStatus) {
        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot perform delivery updates on a CANCELLED order");
        }
        if (currentStatus == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Cannot perform delivery updates on a COMPLETED order");
        }
        if (currentStatus != requiredStatus) {
            throw new IllegalStateException("Invalid order state transition. Order must be in " + requiredStatus
                    + " state, but current state is " + currentStatus);
        }
    }

    private void validatePaymentRequest(DeliveryPaymentRequest paymentRequest, BigDecimal totalAmount) {
        if (paymentRequest == null || paymentRequest.getAmountReceived() == null) {
            throw new IllegalArgumentException("Payment details are required upon delivery");
        }

        BigDecimal amountReceived = paymentRequest.getAmountReceived();
        if (amountReceived.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount received cannot be negative");
        }

        if (amountReceived.compareTo(totalAmount) > 0) {
            throw new IllegalArgumentException("Amount received (" + amountReceived
                    + ") cannot exceed total order amount (" + totalAmount + ")");
        }
    }

    private PaymentStatus evaluatePaymentStatus(BigDecimal amountReceived, BigDecimal totalAmount) {
        if (amountReceived.compareTo(BigDecimal.ZERO) == 0) {
            return PaymentStatus.PENDING;
        } else if (amountReceived.compareTo(totalAmount) == 0) {
            return PaymentStatus.PAID;
        } else {
            return PaymentStatus.PARTIAL;
        }
    }
}

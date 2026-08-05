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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service managing delivery personnel workflows: dashboard orders retrieval,
 * transition to OUT_FOR_DELIVERY, and delivery completion with temporary payment recording.
 */
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAssignedOrdersForDeliveryPerson(String username, Pageable pageable) {
        List<OrderStatus> deliveryStatuses = List.of(OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY);
        return orderRepository.findByDeliveryPersonUsernameAndOrderStatusIn(username, deliveryStatuses, pageable)
                .map(orderService::mapToResponse);
    }

    @Transactional
    public OrderResponse startDelivery(Long orderId, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        validateDeliveryPerson(order, username);

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot start delivery for a cancelled order");
        }

        if (order.getOrderStatus() != OrderStatus.ASSIGNED) {
            throw new IllegalArgumentException("Order must be in ASSIGNED status to start delivery");
        }

        order.setOrderStatus(OrderStatus.OUT_FOR_DELIVERY);
        order.setDeliveryStatus(DeliveryStatus.OUT_FOR_DELIVERY);

        Order savedOrder = orderRepository.save(order);
        return orderService.mapToResponse(savedOrder);
    }

    @Transactional
    public OrderResponse markDelivered(Long orderId, DeliveryPaymentRequest paymentRequest, String username) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        validateDeliveryPerson(order, username);

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot mark a cancelled order as delivered");
        }

        if (order.getOrderStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new IllegalArgumentException("Order must be in OUT_FOR_DELIVERY status before marking as delivered");
        }

        if (paymentRequest == null || paymentRequest.getAmountReceived() == null) {
            throw new IllegalArgumentException("Payment details are required upon delivery");
        }

        BigDecimal amountReceived = paymentRequest.getAmountReceived();
        if (amountReceived.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount received cannot be negative");
        }

        if (amountReceived.compareTo(order.getTotalAmount()) > 0) {
            throw new IllegalArgumentException("Amount received (" + amountReceived + ") cannot exceed total order amount (" + order.getTotalAmount() + ")");
        }

        order.setAmountReceived(amountReceived);
        order.setPaymentMethod(paymentRequest.getPaymentMethod());

        if (amountReceived.compareTo(order.getTotalAmount()) == 0) {
            order.setPaymentStatus(PaymentStatus.PAID);
        } else if (amountReceived.compareTo(BigDecimal.ZERO) > 0) {
            order.setPaymentStatus(PaymentStatus.PARTIAL);
        } else {
            order.setPaymentStatus(PaymentStatus.PENDING);
        }

        order.setOrderStatus(OrderStatus.DELIVERED);
        order.setDeliveryStatus(DeliveryStatus.DELIVERED);

        Order savedOrder = orderRepository.save(order);
        return orderService.mapToResponse(savedOrder);
    }

    private void validateDeliveryPerson(Order order, String username) {
        if (order.getDeliveryPerson() == null || !order.getDeliveryPerson().getUsername().equals(username)) {
            throw new IllegalArgumentException("Only the assigned delivery person can update this order");
        }
    }
}

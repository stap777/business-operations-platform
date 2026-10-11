package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.StockAdjustment;
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service managing delivery workflow operations and state machine transitions.
 *
 * State Machine Workflow:
 * Driver: ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED
 * Admin/Manager: CREATED / ASSIGNED / OUT_FOR_DELIVERY -> DELIVERED
 *
 * Marking an order DELIVERED atomically deducts tracked inventory, creates OUT stock adjustments,
 * and optionally records delivery-time payment.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final AuditLogService auditLogService;

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
        User actor = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        validateAssignedDeliveryPerson(order, actor);
        validateDeliveryState(order, OrderStatus.ASSIGNED);

        order.setOrderStatus(OrderStatus.OUT_FOR_DELIVERY);
        order.setDeliveryStatus(DeliveryStatus.OUT_FOR_DELIVERY);

        Order savedOrder = orderRepository.save(order);
        return orderService.mapToResponse(savedOrder);
    }

    /**
     * Marks order as delivered by delivery personnel (OUT_FOR_DELIVERY -> DELIVERED).
     */
    @Transactional
    public OrderResponse markDelivered(Long orderId, DeliveryPaymentRequest paymentRequest, String username) {
        return executeOrderDelivery(orderId, paymentRequest, username, false);
    }

    /**
     * Marks order as delivered by admin or manager directly.
     */
    @Transactional
    public OrderResponse markDeliveredByAdmin(Long orderId, DeliveryPaymentRequest paymentRequest, String username) {
        return executeOrderDelivery(orderId, paymentRequest, username, true);
    }

    /**
     * Single source of truth for order delivery transition and inventory deduction.
     * Serializes concurrent requests via pessimistic write lock on the order row.
     */
    @Transactional
    public OrderResponse executeOrderDelivery(Long orderId, DeliveryPaymentRequest paymentRequest, String username, boolean isAdminOrManagerAction) {
        // Step 1: Acquire pessimistic write lock to serialize concurrent requests
        Order order = orderRepository.findWithLockById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Step 2: Validate actor
        User actor = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        if (actor.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("User account is inactive: " + username);
        }

        // Step 3: Validate order state
        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot perform delivery updates on a CANCELLED order");
        }
        if (currentStatus == OrderStatus.VOIDED) {
            throw new IllegalStateException("Cannot perform delivery updates on a VOIDED order");
        }
        if (currentStatus == OrderStatus.DELIVERED || order.getDeliveryStatus() == DeliveryStatus.DELIVERED) {
            throw new IllegalStateException("Invalid order state transition. Order #" + order.getOrderNumber() + " is already delivered.");
        }
        if (currentStatus == OrderStatus.VERIFIED || currentStatus == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Invalid order state transition. Order #" + order.getOrderNumber() + " is already verified or completed.");
        }

        if (!isAdminOrManagerAction) {
            validateAssignedDeliveryPerson(order, actor);
            if (currentStatus != OrderStatus.OUT_FOR_DELIVERY) {
                throw new IllegalStateException("Invalid order state transition. Order must be in OUT_FOR_DELIVERY state, but current state is " + currentStatus);
            }
        } else {
            if (currentStatus != OrderStatus.CREATED && currentStatus != OrderStatus.ASSIGNED && currentStatus != OrderStatus.OUT_FOR_DELIVERY) {
                throw new IllegalStateException("Invalid order state transition. Order cannot be delivered from " + currentStatus + " state.");
            }
        }

        // Step 4: Optional payment recording
        BigDecimal amountReceived = (paymentRequest != null && paymentRequest.getAmountReceived() != null)
                ? paymentRequest.getAmountReceived()
                : BigDecimal.ZERO;

        if (amountReceived.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount received cannot be negative");
        }

        if (amountReceived.compareTo(BigDecimal.ZERO) > 0) {
            if (paymentRequest == null || paymentRequest.getPaymentMethod() == null) {
                throw new IllegalArgumentException("Payment method is required when amount received is greater than 0");
            }

            com.asenterprises.bms.dto.PaymentRequest pReq = com.asenterprises.bms.dto.PaymentRequest.builder()
                    .customerId(order.getCustomer().getId())
                    .totalAmount(amountReceived)
                    .paymentMethod(paymentRequest.getPaymentMethod())
                    .remarks("Payment collected upon delivery for Order #" + order.getOrderNumber())
                    .allocations(List.of(
                            com.asenterprises.bms.dto.PaymentAllocationRequest.builder()
                                    .orderId(order.getId())
                                    .allocatedAmount(amountReceived)
                                    .build()
                    ))
                    .build();

            paymentService.createPayment(pReq, actor.getUsername());
        }

        // Step 5: Atomically deduct product stock for tracked products & create StockAdjustment records
        boolean alreadyDeducted = stockAdjustmentRepository.existsByReferenceNumberAndAdjustmentType(
                order.getOrderNumber(), StockAdjustmentType.OUT);

        if (!alreadyDeducted && order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    if (product.getStatus() != ProductStatus.ACTIVE) {
                        throw new IllegalArgumentException("Product '" + product.getName() + "' is inactive");
                    }
                    if (Boolean.TRUE.equals(product.getTrackInventory())) {
                        int updated = productRepository.deductStock(product.getId(), item.getQuantity());
                        if (updated == 0) {
                            throw new IllegalStateException("Insufficient available stock for product '" + product.getName() + "'");
                        }
                        if (product.getAvailableStock() != null) {
                            product.setAvailableStock(product.getAvailableStock() - item.getQuantity());
                        }
                    }
                }
            }

            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null && Boolean.TRUE.equals(product.getTrackInventory())) {
                    Product currentProduct = productRepository.findById(product.getId()).orElse(product);
                    StockAdjustment adjustment = StockAdjustment.builder()
                            .product(currentProduct)
                            .adjustmentType(StockAdjustmentType.OUT)
                            .quantity(item.getQuantity())
                            .reason("ORDER_DELIVERED")
                            .referenceNumber(order.getOrderNumber())
                            .adjustedBy(actor)
                            .adjustmentDate(LocalDateTime.now())
                            .build();
                    stockAdjustmentRepository.save(adjustment);
                    log.info("Stock deducted for product '{}' by quantity {} on delivery of Order #{}.",
                            product.getName(), item.getQuantity(), order.getOrderNumber());
                }
            }
        }

        // Step 6: Transition order status and delivery status
        order.setOrderStatus(OrderStatus.DELIVERED);
        order.setDeliveryStatus(DeliveryStatus.DELIVERED);
        Order savedOrder = orderRepository.save(order);

        // Step 7: Audit Log
        auditLogService.recordAuditLog(
                "ORDER",
                savedOrder.getId(),
                "ORDER_DELIVERED",
                actor,
                "Order #" + savedOrder.getOrderNumber() + " marked as DELIVERED by " + actor.getUsername() +
                        (amountReceived.compareTo(BigDecimal.ZERO) > 0 ? " with payment of " + amountReceived : " without delivery-time payment")
        );

        return orderService.mapToResponse(savedOrder);
    }

    private Order findOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }

    private void validateAssignedDeliveryPerson(Order order, User actor) {
        if (order.getDeliveryPerson() == null) {
            throw new AccessDeniedException("No delivery personnel assigned to this order");
        }
        boolean isAssignedPerson = order.getDeliveryPerson().getUsername().equals(actor.getUsername());
        boolean isAdmin = actor.getRole() == Role.ADMIN;

        if (!isAssignedPerson && !isAdmin) {
            throw new AccessDeniedException("Only the assigned delivery person or an Administrator may perform delivery updates for this order");
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
}

package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.OrderItemRequest;
import com.asenterprises.bms.dto.OrderItemResponse;
import com.asenterprises.bms.dto.OrderRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.entity.Customer;
import com.asenterprises.bms.entity.CustomerStatus;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderItem;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.entity.PaymentStatus;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.ProductStatus;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.CustomerRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

/**
 * Service managing Order lifecycle operations: creation, lookup, searching, and cancellation.
 * Calculates line totals, subtotal, discount, and total amounts.
 * Stock deduction is deferred to inventory movement modules.
 *
 * TODO (V2 Improvement): Future versions should snapshot delivery address instead of referencing Customer address directly.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final com.asenterprises.bms.repository.CouponRepository couponRepository;
    private final com.asenterprises.bms.repository.PaymentAllocationRepository paymentAllocationRepository;
    private final InvoiceService invoiceService;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        return createOrder(request, null);
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request, String authenticatedUsername) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot create order for an inactive customer");
        }

        User manager = null;
        if (authenticatedUsername != null) {
            User actor = userRepository.findByUsername(authenticatedUsername).orElse(null);
            if (actor != null && actor.getRole() == Role.MANAGER) {
                manager = actor;
            } else if (actor != null && actor.getRole() == Role.ADMIN && request.getManagerId() != null) {
                manager = userRepository.findById(request.getManagerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));
            } else if (actor != null && actor.getRole() == Role.ADMIN) {
                manager = actor;
            }
        }

        if (manager == null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));
        }

        if (manager.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign order to an inactive manager");
        }

        if (manager.getRole() != Role.MANAGER && manager.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Assigned manager must have MANAGER or ADMIN role");
        }

        User deliveryPerson = null;
        if (request.getDeliveryPersonId() != null) {
            deliveryPerson = userRepository.findById(request.getDeliveryPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Delivery person not found with id: " + request.getDeliveryPersonId()));

            if (deliveryPerson.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot assign order to an inactive delivery person");
            }

            if (deliveryPerson.getRole() != Role.DELIVERY) {
                throw new IllegalArgumentException("Assigned delivery user must have DELIVERY role");
            }
        } else {
            deliveryPerson = userRepository.findFirstByRoleAndStatusOrderByIdAsc(Role.DELIVERY, UserStatus.ACTIVE)
                    .orElse(null);
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        String orderNumber = generateOrderNumber();
        BigDecimal subtotal = BigDecimal.ZERO;

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .manager(manager)
                .deliveryPerson(deliveryPerson)
                .orderStatus(deliveryPerson != null ? OrderStatus.ASSIGNED : OrderStatus.CREATED)
                .paymentStatus(PaymentStatus.PENDING)
                .deliveryStatus(DeliveryStatus.PENDING)
                .deliveryInstructions(trim(request.getDeliveryInstructions()))
                .notes(trim(request.getNotes()))
                .build();

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot add inactive product '" + product.getName() + "' to order");
            }

            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity for product '" + product.getName() + "' must be greater than 0");
            }

            BigDecimal sellingPrice = product.getSellingPrice();
            BigDecimal purchasePrice = product.getPurchasePrice();
            BigDecimal lineTotal = sellingPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .purchasePrice(purchasePrice)
                    .sellingPrice(sellingPrice)
                    .lineTotal(lineTotal)
                    .build();

            order.addItem(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        String couponCode = trim(request.getCouponCode());

        if (couponCode != null && !couponCode.isEmpty()) {
            String uppercaseCode = couponCode.toUpperCase();
            com.asenterprises.bms.entity.Coupon coupon = couponRepository.findByCode(uppercaseCode)
                    .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with code: " + uppercaseCode));

            if (!coupon.isActive()) {
                throw new IllegalArgumentException("Coupon '" + uppercaseCode + "' is inactive");
            }

            LocalDateTime now = LocalDateTime.now();
            if ((coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) ||
                (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate()))) {
                throw new IllegalArgumentException("Coupon '" + uppercaseCode + "' is expired or not yet valid");
            }

            int used = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            int limit = coupon.getUsageLimit() != null ? coupon.getUsageLimit() : Integer.MAX_VALUE;

            if (used >= limit) {
                throw new IllegalStateException("Coupon '" + uppercaseCode + "' usage limit has been reached");
            }

            BigDecimal minOrder = coupon.getMinimumOrderAmount() != null ? coupon.getMinimumOrderAmount() : BigDecimal.ZERO;
            if (subtotal.compareTo(minOrder) < 0) {
                throw new IllegalArgumentException("Order subtotal (" + subtotal + ") does not meet coupon minimum requirement (" + minOrder + ")");
            }

            BigDecimal discountVal = coupon.getDiscountValue() != null ? coupon.getDiscountValue() : BigDecimal.ZERO;

            if (coupon.getDiscountType() == com.asenterprises.bms.entity.DiscountType.PERCENTAGE) {
                discountAmount = subtotal.multiply(discountVal).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                if (coupon.getMaximumDiscount() != null) {
                    discountAmount = discountAmount.min(coupon.getMaximumDiscount());
                }
            } else if (coupon.getDiscountType() == com.asenterprises.bms.entity.DiscountType.FLAT) {
                discountAmount = discountVal.min(subtotal);
            }

            order.setCoupon(coupon);
            int updatedRows = couponRepository.incrementUsedCount(coupon.getId());
            if (updatedRows == 0) {
                throw new IllegalStateException("Coupon '" + uppercaseCode + "' usage limit has been reached");
            }
        } else if (request.getDiscountAmount() != null) {
            discountAmount = request.getDiscountAmount();
            if (discountAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Discount amount cannot be negative");
            }
            if (discountAmount.compareTo(subtotal) > 0) {
                throw new IllegalArgumentException("Discount amount (" + discountAmount + ") cannot exceed order subtotal (" + subtotal + ")");
            }
        }

        BigDecimal totalAmount = subtotal.subtract(discountAmount);

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        
        // Audit log event
        if (manager != null) {
            auditLogService.recordAuditLog("ORDER", savedOrder.getId(), "ORDER_CREATED", manager, "Created Order #" + savedOrder.getOrderNumber());
        }

        // Auto-create initial invoice immediately upon order placement
        invoiceService.createInvoiceForOrder(savedOrder, manager);

        return mapToResponse(savedOrder);
    }

    @Transactional
    public OrderResponse updateOrder(Long id, OrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == OrderStatus.VERIFIED || currentStatus == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Cannot edit an order that is already " + currentStatus);
        }

        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot edit a cancelled order");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign order to an inactive customer");
        }

        User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));

        if (manager.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign order to an inactive manager");
        }

        User deliveryPerson = null;
        if (request.getDeliveryPersonId() != null) {
            deliveryPerson = userRepository.findById(request.getDeliveryPersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Delivery person not found with id: " + request.getDeliveryPersonId()));

            if (deliveryPerson.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot assign order to an inactive delivery person");
            }
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        order.setCustomer(customer);
        order.setManager(manager);
        if (deliveryPerson != null) {
            order.setDeliveryPerson(deliveryPerson);
        }
        order.setDeliveryInstructions(trim(request.getDeliveryInstructions()));
        order.setNotes(trim(request.getNotes()));

        order.getItems().clear();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot add inactive product '" + product.getName() + "' to order");
            }

            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity for product '" + product.getName() + "' must be greater than 0");
            }

            BigDecimal sellingPrice = product.getSellingPrice();
            BigDecimal purchasePrice = product.getPurchasePrice();
            BigDecimal lineTotal = sellingPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .purchasePrice(purchasePrice)
                    .sellingPrice(sellingPrice)
                    .lineTotal(lineTotal)
                    .build();

            order.addItem(orderItem);
        }

        BigDecimal discountAmount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        if (discountAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Discount amount cannot be negative");
        }
        if (discountAmount.compareTo(subtotal) > 0) {
            throw new IllegalArgumentException("Discount amount cannot exceed subtotal");
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(subtotal.subtract(discountAmount));

        Order updatedOrder = orderRepository.save(order);
        return mapToResponse(updatedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> searchOrders(
            String orderNumber,
            Long customerId,
            OrderStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        String trimmedOrderNumber = trim(orderNumber);
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        return orderRepository.searchOrders(trimmedOrderNumber, customerId, status, startDateTime, endDateTime, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order is already cancelled");
        }

        if (currentStatus == OrderStatus.DELIVERED || currentStatus == OrderStatus.VERIFIED || currentStatus == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel order in " + currentStatus + " state");
        }

        BigDecimal allocatedAmount = paymentAllocationRepository.sumAllocatedAmountByOrderId(id);
        if ((allocatedAmount != null && allocatedAmount.compareTo(BigDecimal.ZERO) > 0) ||
            (order.getAmountReceived() != null && order.getAmountReceived().compareTo(BigDecimal.ZERO) > 0)) {
            throw new IllegalStateException("Cannot cancel order #" + order.getOrderNumber() + " with allocated payments");
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        if (order.getCoupon() != null) {
            couponRepository.decrementUsedCount(order.getCoupon().getId());
        }

        Order updatedOrder = orderRepository.save(order);
        return mapToResponse(updatedOrder);
    }

    private synchronized String generateOrderNumber() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = now.toLocalDate().atTime(LocalTime.MAX);

        long countToday = orderRepository.countOrdersForDate(startOfDay, endOfDay);
        String dateStr = now.format(DATE_FORMATTER);
        long nextSequence = countToday + 1;

        return String.format("ORD-%s-%04d", dateStr, nextSequence);
    }

    private String trim(String input) {
        return input != null ? input.trim() : null;
    }

    public OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::mapToItemResponse)
                .toList();

        boolean isLocked = order.getOrderStatus() == OrderStatus.VERIFIED || order.getOrderStatus() == OrderStatus.COMPLETED;

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getFullName())
                .customerCode(order.getCustomer().getCustomerCode())
                .managerId(order.getManager().getId())
                .managerName(order.getManager().getFullName())
                .deliveryPersonId(order.getDeliveryPerson() != null ? order.getDeliveryPerson().getId() : null)
                .deliveryPersonName(order.getDeliveryPerson() != null ? order.getDeliveryPerson().getFullName() : null)
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .deliveryStatus(order.getDeliveryStatus())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .couponCode(order.getCoupon() != null ? order.getCoupon().getCode() : null)
                .totalAmount(order.getTotalAmount())
                .amountReceived(order.getAmountReceived() != null ? order.getAmountReceived() : BigDecimal.ZERO)
                .paymentMethod(order.getPaymentMethod())
                .deliveryInstructions(order.getDeliveryInstructions())
                .notes(order.getNotes())
                .items(itemResponses)
                .isLocked(isLocked)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemResponse mapToItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .sellingPrice(item.getSellingPrice())
                .lineTotal(item.getLineTotal())
                .unit(item.getProduct().getUnit())
                .build();
    }
}

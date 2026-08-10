package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.DeliveryPaymentRequest;
import com.asenterprises.bms.dto.OrderResponse;
import com.asenterprises.bms.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Dedicated REST controller for delivery personnel workflow operations (/api/v1/delivery).
 * Provides endpoints for viewing assigned orders, initiating delivery, and completing delivery.
 */
@RestController
@RequestMapping("/delivery")
@PreAuthorize("hasAnyRole('DELIVERY', 'ADMIN')")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping("/orders")
    public ResponseEntity<Page<OrderResponse>> getAssignedOrders(
            Principal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(deliveryService.getAssignedOrdersForDeliveryPerson(principal.getName(), pageable));
    }

    @PatchMapping("/orders/{id}/start-delivery")
    public ResponseEntity<OrderResponse> startDelivery(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(deliveryService.startDelivery(id, principal.getName()));
    }

    @PatchMapping("/orders/{id}/mark-delivered")
    public ResponseEntity<OrderResponse> markDelivered(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryPaymentRequest paymentRequest,
            Principal principal) {

        return ResponseEntity.ok(deliveryService.markDelivered(id, paymentRequest, principal.getName()));
    }
}

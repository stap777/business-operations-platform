package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.StockAdjustmentRequest;
import com.asenterprises.bms.dto.StockAdjustmentResponse;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.entity.StockAdjustment;
import com.asenterprises.bms.entity.StockAdjustmentType;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Service managing non-sales inventory adjustments, atomic stock recalculations,
 * and non-negative stock invariant enforcement.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockAdjustmentService {

    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Creates a stock adjustment record and atomically updates Product available stock.
     */
    @Transactional
    public StockAdjustmentResponse createStockAdjustment(StockAdjustmentRequest request, String username) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        User adjustedBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        if (adjustedBy.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Adjusting user account is not active");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Adjustment quantity must be greater than 0");
        }

        int currentStock = product.getAvailableStock() != null ? product.getAvailableStock() : 0;
        int qty = request.getQuantity();
        int newStock;

        StockAdjustmentType type = request.getAdjustmentType();
        switch (type) {
            case IN -> newStock = currentStock + qty;
            case CORRECTION -> newStock = currentStock + qty; // Positive correction addition
            case OUT, DAMAGED -> newStock = currentStock - qty;
            default -> throw new IllegalArgumentException("Unsupported adjustment type: " + type);
        }

        // Business Rule: Stock cannot become negative
        if (newStock < 0) {
            throw new IllegalArgumentException("Insufficient available stock for product '" + product.getName() +
                    "'. Current stock: " + currentStock + ", required reduction: " + qty);
        }

        product.setAvailableStock(newStock);
        productRepository.save(product);

        String refNum = request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : null;

        StockAdjustment adjustment = StockAdjustment.builder()
                .product(product)
                .adjustmentType(type)
                .quantity(qty)
                .reason(request.getReason().trim())
                .referenceNumber(refNum)
                .adjustedBy(adjustedBy)
                .adjustmentDate(LocalDateTime.now())
                .build();

        StockAdjustment savedAdjustment = stockAdjustmentRepository.save(adjustment);
        log.info("Stock adjustment recorded for product '{}' ({} {}). New available stock: {}",
                product.getName(), type, qty, newStock);

        return mapToResponse(savedAdjustment);
    }

    @Transactional(readOnly = true)
    public StockAdjustmentResponse getStockAdjustmentById(Long id) {
        StockAdjustment adjustment = stockAdjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock adjustment not found with id: " + id));
        return mapToResponse(adjustment);
    }

    @Transactional(readOnly = true)
    public Page<StockAdjustmentResponse> searchStockAdjustments(
            Long productId,
            StockAdjustmentType type,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        return stockAdjustmentRepository.searchStockAdjustments(productId, type, startDateTime, endDateTime, pageable)
                .map(this::mapToResponse);
    }

    public StockAdjustmentResponse mapToResponse(StockAdjustment adjustment) {
        return StockAdjustmentResponse.builder()
                .id(adjustment.getId())
                .productId(adjustment.getProduct().getId())
                .productName(adjustment.getProduct().getName())
                .adjustmentType(adjustment.getAdjustmentType())
                .quantity(adjustment.getQuantity())
                .reason(adjustment.getReason())
                .referenceNumber(adjustment.getReferenceNumber())
                .adjustedById(adjustment.getAdjustedBy().getId())
                .adjustedByName(adjustment.getAdjustedBy().getFullName())
                .adjustmentDate(adjustment.getAdjustmentDate())
                .createdAt(adjustment.getCreatedAt())
                .build();
    }
}

package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.ProductResponse;
import com.asenterprises.bms.dto.StockAdjustmentResponse;
import com.asenterprises.bms.entity.Product;
import com.asenterprises.bms.repository.ProductRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing inventory reporting, stock valuation, and low/out-of-stock monitoring.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryReportService {

    private final ProductRepository productRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final ProductService productService;
    private final StockAdjustmentService stockAdjustmentService;

    @Transactional(readOnly = true)
    public InventoryReportResponse getInventoryReport() {
        long totalProducts = productRepository.count();
        long lowStockCount = productRepository.countLowStockProducts();

        List<Product> lowStockEntities = productRepository.findLowStockProducts();
        List<Product> outOfStockEntities = productRepository.findOutOfStockProducts();

        List<ProductResponse> lowStockDtos = lowStockEntities.stream()
                .map(productService::mapToResponse)
                .collect(Collectors.toList());

        List<ProductResponse> outOfStockDtos = outOfStockEntities.stream()
                .map(productService::mapToResponse)
                .collect(Collectors.toList());

        BigDecimal valuation = productRepository.findAll().stream()
                .map(p -> p.getSellingPrice().multiply(BigDecimal.valueOf(p.getAvailableStock() != null ? p.getAvailableStock() : 0)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<StockAdjustmentResponse> recentAdjustments = stockAdjustmentService.searchStockAdjustments(null, null, null, null, Pageable.ofSize(20))
                .getContent();

        log.info("Generated inventory report: {} products, {} low stock, {} out of stock",
                totalProducts, lowStockCount, outOfStockEntities.size());

        return InventoryReportResponse.builder()
                .totalProducts(totalProducts)
                .totalLowStockCount(lowStockCount)
                .totalOutOfStockCount(outOfStockEntities.size())
                .totalInventoryValuation(valuation)
                .lowStockProducts(lowStockDtos)
                .outOfStockProducts(outOfStockDtos)
                .recentAdjustments(recentAdjustments)
                .build();
    }
}

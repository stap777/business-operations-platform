package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.StockAdjustment;
import com.asenterprises.bms.entity.StockAdjustmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * JPA Repository for StockAdjustment entity persistence and auditing queries.
 */
@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {

    @Query(value = "SELECT sa FROM StockAdjustment sa LEFT JOIN FETCH sa.product LEFT JOIN FETCH sa.adjustedBy " +
           "WHERE (cast(:productId as Long) IS NULL OR sa.product.id = :productId) " +
           "AND (cast(:type as String) IS NULL OR sa.adjustmentType = :type) " +
           "AND (cast(:startDate as LocalDateTime) IS NULL OR sa.adjustmentDate >= :startDate) " +
           "AND (cast(:endDate as LocalDateTime) IS NULL OR sa.adjustmentDate <= :endDate)",
           countQuery = "SELECT COUNT(sa) FROM StockAdjustment sa " +
           "WHERE (cast(:productId as Long) IS NULL OR sa.product.id = :productId) " +
           "AND (cast(:type as String) IS NULL OR sa.adjustmentType = :type) " +
           "AND (cast(:startDate as LocalDateTime) IS NULL OR sa.adjustmentDate >= :startDate) " +
           "AND (cast(:endDate as LocalDateTime) IS NULL OR sa.adjustmentDate <= :endDate)")
    Page<StockAdjustment> searchStockAdjustments(
            @Param("productId") Long productId,
            @Param("type") StockAdjustmentType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    java.util.List<StockAdjustment> findByProductId(Long productId);
}

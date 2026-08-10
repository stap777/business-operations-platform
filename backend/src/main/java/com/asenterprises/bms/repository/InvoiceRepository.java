package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * JPA Repository for Invoice entity persistence and search queries.
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt >= :startOfDay AND i.createdAt <= :endOfDay")
    long countInvoicesForDate(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT i FROM Invoice i JOIN FETCH i.order JOIN FETCH i.generatedBy " +
           "WHERE (:query IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(i.order.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(i.customerNameSnapshot) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(i.customerPhoneSnapshot) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:startDate IS NULL OR i.invoiceDate >= :startDate) " +
           "AND (:endDate IS NULL OR i.invoiceDate <= :endDate)")
    Page<Invoice> searchInvoices(
            @Param("query") String query,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}

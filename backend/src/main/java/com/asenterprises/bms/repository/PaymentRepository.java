package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Payment;
import com.asenterprises.bms.entity.PaymentMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * JPA Repository for Payment entity persistence and querying.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentNumber(String paymentNumber);

    boolean existsByPaymentNumber(String paymentNumber);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.createdAt >= :startOfDay AND p.createdAt <= :endOfDay")
    long countPaymentsForDate(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query(
        value = "SELECT DISTINCT p FROM Payment p JOIN FETCH p.customer JOIN FETCH p.receivedBy " +
                "WHERE (CAST(:paymentNumber AS String) IS NULL OR LOWER(p.paymentNumber) LIKE CONCAT('%', LOWER(CAST(:paymentNumber AS String)), '%')) " +
                "AND (CAST(:customerId AS Long) IS NULL OR p.customer.id = :customerId) " +
                "AND (:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) " +
                "AND (CAST(:startDate AS java.time.LocalDateTime) IS NULL OR p.paymentDate >= :startDate) " +
                "AND (CAST(:endDate AS java.time.LocalDateTime) IS NULL OR p.paymentDate <= :endDate)",
        countQuery = "SELECT COUNT(p) FROM Payment p " +
                     "WHERE (CAST(:paymentNumber AS String) IS NULL OR LOWER(p.paymentNumber) LIKE CONCAT('%', LOWER(CAST(:paymentNumber AS String)), '%')) " +
                     "AND (CAST(:customerId AS Long) IS NULL OR p.customer.id = :customerId) " +
                     "AND (:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) " +
                     "AND (CAST(:startDate AS java.time.LocalDateTime) IS NULL OR p.paymentDate >= :startDate) " +
                     "AND (CAST(:endDate AS java.time.LocalDateTime) IS NULL OR p.paymentDate <= :endDate)"
    )
    Page<Payment> searchPayments(
            @Param("paymentNumber") String paymentNumber,
            @Param("customerId") Long customerId,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT SUM(p.totalAmount) FROM Payment p WHERE p.paymentDate >= :start AND p.paymentDate <= :end")
    java.math.BigDecimal sumPaymentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentDate >= :start AND p.paymentDate <= :end AND (:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod)")
    long countPaymentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("paymentMethod") PaymentMethod paymentMethod);

    @Query("SELECT new com.asenterprises.bms.dto.PaymentMethodSummaryResponse(" +
           "p.paymentMethod, COUNT(p), SUM(p.totalAmount)) " +
           "FROM Payment p " +
           "WHERE p.paymentDate >= :start AND p.paymentDate <= :end " +
           "GROUP BY p.paymentMethod")
    java.util.List<com.asenterprises.bms.dto.PaymentMethodSummaryResponse> summarizePaymentsByMethodBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT p FROM Payment p JOIN FETCH p.customer WHERE p.customer.id = :customerId ORDER BY p.paymentDate DESC")
    java.util.List<Payment> findByCustomerId(@Param("customerId") Long customerId);
}

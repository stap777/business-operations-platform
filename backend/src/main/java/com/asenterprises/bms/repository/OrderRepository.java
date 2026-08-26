package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    long countByCustomerId(Long customerId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findWithLockById(@Param("id") Long id);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startOfDay AND o.createdAt <= :endOfDay")
    long countOrdersForDate(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    Page<Order> findByDeliveryPersonUsernameAndOrderStatusInOrderByCreatedAtAsc(
            String username,
            Collection<OrderStatus> orderStatuses,
            Pageable pageable
    );

    @Query(
        value = "SELECT DISTINCT o FROM Order o JOIN FETCH o.customer JOIN FETCH o.manager " +
                "WHERE (CAST(:orderNumber AS String) IS NULL OR LOWER(o.orderNumber) LIKE CONCAT('%', LOWER(CAST(:orderNumber AS String)), '%')) " +
                "AND (CAST(:customerId AS Long) IS NULL OR o.customer.id = :customerId) " +
                "AND (:status IS NULL OR o.orderStatus = :status) " +
                "AND (CAST(:startDate AS java.time.LocalDateTime) IS NULL OR o.createdAt >= :startDate) " +
                "AND (CAST(:endDate AS java.time.LocalDateTime) IS NULL OR o.createdAt <= :endDate)",
        countQuery = "SELECT COUNT(o) FROM Order o " +
                     "WHERE (CAST(:orderNumber AS String) IS NULL OR LOWER(o.orderNumber) LIKE CONCAT('%', LOWER(CAST(:orderNumber AS String)), '%')) " +
                     "AND (CAST(:customerId AS Long) IS NULL OR o.customer.id = :customerId) " +
                     "AND (:status IS NULL OR o.orderStatus = :status) " +
                     "AND (CAST(:startDate AS java.time.LocalDateTime) IS NULL OR o.createdAt >= :startDate) " +
                     "AND (CAST(:endDate AS java.time.LocalDateTime) IS NULL OR o.createdAt <= :endDate)"
    )
    Page<Order> searchOrders(
            @Param("orderNumber") String orderNumber,
            @Param("customerId") Long customerId,
            @Param("status") OrderStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query(
        value = "SELECT o FROM Order o JOIN FETCH o.customer LEFT JOIN FETCH o.deliveryPerson " +
                "WHERE o.orderStatus = com.asenterprises.bms.entity.OrderStatus.DELIVERED " +
                "ORDER BY o.updatedAt ASC",
        countQuery = "SELECT COUNT(o) FROM Order o " +
                     "WHERE o.orderStatus = com.asenterprises.bms.entity.OrderStatus.DELIVERED"
    )
    Page<Order> findPendingVerificationOrders(Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    long countOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus = :status")
    long countOrdersBetweenAndStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("status") OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.deliveryStatus = com.asenterprises.bms.entity.DeliveryStatus.PENDING")
    long countDeliveriesPendingBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.deliveryStatus = com.asenterprises.bms.entity.DeliveryStatus.DELIVERED")
    long countDeliveriesCompletedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.deliveryPerson.id = :agentId AND o.createdAt >= :start AND o.createdAt <= :end")
    long countAssignedDeliveriesForAgentBetween(@Param("agentId") Long agentId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.deliveryPerson.id = :agentId AND o.createdAt >= :start AND o.createdAt <= :end AND o.deliveryStatus IN (com.asenterprises.bms.entity.DeliveryStatus.PENDING, com.asenterprises.bms.entity.DeliveryStatus.OUT_FOR_DELIVERY)")
    long countPendingDeliveriesForAgentBetween(@Param("agentId") Long agentId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.deliveryPerson.id = :agentId AND o.createdAt >= :start AND o.createdAt <= :end AND o.deliveryStatus = com.asenterprises.bms.entity.DeliveryStatus.DELIVERED")
    long countCompletedDeliveriesForAgentBetween(@Param("agentId") Long agentId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    java.math.BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.discountAmount) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    java.math.BigDecimal sumDiscountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    long countValidOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.totalAmount - COALESCE(o.amountReceived, 0)) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    java.math.BigDecimal sumOutstandingForOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(item.quantity * item.purchasePrice) FROM Order o JOIN o.items item WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED AND item.purchasePrice IS NOT NULL")
    java.math.BigDecimal sumCogsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(item) FROM Order o JOIN o.items item WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED AND item.purchasePrice IS NULL")
    long countLegacyItemsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.customer.id = :customerId ORDER BY o.createdAt DESC")
    java.util.List<Order> findByCustomerId(@Param("customerId") Long customerId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Order o SET o.createdAt = :createdAt WHERE o.id = :id")
    int overrideCreatedAt(@Param("id") Long id, @Param("createdAt") LocalDateTime createdAt);

    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.customer LEFT JOIN FETCH o.items item " +
           "WHERE o.createdAt >= :startOfDay AND o.createdAt <= :endOfDay " +
           "AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED " +
           "ORDER BY o.createdAt ASC")
    java.util.List<Order> findOrdersForDispatchDate(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}

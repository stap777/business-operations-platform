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

    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.customer JOIN FETCH o.manager " +
           "WHERE (:orderNumber IS NULL OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :orderNumber, '%'))) " +
           "AND (:customerId IS NULL OR o.customer.id = :customerId) " +
           "AND (:status IS NULL OR o.orderStatus = :status) " +
           "AND (:startDate IS NULL OR o.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR o.createdAt <= :endDate)")
    Page<Order> searchOrders(
            @Param("orderNumber") String orderNumber,
            @Param("customerId") Long customerId,
            @Param("status") OrderStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT o FROM Order o JOIN FETCH o.customer LEFT JOIN FETCH o.deliveryPerson " +
           "WHERE o.orderStatus = com.asenterprises.bms.entity.OrderStatus.DELIVERED " +
           "ORDER BY o.updatedAt ASC")
    Page<Order> findPendingVerificationOrders(Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end")
    long countOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus = :status")
    long countOrdersBetweenAndStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("status") OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.deliveryStatus = com.asenterprises.bms.entity.DeliveryStatus.PENDING")
    long countDeliveriesPendingBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.deliveryStatus = com.asenterprises.bms.entity.DeliveryStatus.DELIVERED")
    long countDeliveriesCompletedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    java.math.BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(o.discountAmount) FROM Order o WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    java.math.BigDecimal sumDiscountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(item.quantity * p.purchasePrice) FROM Order o JOIN o.items item JOIN item.product p WHERE o.createdAt >= :start AND o.createdAt <= :end AND o.orderStatus != com.asenterprises.bms.entity.OrderStatus.CANCELLED")
    java.math.BigDecimal sumCogsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.customer.id = :customerId ORDER BY o.createdAt DESC")
    java.util.List<Order> findByCustomerId(@Param("customerId") Long customerId);
}

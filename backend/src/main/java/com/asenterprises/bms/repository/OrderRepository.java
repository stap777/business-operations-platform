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
}

package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * JPA Repository for Coupon entity persistence and querying.
 */
@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT c FROM Coupon c WHERE " +
           "(CAST(:query AS String) IS NULL OR LOWER(c.code) LIKE CONCAT('%', LOWER(CAST(:query AS String)), '%') OR LOWER(c.description) LIKE CONCAT('%', LOWER(CAST(:query AS String)), '%')) AND " +
           "(CAST(:active AS Boolean) IS NULL OR c.active = :active)")
    Page<Coupon> searchCoupons(@Param("query") String query, @Param("active") Boolean active, Pageable pageable);

    long countByActiveTrue();

    long countByActiveFalse();

    @Query("SELECT COUNT(c) FROM Coupon c WHERE c.endDate < :now")
    long countExpiredCoupons(@Param("now") java.time.LocalDateTime now);

    @Query("SELECT SUM(COALESCE(c.usedCount, 0)) FROM Coupon c")
    Long sumTotalRedemptions();

    @Query("SELECT c FROM Coupon c WHERE c.active = true AND c.endDate > :now AND c.endDate <= :threshold")
    java.util.List<Coupon> findUpcomingExpiries(@Param("now") java.time.LocalDateTime now, @Param("threshold") java.time.LocalDateTime threshold);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.usedCount = COALESCE(c.usedCount, 0) + 1 WHERE c.id = :id AND (c.usageLimit IS NULL OR COALESCE(c.usedCount, 0) < c.usageLimit)")
    int incrementUsedCount(@Param("id") Long id);
}

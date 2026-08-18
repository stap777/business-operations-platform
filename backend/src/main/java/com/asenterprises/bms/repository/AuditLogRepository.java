package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * JPA Repository for AuditLog entity persistence and search queries.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);

    java.util.List<AuditLog> findByEntityTypeAndAction(String entityType, String action);

    @Query(value = "SELECT a FROM AuditLog a LEFT JOIN FETCH a.performedBy " +
           "WHERE (:entityType IS NULL OR a.entityType = :entityType) " +
           "AND (:action IS NULL OR a.action = :action) " +
           "AND (:performedById IS NULL OR a.performedBy.id = :performedById)",
           countQuery = "SELECT COUNT(a) FROM AuditLog a " +
           "WHERE (:entityType IS NULL OR a.entityType = :entityType) " +
           "AND (:action IS NULL OR a.action = :action) " +
           "AND (:performedById IS NULL OR a.performedBy.id = :performedById)")
    Page<AuditLog> searchAuditLogs(
            @Param("entityType") String entityType,
            @Param("action") String action,
            @Param("performedById") Long performedById,
            Pageable pageable
    );
}

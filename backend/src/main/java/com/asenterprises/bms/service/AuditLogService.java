package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.AuditLogResponse;
import com.asenterprises.bms.entity.AuditLog;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service managing system audit log recording and search operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuditLog recordAuditLog(String entityType, Long entityId, String action, User performedBy, String remarks) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .performedAt(LocalDateTime.now())
                .remarks(remarks)
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("AuditLog recorded: {} {} on entity {} #{} by {}", action, entityType, entityId, saved.getPerformedBy().getUsername());
        return saved;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> searchAuditLogs(String entityType, String action, Long performedById, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(entityType, action, performedById, pageable)
                .map(this::mapToResponse);
    }

    public AuditLogResponse mapToResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .action(auditLog.getAction())
                .performedById(auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getId() : null)
                .performedByName(auditLog.getPerformedBy() != null ? auditLog.getPerformedBy().getFullName() : "System")
                .performedAt(auditLog.getPerformedAt())
                .remarks(auditLog.getRemarks())
                .build();
    }
}

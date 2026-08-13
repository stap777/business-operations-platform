package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing UserSession persistence.
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findByTokenHash(String tokenHash);

    Optional<UserSession> findByTokenHashAndRevokedAtIsNull(String tokenHash);

    List<UserSession> findByUserIdAndRevokedAtIsNull(Long userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :now WHERE s.user.id = :userId AND s.revokedAt IS NULL")
    int revokeAllActiveUserSessions(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :now OR s.revokedAt IS NOT NULL")
    int deleteExpiredOrRevokedSessions(@Param("now") LocalDateTime now);
}

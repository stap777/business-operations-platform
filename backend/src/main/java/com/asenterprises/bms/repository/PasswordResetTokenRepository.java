package com.asenterprises.bms.repository;

import com.asenterprises.bms.entity.PasswordResetToken;
import com.asenterprises.bms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findByUserAndUsedAtIsNullAndExpiresAtAfter(User user, LocalDateTime now);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.usedAt = :now WHERE p.user = :user AND p.usedAt IS NULL")
    void invalidateAllActiveTokensForUser(@Param("user") User user, @Param("now") LocalDateTime now);
}

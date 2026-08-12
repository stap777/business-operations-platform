package com.asenterprises.bms.security;

import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserSession;
import com.asenterprises.bms.repository.UserSessionRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

/**
 * Core service managing database-backed server-side sessions.
 * Handles cryptographically secure token generation, SHA-256 hashing, session validation,
 * revocation, and scheduled cleanup.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private static final int TOKEN_BYTES = 32; // 256 bits of entropy
    private static final long LAST_ACCESS_UPDATE_THRESHOLD_SECONDS = 60; // Throttled update strategy

    private final UserSessionRepository userSessionRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${session.expiration:86400000}")
    private long sessionExpirationMillis;

    public String getCookieName() {
        return "AVEN_SESSION";
    }

    public long getSessionExpirationMillis() {
        return sessionExpirationMillis;
    }

    @Transactional
    public String createSession(User user, HttpServletRequest request) {
        byte[] randomBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(sessionExpirationMillis / 1000);

        String userAgent = request != null ? request.getHeader("User-Agent") : null;
        if (userAgent != null && userAgent.length() > 512) {
            userAgent = userAgent.substring(0, 512);
        }

        String ipAddress = extractIpAddress(request);

        UserSession session = UserSession.builder()
                .user(user)
                .tokenHash(tokenHash)
                .createdAt(now)
                .expiresAt(expiresAt)
                .lastAccessedAt(now)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();

        userSessionRepository.save(session);
        log.info("Created session ID {} for user {}", session.getId(), user.getUsername());

        return rawToken;
    }

    @Transactional
    public Optional<UserSession> validateSession(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }

        String tokenHash = hashToken(rawToken);
        Optional<UserSession> sessionOpt = userSessionRepository.findByTokenHashAndRevokedAtIsNull(tokenHash);

        if (sessionOpt.isEmpty()) {
            return Optional.empty();
        }

        UserSession session = sessionOpt.get();

        if (session.isExpired()) {
            log.info("Session ID {} for user {} has expired", session.getId(), session.getUser().getUsername());
            session.setRevokedAt(LocalDateTime.now());
            userSessionRepository.save(session);
            return Optional.empty();
        }

        LocalDateTime now = LocalDateTime.now();
        if (session.getLastAccessedAt() == null ||
            session.getLastAccessedAt().plusSeconds(LAST_ACCESS_UPDATE_THRESHOLD_SECONDS).isBefore(now)) {
            session.setLastAccessedAt(now);
            userSessionRepository.save(session);
        }

        return Optional.of(session);
    }

    @Transactional
    public void revokeSession(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        String tokenHash = hashToken(rawToken);
        userSessionRepository.findByTokenHashAndRevokedAtIsNull(tokenHash).ifPresent(session -> {
            session.setRevokedAt(LocalDateTime.now());
            userSessionRepository.save(session);
            log.info("Revoked session ID {} for user {}", session.getId(), session.getUser().getUsername());
        });
    }

    @Transactional
    public void revokeAllUserSessions(Long userId) {
        if (userId == null) return;
        int count = userSessionRepository.revokeAllActiveUserSessions(userId, LocalDateTime.now());
        log.info("Revoked {} active sessions for user ID {}", count, userId);
    }

    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void cleanupExpiredSessions() {
        int count = userSessionRepository.deleteExpiredOrRevokedSessions(LocalDateTime.now());
        if (count > 0) {
            log.info("Cleaned up {} expired or revoked user sessions", count);
        }
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(64);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) return null;
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null && ip.length() > 64 ? ip.substring(0, 64) : ip;
    }
}

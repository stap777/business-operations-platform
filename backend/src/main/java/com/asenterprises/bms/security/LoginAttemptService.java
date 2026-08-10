package com.asenterprises.bms.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service providing brute-force attack prevention on authentication endpoints.
 * Locks authentication attempts after 5 consecutive failures for a 15-minute window.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_TIME_DURATION_MILLIS = 15 * 60 * 1000; // 15 minutes

    private final Map<String, AttemptInfo> attemptsCache = new ConcurrentHashMap<>();

    private static class AttemptInfo {
        int count;
        long lastAttemptTimestamp;

        AttemptInfo(int count, long lastAttemptTimestamp) {
            this.count = count;
            this.lastAttemptTimestamp = lastAttemptTimestamp;
        }
    }

    public boolean isBlocked(String key) {
        if (key == null || key.isBlank()) return false;
        String normalizedKey = key.trim().toLowerCase();
        AttemptInfo info = attemptsCache.get(normalizedKey);

        if (info == null) return false;

        // Reset if lock time has expired
        if (System.currentTimeMillis() - info.lastAttemptTimestamp > LOCK_TIME_DURATION_MILLIS) {
            attemptsCache.remove(normalizedKey);
            return false;
        }

        return info.count >= MAX_ATTEMPTS;
    }

    public void loginFailed(String key) {
        if (key == null || key.isBlank()) return;
        String normalizedKey = key.trim().toLowerCase();
        long now = System.currentTimeMillis();

        attemptsCache.compute(normalizedKey, (k, info) -> {
            if (info == null || (now - info.lastAttemptTimestamp > LOCK_TIME_DURATION_MILLIS)) {
                return new AttemptInfo(1, now);
            } else {
                info.count++;
                info.lastAttemptTimestamp = now;
                return info;
            }
        });
    }

    public void loginSucceeded(String key) {
        if (key == null || key.isBlank()) return;
        attemptsCache.remove(key.trim().toLowerCase());
    }

    public int getRemainingAttempts(String key) {
        if (key == null || key.isBlank()) return MAX_ATTEMPTS;
        AttemptInfo info = attemptsCache.get(key.trim().toLowerCase());
        if (info == null || (System.currentTimeMillis() - info.lastAttemptTimestamp > LOCK_TIME_DURATION_MILLIS)) {
            return MAX_ATTEMPTS;
        }
        return Math.max(0, MAX_ATTEMPTS - info.count);
    }
}

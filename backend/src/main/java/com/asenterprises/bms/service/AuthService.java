package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.LoginResponse;
import com.asenterprises.bms.dto.WorkspaceSetupRequest;
import com.asenterprises.bms.entity.BusinessSettings;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.BusinessSettingsRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.security.CustomUserDetailsService;
import com.asenterprises.bms.security.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.asenterprises.bms.dto.ForgotPasswordRequest;
import com.asenterprises.bms.dto.ResetPasswordRequest;
import com.asenterprises.bms.entity.PasswordResetToken;
import com.asenterprises.bms.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import com.asenterprises.bms.dto.UserResponse;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.security.SessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import java.util.Arrays;

/**
 * Service encapsulating authentication operations: verifying credentials, status checks, session management,
 * rate limiting brute-force protection, one-time workspace initialization, and password recovery.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BusinessSettingsRepository businessSettingsRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final CustomUserDetailsService customUserDetailsService;
    private final LoginAttemptService loginAttemptService;
    private final EmailService emailService;

    @Value("${app.frontend-url:https://aven-frontend.onrender.com}")
    private String frontendUrl;

    public LoginResponse login(LoginRequest request) {
        return login(request, null, null);
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedUsername = request.getUsername() != null ? request.getUsername().trim() : "";

        if (loginAttemptService.isBlocked(normalizedUsername)) {
            log.warn("Authentication blocked for username: {} due to excessive failed attempts", normalizedUsername);
            throw new BadCredentialsException("Account is temporarily locked due to excessive failed attempts. Please try again later.");
        }

        User user = userRepository.findByUsername(normalizedUsername)
                .orElseThrow(() -> {
                    loginAttemptService.loginFailed(normalizedUsername);
                    log.warn("Authentication failed for username: {}", normalizedUsername);
                    return new BadCredentialsException("Invalid username or password");
                });

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Authentication failed: account inactive for user: {}", normalizedUsername);
            throw new DisabledException("User account is inactive");
        }

        boolean passwordMatch = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!passwordMatch) {
            loginAttemptService.loginFailed(normalizedUsername);
            log.warn("Authentication failed for username: {}", normalizedUsername);
            throw new BadCredentialsException("Invalid username or password");
        }

        loginAttemptService.loginSucceeded(normalizedUsername);

        String rawToken = sessionService.createSession(user, httpRequest);

        if (httpResponse != null) {
            ResponseCookie cookie = ResponseCookie.from(sessionService.getCookieName(), rawToken)
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .path("/")
                    .maxAge(sessionService.getSessionExpirationMillis() / 1000)
                    .build();
            httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        log.info("Session authentication successful for user: {}", normalizedUsername);

        return LoginResponse.builder()
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .build();
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractSessionCookie(request);
        if (rawToken != null) {
            sessionService.revokeSession(rawToken);
        }
        clearSessionCookie(response);
        log.info("Logout completed successfully");
    }

    public void logoutAll(String username, HttpServletResponse response) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        sessionService.revokeAllUserSessions(user.getId());
        clearSessionCookie(response);
        log.info("Logout-all completed successfully for user: {}", username);
    }

    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .firstLogin(user.isFirstLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String extractSessionCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> sessionService.getCookieName().equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void clearSessionCookie(HttpServletResponse response) {
        if (response == null) return;
        ResponseCookie cookie = ResponseCookie.from(sessionService.getCookieName(), "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @Transactional
    public void setupWorkspace(WorkspaceSetupRequest request) {
        // Enforce ONE-TIME initialization: block if an administrator already exists
        if (userRepository.existsByRole(Role.ADMIN)) {
            log.warn("Workspace setup rejected: system already initialized with an administrator");
            throw new IllegalStateException("Workspace setup has already been completed. Additional setup calls are strictly prohibited.");
        }

        String adminUsername = request.getAdminUsername().trim();
        log.info("Initializing primary workspace setup for admin username: {}", adminUsername);

        if (userRepository.existsByUsername(adminUsername)) {
            throw new IllegalArgumentException("Username '" + adminUsername + "' is already taken");
        }

        // Format and validate phone number for admin
        String adminPhone = request.getAdminPhone() != null ? request.getAdminPhone().replaceAll("\\D", "") : "";
        if (!adminPhone.matches("^[6-9]\\d{9}$")) {
            adminPhone = request.getPhone() != null ? request.getPhone().replaceAll("\\D", "") : "";
        }
        if (!adminPhone.matches("^[6-9]\\d{9}$") || userRepository.existsByPhoneNumber(adminPhone)) {
            long base = System.currentTimeMillis() % 1000000000L;
            int counter = 0;
            do {
                adminPhone = String.format("9%09d", Math.abs((base + counter) % 1000000000L));
                counter++;
            } while (userRepository.existsByPhoneNumber(adminPhone));
        }

        // 1. Create Primary Administrator with Role.ADMIN and UserStatus.ACTIVE
        User adminUser = User.builder()
                .fullName(request.getAdminFullName().trim())
                .username(adminUsername)
                .phoneNumber(adminPhone)
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build();

        userRepository.save(adminUser);
        log.info("Primary administrator saved successfully.");

        // 2. Persist initial team members if provided (ensuring NEVER creating additional ADMIN accounts)
        if (request.getTeamMembers() != null && !request.getTeamMembers().isEmpty()) {
            long baseSeq = System.currentTimeMillis() % 100000000L;
            int counter = 0;
            for (WorkspaceSetupRequest.TeamMemberSetupDto memberDto : request.getTeamMembers()) {
                if (memberDto.getUsername() == null || memberDto.getUsername().isBlank()) continue;

                String memberUsername = memberDto.getUsername().trim();
                if (userRepository.existsByUsername(memberUsername)) continue;

                Role assignedRole = memberDto.getRole();
                // Prevent role escalation: secondary setup members MUST NOT be granted ADMIN role
                if (assignedRole == Role.ADMIN) {
                    log.warn("Secondary team member '{}' attempted ADMIN role escalation; forcing to MANAGER", memberUsername);
                    assignedRole = Role.MANAGER;
                } else if (assignedRole == null) {
                    assignedRole = Role.DELIVERY;
                }

                String memberPhone = memberDto.getPhoneNumber() != null ? memberDto.getPhoneNumber().replaceAll("\\D", "") : "";
                if (!memberPhone.matches("^[6-9]\\d{9}$") || userRepository.existsByPhoneNumber(memberPhone)) {
                    do {
                        memberPhone = String.format("98%08d", Math.abs((baseSeq + counter) % 100000008L));
                        counter++;
                    } while (userRepository.existsByPhoneNumber(memberPhone));
                }

                User teamUser = User.builder()
                        .fullName(memberDto.getFullName().trim())
                        .username(memberUsername)
                        .phoneNumber(memberPhone)
                        .password(passwordEncoder.encode(memberDto.getPassword()))
                        .role(assignedRole)
                        .status(UserStatus.ACTIVE)
                        .firstLogin(false)
                        .build();

                userRepository.save(teamUser);
                log.info("Initial team member '{}' created with role: {}", memberUsername, teamUser.getRole());
            }
        }

        // 3. Persist or update Business Settings
        BusinessSettings settings = businessSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> BusinessSettings.builder()
                        .invoicePrefix("INV")
                        .currency("INR")
                        .logoUrl("https://asenterprises.com/logo.png")
                        .defaultPaymentTerms("Payment due within 30 days of invoice issuance.")
                        .invoiceFooter("Thank you for your business!")
                        .build());

        settings.setBusinessName(request.getBusinessName() != null ? request.getBusinessName().trim() : "A.S. Enterprises");
        settings.setPhone(request.getPhone() != null ? request.getPhone().trim() : "+91-9876543210");
        settings.setAddress(request.getAddress() != null ? request.getAddress().trim() : "Headquarters Address");

        businessSettingsRepository.save(settings);
        log.info("Workspace business settings persisted successfully: {}", settings.getBusinessName());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String identifier = request.getEmailOrUsername() != null ? request.getEmailOrUsername().trim() : "";
        log.info("Processing password reset request for identifier [redacted]");

        if (identifier.isBlank()) {
            return;
        }

        userRepository.findByUsernameOrEmail(identifier).ifPresent(user -> {
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                log.warn("Password reset requested for user [redacted], but user has no email registered");
                return;
            }

            passwordResetTokenRepository.invalidateAllActiveTokensForUser(user, LocalDateTime.now());

            byte[] randomBytes = new byte[32];
            new java.security.SecureRandom().nextBytes(randomBytes);
            String rawToken = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

            String tokenHash = hashToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();

            passwordResetTokenRepository.save(resetToken);

            String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetUrl);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String rawToken = request.getToken() != null ? request.getToken().trim() : "";
        String newPassword = request.getNewPassword();

        if (rawToken.isBlank() || newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Invalid reset token or password criteria not met");
        }

        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new IllegalArgumentException("Invalid or expired password reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        passwordResetTokenRepository.invalidateAllActiveTokensForUser(user, LocalDateTime.now());
        log.info("Password reset successfully completed for user [redacted]");
    }

    private String hashToken(String rawToken) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }
}

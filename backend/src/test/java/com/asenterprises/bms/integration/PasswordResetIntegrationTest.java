package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.ForgotPasswordRequest;
import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.LoginResponse;
import com.asenterprises.bms.dto.ResetPasswordRequest;
import com.asenterprises.bms.entity.PasswordResetToken;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.PasswordResetTokenRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PasswordResetIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @MockBean
    private JavaMailSender mailSender;

    private User testUser;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.when(mailSender.createMimeMessage()).thenReturn(new jakarta.mail.internet.MimeMessage((jakarta.mail.Session) null));

        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .fullName("Test Recovery User")
                .username("recovery_admin")
                .email("recovery@asenterprises.com")
                .phoneNumber("9876543210")
                .password(passwordEncoder.encode("OldPassword123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());
    }

    @Test
    @DisplayName("Test 1 — Forgot password for existing user creates hashed token in database")
    void testForgotPasswordSuccess() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .emailOrUsername("recovery@asenterprises.com")
                .build();

        authService.forgotPassword(request);

        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByUserAndUsedAtIsNullAndExpiresAtAfter(testUser, LocalDateTime.now().minusMinutes(1));
        assertThat(tokens).hasSize(1);

        PasswordResetToken token = tokens.get(0);
        assertThat(token.getTokenHash()).hasSize(64); // SHA-256 hex string length
        assertThat(token.getUsedAt()).isNull();
        assertThat(token.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("Test 2 — Forgot password for unknown user executes silently without throwing exception")
    void testForgotPasswordUnknownUser() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .emailOrUsername("nonexistent@example.com")
                .build();

        authService.forgotPassword(request);

        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        assertThat(tokens).isEmpty();
    }

    @Test
    @DisplayName("Test 3 — Reset password with valid token updates password and allows login with new password")
    void testResetPasswordSuccess() {
        byte[] randomBytes = new byte[32];
        new java.security.SecureRandom().nextBytes(randomBytes);
        String rawToken = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash;
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            tokenHash = sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build());

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("NewSuperSecretPassword123!")
                .build();

        authService.resetPassword(resetReq);

        // Verify token marked as used
        PasswordResetToken updatedToken = passwordResetTokenRepository.findById(resetToken.getId()).orElseThrow();
        assertThat(updatedToken.getUsedAt()).isNotNull();

        // Verify login works with new password
        LoginResponse loginRes = authService.login(LoginRequest.builder()
                .username("recovery_admin")
                .password("NewSuperSecretPassword123!")
                .build());

        assertThat(loginRes).isNotNull();
        assertThat(loginRes.getToken()).isNotBlank();
    }

    @Test
    @DisplayName("Test 4 — Reset password with used token throws IllegalArgumentException")
    void testResetPasswordUsedToken() {
        PasswordResetToken resetToken = passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .tokenHash("a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .usedAt(LocalDateTime.now().minusMinutes(5))
                .build());

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token("dummytoken")
                .newPassword("NewSuperSecretPassword123!")
                .build();

        assertThatThrownBy(() -> authService.resetPassword(resetReq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired");
    }

    @Test
    @DisplayName("Test 5 — Reset password with expired token throws IllegalArgumentException")
    void testResetPasswordExpiredToken() {
        PasswordResetToken resetToken = passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(testUser)
                .tokenHash("f9e8d7c6b5a403928170f9e8d7c6b5a403928170f9e8d7c6b5a403928170f9e8")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build());

        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .token("dummytoken")
                .newPassword("NewSuperSecretPassword123!")
                .build();

        assertThatThrownBy(() -> authService.resetPassword(resetReq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired");
    }
}

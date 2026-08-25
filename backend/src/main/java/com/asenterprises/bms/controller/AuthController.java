package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.ForgotPasswordRequest;
import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.LoginResponse;
import com.asenterprises.bms.dto.ResetPasswordRequest;
import com.asenterprises.bms.dto.UserResponse;
import com.asenterprises.bms.dto.WorkspaceSetupRequest;
import com.asenterprises.bms.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import java.util.Arrays;

/**
 * REST Controller exposing authentication, session lifecycle, password recovery, and workspace initialization endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        return ResponseEntity.ok(authService.login(request, httpRequest, httpResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, String>> logoutAll(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        authService.logoutAll(authentication.getName(), response);
        return ResponseEntity.ok(Map.of("message", "Logged out from all devices successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication, HttpServletRequest request) {
        String origin = request != null ? request.getHeader("Origin") : "none";
        String userAgent = request != null ? request.getHeader("User-Agent") : "none";
        boolean cookiePresent = request != null && request.getCookies() != null &&
                Arrays.stream(request.getCookies()).anyMatch(c -> "AVEN_SESSION".equals(c.getName()));
        boolean authenticated = authentication != null && authentication.isAuthenticated();
        String username = authentication != null ? authentication.getName() : "none";

        log.info("[SESSION-DIAGNOSTIC] /auth/me Endpoint Executed | Origin: {} | User-Agent: {} | CookiePresent: {} | Authenticated: {} | User: {}",
                origin != null ? origin : "none", userAgent != null ? userAgent : "none", cookiePresent, authenticated, username);

        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> checkSystemStatus() {
        return ResponseEntity.ok(Map.of("adminExists", authService.isWorkspaceInitialized()));
    }

    @PostMapping("/setup")
    public ResponseEntity<Void> setupWorkspace(@Valid @RequestBody WorkspaceSetupRequest request) {
        authService.setupWorkspace(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "If an account exists for that email, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password has been successfully reset. Please log in with your new password."));
    }
}


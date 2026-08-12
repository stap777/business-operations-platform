package com.asenterprises.bms.controller;

import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.LoginResponse;
import com.asenterprises.bms.dto.WorkspaceSetupRequest;
import com.asenterprises.bms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.asenterprises.bms.dto.ForgotPasswordRequest;
import com.asenterprises.bms.dto.ResetPasswordRequest;
import java.util.Map;

/**
 * REST Controller exposing public authentication, password recovery, and workspace initialization endpoints.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
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

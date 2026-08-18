package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.WorkspaceSetupRequest;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.AdminUserService;
import com.asenterprises.bms.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SecurityHardeningIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    @Autowired
    private AdminUserService adminUserService;

    private User primaryAdmin;

    @Autowired
    private com.asenterprises.bms.repository.OrderRepository orderRepository;
    @Autowired
    private com.asenterprises.bms.repository.PaymentAllocationRepository paymentAllocationRepository;
    @Autowired
    private com.asenterprises.bms.repository.PaymentRepository paymentRepository;
    @Autowired
    private com.asenterprises.bms.repository.InvoiceRepository invoiceRepository;
    @Autowired
    private com.asenterprises.bms.repository.StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private com.asenterprises.bms.repository.AuditLogRepository auditLogRepository;

    @Autowired
    private com.asenterprises.bms.repository.UserSessionRepository userSessionRepository;

    private void clearAllData() {
        auditLogRepository.deleteAll();
        userSessionRepository.deleteAll();
        paymentAllocationRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        stockAdjustmentRepository.deleteAll();
        orderRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        clearAllData();

        primaryAdmin = userRepository.save(User.builder()
                .fullName("Primary Administrator")
                .username("primary_admin")
                .phoneNumber("9876543210")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());
    }

    @Test
    @DisplayName("Security 1 — /auth/setup fails when an administrator account already exists")
    void testWorkspaceSetupBlockedWhenAdminExists() {
        WorkspaceSetupRequest setupRequest = WorkspaceSetupRequest.builder()
                .adminFullName("Secondary Admin")
                .adminUsername("sec_admin")
                .adminPassword("SecAdminPass123!")
                .adminPhone("9988776655")
                .businessName("Secondary Enterprise")
                .build();

        assertThatThrownBy(() -> authService.setupWorkspace(setupRequest))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Workspace setup has already been completed");
    }

    @Test
    @DisplayName("Security 2 — /auth/setup prevents role escalation for team members")
    void testWorkspaceSetupPreventsSecondaryAdminRoleEscalation() {
        clearAllData(); // Clear to allow setup

        WorkspaceSetupRequest setupRequest = WorkspaceSetupRequest.builder()
                .adminFullName("Initial Admin")
                .adminUsername("init_admin")
                .adminPassword("AdminPass123!")
                .adminPhone("9876543210")
                .businessName("Initial Corp")
                .teamMembers(List.of(
                        WorkspaceSetupRequest.TeamMemberSetupDto.builder()
                                .fullName("Escalated Member")
                                .username("escalated_user")
                                .password("Pass123!")
                                .role(Role.ADMIN) // Attempting ADMIN escalation
                                .phoneNumber("9876543211")
                                .build()
                ))
                .build();

        authService.setupWorkspace(setupRequest);

        User teamUser = userRepository.findByUsername("escalated_user").orElseThrow();
        assertThat(teamUser.getRole()).isNotEqualTo(Role.ADMIN);
        assertThat(teamUser.getRole()).isEqualTo(Role.MANAGER);
    }

    @Test
    @DisplayName("Security 3 — Deactivating the sole active administrator account is rejected")
    void testDeactivatingSoleAdminRejected() {
        assertThatThrownBy(() -> adminUserService.deactivateUser(primaryAdmin.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot deactivate the primary active administrator account");
    }

    @Test
    @DisplayName("Security 4 — Brute-force rate limiting locks authentication after 5 consecutive failed logins")
    void testBruteForceAuthenticationLockout() {
        LoginRequest badRequest = LoginRequest.builder()
                .username("primary_admin")
                .password("WrongPassword!")
                .build();

        // 5 Failed attempts
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> authService.login(badRequest))
                    .isInstanceOf(BadCredentialsException.class);
        }

        // 6th attempt should be blocked with rate limiting error
        assertThatThrownBy(() -> authService.login(badRequest))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Account is temporarily locked due to excessive failed attempts");
    }
}

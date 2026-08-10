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
import com.asenterprises.bms.security.JwtService;
import com.asenterprises.bms.security.LoginAttemptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service encapsulating authentication operations: verifying credentials, status checks, token generation,
 * rate limiting brute-force protection, and one-time workspace initialization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BusinessSettingsRepository businessSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;
    private final LoginAttemptService loginAttemptService;

    public LoginResponse login(LoginRequest request) {
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

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(userDetails);

        log.info("Authentication successful for user: {}", normalizedUsername);

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .build();
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
}

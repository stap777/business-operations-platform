package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.LoginResponse;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthenticationIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    private User adminUser;
    private User managerUser;
    private User deliveryUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .fullName("System Administrator")
                .username("admin_test")
                .phoneNumber("9876543210")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        managerUser = userRepository.save(User.builder()
                .fullName("Operations Manager")
                .username("manager_test")
                .phoneNumber("9876543211")
                .password(passwordEncoder.encode("ManagerPass123!"))
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryUser = userRepository.save(User.builder()
                .fullName("Delivery Person")
                .username("delivery_test")
                .phoneNumber("9876543212")
                .password(passwordEncoder.encode("DeliveryPass123!"))
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        inactiveUser = userRepository.save(User.builder()
                .fullName("Inactive Employee")
                .username("inactive_test")
                .phoneNumber("9876543213")
                .password(passwordEncoder.encode("InactivePass123!"))
                .role(Role.MANAGER)
                .status(UserStatus.INACTIVE)
                .firstLogin(false)
                .build());
    }

    @Test
    @DisplayName("Test 1 — Valid ADMIN Authentication creates session and returns matching profile")
    void testValidAdminAuthentication() {
        LoginRequest request = LoginRequest.builder()
                .username("admin_test")
                .password("AdminPass123!")
                .build();

        org.springframework.mock.web.MockHttpServletRequest mockRequest = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse mockResponse = new org.springframework.mock.web.MockHttpServletResponse();

        LoginResponse response = authService.login(request, mockRequest, mockResponse);

        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("admin_test");
        assertThat(response.getRole()).isEqualTo(Role.ADMIN);
        assertThat(response.getFullName()).isEqualTo("System Administrator");

        // Verify Set-Cookie header contains AVEN_SESSION
        String setCookieHeader = mockResponse.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).contains("AVEN_SESSION=");
        assertThat(setCookieHeader).contains("HttpOnly");
    }

    @Test
    @DisplayName("Test 2 — Wrong password throws BadCredentialsException (401)")
    void testWrongPasswordAuthentication() {
        LoginRequest request = LoginRequest.builder()
                .username("admin_test")
                .password("WrongPassword123")
                .build();

        org.springframework.mock.web.MockHttpServletRequest mockRequest = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse mockResponse = new org.springframework.mock.web.MockHttpServletResponse();

        assertThatThrownBy(() -> authService.login(request, mockRequest, mockResponse))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    @DisplayName("Test 3 — Non-existent user throws BadCredentialsException (401)")
    void testNonExistentUserAuthentication() {
        LoginRequest request = LoginRequest.builder()
                .username("unknown_user")
                .password("SomePassword123")
                .build();

        org.springframework.mock.web.MockHttpServletRequest mockRequest = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse mockResponse = new org.springframework.mock.web.MockHttpServletResponse();

        assertThatThrownBy(() -> authService.login(request, mockRequest, mockResponse))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid username or password");
    }

    @Test
    @DisplayName("Test 4 — Inactive user throws DisabledException (401)")
    void testInactiveUserAuthentication() {
        LoginRequest request = LoginRequest.builder()
                .username("inactive_test")
                .password("InactivePass123!")
                .build();

        org.springframework.mock.web.MockHttpServletRequest mockRequest = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse mockResponse = new org.springframework.mock.web.MockHttpServletResponse();

        assertThatThrownBy(() -> authService.login(request, mockRequest, mockResponse))
                .isInstanceOf(DisabledException.class)
                .hasMessage("User account is inactive");
    }

    @Test
    @DisplayName("Test 5 — Valid MANAGER Authentication returns MANAGER role")
    void testValidManagerAuthentication() {
        LoginRequest request = LoginRequest.builder()
                .username("manager_test")
                .password("ManagerPass123!")
                .build();

        org.springframework.mock.web.MockHttpServletRequest mockRequest = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse mockResponse = new org.springframework.mock.web.MockHttpServletResponse();

        LoginResponse response = authService.login(request, mockRequest, mockResponse);

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo(Role.MANAGER);
    }

    @Test
    @DisplayName("Test 6 — Valid DELIVERY Authentication returns DELIVERY role")
    void testValidDeliveryAuthentication() {
        LoginRequest request = LoginRequest.builder()
                .username("delivery_test")
                .password("DeliveryPass123!")
                .build();

        org.springframework.mock.web.MockHttpServletRequest mockRequest = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse mockResponse = new org.springframework.mock.web.MockHttpServletResponse();

        LoginResponse response = authService.login(request, mockRequest, mockResponse);

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo(Role.DELIVERY);
    }

}

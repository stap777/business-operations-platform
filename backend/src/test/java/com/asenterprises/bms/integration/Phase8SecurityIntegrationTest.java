package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.CreateUserRequest;
import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.dto.ResetPasswordRequest;
import com.asenterprises.bms.dto.UpdateUserRequest;
import com.asenterprises.bms.entity.AuditLog;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserSession;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.AuditLogRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase8SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminUser;
    private User managerUser;
    private User deliveryUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .fullName("Admin User")
                .username("admin_p8")
                .phoneNumber("9000000001")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        managerUser = userRepository.save(User.builder()
                .fullName("Manager User")
                .username("manager_p8")
                .phoneNumber("9000000002")
                .password(passwordEncoder.encode("ManagerPass123!"))
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryUser = userRepository.save(User.builder()
                .fullName("Delivery User")
                .username("delivery_p8")
                .phoneNumber("9000000003")
                .password(passwordEncoder.encode("DeliveryPass123!"))
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        inactiveUser = userRepository.save(User.builder()
                .fullName("Inactive User")
                .username("inactive_p8")
                .phoneNumber("9000000004")
                .password(passwordEncoder.encode("InactivePass123!"))
                .role(Role.MANAGER)
                .status(UserStatus.INACTIVE)
                .firstLogin(false)
                .build());
    }

    // ==========================================
    // SECTION 1: AUTHENTICATION TESTS (1-5)
    // ==========================================

    @Test
    @DisplayName("Test 1 — Valid login succeeds and returns safe user profile + authentication token/session")
    void test1_ValidLogin_Succeeds_ReturnsSafeProfileAndToken() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin_p8")
                .password("AdminPass123!")
                .build();

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin_p8"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.fullName").value("Admin User"))
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.password").doesNotExist()) // Hash leak check
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        assertThat(responseStr).doesNotContain("AdminPass123!");
    }

    @Test
    @DisplayName("Test 2 — Wrong password returns 401 Unauthorized")
    void test2_WrongPassword_Returns401() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("admin_p8")
                .password("WrongPassword123!")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 3 — Unknown user returns 401 Unauthorized")
    void test3_UnknownUser_Returns401() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("non_existent_user")
                .password("SomePass123!")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 4 — Inactive user cannot authenticate (401 Unauthorized)")
    void test4_InactiveUser_CannotAuthenticate() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("inactive_p8")
                .password("InactivePass123!")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 5 — Stored password is BCrypt hashed and never stored as plaintext")
    void test5_PasswordIsBcryptHashed() {
        User dbUser = userRepository.findByUsername("admin_p8").orElseThrow();
        assertThat(dbUser.getPassword()).startsWith("$2a$");
        assertThat(dbUser.getPassword()).isNotEqualTo("AdminPass123!");
        assertThat(passwordEncoder.matches("AdminPass123!", dbUser.getPassword())).isTrue();
    }

    // ==========================================
    // SECTION 2: SESSION/BEARER AUTHENTICATION (6-11)
    // ==========================================

    @Test
    @DisplayName("Test 6 — Valid Bearer token authenticates a protected request")
    void test6_ValidBearerToken_AuthenticatesRequest() throws Exception {
        String token = performLoginAndGetToken("admin_p8", "AdminPass123!");

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin_p8"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Test 7 — Valid AVEN_SESSION cookie authenticates a protected request")
    void test7_ValidCookie_AuthenticatesRequest() throws Exception {
        Cookie cookie = performLoginAndGetCookie("admin_p8", "AdminPass123!");

        mockMvc.perform(get("/auth/me")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin_p8"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Test 8 — Missing authentication on protected endpoint returns 401 Unauthorized")
    void test8_MissingAuth_Returns401() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 9 — Malformed token does not cause a 500 error (returns 401)")
    void test9_MalformedToken_Returns401Without500() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer invalid.malformed.token.string!"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 10 — Expired session returns 401 Unauthorized")
    void test10_ExpiredSession_Returns401() throws Exception {
        String token = performLoginAndGetToken("admin_p8", "AdminPass123!");

        // Artificially expire user session in DB
        List<UserSession> sessions = userSessionRepository.findByUserIdAndRevokedAtIsNull(adminUser.getId());
        assertThat(sessions).isNotEmpty();
        UserSession s = sessions.get(0);
        s.setExpiresAt(LocalDateTime.now().minusHours(1));
        userSessionRepository.save(s);

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 11 — Authentication results in correct username and ROLE_* authority in SecurityContext")
    void test11_SecurityContext_PopulatesUserAndRoles() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");
        String managerToken = performLoginAndGetToken("manager_p8", "ManagerPass123!");
        String deliveryToken = performLoginAndGetToken("delivery_p8", "DeliveryPass123!");

        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"));

        mockMvc.perform(get("/auth/me").header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("DELIVERY"));
    }

    // ==========================================
    // SECTION 3: AUTHORIZATION MATRIX TESTS (12-17)
    // ==========================================

    @Test
    @DisplayName("Test 12 — ADMIN can access admin-protected endpoint (/admin/users/search)")
    void test12_Admin_AccessesAdminEndpoint_Success() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        mockMvc.perform(get("/admin/users/search")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Test 13 — MANAGER receives 403 Forbidden from admin-only endpoint (/admin/users/search)")
    void test13_Manager_AccessesAdminEndpoint_Returns403() throws Exception {
        String managerToken = performLoginAndGetToken("manager_p8", "ManagerPass123!");

        mockMvc.perform(get("/admin/users/search")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 14 — DELIVERY receives 403 Forbidden from admin-only endpoint (/admin/users/search)")
    void test14_Delivery_AccessesAdminEndpoint_Returns403() throws Exception {
        String deliveryToken = performLoginAndGetToken("delivery_p8", "DeliveryPass123!");

        mockMvc.perform(get("/admin/users/search")
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 15 — MANAGER can access appropriate manager endpoint (/orders/search)")
    void test15_Manager_AccessesManagerEndpoint_Success() throws Exception {
        String managerToken = performLoginAndGetToken("manager_p8", "ManagerPass123!");

        mockMvc.perform(get("/orders/search")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Test 16 — DELIVERY receives 403 Forbidden from inappropriate manager endpoint (/orders/search)")
    void test16_Delivery_AccessesManagerEndpoint_Returns403() throws Exception {
        String deliveryToken = performLoginAndGetToken("delivery_p8", "DeliveryPass123!");

        mockMvc.perform(get("/orders/search")
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 17 — DELIVERY can access appropriate delivery endpoint (/delivery/orders)")
    void test17_Delivery_AccessesDeliveryEndpoint_Success() throws Exception {
        String deliveryToken = performLoginAndGetToken("delivery_p8", "DeliveryPass123!");

        mockMvc.perform(get("/delivery/orders")
                        .header("Authorization", "Bearer " + deliveryToken))
                .andExpect(status().isOk());
    }

    // ==========================================
    // SECTION 4: USER MANAGEMENT TESTS (18-22)
    // ==========================================

    @Test
    @DisplayName("Test 18 — ADMIN can create manager user through real API")
    void test18_Admin_CreatesManagerUser_Success() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        CreateUserRequest request = CreateUserRequest.builder()
                .fullName("New Sales Representative")
                .username("new_manager")
                .password("NewManagerPass123!")
                .phoneNumber("9000000099")
                .build();

        mockMvc.perform(post("/admin/users/manager")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("new_manager"))
                .andExpect(jsonPath("$.role").value("MANAGER"));

        User newUser = userRepository.findByUsername("new_manager").orElseThrow();
        assertThat(newUser.getRole()).isEqualTo(Role.MANAGER);
    }

    @Test
    @DisplayName("Test 19 — Created user's password is BCrypt hashed")
    void test19_CreatedUserPasswordIsBCryptHashed() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        CreateUserRequest request = CreateUserRequest.builder()
                .fullName("New Delivery Boy")
                .username("new_delivery")
                .password("NewDeliveryPass123!")
                .phoneNumber("9000000088")
                .build();

        mockMvc.perform(post("/admin/users/delivery")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        User newUser = userRepository.findByUsername("new_delivery").orElseThrow();
        assertThat(newUser.getPassword()).startsWith("$2a$");
        assertThat(passwordEncoder.matches("NewDeliveryPass123!", newUser.getPassword())).isTrue();
    }

    @Test
    @DisplayName("Test 20 — ADMIN can deactivate a user")
    void test20_Admin_DeactivatesUser_Success() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        mockMvc.perform(patch("/admin/users/" + managerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        User updatedUser = userRepository.findById(managerUser.getId()).orElseThrow();
        assertThat(updatedUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
    }

    @Test
    @DisplayName("Test 21 — Deactivated user cannot authenticate")
    void test21_DeactivatedUser_CannotAuthenticate() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        // Deactivate manager
        mockMvc.perform(patch("/admin/users/" + managerUser.getId() + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Attempt login with deactivated manager
        LoginRequest loginRequest = LoginRequest.builder()
                .username("manager_p8")
                .password("ManagerPass123!")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 22 — ADMIN can update user profile details")
    void test22_Admin_UpdatesUserDetails_Success() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        UpdateUserRequest updateRequest = UpdateUserRequest.builder()
                .fullName("Updated Manager Name")
                .phoneNumber("9000000077")
                .build();

        mockMvc.perform(put("/admin/users/" + managerUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Manager Name"))
                .andExpect(jsonPath("$.phoneNumber").value("9000000077"));
    }

    @Test
    @DisplayName("Test 23 — Authentication and Admin user actions generate audit logs")
    void test23_AuditLogsRecordedForAuthAndUserManagement() throws Exception {
        String adminToken = performLoginAndGetToken("admin_p8", "AdminPass123!");

        // Verify LOGIN_SUCCESS audit log
        List<AuditLog> loginLogs = auditLogRepository.findByEntityTypeAndAction("USER", "LOGIN_SUCCESS");
        assertThat(loginLogs).isNotEmpty();

        // Create manager
        CreateUserRequest request = CreateUserRequest.builder()
                .fullName("Audit Test Manager")
                .username("audit_manager")
                .password("AuditPass123!")
                .phoneNumber("9000000066")
                .build();

        mockMvc.perform(post("/admin/users/manager")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        List<AuditLog> createLogs = auditLogRepository.findByEntityTypeAndAction("USER", "USER_CREATED");
        assertThat(createLogs).isNotEmpty();
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private String performLoginAndGetToken(String username, String password) throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username(username)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }

    private Cookie performLoginAndGetCookie(String username, String password) throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username(username)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return result.getResponse().getCookie("AVEN_SESSION");
    }
}

package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserSession;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SessionAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .fullName("Test User")
                .username("session_user")
                .phoneNumber("9876543210")
                .password(passwordEncoder.encode("SessionPass123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());
    }

    @Test
    @DisplayName("Test 1 — Login creates DB session record and returns AVEN_SESSION HttpOnly cookie")
    void testLogin_Success_SetsCookieAndCreatesDatabaseSession() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("session_user")
                .password("SessionPass123!")
                .build();

        MvcResult result = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(jsonPath("$.username").value("session_user"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn();

        String setCookieHeader = result.getResponse().getHeader("Set-Cookie");
        assertThat(setCookieHeader).contains("AVEN_SESSION=");
        assertThat(setCookieHeader).contains("HttpOnly");
        assertThat(setCookieHeader).contains("SameSite=None");

        List<UserSession> sessions = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(sessions).hasSize(1);
        assertThat(sessions.get(0).getTokenHash()).isNotBlank();
        assertThat(sessions.get(0).getTokenHash()).doesNotContain(extractRawCookieValue(result)); // Token must be one-way hashed!
    }

    @Test
    @DisplayName("Test 2 — Login failure with wrong password creates no DB session")
    void testLogin_Failure_NoSessionCreated() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .username("session_user")
                .password("WrongPassword123!")
                .build();

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        List<UserSession> sessions = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(sessions).isEmpty();
    }

    @Test
    @DisplayName("Test 3 — Authenticated request with valid session cookie returns current user details")
    void testAuthenticatedRequest_Success() throws Exception {
        Cookie sessionCookie = performLoginAndGetCookie("session_user", "SessionPass123!");

        mockMvc.perform(get("/auth/me")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("session_user"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.fullName").value("Test User"));
    }

    @Test
    @DisplayName("Test 4 — Unauthenticated request without session cookie returns 401 Unauthorized")
    void testUnauthenticatedRequest_Fails() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 5 — Invalid session cookie fails gracefully returning 401 (no 500 error)")
    void testInvalidCookie_FailsGracefullyWithout500() throws Exception {
        Cookie fakeCookie = new Cookie("AVEN_SESSION", "invalid_fake_token_1234567890");

        mockMvc.perform(get("/auth/me")
                        .cookie(fakeCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 6 — Logout revokes database session and clears AVEN_SESSION cookie")
    void testLogout_RevokesSessionAndClearsCookie() throws Exception {
        Cookie sessionCookie = performLoginAndGetCookie("session_user", "SessionPass123!");

        mockMvc.perform(post("/auth/logout")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("AVEN_SESSION", 0));

        // Subsequent /auth/me call fails with 401
        mockMvc.perform(get("/auth/me")
                        .cookie(sessionCookie))
                .andExpect(status().isUnauthorized());

        // Verify session is marked revoked in DB
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(activeSessions).isEmpty();
    }

    @Test
    @DisplayName("Test 7 — Logout-all revokes all sessions across multiple devices")
    void testLogoutAll_RevokesAllSessions() throws Exception {
        Cookie session1Cookie = performLoginAndGetCookie("session_user", "SessionPass123!");
        Cookie session2Cookie = performLoginAndGetCookie("session_user", "SessionPass123!");

        List<UserSession> activeBefore = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(activeBefore).hasSize(2);

        // Perform logout-all from session 1
        mockMvc.perform(post("/auth/logout-all")
                        .cookie(session1Cookie))
                .andExpect(status().isOk());

        // Both sessions are now revoked
        mockMvc.perform(get("/auth/me")
                        .cookie(session1Cookie))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/auth/me")
                        .cookie(session2Cookie))
                .andExpect(status().isUnauthorized());

        List<UserSession> activeAfter = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(activeAfter).isEmpty();
    }

    @Test
    @DisplayName("Test 8 — Multiple device sessions: single logout revokes only targeted session")
    void testMultipleDeviceSessions_IsolatedRevocation() throws Exception {
        Cookie sessionA = performLoginAndGetCookie("session_user", "SessionPass123!");
        Cookie sessionB = performLoginAndGetCookie("session_user", "SessionPass123!");

        // Logout session A
        mockMvc.perform(post("/auth/logout")
                        .cookie(sessionA))
                .andExpect(status().isOk());

        // Session A is unauthorized
        mockMvc.perform(get("/auth/me")
                        .cookie(sessionA))
                .andExpect(status().isUnauthorized());

        // Session B remains valid and authorized!
        mockMvc.perform(get("/auth/me")
                        .cookie(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("session_user"));
    }

    @Test
    @DisplayName("Test 9 — Bearer header authentication fallback succeeds without session cookie")
    void testBearerAuthentication_Success() throws Exception {
        String rawToken = performLoginAndGetToken("session_user", "SessionPass123!");
        assertThat(rawToken).isNotBlank();

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("session_user"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.fullName").value("Test User"));
    }

    @Test
    @DisplayName("Test 10 — Invalid bearer token returns 401 Unauthorized")
    void testInvalidBearerToken_FailsGracefully() throws Exception {
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer invalid_fake_bearer_token_999"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 11 — Expired session via Bearer header returns 401 Unauthorized")
    void testExpiredSession_BearerHeader_Fails() throws Exception {
        String rawToken = performLoginAndGetToken("session_user", "SessionPass123!");

        // Expire the session in database
        List<UserSession> sessions = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(sessions).hasSize(1);
        UserSession s = sessions.get(0);
        s.setExpiresAt(java.time.LocalDateTime.now().minusMinutes(10));
        userSessionRepository.save(s);

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Test 12 — Revoked session via Bearer header returns 401 Unauthorized")
    void testRevokedSession_BearerHeader_Fails() throws Exception {
        String rawToken = performLoginAndGetToken("session_user", "SessionPass123!");

        // Revoke the session via logout call using Bearer header
        mockMvc.perform(post("/auth/logout")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isOk());

        // Subsequent /auth/me call with Bearer header fails with 401
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isUnauthorized());

        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndRevokedAtIsNull(testUser.getId());
        assertThat(activeSessions).isEmpty();
    }

    @Test
    @DisplayName("Test 13 — Refresh / session restoration via /auth/me with Bearer token succeeds")
    void testSessionRestoration_AuthMeWithBearer_Success() throws Exception {
        String rawToken = performLoginAndGetToken("session_user", "SessionPass123!");

        // Simulate page refresh: GET /auth/me with stored Bearer token
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("session_user"))
                .andExpect(jsonPath("$.fullName").value("Test User"));
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

        Cookie responseCookie = result.getResponse().getCookie("AVEN_SESSION");
        assertThat(responseCookie).isNotNull();
        return responseCookie;
    }

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

        String responseBody = result.getResponse().getContentAsString();
        com.fasterxml.jackson.databind.JsonNode jsonNode = objectMapper.readTree(responseBody);
        return jsonNode.has("token") ? jsonNode.get("token").asText() : "";
    }

    private String extractRawCookieValue(MvcResult result) {
        Cookie c = result.getResponse().getCookie("AVEN_SESSION");
        return c != null ? c.getValue() : "";
    }
}

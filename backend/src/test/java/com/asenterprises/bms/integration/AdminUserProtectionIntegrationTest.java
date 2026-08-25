package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.LoginRequest;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminUserProtectionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.asenterprises.bms.repository.AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User primaryAdmin;
    private User secondAdmin;
    private User managerUser;
    private User deliveryUser;
    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        auditLogRepository.deleteAll();
        userSessionRepository.deleteAll();
        userRepository.deleteAll();

        primaryAdmin = userRepository.save(User.builder()
                .fullName("Primary Admin")
                .username("primary_admin")
                .phoneNumber("9876543210")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        managerUser = userRepository.save(User.builder()
                .fullName("Test Manager")
                .username("test_manager")
                .phoneNumber("9876543211")
                .password(passwordEncoder.encode("ManagerPass123!"))
                .role(Role.MANAGER)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        deliveryUser = userRepository.save(User.builder()
                .fullName("Test Delivery")
                .username("test_delivery")
                .phoneNumber("9876543212")
                .password(passwordEncoder.encode("DeliveryPass123!"))
                .role(Role.DELIVERY)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        adminToken = performLoginAndGetToken("primary_admin", "AdminPass123!");
    }

    @Test
    @DisplayName("Test 1 — Single remaining Admin deletion request fails with HTTP 409 Conflict")
    void test1_SingleAdminDeletion_Returns409Conflict() throws Exception {
        assertThat(userRepository.countByRole(Role.ADMIN)).isEqualTo(1L);

        mockMvc.perform(delete("/admin/users/" + primaryAdmin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("The last administrator account cannot be deleted."));

        assertThat(userRepository.findById(primaryAdmin.getId())).isPresent();
    }

    @Test
    @DisplayName("Test 2 — Multiple Admins exist: deleting one Admin succeeds with HTTP 204 No Content")
    void test2_MultipleAdmins_DeleteOne_Succeeds() throws Exception {
        secondAdmin = userRepository.save(User.builder()
                .fullName("Secondary Admin")
                .username("secondary_admin")
                .phoneNumber("9876543213")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .firstLogin(false)
                .build());

        assertThat(userRepository.countByRole(Role.ADMIN)).isEqualTo(2L);

        mockMvc.perform(delete("/admin/users/" + secondAdmin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(secondAdmin.getId())).isEmpty();
        assertThat(userRepository.countByRole(Role.ADMIN)).isEqualTo(1L);
    }

    @Test
    @DisplayName("Test 3 — Deleting a Manager account succeeds with HTTP 204 No Content")
    void test3_DeleteManager_Succeeds() throws Exception {
        mockMvc.perform(delete("/admin/users/" + managerUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(managerUser.getId())).isEmpty();
    }

    @Test
    @DisplayName("Test 4 — Deleting a Delivery user account succeeds with HTTP 204 No Content")
    void test4_DeleteDeliveryUser_Succeeds() throws Exception {
        mockMvc.perform(delete("/admin/users/" + deliveryUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(deliveryUser.getId())).isEmpty();
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

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("token").asText();
    }
}

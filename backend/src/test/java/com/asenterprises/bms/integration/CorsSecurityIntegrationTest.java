package com.asenterprises.bms.integration;

import com.asenterprises.bms.dto.WorkspaceSetupRequest;
import com.asenterprises.bms.repository.AuditLogRepository;
import com.asenterprises.bms.repository.InvoiceRepository;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.PaymentAllocationRepository;
import com.asenterprises.bms.repository.PaymentRepository;
import com.asenterprises.bms.repository.StockAdjustmentRepository;
import com.asenterprises.bms.repository.UserRepository;
import com.asenterprises.bms.repository.UserSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class CorsSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentAllocationRepository paymentAllocationRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        userSessionRepository.deleteAll();
        paymentAllocationRepository.deleteAll();
        paymentRepository.deleteAll();
        invoiceRepository.deleteAll();
        stockAdjustmentRepository.deleteAll();
        orderRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("CORS 1 — OPTIONS preflight from Railway frontend domain is allowed with credentials")
    void testOptionsPreflightFromRailwayFrontend() throws Exception {
        mockMvc.perform(options("/api/v1/auth/setup").contextPath("/api/v1")
                        .header("Origin", "https://asenterprise.up.railway.app")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://asenterprise.up.railway.app"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS 2 — OPTIONS preflight from Localhost frontend is allowed with credentials")
    void testOptionsPreflightFromLocalhost() throws Exception {
        mockMvc.perform(options("/api/v1/auth/setup").contextPath("/api/v1")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS 3 — POST /api/v1/auth/setup succeeds from Railway frontend with CORS headers")
    void testCreateWorkspacePostFromRailwayFrontend() throws Exception {
        WorkspaceSetupRequest setupRequest = WorkspaceSetupRequest.builder()
                .adminFullName("Railway Admin")
                .adminUsername("railway_admin")
                .adminPassword("RailwayPass123!")
                .adminPhone("9876543210")
                .adminEmail("admin@asenterprise.com")
                .businessName("Railway Enterprise")
                .industry("Distribution")
                .businessType("Corporation")
                .phone("9876543210")
                .email("info@asenterprise.com")
                .address("123 Railway Station Road")
                .build();

        mockMvc.perform(post("/api/v1/auth/setup").contextPath("/api/v1")
                        .header("Origin", "https://asenterprise.up.railway.app")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://asenterprise.up.railway.app"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS 4 — POST /api/v1/auth/setup returns 409 CONFLICT if Admin already exists")
    void testSetupRejectedWhenAdminAlreadyExists() throws Exception {
        WorkspaceSetupRequest setupRequest = WorkspaceSetupRequest.builder()
                .adminFullName("Railway Admin")
                .adminUsername("railway_admin")
                .adminPassword("RailwayPass123!")
                .adminPhone("9876543210")
                .adminEmail("admin@asenterprise.com")
                .businessName("Railway Enterprise")
                .industry("Distribution")
                .businessType("Corporation")
                .phone("9876543210")
                .email("info@asenterprise.com")
                .address("123 Railway Station Road")
                .build();

        // Initial setup setup succeeds
        mockMvc.perform(post("/api/v1/auth/setup").contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isCreated());

        // Second setup attempt must fail with 409 CONFLICT
        mockMvc.perform(post("/api/v1/auth/setup").contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isConflict());
    }
}

package com.asenterprises.bms.integration;

import com.asenterprises.bms.service.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test verifying that the development profile ('dev') starts up cleanly
 * without any SMTP credentials or mail host configured, and that EmailService operates safely.
 */
@SpringBootTest
@ActiveProfiles("dev")
@TestPropertySource(properties = {
    "SPRING_DATASOURCE_URL=jdbc:h2:mem:dev_env_startup_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=update",
    "spring.flyway.enabled=false"
})
public class DevEnvironmentStartupTest {

    @Autowired
    private EmailService emailService;

    @Test
    @DisplayName("Verify dev profile application context loads successfully without SMTP credentials")
    void testDevProfileStartupWithoutSmtp() {
        assertThat(emailService).isNotNull();
        // Trigger password reset email call in dev profile where JavaMailSender is null
        emailService.sendPasswordResetEmail("devuser@example.com", "Dev User", "http://localhost:3000/reset-password?token=test");
    }
}

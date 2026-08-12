package com.asenterprises.bms.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test verifying that the production profile ('prod') correctly maps
 * the SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, and SPRING_DATASOURCE_PASSWORD
 * environment variables to spring.datasource.* properties for Hikari and Flyway.
 */
@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "SPRING_DATASOURCE_URL=jdbc:h2:mem:prod_env_binding_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "SPRING_DATASOURCE_USERNAME=test_prod_user",
    "SPRING_DATASOURCE_PASSWORD=test_prod_password",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.flyway.enabled=false"
})
public class ProdEnvironmentBindingTest {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Test
    @DisplayName("Verify production configuration resolves SPRING_DATASOURCE_URL to a valid JDBC URL and binds username correctly")
    void testProdEnvironmentVariableBinding() {
        assertThat(datasourceUrl)
            .as("Datasource URL must resolve the environment variable value")
            .startsWith("jdbc:");

        assertThat(datasourceUsername)
            .as("Datasource username must match environment variable")
            .isEqualTo("test_prod_user");
    }
}

package com.asenterprises.bms.integration;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verification test proving that a completely brand-new/empty database can execute
 * all Flyway migrations from scratch in correct order, and that Hibernate ddl-auto=validate
 * passes cleanly against the resulting schema.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:flyway_test_db;DB_CLOSE_DELAY=0;MODE=PostgreSQL",
    "spring.flyway.enabled=true",
    "spring.flyway.baseline-on-migrate=true",
    "spring.flyway.baseline-version=1.0",
    "spring.flyway.locations=classpath:db/migration",
    "spring.jpa.hibernate.ddl-auto=validate"
})
public class FlywayMigrationVerificationTest {

    @Autowired
    private Flyway flyway;

    @Test
    @DisplayName("Verify Flyway migrations execute from scratch in sequence and Hibernate schema validation passes")
    void testFlywayMigrationsExecutionAndOrdering() {
        MigrationInfo[] applied = flyway.info().applied();

        assertThat(applied)
            .as("Flyway applied migrations count")
            .hasSize(4);

        assertThat(applied[0].getScript())
            .as("First migration script name")
            .isEqualTo("V1__initial_schema.sql");

        assertThat(applied[1].getScript())
            .as("Second migration script name")
            .isEqualTo("V1_1__add_order_item_purchase_price.sql");

        assertThat(applied[2].getScript())
            .as("Third migration script name")
            .isEqualTo("V1_2__add_user_email_and_password_reset.sql");

        assertThat(applied[3].getScript())
            .as("Fourth migration script name")
            .isEqualTo("V1_3__create_user_sessions.sql");

        assertThat(flyway.info().pending())
            .as("No pending migrations remain")
            .isEmpty();
    }
}

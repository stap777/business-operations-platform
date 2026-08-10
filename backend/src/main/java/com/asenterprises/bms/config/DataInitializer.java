package com.asenterprises.bms.config;

import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Initializes default system users upon backend startup if no users exist.
 */
@Component
@Profile({"dev", "local"})
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Database is empty. Ready for initial workspace setup via /auth/setup.");
        }

        // Clean up legacy mock/demo employee accounts if present in dev DB
        List<String> mockUsernames = List.of("manager", "delivery", "emp_mgr_01", "emp_del_01", "testmanager", "testdelivery");
        mockUsernames.forEach(username -> {
            userRepository.findByUsername(username).ifPresent(user -> {
                log.info("Cleaning up mock/demo user account: {}", username);
                userRepository.delete(user);
            });
        });
    }
}

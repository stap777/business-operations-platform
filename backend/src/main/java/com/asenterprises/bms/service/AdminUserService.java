package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CreateUserRequest;
import com.asenterprises.bms.dto.ResetPasswordRequest;
import com.asenterprises.bms.dto.UpdateUserRequest;
import com.asenterprises.bms.dto.UserResponse;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.entity.UserStatus;
import com.asenterprises.bms.exception.ResourceNotFoundException;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing administrative user management workflows: Manager/Delivery user creation,
 * updates, password resets, and status toggles. Explicitly omits user deletion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createManager(CreateUserRequest request) {
        return createUserWithRole(request, Role.MANAGER);
    }

    @Transactional
    public UserResponse createDeliveryUser(CreateUserRequest request) {
        return createUserWithRole(request, Role.DELIVERY);
    }

    private UserResponse createUserWithRole(CreateUserRequest request, Role role) {
        String username = trim(request.getUsername());
        String phone = trim(request.getPhoneNumber());

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken");
        }

        if (userRepository.existsByPhoneNumber(phone)) {
            throw new IllegalArgumentException("Phone number '" + phone + "' is already registered");
        }

        User user = User.builder()
                .fullName(trim(request.getFullName()))
                .username(username)
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(phone)
                .role(role)
                .status(UserStatus.ACTIVE)
                .firstLogin(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Created user {} with role {}", savedUser.getUsername(), role);
        return mapToResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String newPhone = trim(request.getPhoneNumber());
        if (!user.getPhoneNumber().equalsIgnoreCase(newPhone) && userRepository.existsByPhoneNumber(newPhone)) {
            throw new IllegalArgumentException("Phone number '" + newPhone + "' is already registered to another user");
        }

        user.setFullName(trim(request.getFullName()));
        user.setPhoneNumber(newPhone);

        User updatedUser = userRepository.save(user);
        log.info("Updated profile for user {}", updatedUser.getUsername());
        return mapToResponse(updatedUser);
    }

    @Transactional
    public UserResponse activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setStatus(UserStatus.ACTIVE);
        User updatedUser = userRepository.save(user);
        log.info("Activated user {}", updatedUser.getUsername());
        return mapToResponse(updatedUser);
    }

    @Transactional
    public UserResponse deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndStatus(Role.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot deactivate the primary active administrator account.");
            }
        }

        user.setStatus(UserStatus.INACTIVE);
        User updatedUser = userRepository.save(user);
        log.info("Deactivated user {}", updatedUser.getUsername());
        return mapToResponse(updatedUser);
    }

    @Transactional
    public UserResponse resetPassword(Long userId, ResetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setFirstLogin(true);

        User updatedUser = userRepository.save(user);
        log.info("Reset password for user {}", updatedUser.getUsername());
        return mapToResponse(updatedUser);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToResponse(user);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, Role role, UserStatus status, Pageable pageable) {
        String trimmedQuery = trim(query);
        return userRepository.searchUsers(trimmedQuery, role, status, pageable)
                .map(this::mapToResponse);
    }

    private String trim(String input) {
        return (input != null && !input.trim().isEmpty()) ? input.trim() : null;
    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .firstLogin(user.isFirstLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

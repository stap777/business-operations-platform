package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing user account details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String fullName;
    private String username;
    private String phoneNumber;
    private Role role;
    private UserStatus status;
    private boolean firstLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

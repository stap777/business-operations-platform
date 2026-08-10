package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO encapsulating initial workspace setup data including primary administrator credentials,
 * business details, and optional initial team members.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceSetupRequest {

    // Primary Admin Setup Data
    @NotBlank(message = "Administrator full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String adminFullName;

    @NotBlank(message = "Administrator username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain alphanumeric characters, dots, underscores, and hyphens")
    private String adminUsername;

    private String adminEmail;

    @NotBlank(message = "Administrator password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String adminPassword;

    private String adminPhone;

    // Business Details
    @NotBlank(message = "Business name is required")
    private String businessName;

    private String industry;

    private String businessType;

    private String phone;

    private String email;

    private String address;

    private String gstNumber;

    // Optional Initial Team Members
    @Builder.Default
    private List<@Valid TeamMemberSetupDto> teamMembers = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamMemberSetupDto {

        @NotBlank(message = "Team member full name is required")
        private String fullName;

        @NotBlank(message = "Team member username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain alphanumeric characters, dots, underscores, and hyphens")
        private String username;

        @NotBlank(message = "Team member password is required")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        private String password;

        @NotNull(message = "Role is required")
        private Role role;

        private String phoneNumber;
    }
}

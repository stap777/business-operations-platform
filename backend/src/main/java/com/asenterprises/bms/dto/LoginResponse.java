package com.asenterprises.bms.dto;

import com.asenterprises.bms.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object returned upon successful authentication containing JWT and user profile details.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String username;
    private Role role;
    private String fullName;
}

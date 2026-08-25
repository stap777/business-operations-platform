package com.asenterprises.bms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for resetting all workspace data.
 * Requires strict administrator authentication and confirmation phrase.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetWorkspaceRequest {

    @NotBlank(message = "Administrator password is required")
    private String adminPassword;

    @NotBlank(message = "Confirmation text is required")
    private String confirmationText;
}

package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lightweight Data Transfer Object used for populating customer selection dropdowns in UI forms.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDropdownResponse {

    private Long id;
    private String customerCode;
    private String fullName;
}

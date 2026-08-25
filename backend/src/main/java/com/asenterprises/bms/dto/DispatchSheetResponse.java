package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchSheetResponse {
    private String businessName;
    private String logoUrl;
    private LocalDate date;
    private LocalDateTime printedAt;
    private String printedByName;
    private int totalOrders;
    private List<DispatchSheetOrderDto> orders;
}

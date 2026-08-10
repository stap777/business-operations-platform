package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Breakdown DTO summarizing delivery agent performance and order assignments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAgentPerformanceResponse {

    private Long deliveryPersonId;
    private String deliveryPersonName;
    private long totalAssigned;
    private long pendingDeliveries;
    private long completedDeliveries;
}

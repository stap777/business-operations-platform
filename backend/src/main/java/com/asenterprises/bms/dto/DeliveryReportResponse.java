package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated report DTO for delivery operation metrics and agent performance.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryReportResponse {

    private long deliveriesToday;
    private long pendingDeliveries;
    private long completedDeliveries;
    private List<DeliveryAgentPerformanceResponse> agentPerformanceList;
}

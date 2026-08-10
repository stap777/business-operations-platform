package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.DeliveryAgentPerformanceResponse;
import com.asenterprises.bms.dto.DeliveryReportResponse;
import com.asenterprises.bms.entity.DeliveryStatus;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.Role;
import com.asenterprises.bms.entity.User;
import com.asenterprises.bms.repository.OrderRepository;
import com.asenterprises.bms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service managing delivery operations performance and agent breakdown analytics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryReportService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DeliveryReportResponse getDeliveryReport() {
        return getDeliveryReport(null, null);
    }

    @Transactional(readOnly = true)
    public DeliveryReportResponse getDeliveryReport(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        long deliveriesToday = orderRepository.countOrdersBetween(startDateTime, endDateTime);
        long pendingDeliveries = orderRepository.countDeliveriesPendingBetween(startDateTime, endDateTime);
        long completedDeliveries = orderRepository.countDeliveriesCompletedBetween(startDateTime, endDateTime);

        List<User> deliveryAgents = userRepository.findByRole(Role.DELIVERY);

        List<DeliveryAgentPerformanceResponse> agentPerformanceList = new ArrayList<>();
        for (User agent : deliveryAgents) {
            long assigned = orderRepository.countAssignedDeliveriesForAgentBetween(agent.getId(), startDateTime, endDateTime);
            long pending = orderRepository.countPendingDeliveriesForAgentBetween(agent.getId(), startDateTime, endDateTime);
            long completed = orderRepository.countCompletedDeliveriesForAgentBetween(agent.getId(), startDateTime, endDateTime);

            agentPerformanceList.add(DeliveryAgentPerformanceResponse.builder()
                    .deliveryPersonId(agent.getId())
                    .deliveryPersonName(agent.getFullName())
                    .totalAssigned(assigned)
                    .pendingDeliveries(pending)
                    .completedDeliveries(completed)
                    .build());
        }

        log.info("Generated delivery report from {} to {}: {} total, {} completed, {} pending",
                start, end, deliveriesToday, completedDeliveries, pendingDeliveries);

        return DeliveryReportResponse.builder()
                .deliveriesToday(deliveriesToday)
                .pendingDeliveries(pendingDeliveries)
                .completedDeliveries(completedDeliveries)
                .agentPerformanceList(agentPerformanceList)
                .build();
    }
}

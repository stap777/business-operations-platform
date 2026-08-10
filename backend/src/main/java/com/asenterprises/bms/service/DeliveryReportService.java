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
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long deliveriesToday = orderRepository.countOrdersBetween(startOfDay, endOfDay);
        long pendingDeliveries = orderRepository.countDeliveriesPendingBetween(startOfDay, endOfDay);
        long completedDeliveries = orderRepository.countDeliveriesCompletedBetween(startOfDay, endOfDay);

        List<User> deliveryAgents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.DELIVERY)
                .toList();

        List<Order> allOrders = orderRepository.findAll();

        List<DeliveryAgentPerformanceResponse> agentPerformanceList = new ArrayList<>();
        for (User agent : deliveryAgents) {
            List<Order> agentOrders = allOrders.stream()
                    .filter(o -> o.getDeliveryPerson() != null && o.getDeliveryPerson().getId().equals(agent.getId()))
                    .toList();

            long assigned = agentOrders.size();
            long pending = agentOrders.stream().filter(o -> o.getDeliveryStatus() == DeliveryStatus.PENDING || o.getDeliveryStatus() == DeliveryStatus.OUT_FOR_DELIVERY).count();
            long completed = agentOrders.stream().filter(o -> o.getDeliveryStatus() == DeliveryStatus.DELIVERED).count();

            agentPerformanceList.add(DeliveryAgentPerformanceResponse.builder()
                    .deliveryPersonId(agent.getId())
                    .deliveryPersonName(agent.getFullName())
                    .totalAssigned(assigned)
                    .pendingDeliveries(pending)
                    .completedDeliveries(completed)
                    .build());
        }

        log.info("Generated delivery report: {} today, {} completed, {} pending",
                deliveriesToday, completedDeliveries, pendingDeliveries);

        return DeliveryReportResponse.builder()
                .deliveriesToday(deliveriesToday)
                .pendingDeliveries(pendingDeliveries)
                .completedDeliveries(completedDeliveries)
                .agentPerformanceList(agentPerformanceList)
                .build();
    }
}

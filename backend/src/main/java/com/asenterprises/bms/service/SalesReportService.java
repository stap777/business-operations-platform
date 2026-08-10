package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.SalesPeriodItemResponse;
import com.asenterprises.bms.dto.SalesReportResponse;
import com.asenterprises.bms.entity.Order;
import com.asenterprises.bms.entity.OrderStatus;
import com.asenterprises.bms.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.ArrayList;
import java.util.List;

/**
 * Service producing comprehensive multi-period sales analytics reports.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalesReportService {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public SalesReportResponse getSalesReport(LocalDate startDate, LocalDate endDate, String granularity) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        long totalOrders = orderRepository.countOrdersBetween(startDateTime, endDateTime);
        long validOrders = orderRepository.countValidOrdersBetween(startDateTime, endDateTime);
        BigDecimal totalRevenue = orderRepository.sumRevenueBetween(startDateTime, endDateTime);
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }
        BigDecimal totalDiscount = orderRepository.sumDiscountBetween(startDateTime, endDateTime);
        if (totalDiscount == null) {
            totalDiscount = BigDecimal.ZERO;
        }

        BigDecimal totalCogs = orderRepository.sumCogsBetween(startDateTime, endDateTime);
        if (totalCogs == null) {
            totalCogs = BigDecimal.ZERO;
        }
        BigDecimal grossProfit = totalRevenue.subtract(totalCogs);
        BigDecimal profitMarginPercentage = BigDecimal.ZERO;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMarginPercentage = grossProfit.multiply(BigDecimal.valueOf(100))
                    .divide(totalRevenue, 2, RoundingMode.HALF_UP);
        }

        long completedOrders = orderRepository.countOrdersBetweenAndStatus(startDateTime, endDateTime, OrderStatus.COMPLETED)
                + orderRepository.countOrdersBetweenAndStatus(startDateTime, endDateTime, OrderStatus.VERIFIED)
                + orderRepository.countOrdersBetweenAndStatus(startDateTime, endDateTime, OrderStatus.DELIVERED);

        long cancelledOrders = orderRepository.countOrdersBetweenAndStatus(startDateTime, endDateTime, OrderStatus.CANCELLED);

        BigDecimal avgOrderValue = validOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(validOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long legacyItemsCount = orderRepository.countLegacyItemsBetween(startDateTime, endDateTime);
        boolean cogsIncomplete = legacyItemsCount > 0;

        List<SalesPeriodItemResponse> periodItems = buildPeriodBreakdown(start, end, granularity);

        log.info("Generated sales report from {} to {} with granularity {}", start, end, granularity);

        return SalesReportResponse.builder()
                .granularity(granularity != null ? granularity.toUpperCase() : "DAILY")
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .totalDiscountGiven(totalDiscount)
                .averageOrderValue(avgOrderValue)
                .totalCogs(totalCogs)
                .grossProfit(grossProfit)
                .profitMarginPercentage(profitMarginPercentage)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .cogsIncomplete(cogsIncomplete)
                .items(periodItems)
                .build();
    }

    private List<SalesPeriodItemResponse> buildPeriodBreakdown(LocalDate start, LocalDate end, String granularity) {
        List<SalesPeriodItemResponse> items = new ArrayList<>();
        LocalDate current = start;
        String mode = granularity != null ? granularity.toUpperCase() : "DAILY";

        while (!current.isAfter(end)) {
            LocalDate periodEnd;
            String label;

            if ("WEEKLY".equals(mode)) {
                periodEnd = current.plusDays(6);
                if (periodEnd.isAfter(end)) {
                    periodEnd = end;
                }
                label = current + " to " + periodEnd;
            } else if ("MONTHLY".equals(mode)) {
                periodEnd = current.withDayOfMonth(current.lengthOfMonth());
                if (periodEnd.isAfter(end)) {
                    periodEnd = end;
                }
                label = current.getYear() + "-" + String.format("%02d", current.getMonthValue());
            } else {
                periodEnd = current;
                label = current.toString();
            }

            LocalDateTime pStart = current.atStartOfDay();
            LocalDateTime pEnd = periodEnd.atTime(LocalTime.MAX);

            long pOrders = orderRepository.countOrdersBetween(pStart, pEnd);
            long pValidOrders = orderRepository.countValidOrdersBetween(pStart, pEnd);
            BigDecimal pRevenue = orderRepository.sumRevenueBetween(pStart, pEnd);
            if (pRevenue == null) {
                pRevenue = BigDecimal.ZERO;
            }
            BigDecimal pDiscount = orderRepository.sumDiscountBetween(pStart, pEnd);
            if (pDiscount == null) {
                pDiscount = BigDecimal.ZERO;
            }
            BigDecimal pCogs = orderRepository.sumCogsBetween(pStart, pEnd);
            if (pCogs == null) {
                pCogs = BigDecimal.ZERO;
            }
            BigDecimal pGrossProfit = pRevenue.subtract(pCogs);
            BigDecimal pMargin = BigDecimal.ZERO;
            if (pRevenue.compareTo(BigDecimal.ZERO) > 0) {
                pMargin = pGrossProfit.multiply(BigDecimal.valueOf(100))
                        .divide(pRevenue, 2, RoundingMode.HALF_UP);
            }

            long pCompleted = orderRepository.countOrdersBetweenAndStatus(pStart, pEnd, OrderStatus.COMPLETED)
                    + orderRepository.countOrdersBetweenAndStatus(pStart, pEnd, OrderStatus.VERIFIED);
            long pCancelled = orderRepository.countOrdersBetweenAndStatus(pStart, pEnd, OrderStatus.CANCELLED);

            BigDecimal pAvg = pValidOrders > 0
                    ? pRevenue.divide(BigDecimal.valueOf(pValidOrders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            items.add(SalesPeriodItemResponse.builder()
                    .periodLabel(label)
                    .totalOrders(pOrders)
                    .revenue(pRevenue)
                    .discountGiven(pDiscount)
                    .averageOrderValue(pAvg)
                    .cogs(pCogs)
                    .grossProfit(pGrossProfit)
                    .profitMarginPercentage(pMargin)
                    .completedOrders(pCompleted)
                    .cancelledOrders(pCancelled)
                    .build());

            current = periodEnd.plusDays(1);
        }

        return items;
    }
}

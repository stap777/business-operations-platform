package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Individual running balance entry DTO in customer financial ledger (Order debits / Payment credits).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntryResponse {

    private LocalDateTime date;
    private String type; // ORDER or PAYMENT
    private String referenceNumber;
    private BigDecimal debitAmount;  // Increases balance owed
    private BigDecimal creditAmount; // Decreases balance owed
    private BigDecimal runningBalance;
    private String remarks;
}

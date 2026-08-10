package com.asenterprises.bms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Complete customer ledger statement including summary balances and chronological entries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerLedgerResponse {

    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private BigDecimal totalOrderAmount;
    private BigDecimal totalPaymentAmount;
    private BigDecimal outstandingBalance;
    private List<LedgerEntryResponse> entries;
}

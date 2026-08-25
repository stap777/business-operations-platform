package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CustomerLedgerResponse;
import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.dto.SalesReportResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Service formatting business reports into CSV, Excel-compatible text structures, and PDF placeholder reports.
 *
 * TODO (V2 Improvement): For large datasets (>10,000 records), switch from standard POI workbook to streaming SXSSFWorkbook to avoid memory overhead.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final SalesReportService salesReportService;
    private final PaymentReportService paymentReportService;
    private final InventoryReportService inventoryReportService;
    private final CustomerLedgerService customerLedgerService;
    private final com.asenterprises.bms.repository.OrderRepository orderRepository;
    private final com.asenterprises.bms.repository.CustomerRepository customerRepository;

    public byte[] exportReport(String reportType, String format, LocalDate startDate, LocalDate endDate, Long customerId) {
        String normalizedType = reportType.toLowerCase();
        String normalizedFormat = format != null ? format.toLowerCase() : "csv";

        String content;
        switch (normalizedType) {
            case "orders":
                content = formatOrdersReport(normalizedFormat);
                break;

            case "customers":
                content = formatCustomersReport(normalizedFormat);
                break;

            case "sales":
                SalesReportResponse sales = salesReportService.getSalesReport(startDate, endDate, "DAILY");
                content = formatSalesReport(sales, normalizedFormat);
                break;

            case "payments":
                PaymentReportResponse payments = paymentReportService.getPaymentReport(startDate, endDate, null);
                content = formatPaymentReport(payments, normalizedFormat);
                break;

            case "inventory":
                InventoryReportResponse inventory = inventoryReportService.getInventoryReport();
                content = formatInventoryReport(inventory, normalizedFormat);
                break;

            case "customer-ledger":
                if (customerId == null) {
                    throw new IllegalArgumentException("customerId parameter is required for customer ledger export");
                }
                CustomerLedgerResponse ledger = customerLedgerService.getCustomerLedger(customerId);
                content = formatCustomerLedger(ledger, normalizedFormat);
                break;

            default:
                throw new IllegalArgumentException("Unsupported report type: " + reportType);
        }

        log.info("Exported {} report in {} format", reportType, format);
        return content.getBytes();
    }

    private String formatSalesReport(SalesReportResponse report, String format) {
        StringBuilder sb = new StringBuilder();
        if ("pdf".equals(format)) {
            sb.append("=== A.S. ENTERPRISES SALES REPORT [PDF PLACEHOLDER] ===\n");
            sb.append("Total Orders: ").append(report.getTotalOrders()).append("\n");
            sb.append("Total Revenue: ").append(report.getTotalRevenue()).append("\n");
            sb.append("Total Discount: ").append(report.getTotalDiscountGiven()).append("\n");
            sb.append("Average Order Value: ").append(report.getAverageOrderValue()).append("\n");
            return sb.toString();
        }

        sb.append("Period,Total Orders,Revenue,Discount Given,Average Order Value,Completed Orders,Cancelled Orders\n");
        report.getItems().forEach(item -> {
            sb.append(item.getPeriodLabel()).append(",")
              .append(item.getTotalOrders()).append(",")
              .append(item.getRevenue()).append(",")
              .append(item.getDiscountGiven()).append(",")
              .append(item.getAverageOrderValue()).append(",")
              .append(item.getCompletedOrders()).append(",")
              .append(item.getCancelledOrders()).append("\n");
        });
        return sb.toString();
    }

    private String formatPaymentReport(PaymentReportResponse report, String format) {
        StringBuilder sb = new StringBuilder();
        if ("pdf".equals(format)) {
            sb.append("=== A.S. ENTERPRISES PAYMENT REPORT [PDF PLACEHOLDER] ===\n");
            sb.append("Total Payments Received: ").append(report.getTotalPaymentsReceived()).append("\n");
            sb.append("Total Outstanding: ").append(report.getTotalOutstandingAmount()).append("\n");
            return sb.toString();
        }

        sb.append("Payment Number,Payment Date,Customer,Payment Method,Total Amount\n");
        report.getRecentPayments().forEach(p -> {
            sb.append(p.getPaymentNumber()).append(",")
              .append(p.getPaymentDate()).append(",")
              .append(p.getCustomerName()).append(",")
              .append(p.getPaymentMethod()).append(",")
              .append(p.getTotalAmount()).append("\n");
        });
        return sb.toString();
    }

    private String formatInventoryReport(InventoryReportResponse report, String format) {
        StringBuilder sb = new StringBuilder();
        if ("pdf".equals(format)) {
            sb.append("=== A.S. ENTERPRISES INVENTORY REPORT [PDF PLACEHOLDER] ===\n");
            sb.append("Total Products: ").append(report.getTotalProducts()).append("\n");
            sb.append("Low Stock Count: ").append(report.getTotalLowStockCount()).append("\n");
            sb.append("Total Valuation: ").append(report.getTotalInventoryValuation()).append("\n");
            return sb.toString();
        }

        sb.append("SKU,Product Name,Category,Unit,Selling Price,Available Stock,Status\n");
        report.getLowStockProducts().forEach(p -> {
            sb.append(p.getSku()).append(",")
              .append(p.getName()).append(",")
              .append(p.getCategoryName()).append(",")
              .append(p.getUnit()).append(",")
              .append(p.getSellingPrice()).append(",")
              .append(p.getAvailableStock()).append(",")
              .append(p.getStatus()).append("\n");
        });
        return sb.toString();
    }

    private String formatCustomerLedger(CustomerLedgerResponse ledger, String format) {
        StringBuilder sb = new StringBuilder();
        if ("pdf".equals(format)) {
            sb.append("=== A.S. ENTERPRISES CUSTOMER LEDGER STATEMENT [PDF PLACEHOLDER] ===\n");
            sb.append("Customer: ").append(ledger.getCustomerName()).append("\n");
            sb.append("Outstanding Balance: ").append(ledger.getOutstandingBalance()).append("\n");
            return sb.toString();
        }

        sb.append("Date,Type,Reference Number,Debit Amount,Credit Amount,Running Balance,Remarks\n");
        ledger.getEntries().forEach(e -> {
            sb.append(e.getDate()).append(",")
              .append(e.getType()).append(",")
              .append(e.getReferenceNumber()).append(",")
              .append(e.getDebitAmount()).append(",")
              .append(e.getCreditAmount()).append(",")
              .append(e.getRunningBalance()).append(",")
              .append(e.getRemarks()).append("\n");
        });
        return sb.toString();
    }

    private String formatOrdersReport(String format) {
        StringBuilder sb = new StringBuilder();
        sb.append("Order Number,Customer,Products,Total Amount,Payment Method,Date,Status\n");
        orderRepository.findAll().forEach(order -> {
            String productSummary = order.getItems().stream()
                    .map(item -> item.getProduct().getName() + " (x" + item.getQuantity() + ")")
                    .reduce((a, b) -> a + "; " + b).orElse("-");
            productSummary = "\"" + productSummary.replace("\"", "\"\"") + "\"";
            String custName = "\"" + (order.getCustomer() != null ? order.getCustomer().getFullName().replace("\"", "\"\"") : "") + "\"";

            sb.append(order.getOrderNumber()).append(",")
              .append(custName).append(",")
              .append(productSummary).append(",")
              .append(order.getTotalAmount()).append(",")
              .append(order.getPaymentMethod() != null ? order.getPaymentMethod() : "PENDING").append(",")
              .append(order.getCreatedAt() != null ? order.getCreatedAt().toString() : "").append(",")
              .append(order.getOrderStatus()).append("\n");
        });
        return sb.toString();
    }

    private String formatCustomersReport(String format) {
        StringBuilder sb = new StringBuilder();
        sb.append("Customer Code,Full Name,Phone Number,Alternate Phone,Address,Status\n");
        customerRepository.findAll().forEach(cust -> {
            String name = "\"" + (cust.getFullName() != null ? cust.getFullName().replace("\"", "\"\"") : "") + "\"";
            String addr = "\"" + (cust.getAddress() != null ? cust.getAddress().replace("\"", "\"\"") : "") + "\"";
            sb.append(cust.getCustomerCode()).append(",")
              .append(name).append(",")
              .append(cust.getPhoneNumber() != null ? cust.getPhoneNumber() : "").append(",")
              .append(cust.getAlternatePhoneNumber() != null ? cust.getAlternatePhoneNumber() : "").append(",")
              .append(addr).append(",")
              .append(cust.getStatus()).append("\n");
        });
        return sb.toString();
    }
}

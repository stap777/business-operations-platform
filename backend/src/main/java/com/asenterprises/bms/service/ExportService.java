package com.asenterprises.bms.service;

import com.asenterprises.bms.dto.CustomerLedgerResponse;
import com.asenterprises.bms.dto.InventoryReportResponse;
import com.asenterprises.bms.dto.PaymentReportResponse;
import com.asenterprises.bms.dto.SalesReportResponse;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service formatting business reports into CSV, Excel-compatible text structures, and binary PDF reports.
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

        boolean isPdf = "pdf".equalsIgnoreCase(normalizedFormat);

        switch (normalizedType) {
            case "orders":
                return isPdf ? generateOrdersPdf() : formatOrdersReport().getBytes();

            case "customers":
                return isPdf ? generateCustomersPdf() : formatCustomersReport().getBytes();

            case "sales":
                SalesReportResponse sales = salesReportService.getSalesReport(startDate, endDate, "DAILY");
                return isPdf ? generateSalesPdf(sales) : formatSalesReport(sales).getBytes();

            case "payments":
                PaymentReportResponse payments = paymentReportService.getPaymentReport(startDate, endDate, null);
                return isPdf ? generatePaymentPdf(payments) : formatPaymentReport(payments).getBytes();

            case "inventory":
                InventoryReportResponse inventory = inventoryReportService.getInventoryReport();
                return isPdf ? generateInventoryPdf(inventory) : formatInventoryReport(inventory).getBytes();

            case "customer-ledger":
                if (customerId == null) {
                    throw new IllegalArgumentException("customerId parameter is required for customer ledger export");
                }
                CustomerLedgerResponse ledger = customerLedgerService.getCustomerLedger(customerId);
                return isPdf ? generateCustomerLedgerPdf(ledger) : formatCustomerLedger(ledger).getBytes();

            default:
                throw new IllegalArgumentException("Unsupported report type: " + reportType);
        }
    }

    // --- PDF Generators ---

    private byte[] generateOrdersPdf() {
        String[] headers = {"Order #", "Customer", "Total Amount", "Payment Method", "Date", "Status"};
        List<String[]> rows = new ArrayList<>();
        orderRepository.findAll().forEach(order -> {
            String custName = order.getCustomer() != null ? order.getCustomer().getFullName() : "Walk-in";
            rows.add(new String[]{
                order.getOrderNumber(),
                custName,
                "Rs. " + (order.getTotalAmount() != null ? order.getTotalAmount().toString() : "0"),
                order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "PENDING",
                order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().toString() : "",
                order.getOrderStatus() != null ? order.getOrderStatus().name() : ""
            });
        });
        return buildPdfDocument("Orders Report", headers, rows, "Total Orders: " + rows.size());
    }

    private byte[] generateCustomersPdf() {
        String[] headers = {"Code", "Full Name", "Phone Number", "Address", "Status"};
        List<String[]> rows = new ArrayList<>();
        customerRepository.findAll().forEach(cust -> {
            rows.add(new String[]{
                cust.getCustomerCode() != null ? cust.getCustomerCode() : "",
                cust.getFullName() != null ? cust.getFullName() : "",
                cust.getPhoneNumber() != null ? cust.getPhoneNumber() : "",
                cust.getAddress() != null ? cust.getAddress() : "",
                cust.getStatus() != null ? cust.getStatus().name() : "ACTIVE"
            });
        });
        return buildPdfDocument("Customers Directory Report", headers, rows, "Total Customers: " + rows.size());
    }

    private byte[] generateSalesPdf(SalesReportResponse report) {
        String summary = String.format("Total Revenue: Rs. %s | Total Orders: %s | Total Discount: Rs. %s",
                report.getTotalRevenue(), report.getTotalOrders(), report.getTotalDiscountGiven());
        String[] headers = {"Period", "Total Orders", "Revenue", "Discount", "Avg Order Value"};
        List<String[]> rows = new ArrayList<>();
        if (report.getItems() != null) {
            report.getItems().forEach(item -> {
                rows.add(new String[]{
                    item.getPeriodLabel(),
                    String.valueOf(item.getTotalOrders()),
                    "Rs. " + item.getRevenue(),
                    "Rs. " + item.getDiscountGiven(),
                    "Rs. " + item.getAverageOrderValue()
                });
            });
        }
        return buildPdfDocument("Sales & Revenue Report", headers, rows, summary);
    }

    private byte[] generatePaymentPdf(PaymentReportResponse report) {
        String summary = String.format("Total Payments Received: Rs. %s | Total Outstanding: Rs. %s",
                report.getTotalPaymentsReceived(), report.getTotalOutstandingAmount());
        String[] headers = {"Payment #", "Date", "Customer", "Method", "Amount"};
        List<String[]> rows = new ArrayList<>();
        if (report.getRecentPayments() != null) {
            report.getRecentPayments().forEach(p -> {
                rows.add(new String[]{
                    p.getPaymentNumber(),
                    p.getPaymentDate() != null ? p.getPaymentDate().toString() : "",
                    p.getCustomerName(),
                    p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "",
                    "Rs. " + p.getTotalAmount()
                });
            });
        }
        return buildPdfDocument("Payment Audit Report", headers, rows, summary);
    }

    private byte[] generateInventoryPdf(InventoryReportResponse report) {
        String summary = String.format("Total Products: %s | Low Stock Alert Count: %s | Total Inventory Value: Rs. %s",
                report.getTotalProducts(), report.getTotalLowStockCount(), report.getTotalInventoryValuation());
        String[] headers = {"SKU", "Product Name", "Category", "Selling Price", "Available Stock", "Status"};
        List<String[]> rows = new ArrayList<>();
        if (report.getLowStockProducts() != null) {
            report.getLowStockProducts().forEach(p -> {
                rows.add(new String[]{
                    p.getSku(),
                    p.getName(),
                    p.getCategoryName(),
                    "Rs. " + p.getSellingPrice(),
                    String.valueOf(p.getAvailableStock()),
                    p.getStatus() != null ? p.getStatus().name() : ""
                });
            });
        }
        return buildPdfDocument("Inventory Valuation & Low Stock Report", headers, rows, summary);
    }

    private byte[] generateCustomerLedgerPdf(CustomerLedgerResponse ledger) {
        String summary = String.format("Customer: %s | Outstanding Balance: Rs. %s",
                ledger.getCustomerName(), ledger.getOutstandingBalance());
        String[] headers = {"Date", "Type", "Ref #", "Debit", "Credit", "Balance", "Remarks"};
        List<String[]> rows = new ArrayList<>();
        if (ledger.getEntries() != null) {
            ledger.getEntries().forEach(e -> {
                rows.add(new String[]{
                    e.getDate() != null ? e.getDate().toString() : "",
                    e.getType(),
                    e.getReferenceNumber(),
                    "Rs. " + e.getDebitAmount(),
                    "Rs. " + e.getCreditAmount(),
                    "Rs. " + e.getRunningBalance(),
                    e.getRemarks() != null ? e.getRemarks() : ""
                });
            });
        }
        return buildPdfDocument("Customer Ledger Statement", headers, rows, summary);
    }

    // OpenPDF Helper
    private byte[] buildPdfDocument(String title, String[] headers, List<String[]> rows, String summaryInfo) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Brand Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, Color.BLACK);
            Paragraph pTitle = new Paragraph("A.S. ENTERPRISES - " + title.toUpperCase(), titleFont);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(pTitle);

            // Subtitle Date
            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
            Paragraph pSub = new Paragraph("Report Date: " + LocalDate.now().toString(), subFont);
            pSub.setAlignment(Element.ALIGN_CENTER);
            pSub.setSpacingAfter(8f);
            document.add(pSub);

            // Summary Bar
            if (summaryInfo != null && !summaryInfo.isBlank()) {
                Font summaryFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);
                Paragraph pSummary = new Paragraph(summaryInfo, summaryFont);
                pSummary.setAlignment(Element.ALIGN_LEFT);
                pSummary.setSpacingAfter(10f);
                document.add(pSummary);
            }

            // Data Table
            if (headers != null && headers.length > 0) {
                PdfPTable table = new PdfPTable(headers.length);
                table.setWidthPercentage(100);

                Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
                for (String header : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                    cell.setBackgroundColor(new Color(30, 41, 59)); // Slate dark header
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cell.setPadding(5f);
                    table.addCell(cell);
                }

                Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
                for (String[] row : rows) {
                    for (String cellValue : row) {
                        PdfPCell cell = new PdfPCell(new Phrase(cellValue != null ? cellValue : "", dataFont));
                        cell.setPadding(4f);
                        table.addCell(cell);
                    }
                }

                document.add(table);
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF document for report: {}", title, e);
            throw new RuntimeException("Error generating PDF document report", e);
        }
    }

    // --- CSV Format Handlers ---

    private String formatSalesReport(SalesReportResponse report) {
        StringBuilder sb = new StringBuilder();
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

    private String formatPaymentReport(PaymentReportResponse report) {
        StringBuilder sb = new StringBuilder();
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

    private String formatInventoryReport(InventoryReportResponse report) {
        StringBuilder sb = new StringBuilder();
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

    private String formatCustomerLedger(CustomerLedgerResponse ledger) {
        StringBuilder sb = new StringBuilder();
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

    private String formatOrdersReport() {
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
              .append(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "PENDING").append(",")
              .append(order.getCreatedAt() != null ? order.getCreatedAt().toString() : "").append(",")
              .append(order.getOrderStatus()).append("\n");
        });
        return sb.toString();
    }

    private String formatCustomersReport() {
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

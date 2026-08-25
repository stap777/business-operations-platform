package com.asenterprises.bms.controller;

import com.asenterprises.bms.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * REST controller for report export downloads (/api/v1/exports).
 */
@RestController
@RequestMapping("/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportType,
            @RequestParam(required = false, defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long customerId) {

        byte[] data = exportService.exportReport(reportType, format, startDate, endDate, customerId);

        boolean isPdf = "pdf".equalsIgnoreCase(format);
        boolean isXlsx = "xlsx".equalsIgnoreCase(format) || "excel".equalsIgnoreCase(format);

        String fileExtension = isPdf ? "pdf" : (isXlsx ? "xlsx" : "csv");
        String formattedTitle = reportType.substring(0, 1).toUpperCase() + reportType.substring(1);
        String dateSuffix = LocalDate.now().toString();
        String filename = formattedTitle + "_" + dateSuffix + "." + fileExtension;

        MediaType mediaType;
        if (isPdf) {
            mediaType = MediaType.APPLICATION_PDF;
        } else if (isXlsx) {
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            mediaType = MediaType.TEXT_PLAIN;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }
}

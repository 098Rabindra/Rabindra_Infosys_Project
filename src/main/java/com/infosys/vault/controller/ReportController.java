package com.infosys.vault.controller;

import com.infosys.vault.dto.ApiResponse;
import com.infosys.vault.dto.LoginActivityReportResponse;
import com.infosys.vault.dto.PasswordHealthReportResponse;
import com.infosys.vault.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/password-health")
    public ResponseEntity<?> getPasswordHealthReport(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            PasswordHealthReportResponse response = reportService.getPasswordHealthReport(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/login-activity")
    public ResponseEntity<?> getLoginActivityReport(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            LoginActivityReportResponse response = reportService.getLoginActivityReport(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}

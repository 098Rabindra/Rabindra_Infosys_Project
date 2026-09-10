package com.infosys.vault.controller;

import com.infosys.vault.dto.ApiResponse;
import com.infosys.vault.dto.SecurityAnalyticsDTO;
import com.infosys.vault.model.AuditLog;
import com.infosys.vault.model.SecurityAlert;
import com.infosys.vault.model.SuspiciousActivity;
import com.infosys.vault.service.SecurityAuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final SecurityAuditService securityAuditService;

    public SecurityController(SecurityAuditService securityAuditService) {
        this.securityAuditService = securityAuditService;
    }

    @GetMapping("/suspicious-activities")
    public ResponseEntity<?> getSuspiciousActivities(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            List<SuspiciousActivity> list = securityAuditService.getSuspiciousActivities(userId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getSecurityAlerts(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            List<SecurityAlert> alerts = securityAuditService.getSecurityAlerts(userId);
            return ResponseEntity.ok(alerts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PatchMapping("/alerts/{id}/read")
    public ResponseEntity<?> markAlertAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        try {
            String userId = userDetails.getUsername();
            securityAuditService.markAlertAsRead(userId, id);
            return ResponseEntity.ok(new ApiResponse(true, "Alert marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            List<AuditLog> auditLogs = securityAuditService.getAuditLogs(userId);
            return ResponseEntity.ok(auditLogs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getSecurityAnalytics(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            SecurityAnalyticsDTO analytics = securityAuditService.getSecurityAnalytics(userId);
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}

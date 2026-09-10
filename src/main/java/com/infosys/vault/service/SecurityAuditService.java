package com.infosys.vault.service;

import com.infosys.vault.dto.SecurityAnalyticsDTO;
import com.infosys.vault.model.AuditLog;
import com.infosys.vault.model.LoginSecurity;
import com.infosys.vault.model.SecurityAlert;
import com.infosys.vault.model.SuspiciousActivity;
import com.infosys.vault.model.User;
import com.infosys.vault.repository.AuditLogRepository;
import com.infosys.vault.repository.LoginSecurityRepository;
import com.infosys.vault.repository.SecurityAlertRepository;
import com.infosys.vault.repository.SuspiciousActivityRepository;
import com.infosys.vault.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class SecurityAuditService {

    private final SuspiciousActivityRepository suspiciousActivityRepository;
    private final SecurityAlertRepository securityAlertRepository;
    private final AuditLogRepository auditLogRepository;
    private final LoginSecurityRepository loginSecurityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SecurityAuditService(
            SuspiciousActivityRepository suspiciousActivityRepository,
            SecurityAlertRepository securityAlertRepository,
            AuditLogRepository auditLogRepository,
            LoginSecurityRepository loginSecurityRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.suspiciousActivityRepository = suspiciousActivityRepository;
        this.securityAlertRepository = securityAlertRepository;
        this.auditLogRepository = auditLogRepository;
        this.loginSecurityRepository = loginSecurityRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAuditLog(Long userId, String email, String action, String description) {
        try {
            AuditLog auditLog = new AuditLog(userId, email, action, description);
            auditLogRepository.saveAndFlush(auditLog);
        } catch (IllegalArgumentException | org.springframework.dao.DataAccessException e) {
            System.err.println("Failed to record audit log: " + e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void evaluateAndDetectSuspiciousActivity(String identifier, Long userId) {
        try {
            if (identifier == null || identifier.trim().isEmpty()) {
                return;
            }
            String cleanEmail = identifier.trim();

            User user;
            if (userId != null) {
                user = userRepository.findById(userId).orElse(null);
            } else {
                user = userRepository.findByEmail(cleanEmail)
                        .orElseGet(() -> userRepository.findByUsername(cleanEmail).orElse(null));
            }

            String searchEmail = user != null ? user.getEmail() : cleanEmail;
            String searchUsername = user != null ? user.getUsername() : cleanEmail;
            Long targetUserId = user != null ? user.getId() : null;

            // Fetch recent login security logs
            List<LoginSecurity> recentLogs = loginSecurityRepository
                    .findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(searchEmail, searchUsername);

            if (recentLogs == null || recentLogs.isEmpty()) {
                return;
            }

            // Count failed attempts in recent 15 minutes or top 5 attempts
            LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);
            long failedCount = 0;
            for (LoginSecurity log : recentLogs) {
                if (log.getTimestamp() != null && log.getTimestamp().isAfter(fifteenMinsAgo)) {
                    if ("FAILED".equalsIgnoreCase(log.getLoginStatus())) {
                        failedCount++;
                    }
                }
            }

            // Also check if latest consecutive attempts are failed (at least 3)
            if (failedCount < 3) {
                long consecutiveFailed = 0;
                for (LoginSecurity log : recentLogs) {
                    if ("FAILED".equalsIgnoreCase(log.getLoginStatus())) {
                        consecutiveFailed++;
                    } else {
                        break;
                    }
                }
                if (consecutiveFailed >= 3) {
                    failedCount = consecutiveFailed;
                }
            }

            // Threshold rule: >= 3 failed logins triggers suspicious activity
            if (failedCount >= 3) {
                // Check if a suspicious activity was created in last 5 minutes to avoid duplication
                List<SuspiciousActivity> existing = suspiciousActivityRepository
                        .findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByDetectedAtDesc(searchEmail, searchUsername);

                boolean recentFlagged = false;
                if (existing != null && !existing.isEmpty()) {
                    LocalDateTime topTime = existing.get(0).getDetectedAt();
                    if (topTime != null && topTime.isAfter(LocalDateTime.now().minusMinutes(5))) {
                        recentFlagged = true;
                    }
                }

                if (!recentFlagged) {
                    String desc = "Multiple failed login attempts (" + failedCount + ") detected within a short timeframe.";

                    // 1. Store SuspiciousActivity
                    SuspiciousActivity suspicious = new SuspiciousActivity(
                            targetUserId, searchEmail, "Multiple Failed Logins", desc);
                    suspiciousActivityRepository.saveAndFlush(suspicious);

                    // 2. Store SecurityAlert
                    SecurityAlert alert = new SecurityAlert(
                            targetUserId, searchEmail, "MULTIPLE_FAILED_LOGINS",
                            "⚠ Multiple Failed Login Attempts detected for " + searchEmail + " (" + failedCount + " failed attempts)",
                            "HIGH");
                    securityAlertRepository.saveAndFlush(alert);

                    // 3. Store Audit Logs
                    recordAuditLog(targetUserId, searchEmail, "Suspicious Activity", desc);
                    recordAuditLog(targetUserId, searchEmail, "Security Alert Created", "High severity security alert created for " + searchEmail);

                    // 4. Create In-App Notification & Send Email
                    if (targetUserId != null) {
                        notificationService.createNotification(
                                targetUserId,
                                "FAILED_LOGIN",
                                "Security Alert: Multiple Failed Logins",
                                "Multiple failed login attempts (" + failedCount + ") were detected on your account. Please verify your account security."
                        );
                        notificationService.createNotification(
                                targetUserId,
                                "SUSPICIOUS_ACTIVITY",
                                "Risk Alert: Suspicious Activity Detected",
                                "Suspicious activity was detected on your SecureVault account (" + searchEmail + "). Please review your security logs."
                        );
                    }
                }
            }
        } catch (IllegalArgumentException | org.springframework.dao.DataAccessException e) {
            System.err.println("Failed to evaluate suspicious activity: " + e.getMessage());
        }
    }

    public List<SuspiciousActivity> getSuspiciousActivities(String userIdStr) {
        try {
            long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                return suspiciousActivityRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByDetectedAtDesc(user.getEmail(), user.getUsername());
            }
        } catch (NumberFormatException ignored) {
        }
        return Collections.emptyList();
    }

    public List<SecurityAlert> getSecurityAlerts(String userIdStr) {
        try {
            long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                return securityAlertRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail(), user.getUsername());
            }
        } catch (NumberFormatException ignored) {
        }
        return Collections.emptyList();
    }

    @Transactional
    public void markAlertAsRead(String userIdStr, Long alertId) {
        if (alertId == null) return;
        try {
            long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                SecurityAlert alert = securityAlertRepository.findById(alertId).orElse(null);
                if (alert != null && alert.getEmail() != null &&
                        (alert.getEmail().equalsIgnoreCase(user.getEmail()) || alert.getEmail().equalsIgnoreCase(user.getUsername()))) {
                    alert.setStatus("READ");
                    securityAlertRepository.save(alert);
                }
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Failed to mark alert as read: " + e.getMessage(), e);
        }
    }

    public List<AuditLog> getAuditLogs(String userIdStr) {
        try {
            long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                return auditLogRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(user.getEmail(), user.getUsername());
            }
        } catch (NumberFormatException ignored) {
        }
        return Collections.emptyList();
    }

    public SecurityAnalyticsDTO getSecurityAnalytics(String userIdStr) {
        String email;
        String username;

        try {
            long userId = Long.parseLong(userIdStr);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                email = user.getEmail();
                username = user.getUsername();
            } else {
                email = userIdStr;
                username = userIdStr;
            }
        } catch (NumberFormatException e) {
            email = userIdStr;
            username = userIdStr;
        }

        List<LoginSecurity> loginLogs = loginSecurityRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(email, username);
        if (loginLogs == null) loginLogs = Collections.emptyList();

        long totalLogins = loginLogs.size();
        long successfulLogins = loginLogs.stream().filter(l -> "SUCCESS".equalsIgnoreCase(l.getLoginStatus())).count();
        long failedLogins = loginLogs.stream().filter(l -> "FAILED".equalsIgnoreCase(l.getLoginStatus())).count();
        double successRate = totalLogins > 0 ? ((double) successfulLogins / totalLogins) * 100.0 : 100.0;

        List<SuspiciousActivity> suspiciousList = suspiciousActivityRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByDetectedAtDesc(email, username);
        if (suspiciousList == null) suspiciousList = Collections.emptyList();

        long suspiciousCount = suspiciousList.size();
        long flaggedSuspiciousCount = suspiciousList.stream().filter(s -> "FLAGGED".equalsIgnoreCase(s.getStatus())).count();

        List<SecurityAlert> alertsList = securityAlertRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByCreatedAtDesc(email, username);
        if (alertsList == null) alertsList = Collections.emptyList();

        long totalAlerts = alertsList.size();
        long unreadAlerts = alertsList.stream().filter(a -> "UNREAD".equalsIgnoreCase(a.getStatus())).count();
        long highSeverityAlerts = alertsList.stream().filter(a -> "HIGH".equalsIgnoreCase(a.getSeverity())).count();

        List<AuditLog> auditLogs = auditLogRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(email, username);
        if (auditLogs == null) auditLogs = Collections.emptyList();

        List<LoginSecurity> recentLogins = loginLogs.stream().limit(10).toList();
        List<SuspiciousActivity> recentSuspicious = suspiciousList.stream().limit(10).toList();
        List<SecurityAlert> recentAlerts = alertsList.stream().limit(10).toList();
        List<AuditLog> recentAudit = auditLogs.stream().limit(10).toList();

        return new SecurityAnalyticsDTO(
                totalLogins, successfulLogins, failedLogins, Math.round(successRate * 10.0) / 10.0,
                suspiciousCount, flaggedSuspiciousCount,
                totalAlerts, unreadAlerts, highSeverityAlerts,
                recentLogins, recentSuspicious, recentAlerts, recentAudit
        );
    }
}

package com.infosys.vault.dto;

import com.infosys.vault.model.AuditLog;
import com.infosys.vault.model.LoginSecurity;
import com.infosys.vault.model.SecurityAlert;
import com.infosys.vault.model.SuspiciousActivity;

import java.util.List;

public class SecurityAnalyticsDTO {
    private long totalLogins;
    private long successfulLogins;
    private long failedLogins;
    private double successRatePercentage;

    private long suspiciousActivitiesCount;
    private long flaggedSuspiciousCount;

    private long totalAlertsCount;
    private long unreadAlertsCount;
    private long highSeverityAlertsCount;

    private List<LoginSecurity> recentLoginActivities;
    private List<SuspiciousActivity> recentSuspiciousActivities;
    private List<SecurityAlert> recentSecurityAlerts;
    private List<AuditLog> recentAuditLogs;

    public SecurityAnalyticsDTO() {
    }

    public SecurityAnalyticsDTO(long totalLogins, long successfulLogins, long failedLogins, double successRatePercentage,
                                long suspiciousActivitiesCount, long flaggedSuspiciousCount,
                                long totalAlertsCount, long unreadAlertsCount, long highSeverityAlertsCount,
                                List<LoginSecurity> recentLoginActivities, List<SuspiciousActivity> recentSuspiciousActivities,
                                List<SecurityAlert> recentSecurityAlerts, List<AuditLog> recentAuditLogs) {
        this.totalLogins = totalLogins;
        this.successfulLogins = successfulLogins;
        this.failedLogins = failedLogins;
        this.successRatePercentage = successRatePercentage;
        this.suspiciousActivitiesCount = suspiciousActivitiesCount;
        this.flaggedSuspiciousCount = flaggedSuspiciousCount;
        this.totalAlertsCount = totalAlertsCount;
        this.unreadAlertsCount = unreadAlertsCount;
        this.highSeverityAlertsCount = highSeverityAlertsCount;
        this.recentLoginActivities = recentLoginActivities;
        this.recentSuspiciousActivities = recentSuspiciousActivities;
        this.recentSecurityAlerts = recentSecurityAlerts;
        this.recentAuditLogs = recentAuditLogs;
    }

    public long getTotalLogins() {
        return totalLogins;
    }

    public void setTotalLogins(long totalLogins) {
        this.totalLogins = totalLogins;
    }

    public long getSuccessfulLogins() {
        return successfulLogins;
    }

    public void setSuccessfulLogins(long successfulLogins) {
        this.successfulLogins = successfulLogins;
    }

    public long getFailedLogins() {
        return failedLogins;
    }

    public void setFailedLogins(long failedLogins) {
        this.failedLogins = failedLogins;
    }

    public double getSuccessRatePercentage() {
        return successRatePercentage;
    }

    public void setSuccessRatePercentage(double successRatePercentage) {
        this.successRatePercentage = successRatePercentage;
    }

    public long getSuspiciousActivitiesCount() {
        return suspiciousActivitiesCount;
    }

    public void setSuspiciousActivitiesCount(long suspiciousActivitiesCount) {
        this.suspiciousActivitiesCount = suspiciousActivitiesCount;
    }

    public long getFlaggedSuspiciousCount() {
        return flaggedSuspiciousCount;
    }

    public void setFlaggedSuspiciousCount(long flaggedSuspiciousCount) {
        this.flaggedSuspiciousCount = flaggedSuspiciousCount;
    }

    public long getTotalAlertsCount() {
        return totalAlertsCount;
    }

    public void setTotalAlertsCount(long totalAlertsCount) {
        this.totalAlertsCount = totalAlertsCount;
    }

    public long getUnreadAlertsCount() {
        return unreadAlertsCount;
    }

    public void setUnreadAlertsCount(long unreadAlertsCount) {
        this.unreadAlertsCount = unreadAlertsCount;
    }

    public long getHighSeverityAlertsCount() {
        return highSeverityAlertsCount;
    }

    public void setHighSeverityAlertsCount(long highSeverityAlertsCount) {
        this.highSeverityAlertsCount = highSeverityAlertsCount;
    }

    public List<LoginSecurity> getRecentLoginActivities() {
        return recentLoginActivities;
    }

    public void setRecentLoginActivities(List<LoginSecurity> recentLoginActivities) {
        this.recentLoginActivities = recentLoginActivities;
    }

    public List<SuspiciousActivity> getRecentSuspiciousActivities() {
        return recentSuspiciousActivities;
    }

    public void setRecentSuspiciousActivities(List<SuspiciousActivity> recentSuspiciousActivities) {
        this.recentSuspiciousActivities = recentSuspiciousActivities;
    }

    public List<SecurityAlert> getRecentSecurityAlerts() {
        return recentSecurityAlerts;
    }

    public void setRecentSecurityAlerts(List<SecurityAlert> recentSecurityAlerts) {
        this.recentSecurityAlerts = recentSecurityAlerts;
    }

    public List<AuditLog> getRecentAuditLogs() {
        return recentAuditLogs;
    }

    public void setRecentAuditLogs(List<AuditLog> recentAuditLogs) {
        this.recentAuditLogs = recentAuditLogs;
    }
}

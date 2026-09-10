package com.infosys.vault.dto;

import com.infosys.vault.model.LoginSecurity;

import java.util.List;

public class LoginActivityReportResponse {
    private long totalAttempts;
    private long successfulLogins;
    private long failedLogins;
    private double successRate;
    private List<LoginSecurity> recentActivities;

    public LoginActivityReportResponse() {
    }

    public LoginActivityReportResponse(long totalAttempts, long successfulLogins, long failedLogins, double successRate, List<LoginSecurity> recentActivities) {
        this.totalAttempts = totalAttempts;
        this.successfulLogins = successfulLogins;
        this.failedLogins = failedLogins;
        this.successRate = successRate;
        this.recentActivities = recentActivities;
    }

    public long getTotalAttempts() {
        return totalAttempts;
    }

    public void setTotalAttempts(long totalAttempts) {
        this.totalAttempts = totalAttempts;
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

    public double getSuccessRate() {
        return successRate;
    }

    public void setSuccessRate(double successRate) {
        this.successRate = successRate;
    }

    public List<LoginSecurity> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<LoginSecurity> recentActivities) {
        this.recentActivities = recentActivities;
    }
}

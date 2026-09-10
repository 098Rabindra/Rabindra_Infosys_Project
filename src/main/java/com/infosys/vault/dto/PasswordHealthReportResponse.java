package com.infosys.vault.dto;

import java.util.List;

public class PasswordHealthReportResponse {
    private long totalCredentials;
    private long strongCount;
    private long mediumCount;
    private long weakCount;
    private double healthScore;
    private String summary;
    private List<CredentialHealthSummary> items;

    public PasswordHealthReportResponse() {
    }

    public PasswordHealthReportResponse(long totalCredentials, long strongCount, long mediumCount, long weakCount, double healthScore, String summary, List<CredentialHealthSummary> items) {
        this.totalCredentials = totalCredentials;
        this.strongCount = strongCount;
        this.mediumCount = mediumCount;
        this.weakCount = weakCount;
        this.healthScore = healthScore;
        this.summary = summary;
        this.items = items;
    }

    public long getTotalCredentials() {
        return totalCredentials;
    }

    public void setTotalCredentials(long totalCredentials) {
        this.totalCredentials = totalCredentials;
    }

    public long getStrongCount() {
        return strongCount;
    }

    public void setStrongCount(long strongCount) {
        this.strongCount = strongCount;
    }

    public long getMediumCount() {
        return mediumCount;
    }

    public void setMediumCount(long mediumCount) {
        this.mediumCount = mediumCount;
    }

    public long getWeakCount() {
        return weakCount;
    }

    public void setWeakCount(long weakCount) {
        this.weakCount = weakCount;
    }

    public double getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(double healthScore) {
        this.healthScore = healthScore;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<CredentialHealthSummary> getItems() {
        return items;
    }

    public void setItems(List<CredentialHealthSummary> items) {
        this.items = items;
    }

    public static class CredentialHealthSummary {
        private String id;
        private String title;
        private String username;
        private String category;
        private String strengthLabel;
        private int score;

        public CredentialHealthSummary() {
        }

        public CredentialHealthSummary(String id, String title, String username, String category, String strengthLabel, int score) {
            this.id = id;
            this.title = title;
            this.username = username;
            this.category = category;
            this.strengthLabel = strengthLabel;
            this.score = score;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public String getStrengthLabel() {
            return strengthLabel;
        }

        public void setStrengthLabel(String strengthLabel) {
            this.strengthLabel = strengthLabel;
        }

        public int getScore() {
            return score;
        }

        public void setScore(int score) {
            this.score = score;
        }
    }
}

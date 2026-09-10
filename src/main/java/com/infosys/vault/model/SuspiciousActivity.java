package com.infosys.vault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suspicious_activities")
public class SuspiciousActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String email;

    @Column(name = "activity_type", nullable = false)
    private String activityType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(nullable = false)
    private String status; // FLAGGED, RESOLVED

    public SuspiciousActivity() {
        this.detectedAt = LocalDateTime.now();
        this.status = "FLAGGED";
    }

    public SuspiciousActivity(Long userId, String email, String activityType, String description) {
        this();
        this.userId = userId;
        this.email = email;
        this.activityType = activityType;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getActivityType() {
        return activityType;
    }

    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

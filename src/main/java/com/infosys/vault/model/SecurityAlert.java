package com.infosys.vault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_alerts")
public class SecurityAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String email;

    @Column(name = "alert_type", nullable = false)
    private String alertType;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private String severity; // HIGH, MEDIUM, LOW

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String status; // UNREAD, READ, DISMISSED

    public SecurityAlert() {
        this.createdAt = LocalDateTime.now();
        this.status = "UNREAD";
        this.severity = "HIGH";
    }

    public SecurityAlert(Long userId, String email, String alertType, String message, String severity) {
        this();
        this.userId = userId;
        this.email = email;
        this.alertType = alertType;
        this.message = message;
        this.severity = severity != null ? severity : "HIGH";
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

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

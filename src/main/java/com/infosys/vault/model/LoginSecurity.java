package com.infosys.vault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_security")
public class LoginSecurity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(name = "login_status", nullable = false)
    private String loginStatus; // SUCCESS or FAILED

    @Column(nullable = false)
    private String activity;

    @Column(name = "date_and_time", nullable = false)
    private LocalDateTime timestamp;

    public LoginSecurity() {
        this.timestamp = LocalDateTime.now();
    }

    public LoginSecurity(String email, String loginStatus, String activity) {
        this.email = email;
        this.loginStatus = loginStatus;
        this.activity = activity;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLoginStatus() {
        return loginStatus;
    }

    public void setLoginStatus(String loginStatus) {
        this.loginStatus = loginStatus;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

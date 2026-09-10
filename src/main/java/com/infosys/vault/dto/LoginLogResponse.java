package com.infosys.vault.dto;

import com.infosys.vault.model.LoginSecurity;

import java.time.format.DateTimeFormatter;

public class LoginLogResponse {

    private Long id;
    private Integer slNo;
    private String email;
    private String username;
    private String activity;
    private String status;
    private String loginStatus;
    private String dateAndTime;
    private String timestamp;

    public LoginLogResponse() {
    }

    public LoginLogResponse(LoginSecurity security, Integer slNo) {
        this.id = security.getId();
        this.slNo = slNo;
        this.email = security.getEmail();
        this.username = security.getEmail();
        this.activity = security.getActivity();
        this.status = security.getLoginStatus();
        this.loginStatus = security.getLoginStatus();
        if (security.getTimestamp() != null) {
            String formatted = security.getTimestamp().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            this.dateAndTime = formatted;
            this.timestamp = formatted;
        } else {
            this.dateAndTime = "";
            this.timestamp = "";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSlNo() {
        return slNo;
    }

    public void setSlNo(Integer slNo) {
        this.slNo = slNo;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLoginStatus() {
        return loginStatus;
    }

    public void setLoginStatus(String loginStatus) {
        this.loginStatus = loginStatus;
    }

    public String getDateAndTime() {
        return dateAndTime;
    }

    public void setDateAndTime(String dateAndTime) {
        this.dateAndTime = dateAndTime;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}

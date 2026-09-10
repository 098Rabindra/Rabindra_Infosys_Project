package com.infosys.vault.service;

import com.infosys.vault.model.LoginSecurity;
import com.infosys.vault.repository.LoginSecurityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecurityLogService {

    private final LoginSecurityRepository loginSecurityRepository;

    public SecurityLogService(LoginSecurityRepository loginSecurityRepository) {
        this.loginSecurityRepository = loginSecurityRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSecurityLog(String email, String status, String activity) {
        try {
            LoginSecurity sec = new LoginSecurity(email, status, activity);
            loginSecurityRepository.saveAndFlush(sec);
        } catch (Exception e) {
            System.err.println("Failed to save security log: " + e.getMessage());
        }
    }
}

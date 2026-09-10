package com.infosys.vault.service;

import com.infosys.vault.dto.LoginActivityReportResponse;
import com.infosys.vault.dto.PasswordHealthReportResponse;
import com.infosys.vault.dto.PasswordHealthReportResponse.CredentialHealthSummary;
import com.infosys.vault.model.LoginLog;
import com.infosys.vault.model.LoginSecurity;
import com.infosys.vault.model.User;
import com.infosys.vault.model.VaultItem;
import com.infosys.vault.repository.LoginLogRepository;
import com.infosys.vault.repository.LoginSecurityRepository;
import com.infosys.vault.repository.UserRepository;
import com.infosys.vault.repository.VaultItemRepository;
import com.infosys.vault.util.PasswordStrengthAnalyzer;
import com.infosys.vault.util.PasswordStrengthAnalyzer.StrengthResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ReportService {

    private final VaultItemRepository vaultItemRepository;
    private final LoginSecurityRepository loginSecurityRepository;
    private final LoginLogRepository loginLogRepository;
    private final UserRepository userRepository;

    public ReportService(VaultItemRepository vaultItemRepository,
                         LoginSecurityRepository loginSecurityRepository,
                         LoginLogRepository loginLogRepository,
                         UserRepository userRepository) {
        this.vaultItemRepository = vaultItemRepository;
        this.loginSecurityRepository = loginSecurityRepository;
        this.loginLogRepository = loginLogRepository;
        this.userRepository = userRepository;
    }

    private Long parseUserId(String userIdStr) {
        try {
            return Long.valueOf(userIdStr);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public PasswordHealthReportResponse getPasswordHealthReport(String userIdStr) {
        Long userId = parseUserId(userIdStr);
        List<VaultItem> items = Collections.emptyList();

        if (userId != null) {
            items = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        }

        long totalCredentials = items.size();
        long strongCount = 0;
        long mediumCount = 0;
        long weakCount = 0;
        double totalScoreSum = 0;
        List<CredentialHealthSummary> itemSummaries = new ArrayList<>();

        for (VaultItem item : items) {
            // Evaluate password strength using password strength analyzer
            String sampleSecret = item.getEncryptedPassword() != null ? item.getEncryptedPassword() : "";
            StrengthResult result = PasswordStrengthAnalyzer.analyze(sampleSecret);

            int score = result.getScore();
            String label = result.getLabel();

            if ("Strong".equalsIgnoreCase(label)) {
                strongCount++;
            } else if ("Medium".equalsIgnoreCase(label)) {
                mediumCount++;
            } else {
                weakCount++;
            }

            totalScoreSum += score;

            itemSummaries.add(new CredentialHealthSummary(
                    item.getId(),
                    item.getTitle(),
                    item.getUsername(),
                    item.getCategory() != null ? item.getCategory().name() : "LOGIN",
                    label,
                    score
            ));
        }

        double healthScore = totalCredentials > 0 ? (totalScoreSum / totalCredentials) : 100.0;
        healthScore = Math.round(healthScore * 10.0) / 10.0;

        String summary;
        if (totalCredentials == 0) {
            summary = "No Credentials Available";
        } else if (healthScore >= 80) {
            summary = "Excellent Password Health";
        } else if (healthScore >= 60) {
            summary = "Good Password Health - Some Weak Passwords";
        } else {
            summary = "Action Required - Password Health Needs Attention";
        }

        return new PasswordHealthReportResponse(
                totalCredentials,
                strongCount,
                mediumCount,
                weakCount,
                healthScore,
                summary,
                itemSummaries
        );
    }

    public LoginActivityReportResponse getLoginActivityReport(String userIdStr) {
        String email = userIdStr;
        String username = userIdStr;

        Long userId = parseUserId(userIdStr);
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                email = user.getEmail();
                username = user.getUsername();
            }
        }

        List<LoginSecurity> logs = loginSecurityRepository.findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByTimestampDesc(email, username);
        if (logs == null) {
            logs = new ArrayList<>();
        }

        // Fallback: check LoginLogRepository if LoginSecurity logs are empty
        if (logs.isEmpty()) {
            List<LoginLog> altLogs = loginLogRepository.findByUsernameIgnoreCaseOrderByTimestampDesc(username);
            if (altLogs != null && !altLogs.isEmpty()) {
                for (LoginLog alt : altLogs) {
                    LoginSecurity sec = new LoginSecurity(alt.getUsername(), alt.getStatus(), alt.getActivity());
                    sec.setTimestamp(alt.getTimestamp());
                    logs.add(sec);
                }
            }
        }

        long totalAttempts = logs.size();
        long successfulLogins = logs.stream().filter(l -> "SUCCESS".equalsIgnoreCase(l.getLoginStatus())).count();
        long failedLogins = logs.stream().filter(l -> "FAILED".equalsIgnoreCase(l.getLoginStatus())).count();
        double successRate = totalAttempts > 0 ? ((double) successfulLogins / totalAttempts) * 100.0 : 100.0;
        successRate = Math.round(successRate * 10.0) / 10.0;

        List<LoginSecurity> recentActivities = logs.stream().limit(20).toList();

        return new LoginActivityReportResponse(
                totalAttempts,
                successfulLogins,
                failedLogins,
                successRate,
                recentActivities
        );
    }
}

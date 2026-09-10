package com.infosys.vault.service;

import com.infosys.vault.model.Notification;
import com.infosys.vault.model.User;
import com.infosys.vault.model.VaultItem;
import com.infosys.vault.repository.NotificationRepository;
import com.infosys.vault.repository.UserRepository;
import com.infosys.vault.repository.VaultItemRepository;
import com.infosys.vault.util.PasswordStrengthAnalyzer;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
@SuppressWarnings("null")
public class NotificationService {

    private static final Logger LOGGER = Logger.getLogger(NotificationService.class.getName());

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final VaultItemRepository vaultItemRepository;
    private final com.infosys.vault.repository.SecurityAlertRepository securityAlertRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:drajapreinsta@gmail.com}")
    private String mailFrom;

    @Value("${RESEND_API_KEY:${app.resend.api-key:}}")
    private String resendApiKey;

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               VaultItemRepository vaultItemRepository,
                               com.infosys.vault.repository.SecurityAlertRepository securityAlertRepository,
                               JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.vaultItemRepository = vaultItemRepository;
        this.securityAlertRepository = securityAlertRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public Notification createNotification(Long userId, String type, String title, String message) {
        if (userId == null) {
            return null;
        }

        Notification notification = new Notification(userId, type, title, message);
        Notification saved = notificationRepository.save(notification);

        // Async email notification delivery
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
            CompletableFuture.runAsync(() -> {
                try {
                    sendNotificationEmail(user.getEmail(), user.getFullName() != null ? user.getFullName() : user.getUsername(), type, title, message);
                } catch (Exception e) {
                    LOGGER.log(Level.WARNING, "Failed to send notification email to {0}: {1}", new Object[]{user.getEmail(), e.getMessage()});
                }
            });
        }

        return saved;
    }

    @Transactional
    public List<Notification> getUserNotifications(Long userId) {
        if (userId == null) return java.util.Collections.emptyList();

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        if (notifications.isEmpty()) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                // 1. Create a Login Success notification for current session
                String nowFormatted = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                createNotification(
                        userId,
                        "LOGIN_SUCCESS",
                        "New Login Detected",
                        "New login detected on your SecureVault account (" + user.getEmail() + ") at " + nowFormatted + " from Web Browser."
                );

                // 2. Evaluate Password Expiration & Health Alerts
                checkAndPasswordExpirationAlerts(userId);

                // 3. Populate Shared Credentials Notifications if user has shared items
                List<VaultItem> userItems = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
                if (userItems != null) {
                    for (VaultItem item : userItems) {
                        if (item.getPermissionLevel() != null && item.getPermissionLevel() != com.infosys.vault.model.PermissionLevel.FULL_MANAGEMENT) {
                            String title = "Credential Shared: " + item.getTitle();
                            String message = "A credential (" + item.getTitle() + ") has been securely shared with you with '" + item.getPermissionLevel().getLabel() + "' access level.";
                            createNotification(userId, "CREDENTIAL_SHARED", title, message);
                        }
                    }
                }

                // 4. Populate Security Alerts if any exist in SecurityAlertRepository
                if (securityAlertRepository != null) {
                    List<com.infosys.vault.model.SecurityAlert> alerts = securityAlertRepository
                            .findByEmailIgnoreCaseOrEmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail(), user.getUsername());
                    if (alerts != null && !alerts.isEmpty()) {
                        for (com.infosys.vault.model.SecurityAlert sa : alerts) {
                            if ("MULTIPLE_FAILED_LOGINS".equalsIgnoreCase(sa.getAlertType())) {
                                createNotification(userId, "FAILED_LOGIN", "Security Alert: Multiple Failed Logins", sa.getMessage());
                                createNotification(userId, "SUSPICIOUS_ACTIVITY", "Risk Alert: Suspicious Activity Detected", "Suspicious activity was detected on your SecureVault account (" + user.getEmail() + "). Please review your security logs.");
                            }
                        }
                    }
                }

                // Re-fetch created notifications
                notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            }
        }

        return notifications;
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        if (notificationId == null || userId == null) return;
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null && userId.equals(notification.getUserId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        if (userId == null) return;
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public int checkAndPasswordExpirationAlerts(Long userId) {
        if (userId == null) return 0;

        List<VaultItem> items = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        if (items == null || items.isEmpty()) return 0;

        int createdCount = 0;
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        List<Notification> recentExpirations = notificationRepository.findByUserIdAndTypeAndCreatedAtAfter(userId, "PASSWORD_EXPIRATION", twentyFourHoursAgo);

        for (VaultItem item : items) {
            boolean needsUpdate = false;
            String reason = "";

            // Check age (e.g. updated/created > 90 days ago)
            if (item.getUpdatedAt() != null && item.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(90))) {
                needsUpdate = true;
                reason = "password has not been updated in over 90 days";
            } else {
                // Check password strength
                String secret = item.getEncryptedPassword() != null ? item.getEncryptedPassword() : "";
                PasswordStrengthAnalyzer.StrengthResult strength = PasswordStrengthAnalyzer.analyze(secret);
                if ("Weak".equalsIgnoreCase(strength.getLabel())) {
                    needsUpdate = true;
                    reason = "password strength is rated weak";
                }
            }

            if (needsUpdate) {
                String title = "Password Health Alert: " + item.getTitle();
                String message = "Your password for " + item.getTitle() + " (" + (item.getUsername() != null ? item.getUsername() : "Account") + ") needs to be updated because its " + reason + ". Please change it to maintain account security.";

                // Avoid creating duplicate expiration notifications within 24h for the same credential
                boolean alreadyNotified = recentExpirations.stream().anyMatch(n -> n.getMessage() != null && n.getMessage().contains(item.getTitle()));

                if (!alreadyNotified) {
                    createNotification(userId, "PASSWORD_EXPIRATION", title, message);
                    createdCount++;
                }
            }
        }
        return createdCount;
    }

    private void sendNotificationEmail(String recipientEmail, String recipientName, String type, String title, String messageContent)
            throws MessagingException, UnsupportedEncodingException, MailException {

        String badgeColor = "#6366f1";
        String badgeText = "NOTIFICATION";

        switch (type) {
            case "LOGIN_SUCCESS":
                badgeColor = "#10b981"; // emerald
                badgeText = "🔐 SECURITY ALERT - NEW LOGIN";
                break;
            case "FAILED_LOGIN":
                badgeColor = "#ef4444"; // red
                badgeText = "🚨 SECURITY ALERT - FAILED LOGIN";
                break;
            case "CREDENTIAL_SHARED":
                badgeColor = "#06b6d4"; // cyan
                badgeText = "🔗 CREDENTIAL SHARED";
                break;
            case "PASSWORD_EXPIRATION":
                badgeColor = "#f59e0b"; // amber
                badgeText = "🔑 PASSWORD EXPIRATION / HEALTH ALERT";
                break;
            case "SUSPICIOUS_ACTIVITY":
                badgeColor = "#dc2626"; // deep red
                badgeText = "⚠️ SUSPICIOUS ACTIVITY DETECTED";
                break;
        }

        String formattedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        String htmlContent = "<div style=\"font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; background-color: #0f172a; border-radius: 16px; color: #f1f5f9; border: 1px solid #334155;\">"
                + "<div style=\"text-align: center; margin-bottom: 20px;\">"
                + "<h2 style=\"color: #818cf8; margin: 0; font-size: 24px; font-weight: 800;\">SECURE<span style=\"color: #38bdf8;\">VAULT</span></h2>"
                + "<span style=\"display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; background-color: " + badgeColor + "20; color: " + badgeColor + "; border: 1px solid " + badgeColor + "40; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;\">" + badgeText + "</span>"
                + "</div>"
                + "<div style=\"background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #475569;\">"
                + "<h3 style=\"color: #ffffff; font-size: 16px; margin-top: 0; font-weight: 700;\">" + escapeHtml(title) + "</h3>"
                + "<p style=\"color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 16px;\">Hi " + escapeHtml(recipientName) + ",</p>"
                + "<p style=\"color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px; background: #0f172a; padding: 14px; border-radius: 8px; border-left: 4px solid " + badgeColor + ";\">" + escapeHtml(messageContent) + "</p>"
                + "<div style=\"color: #94a3b8; font-size: 12px; border-top: 1px solid #334155; padding-top: 12px; margin-top: 16px;\">"
                + "<p style=\"margin: 4px 0;\"><strong>Timestamp:</strong> " + formattedTime + "</p>"
                + "<p style=\"margin: 4px 0;\"><strong>Account:</strong> " + escapeHtml(recipientEmail) + "</p>"
                + "</div>"
                + "</div>"
                + "<div style=\"text-align: center; margin-top: 20px; color: #64748b; font-size: 11px;\">"
                + "<p style=\"margin: 0;\">SecureVault Security System • End-to-End Encryption</p>"
                + "<p style=\"margin: 4px 0 0 0;\">If you did not initiate this activity, please check your account security immediately.</p>"
                + "</div>"
                + "</div>";

        String subject = title + " - SecureVault";

        // 1. Try Resend HTTP API
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                sendViaResendHttpApi(recipientEmail, subject, htmlContent);
                LOGGER.log(Level.INFO, "Notification Email delivered via Resend HTTP API to: {0}", recipientEmail);
                return;
            } catch (Exception e) {
                LOGGER.log(Level.INFO, "Resend HTTP API note for [{0}]: {1}", new Object[]{recipientEmail, e.getMessage()});
                if (e.getMessage() != null && (e.getMessage().contains("403") || e.getMessage().contains("testing emails"))) {
                    return; // In-app notification created successfully, return without SMTP timeout hang
                }
            }
        }

        // 2. Try Brevo HTTP API
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            try {
                sendViaBrevoHttpApi(recipientEmail, subject, htmlContent);
                LOGGER.log(Level.INFO, "Notification Email delivered via Brevo HTTP API to: {0}", recipientEmail);
                return;
            } catch (Exception e) {
                LOGGER.log(Level.WARNING, "Brevo HTTP API failed: {0}. Falling back to standard SMTP...", e.getMessage());
            }
        }

        // 3. Standard SMTP Fallback
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(mailFrom, "SecureVault Notifications");
        helper.setTo(recipientEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
        LOGGER.log(Level.INFO, "Notification Email delivered via SMTP to: {0}", recipientEmail);
    }

    private String escapeJson(String raw) {
        if (raw == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        return sb.toString();
    }

    private void sendViaResendHttpApi(String recipientEmail, String subject, String htmlBody) throws Exception {
        String targetEmail = recipientEmail != null ? recipientEmail.trim() : "";
        String ownerEmail = "dakuarabindra2001@gmail.com";

        // In Resend free testing tier (from: onboarding@resend.dev), only sending to owner email is allowed.
        // If target is not ownerEmail, we target ownerEmail directly with subject indicating original recipient.
        boolean isTestingModeRecipientMismatch = !targetEmail.equalsIgnoreCase(ownerEmail);
        String actualRecipient = isTestingModeRecipientMismatch ? ownerEmail : targetEmail;
        String actualSubject = isTestingModeRecipientMismatch ? "[Testing Mode - Notification for " + targetEmail + "] " + subject : subject;

        String jsonPayload = String.format(
                "{\"from\":\"SecureVault <onboarding@resend.dev>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                actualRecipient,
                escapeJson(actualSubject),
                escapeJson(htmlBody)
        );

        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            String errBody = response.body() != null ? response.body() : "";
            if (response.statusCode() == 403 && !actualRecipient.equalsIgnoreCase(ownerEmail)) {
                String fallbackPayload = String.format(
                        "{\"from\":\"SecureVault <onboarding@resend.dev>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                        ownerEmail,
                        escapeJson("[Testing Mode - Notification for " + targetEmail + "] " + subject),
                        escapeJson(htmlBody)
                );
                java.net.http.HttpRequest fallbackReq = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("https://api.resend.com/emails"))
                        .header("Authorization", "Bearer " + resendApiKey.trim())
                        .header("Content-Type", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(fallbackPayload))
                        .build();
                java.net.http.HttpResponse<String> fallbackResp = client.send(fallbackReq, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (fallbackResp.statusCode() < 400) {
                    LOGGER.log(Level.INFO, "Notification email routed to owner email ({0}) for recipient: {1}", new Object[]{ownerEmail, targetEmail});
                    return;
                }
            }
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + errBody);
        }

        if (isTestingModeRecipientMismatch) {
            LOGGER.log(Level.INFO, "Resend Test Mode: Notification Email for [{0}] successfully delivered to owner [{1}].", new Object[]{targetEmail, ownerEmail});
        } else {
            LOGGER.log(Level.INFO, "Notification Email delivered via Resend HTTP API to: {0}", targetEmail);
        }
    }

    private void sendViaBrevoHttpApi(String recipientEmail, String subject, String htmlBody) throws Exception {
        String jsonPayload = String.format(
                "{\"sender\":{\"name\":\"SecureVault\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\"}],\"subject\":\"%s\",\"htmlContent\":\"%s\"}",
                mailFrom,
                recipientEmail,
                escapeJson(subject),
                escapeJson(htmlBody)
        );

        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}

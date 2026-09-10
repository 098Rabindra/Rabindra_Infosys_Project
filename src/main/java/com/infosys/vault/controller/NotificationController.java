package com.infosys.vault.controller;

import com.infosys.vault.dto.ApiResponse;
import com.infosys.vault.model.Notification;
import com.infosys.vault.service.NotificationService;
import com.infosys.vault.repository.UserRepository;
import com.infosys.vault.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private Long parseUserId(UserDetails userDetails) {
        if (userDetails == null || userDetails.getUsername() == null) return null;
        String identifier = userDetails.getUsername().trim();
        try {
            return Long.parseLong(identifier);
        } catch (NumberFormatException e) {
            return userRepository.findByEmailIgnoreCase(identifier)
                    .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                    .map(User::getId)
                    .orElse(null);
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = parseUserId(userDetails);
            if (userId == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid user authentication"));
            }
            List<Notification> notifications = notificationService.getUserNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = parseUserId(userDetails);
            if (userId == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid user authentication"));
            }
            long count = notificationService.getUnreadCount(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("unreadCount", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        try {
            Long userId = parseUserId(userDetails);
            if (userId == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid user authentication"));
            }
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok(new ApiResponse(true, "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = parseUserId(userDetails);
            if (userId == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid user authentication"));
            }
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/check-expirations")
    public ResponseEntity<?> checkExpirations(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = parseUserId(userDetails);
            if (userId == null) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid user authentication"));
            }
            int created = notificationService.checkAndPasswordExpirationAlerts(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("alertsGenerated", created);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}

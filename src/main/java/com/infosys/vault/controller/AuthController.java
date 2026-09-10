package com.infosys.vault.controller;

import com.infosys.vault.dto.ApiResponse;
import com.infosys.vault.dto.AuthResponse;
import com.infosys.vault.dto.LoginRequest;
import com.infosys.vault.dto.OtpRequest;
import com.infosys.vault.dto.OtpVerifyRequest;
import com.infosys.vault.dto.RegisterRequest;
import com.infosys.vault.dto.ResetPasswordRequest;
import com.infosys.vault.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpRequest otpRequest) {
        try {
            authService.sendRegistrationOtp(otpRequest.getEmail());
            java.util.Map<String, Object> res = new java.util.HashMap<>();
            res.put("success", true);
            res.put("message", "OTP code sent to " + otpRequest.getEmail());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest otpVerifyRequest) {
        try {
            authService.verifyRegistrationOtp(otpVerifyRequest.getEmail(), otpVerifyRequest.getOtp());
            return ResponseEntity.ok(new ApiResponse(true, "Email verified successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendForgotPasswordOtp(@Valid @RequestBody OtpRequest otpRequest) {
        try {
            authService.sendForgotPasswordOtp(otpRequest.getEmail());
            java.util.Map<String, Object> res = new java.util.HashMap<>();
            res.put("success", true);
            res.put("message", "Password reset OTP sent to " + otpRequest.getEmail());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        try {
            authService.resetPassword(resetPasswordRequest);
            return ResponseEntity.ok(new ApiResponse(true, "Password reset successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            AuthResponse response = authService.register(registerRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        try {
            SecurityContextHolder.clearContext();
            return ResponseEntity.ok(new ApiResponse(true, "Successfully logged out from session"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.GetMapping("/logs")
    public ResponseEntity<?> getSecurityLogs(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            java.util.List<com.infosys.vault.dto.LoginLogResponse> logs = authService.getSecurityLogs(userId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/logs")
    public ResponseEntity<?> clearSecurityLogs(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            String userId = userDetails.getUsername();
            authService.clearSecurityLogs(userId);
            return ResponseEntity.ok(new ApiResponse(true, "All security activity logs cleared successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/logs/{id}")
    public ResponseEntity<?> deleteSecurityLog(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
                                               @org.springframework.web.bind.annotation.PathVariable Long id) {
        try {
            String userId = userDetails.getUsername();
            authService.deleteSecurityLog(userId, id);
            return ResponseEntity.ok(new ApiResponse(true, "Security activity log entry deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}

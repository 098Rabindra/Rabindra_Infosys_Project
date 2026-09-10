package com.infosys.vault.controller;

import com.infosys.vault.dto.ApiResponse;
import com.infosys.vault.dto.VaultItemRequest;
import com.infosys.vault.dto.VaultItemResponse;
import com.infosys.vault.model.PermissionLevel;
import com.infosys.vault.service.VaultService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vault")
public class VaultController {

    private final VaultService vaultService;

    public VaultController(VaultService vaultService) {
        this.vaultService = vaultService;
    }

    @GetMapping("/items")
    public ResponseEntity<?> getAllVaultItems(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean favorite) {
        try {
            String userId = userDetails.getUsername(); // In UserDetailsServiceImpl, username is stored as User ID
            List<VaultItemResponse> items = vaultService.getUserVaultItems(userId, category, favorite);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<?> getVaultItemById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        try {
            String userId = userDetails.getUsername();
            VaultItemResponse item = vaultService.getVaultItemById(id, userId);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PostMapping("/items")
    public ResponseEntity<?> createVaultItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VaultItemRequest request) {
        try {
            String userId = userDetails.getUsername();
            VaultItemResponse response = vaultService.createVaultItem(request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<?> updateVaultItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id,
            @Valid @RequestBody VaultItemRequest request) {
        try {
            String userId = userDetails.getUsername();
            VaultItemResponse response = vaultService.updateVaultItem(id, request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteVaultItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        try {
            String userId = userDetails.getUsername();
            vaultService.deleteVaultItem(id, userId);
            return ResponseEntity.ok(new ApiResponse(true, "Vault item deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PatchMapping("/items/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        try {
            String userId = userDetails.getUsername();
            VaultItemResponse response = vaultService.toggleFavorite(id, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PatchMapping("/items/{id}/permission")
    public ResponseEntity<?> updatePermissionLevel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id,
            @RequestParam PermissionLevel level,
            @RequestParam(required = false) String recipientEmail,
            @RequestBody(required = false) VaultItemRequest payload) {
        try {
            String userId = userDetails.getUsername();
            VaultItemResponse response = vaultService.updatePermissionLevel(id, level, recipientEmail, userId, payload);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}




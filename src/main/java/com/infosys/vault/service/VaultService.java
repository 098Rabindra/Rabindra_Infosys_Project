package com.infosys.vault.service;

import com.infosys.vault.dto.VaultItemRequest;
import com.infosys.vault.dto.VaultItemResponse;
import com.infosys.vault.model.Category;
import com.infosys.vault.model.PermissionLevel;
import com.infosys.vault.model.User;
import com.infosys.vault.model.VaultItem;
import com.infosys.vault.repository.UserRepository;
import com.infosys.vault.repository.VaultItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class VaultService {

    private final VaultItemRepository vaultItemRepository;
    private final UserRepository userRepository;
    private final SecurityAuditService securityAuditService;
    private final NotificationService notificationService;

    public VaultService(VaultItemRepository vaultItemRepository, UserRepository userRepository, SecurityAuditService securityAuditService, NotificationService notificationService) {
        this.vaultItemRepository = vaultItemRepository;
        this.userRepository = userRepository;
        this.securityAuditService = securityAuditService;
        this.notificationService = notificationService;
    }

    private Long parseUserId(String userIdStr) {
        try {
            return Long.valueOf(userIdStr);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid User ID format: " + userIdStr, e);
        }
    }

    private Category parseCategory(String categoryStr) {
        try {
            return Category.valueOf(categoryStr.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new RuntimeException("Invalid Category format: " + categoryStr, e);
        }
    }

    private boolean isItemShared(VaultItem item, List<VaultItem> allItems) {
        if (item == null) return false;
        if (item.getPermissionLevel() == PermissionLevel.VIEW_ONLY || item.getPermissionLevel() == PermissionLevel.EDIT_ACCESS) {
            return true;
        }
        if (item.getTitle() == null || item.getTitle().trim().isEmpty()) return false;

        String cleanTitle = item.getTitle().replaceAll("(?i)\\s*\\(shared\\)", "").trim();
        Long itemUserId = (item.getUser() != null) ? item.getUser().getId() : null;

        if (allItems != null) {
            for (VaultItem other : allItems) {
                if (other == null || other.getId() == null) continue;
                if (other.getId().equals(item.getId())) continue;
                
                Long otherUserId = (other.getUser() != null) ? other.getUser().getId() : null;
                if (itemUserId != null && otherUserId != null && itemUserId.equals(otherUserId)) continue;

                String otherClean = other.getTitle() != null ? other.getTitle().replaceAll("(?i)\\s*\\(shared\\)", "").trim() : "";
                if (!cleanTitle.isEmpty() && cleanTitle.equalsIgnoreCase(otherClean)) {
                    return true;
                }
            }
        }
        return false;
    }

    public List<VaultItemResponse> getUserVaultItems(String userIdStr, String category, Boolean favorite) {
        Long userId = parseUserId(userIdStr);

        List<VaultItem> items;
        boolean hasCategory = category != null && !category.trim().isEmpty();
        boolean isFavorite = Boolean.TRUE.equals(favorite);

        if (hasCategory && isFavorite) {
            Category cat = parseCategory(category);
            items = vaultItemRepository.findByUserIdAndCategoryAndFavoriteOrderByUpdatedAtDesc(userId, cat, true);
        } else if (hasCategory) {
            Category cat = parseCategory(category);
            items = vaultItemRepository.findByUserIdAndCategoryOrderByUpdatedAtDesc(userId, cat);
        } else if (isFavorite) {
            items = vaultItemRepository.findByUserIdAndFavoriteOrderByUpdatedAtDesc(userId, true);
        } else {
            items = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        }

        // Ensure items default to FULL_MANAGEMENT if permission level is null
        for (VaultItem item : items) {
            if (item.getPermissionLevel() == null) {
                item.setPermissionLevel(PermissionLevel.FULL_MANAGEMENT);
                vaultItemRepository.save(item);
            }
        }

        List<VaultItem> allItems = vaultItemRepository.findAll();
        return items.stream()
                .map(item -> new VaultItemResponse(item, isItemShared(item, allItems)))
                .collect(Collectors.toList());
    }

    public VaultItemResponse getVaultItemById(String id, String userIdStr) {
        Long userId = parseUserId(userIdStr);
        VaultItem item = vaultItemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Vault item not found"));
        List<VaultItem> allItems = vaultItemRepository.findAll();
        return new VaultItemResponse(item, isItemShared(item, allItems));
    }

    public VaultItemResponse createVaultItem(VaultItemRequest request, String userIdStr) {
        Long userId = parseUserId(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check for duplicate vault item for the user
        List<VaultItem> existingItems = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        String reqTitleClean = request.getTitle() != null ? request.getTitle().trim().toLowerCase() : "";
        String reqUserClean = request.getUsername() != null ? request.getUsername().trim().toLowerCase() : "";

        boolean isDuplicate = existingItems.stream().anyMatch(existing -> {
            String exTitleClean = existing.getTitle() != null ? existing.getTitle().trim().toLowerCase() : "";
            String exUserClean = existing.getUsername() != null ? existing.getUsername().trim().toLowerCase() : "";

            boolean titleMatch = exTitleClean.equals(reqTitleClean);
            boolean userMatch = exUserClean.equals(reqUserClean);
            return titleMatch && userMatch;
        });

        if (isDuplicate) {
            throw new RuntimeException("Vault item already exists in your account");
        }

        VaultItem item = new VaultItem();
        item.setUser(user);
        item.setTitle(request.getTitle());
        item.setUsername(request.getUsername());
        item.setEncryptedPassword(request.getEncryptedPassword());
        item.setIv(request.getIv());
        item.setUrl(request.getUrl());
        item.setCategory(request.getCategory());
        item.setFavorite(request.isFavorite());
        item.setNotes(request.getNotes());
        item.setPermissionLevel(PermissionLevel.FULL_MANAGEMENT);

        VaultItem saved = vaultItemRepository.save(item);
        securityAuditService.recordAuditLog(user.getId(), user.getEmail(), "Credential Created", "Created new vault credential: " + saved.getTitle());
        return new VaultItemResponse(saved);
    }

    public VaultItemResponse updateVaultItem(String id, VaultItemRequest request, String userIdStr) {
        Long userId = parseUserId(userIdStr);
        VaultItem item = vaultItemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Vault item not found"));

        // System Permission Check: View Only cannot edit credentials
        if (item.getPermissionLevel() == PermissionLevel.VIEW_ONLY) {
            throw new RuntimeException("Permission Denied: 'View Only' access level cannot edit this credential.");
        }

        // System Permission Check: Edit Access cannot elevate permission to Full Management
        if (item.getPermissionLevel() == PermissionLevel.EDIT_ACCESS && request.getPermissionLevel() == PermissionLevel.FULL_MANAGEMENT) {
            throw new RuntimeException("Permission Denied: 'Edit Access' access level cannot elevate permissions to Full Management.");
        }

        item.setTitle(request.getTitle());
        item.setUsername(request.getUsername());
        item.setEncryptedPassword(request.getEncryptedPassword());
        item.setIv(request.getIv());
        item.setUrl(request.getUrl());
        item.setCategory(request.getCategory());
        item.setFavorite(request.isFavorite());
        item.setNotes(request.getNotes());
        if (request.getPermissionLevel() != null && item.getPermissionLevel() == PermissionLevel.FULL_MANAGEMENT) {
            item.setPermissionLevel(request.getPermissionLevel());
        }

        VaultItem saved = vaultItemRepository.save(item);
        syncSharedCopies(saved);

        if (saved.getUser() != null) {
            securityAuditService.recordAuditLog(saved.getUser().getId(), saved.getUser().getEmail(), "Credential Updated", "Updated vault credential: " + saved.getTitle());
        }
        List<VaultItem> allItems = vaultItemRepository.findAll();
        return new VaultItemResponse(saved, isItemShared(saved, allItems));
    }

    private void syncSharedCopies(VaultItem sourceItem) {
        if (sourceItem == null || sourceItem.getTitle() == null) return;
        String title = sourceItem.getTitle().trim();
        String cleanSourceTitle = title.replaceAll("(?i)\\s*\\(shared\\)", "").trim();
        List<VaultItem> allItems = vaultItemRepository.findAll();

        for (VaultItem other : allItems) {
            if (other.getId().equals(sourceItem.getId())) continue;
            String otherTitle = other.getTitle() != null ? other.getTitle().trim() : "";
            String cleanOtherTitle = otherTitle.replaceAll("(?i)\\s*\\(shared\\)", "").trim();
            if (cleanSourceTitle.equalsIgnoreCase(cleanOtherTitle) && !cleanSourceTitle.isEmpty()) {
                other.setUsername(sourceItem.getUsername());
                other.setEncryptedPassword(sourceItem.getEncryptedPassword());
                other.setIv(sourceItem.getIv());
                other.setUrl(sourceItem.getUrl());
                other.setCategory(sourceItem.getCategory());
                other.setNotes(sourceItem.getNotes());
                vaultItemRepository.save(other);
            }
        }
    }

    public void deleteVaultItem(String id, String userIdStr) {
        Long userId = parseUserId(userIdStr);
        VaultItem item = vaultItemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Vault item not found"));

        // System Permission Check: Only Full Management permission can delete credentials
        if (item.getPermissionLevel() != null && item.getPermissionLevel() != PermissionLevel.FULL_MANAGEMENT) {
            throw new RuntimeException("Permission Denied: Only 'Full Management' permission level can delete this credential.");
        }

        vaultItemRepository.delete(item);
        if (item.getUser() != null) {
            securityAuditService.recordAuditLog(item.getUser().getId(), item.getUser().getEmail(), "Credential Deleted", "Deleted vault credential: " + item.getTitle());
        }
    }

    public VaultItemResponse toggleFavorite(String id, String userIdStr) {
        Long userId = parseUserId(userIdStr);
        VaultItem item = vaultItemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Vault item not found"));
        item.setFavorite(!item.isFavorite());
        VaultItem saved = vaultItemRepository.save(item);
        List<VaultItem> allItems = vaultItemRepository.findAll();
        return new VaultItemResponse(saved, isItemShared(saved, allItems));
    }

    public VaultItemResponse updatePermissionLevel(String id, PermissionLevel level, String recipientEmail, String userIdStr) {
        return updatePermissionLevel(id, level, recipientEmail, userIdStr, null);
    }

    public VaultItemResponse updatePermissionLevel(String id, PermissionLevel level, String recipientEmail, String userIdStr, VaultItemRequest payload) {
        Long userId = parseUserId(userIdStr);
        VaultItem item = vaultItemRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Vault item not found"));

        if (item.getPermissionLevel() != null && item.getPermissionLevel() != PermissionLevel.FULL_MANAGEMENT) {
            throw new RuntimeException("Permission Denied: Only 'Full Management' permission level can alter sharing permissions.");
        }

        // Owner item ALWAYS remains FULL_MANAGEMENT
        item.setPermissionLevel(PermissionLevel.FULL_MANAGEMENT);

        // Update encrypted password and IV if provided in payload (when re-encrypted with shared key for recipient)
        if (payload != null && payload.getEncryptedPassword() != null && payload.getIv() != null) {
            item.setEncryptedPassword(payload.getEncryptedPassword());
            item.setIv(payload.getIv());
        }

        VaultItem savedOwnerItem = vaultItemRepository.save(item);

        // If recipientEmail is provided, share/grant access to the specified recipient user
        if (recipientEmail != null && !recipientEmail.trim().isEmpty()) {
            String cleanEmail = recipientEmail.trim();
            User recipientUser = userRepository.findByEmailIgnoreCase(cleanEmail)
                    .or(() -> userRepository.findByUsernameIgnoreCase(cleanEmail))
                    .orElseThrow(() -> new RuntimeException("Recipient user not found with email or username: " + cleanEmail));

            User ownerUser = userRepository.findById(userId).orElse(null);
            String sharerName = (ownerUser != null && ownerUser.getFullName() != null && !ownerUser.getFullName().isBlank())
                    ? ownerUser.getFullName()
                    : ((ownerUser != null) ? ownerUser.getUsername() : "a vault user");
            String targetTitle = savedOwnerItem.getTitle();

            // Avoid duplicating item record for self
            if (!recipientUser.getId().equals(userId)) {
                List<VaultItem> recipientItems = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(recipientUser.getId());
                
                VaultItem recipientItem = recipientItems.stream()
                        .filter(i -> i.getTitle() != null && (i.getTitle().equalsIgnoreCase(targetTitle) || i.getTitle().equalsIgnoreCase(targetTitle + " (shared)")))
                        .findFirst()
                        .orElse(null);

                if (recipientItem == null) {
                    recipientItem = new VaultItem();
                    recipientItem.setUser(recipientUser);
                    recipientItem.setTitle(targetTitle);
                }

                recipientItem.setUsername(savedOwnerItem.getUsername());
                recipientItem.setEncryptedPassword(savedOwnerItem.getEncryptedPassword());
                recipientItem.setIv(savedOwnerItem.getIv());
                recipientItem.setUrl(savedOwnerItem.getUrl());
                recipientItem.setCategory(savedOwnerItem.getCategory());
                recipientItem.setNotes(savedOwnerItem.getNotes());
                recipientItem.setPermissionLevel(level);

                vaultItemRepository.save(recipientItem);

                // 1. Create in-app notification & email for RECIPIENT (User B)
                String titleRecip = "Credential Shared: " + targetTitle;
                String msgRecip = "A credential (" + targetTitle + ") has been securely shared with you by " + sharerName + " with '" + level.getLabel() + "' access level.";
                notificationService.createNotification(recipientUser.getId(), "CREDENTIAL_SHARED", titleRecip, msgRecip);

                // 2. Create in-app notification & email for SHARER (User A)
                String titleOwner = "Credential Shared: " + targetTitle;
                String msgOwner = "You have securely shared credential (" + targetTitle + ") with " + recipientUser.getEmail() + " ('" + level.getLabel() + "' access level).";
                notificationService.createNotification(userId, "CREDENTIAL_SHARED", titleOwner, msgOwner);
            } else {
                // Self-sharing test
                String titleOwner = "Credential Shared: " + targetTitle;
                String msgOwner = "You updated sharing permissions for credential (" + targetTitle + ") with '" + level.getLabel() + "' access level.";
                notificationService.createNotification(userId, "CREDENTIAL_SHARED", titleOwner, msgOwner);
            }
        }

        syncSharedCopies(savedOwnerItem);

        List<VaultItem> allItems = vaultItemRepository.findAll();
        return new VaultItemResponse(savedOwnerItem, isItemShared(savedOwnerItem, allItems));
    }
}



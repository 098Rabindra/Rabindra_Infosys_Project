package com.infosys.vault.dto;

import com.infosys.vault.model.Category;
import com.infosys.vault.model.PermissionLevel;
import com.infosys.vault.model.VaultItem;

import java.time.LocalDateTime;

public class VaultItemResponse {

    private String id;
    private String title;
    private String username;
    private String encryptedPassword;
    private String iv;
    private String url;
    private Category category;
    private PermissionLevel permissionLevel;
    private Boolean favorite = false;
    private Boolean shared = false;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VaultItemResponse() {}

    public VaultItemResponse(VaultItem item) {
        this.id = item.getId();
        this.title = item.getTitle();
        this.username = item.getUsername();
        this.encryptedPassword = item.getEncryptedPassword();
        this.iv = item.getIv();
        this.url = item.getUrl();
        this.category = item.getCategory();
        this.permissionLevel = item.getPermissionLevel();
        this.favorite = item.isFavorite();
        this.notes = item.getNotes();
        this.createdAt = item.getCreatedAt();
        this.updatedAt = item.getUpdatedAt();
    }

    public VaultItemResponse(VaultItem item, boolean isShared) {
        this(item);
        this.shared = isShared;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEncryptedPassword() {
        return encryptedPassword;
    }

    public void setEncryptedPassword(String encryptedPassword) {
        this.encryptedPassword = encryptedPassword;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public boolean isFavorite() {
        return favorite != null && favorite;
    }

    public void setFavorite(Boolean favorite) {
        this.favorite = favorite != null ? favorite : false;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public PermissionLevel getPermissionLevel() {
        return permissionLevel;
    }

    public void setPermissionLevel(PermissionLevel permissionLevel) {
        this.permissionLevel = permissionLevel;
    }

    public Boolean getShared() {
        return shared != null && shared;
    }

    public Boolean isShared() {
        return shared != null && shared;
    }

    public void setShared(Boolean shared) {
        this.shared = shared != null ? shared : false;
    }
}


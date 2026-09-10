package com.infosys.vault.dto;

import com.infosys.vault.model.Category;
import com.infosys.vault.model.PermissionLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VaultItemRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String username;

    @NotBlank(message = "Encrypted password is required")
    private String encryptedPassword;

    @NotBlank(message = "IV is required")
    private String iv;

    private String url;

    @NotNull(message = "Category is required")
    private Category category = Category.LOGIN;

    private Boolean favorite = false;

    private String notes;

    private PermissionLevel permissionLevel = PermissionLevel.FULL_MANAGEMENT;

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

    public PermissionLevel getPermissionLevel() {
        return permissionLevel;
    }

    public void setPermissionLevel(PermissionLevel permissionLevel) {
        this.permissionLevel = permissionLevel != null ? permissionLevel : PermissionLevel.FULL_MANAGEMENT;
    }
}

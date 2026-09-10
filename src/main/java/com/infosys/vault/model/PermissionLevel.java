package com.infosys.vault.model;

public enum PermissionLevel {
    VIEW_ONLY("View Only"),
    EDIT_ACCESS("Edit Access"),
    FULL_MANAGEMENT("Full Management");

    private final String label;

    PermissionLevel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

package com.infosys.vault.util;

public class PasswordStrengthAnalyzer {

    public static class StrengthResult {
        private final int score;
        private final String label;

        public StrengthResult(int score, String label) {
            this.score = score;
            this.label = label;
        }

        public int getScore() {
            return score;
        }

        public String getLabel() {
            return label;
        }
    }

    public static StrengthResult analyze(String password) {
        if (password == null || password.trim().isEmpty()) {
            return new StrengthResult(0, "Weak");
        }

        int score = 0;
        int len = password.length();

        if (len >= 8) score += 20;
        if (len >= 12) score += 20;
        if (len >= 16) score += 10;
        if (password.matches(".*[a-z].*")) score += 10;
        if (password.matches(".*[A-Z].*")) score += 15;
        if (password.matches(".*[0-9].*")) score += 15;
        if (password.matches(".*[^a-zA-Z0-9].*")) score += 10;

        if (score > 100) score = 100;

        String label;
        if (score < 40) {
            label = "Weak";
        } else if (score < 70) {
            label = "Medium";
        } else {
            label = "Strong";
        }

        return new StrengthResult(score, label);
    }
}

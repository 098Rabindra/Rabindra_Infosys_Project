package com.infosys.vault;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.junit.jupiter.api.Test;

import java.awt.Color;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@SuppressWarnings("all")
public class PdfManualGenerator {

    @Test
    public void generateProjectManualPdf() throws Exception {
        String filename = "Password_Vault_Project_Manual.pdf";
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        try (FileOutputStream fos = new FileOutputStream(filename)) {
            PdfWriter.getInstance(document, fos);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(15, 23, 42));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(99, 102, 241));
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(30, 41, 59));
            Font bodyBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(51, 65, 85));
            Font codeFont = FontFactory.getFont(FontFactory.COURIER, 8, new Color(15, 23, 42));
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);

            // Title Header
            Paragraph title = new Paragraph("PASSWORD VAULT & CREDENTIAL MANAGEMENT SYSTEM", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph sub = new Paragraph("Project Manual & Complete Postman API Testing Reference", subtitleFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(15);
            document.add(sub);

            // System Overview Box
            PdfPTable overviewTable = new PdfPTable(1);
            overviewTable.setWidthPercentage(100);
            String overviewText = """
                    Project Overview & Postman Environment Settings:
                    • Base URL: http://localhost:8080
                    • Auth Header: Authorization: Bearer <jwt_token>
                    • Content-Type: application/json
                    • Architecture: Zero-Knowledge Client-Side AES-256-GCM Encryption + Spring Boot REST APIs + PostgreSQL Database""";
            PdfPCell cell = new PdfPCell(new Phrase(overviewText, bodyFont));
            cell.setBackgroundColor(new Color(241, 245, 249));
            cell.setBorderColor(new Color(203, 213, 225));
            cell.setPadding(10);
            overviewTable.addCell(cell);
            overviewTable.setSpacingAfter(15);
            document.add(overviewTable);

            // Helper method for adding Postman Endpoint Sections
            addEndpointSection(document, sectionFont, bodyBold, bodyFont, codeFont, headerFont,
                    "1. Authentication & Session Management APIs",
                    new String[][]{
                            {"POST", "/api/auth/send-otp?email={email}", "Public", "Send 6-digit Registration OTP email",
                             "None (Query Param)", "{\"success\":true, \"message\":\"OTP sent to email\"}"},
                            {"POST", "/api/auth/verify-otp?email={email}&otp={code}", "Public", "Verify Registration OTP",
                             "None (Query Param)", "{\"success\":true, \"message\":\"OTP verified\"}"},
                            {"POST", "/api/auth/register", "Public", "Register new user account",
                             "{\n  \"fullName\": \"Sanjaya Dakua\",\n  \"username\": \"09Sanjaya\",\n  \"email\": \"sanjaya@gmail.com\",\n  \"password\": \"Pass123!\"\n}",
                             "{\n  \"token\": \"eyJhbGci...\",\n  \"type\": \"Bearer\",\n  \"email\": \"sanjaya@gmail.com\"\n}"},
                            {"POST", "/api/auth/login", "Public", "Authenticate user & issue JWT token",
                             "{\n  \"email\": \"sanjaya@gmail.com\",\n  \"password\": \"Pass123!\"\n}",
                             "{\n  \"token\": \"eyJhbGci...\",\n  \"type\": \"Bearer\",\n  \"id\": 1\n}"},
                            {"POST", "/api/auth/forgot-password/send-otp", "Public", "Send Password Reset OTP",
                             "{\n  \"email\": \"sanjaya@gmail.com\"\n}",
                             "{\n  \"success\": true,\n  \"message\": \"Reset OTP sent\"\n}"},
                            {"POST", "/api/auth/reset-password", "Public", "Reset account master password using OTP",
                             "{\n  \"email\": \"sanjaya@gmail.com\",\n  \"otp\": \"123456\",\n  \"newPassword\": \"NewPass123!\"\n}",
                             "{\n  \"success\": true,\n  \"message\": \"Password reset successfully\"\n}"},
                            {"POST", "/api/auth/logout", "Bearer JWT", "Invalidate user session",
                             "None", "{\"success\":true, \"message\":\"Successfully logged out\"}"},
                            {"GET", "/api/auth/logs", "Bearer JWT", "Fetch user login activity history",
                             "None", "[{\n  \"id\": 1,\n  \"email\": \"sanjaya@gmail.com\",\n  \"loginStatus\": \"SUCCESS\"\n}]"}
                    });

            addEndpointSection(document, sectionFont, bodyBold, bodyFont, codeFont, headerFont,
                    "2. Password Vault Credential CRUD APIs",
                    new String[][]{
                            {"POST", "/api/vault/items", "Bearer JWT", "Save new encrypted vault item",
                             "{\n  \"title\": \"Tata Power\",\n  \"username\": \"sanjaya9090@gmail.com\",\n  \"encryptedPassword\": \"CipherBase64==\",\n  \"iv\": \"IvBase64==\",\n  \"category\": \"WORK\",\n  \"notes\": \"Tata Employee\"\n}",
                             "{\n  \"id\": \"uuid-123\",\n  \"title\": \"Tata Power\",\n  \"shared\": false\n}"},
                            {"GET", "/api/vault/items", "Bearer JWT", "Fetch all credentials owned or shared",
                             "None", "[{\n  \"id\": \"uuid-123\",\n  \"title\": \"Tata Power\",\n  \"encryptedPassword\": \"...\"\n}]"},
                            {"GET", "/api/vault/items/{id}", "Bearer JWT", "Fetch vault credential by ID",
                             "None", "{\n  \"id\": \"uuid-123\",\n  \"title\": \"Tata Power\"\n}"},
                            {"PUT", "/api/vault/items/{id}", "Bearer JWT", "Update credential title, payload or notes",
                             "{\n  \"title\": \"Tata Power Corporate\",\n  \"username\": \"sanjaya9090@gmail.com\",\n  \"encryptedPassword\": \"NewCipher==\",\n  \"iv\": \"NewIv==\"\n}",
                             "{\n  \"id\": \"uuid-123\",\n  \"title\": \"Tata Power Corporate\"\n}"},
                            {"DELETE", "/api/vault/items/{id}", "Bearer JWT", "Delete vault credential (Full Management required)",
                             "None", "{\"success\":true, \"message\":\"Item deleted\"}"},
                            {"PATCH", "/api/vault/items/{id}/favorite", "Bearer JWT", "Toggle favorite status",
                             "None", "{\n  \"id\": \"uuid-123\",\n  \"favorite\": true\n}"}
                    });

            addEndpointSection(document, sectionFont, bodyBold, bodyFont, codeFont, headerFont,
                    "3. Credential Sharing & Access Control APIs",
                    new String[][]{
                            {"PATCH", "/api/vault/items/{id}/permission?level={level}&recipientEmail={email}", "Bearer JWT",
                             "Share credential with user (Levels: VIEW_ONLY, EDIT_ACCESS, FULL_MANAGEMENT)",
                             "Body Payload (Optional AES Re-encryption):\n{\n  \"encryptedPassword\": \"SharedKeyCipher==\",\n  \"iv\": \"SharedIv==\"\n}",
                             "{\n  \"id\": \"uuid-123\",\n  \"title\": \"Tata Power\",\n  \"permissionLevel\": \"VIEW_ONLY\",\n  \"shared\": true\n}"}
                    });

            addEndpointSection(document, sectionFont, bodyBold, bodyFont, codeFont, headerFont,
                    "4. Security Monitoring & Auditing APIs",
                    new String[][]{
                            {"GET", "/api/security/audit-logs", "Bearer JWT", "Fetch user security audit log events",
                             "None", "[{\n  \"action\": \"Credential Created\",\n  \"timestamp\": \"2026-09-02T19:40:00\"\n}]"},
                            {"GET", "/api/security/alerts", "Bearer JWT", "Fetch active security alerts",
                             "None", "[{\n  \"status\": \"ACTIVE\",\n  \"description\": \"Failed login attempt detected\"\n}]"},
                            {"GET", "/api/security/suspicious-activities", "Bearer JWT", "Fetch suspicious activity log entries",
                             "None", "[{\n  \"activityType\": \"FAILED_LOGIN_BURST\",\n  \"status\": \"FLAGGED\"\n}]"}
                    });

            addEndpointSection(document, sectionFont, bodyBold, bodyFont, codeFont, headerFont,
                    "5. Security Analytics & Health Reports APIs",
                    new String[][]{
                            {"GET", "/api/reports/password-health", "Bearer JWT", "Fetch vault password health score & weak analysis",
                             "None", "{\n  \"healthScore\": 85.0,\n  \"totalPasswords\": 4,\n  \"weakPasswords\": 0,\n  \"reusedPasswords\": 0\n}"},
                            {"GET", "/api/reports/login-activity", "Bearer JWT", "Fetch login activity statistics & logs",
                             "None", "{\n  \"totalAttempts\": 12,\n  \"successfulLogins\": 10,\n  \"failedLogins\": 2,\n  \"successRate\": 83.3\n}"}
                    });

            // Test Matrix Section
            Paragraph testHeader = new Paragraph("6. Milestone 4 Task 1 Testing Validation Summary", sectionFont);
            testHeader.setSpacingBefore(10);
            testHeader.setSpacingAfter(8);
            document.add(testHeader);

            PdfPTable matrixTable = new PdfPTable(4);
            matrixTable.setWidthPercentage(100);
            matrixTable.setWidths(new float[]{2.5f, 3.5f, 3.5f, 1.5f});

            String[] headers = {"Test Feature", "Expected Result", "Actual Result", "Status"};
            for (String h : headers) {
                PdfPCell hCell = new PdfPCell(new Phrase(h, headerFont));
                hCell.setBackgroundColor(new Color(15, 23, 42));
                hCell.setPadding(6);
                matrixTable.addCell(hCell);
            }

            String[][] matrixData = {
                    {"User Registration", "Account created & OTP verified", "Account created in users table", "PASS"},
                    {"Invalid Login", "400 Bad Request error returned", "400 Bad Request with error msg", "PASS"},
                    {"Vault Credential Add", "AES payload saved in DB", "Saved in vault_items table", "PASS"},
                    {"Credential Sharing", "Recipient copy generated with level", "Recipient item created with level", "PASS"},
                    {"View Only Edit Denied", "400 Bad Request permission error", "400 Bad Request permission error", "PASS"},
                    {"Password Health Report", "Calculates vault strength score", "Calculates score & weak count", "PASS"}
            };

            for (String[] row : matrixData) {
                for (int i = 0; i < row.length; i++) {
                    PdfPCell rCell = new PdfPCell(new Phrase(row[i], i == 3 ? bodyBold : bodyFont));
                    rCell.setPadding(5);
                    if (i == 3) {
                        rCell.setBackgroundColor(new Color(220, 252, 231)); // light green
                    }
                    matrixTable.addCell(rCell);
                }
            }
            document.add(matrixTable);

            document.close();
        }

        // Copy to workspace root and brain artifacts directory
        Files.copy(Paths.get(filename), Paths.get("E:\\MCA Project\\Infosys Project\\Password_Fault\\" + filename), StandardCopyOption.REPLACE_EXISTING);
        String artifactDir = "C:\\Users\\dakua\\.gemini\\antigravity-ide\\brain\\cfdc57bb-8178-477f-8eae-d9bff5a702c1\\";
        Files.copy(Paths.get(filename), Paths.get(artifactDir + filename), StandardCopyOption.REPLACE_EXISTING);

        System.out.println("==================================================");
        System.out.println("PDF GENERATED SUCCESSFULLY AT: " + filename);
        System.out.println("==================================================");
    }

    private void addEndpointSection(Document document, Font sectionFont, Font bodyBold, Font bodyFont, Font codeFont, Font headerFont,
                                    String sectionTitle, String[][] endpoints) throws DocumentException {
        Paragraph p = new Paragraph(sectionTitle, sectionFont);
        p.setSpacingBefore(12);
        p.setSpacingAfter(6);
        document.add(p);

        for (String[] ep : endpoints) {
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 8f});

            // Method & URL Header
            PdfPCell mCell = new PdfPCell(new Phrase(ep[0], headerFont));
            switch (ep[0]) {
                case "GET" -> mCell.setBackgroundColor(new Color(16, 185, 129));
                case "POST" -> mCell.setBackgroundColor(new Color(59, 130, 246));
                case "PUT" -> mCell.setBackgroundColor(new Color(245, 158, 11));
                case "DELETE" -> mCell.setBackgroundColor(new Color(239, 68, 68));
                default -> mCell.setBackgroundColor(new Color(139, 92, 246));
            }
            mCell.setPadding(5);
            mCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(mCell);

            PdfPCell urlCell = new PdfPCell(new Phrase("http://localhost:8080" + ep[1] + "  (" + ep[2] + ")", bodyBold));
            urlCell.setBackgroundColor(new Color(248, 250, 252));
            urlCell.setPadding(5);
            table.addCell(urlCell);

            // Description
            PdfPCell descLabel = new PdfPCell(new Phrase("Description", bodyBold));
            descLabel.setPadding(4);
            table.addCell(descLabel);

            PdfPCell descVal = new PdfPCell(new Phrase(ep[3], bodyFont));
            descVal.setPadding(4);
            table.addCell(descVal);

            // Request Body
            PdfPCell reqLabel = new PdfPCell(new Phrase("Request Payload", bodyBold));
            reqLabel.setPadding(4);
            table.addCell(reqLabel);

            PdfPCell reqVal = new PdfPCell(new Phrase(ep[4], codeFont));
            reqVal.setPadding(4);
            reqVal.setBackgroundColor(new Color(241, 245, 249));
            table.addCell(reqVal);

            // Response Body
            PdfPCell resLabel = new PdfPCell(new Phrase("Expected Response", bodyBold));
            resLabel.setPadding(4);
            table.addCell(resLabel);

            PdfPCell resVal = new PdfPCell(new Phrase(ep[5], codeFont));
            resVal.setPadding(4);
            resVal.setBackgroundColor(new Color(241, 245, 249));
            table.addCell(resVal);

            table.setSpacingAfter(8);
            document.add(table);
        }
    }
}

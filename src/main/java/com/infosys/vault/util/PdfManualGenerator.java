package com.infosys.vault.util;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;

import java.awt.Color;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class PdfManualGenerator {

    // Custom Palette
    private static final Color NAVY = new Color(0x0f, 0x17, 0x2a);
    private static final Color INDIGO = new Color(0x4f, 0x46, 0xe5);
    private static final Color CYAN = new Color(0x08, 0x91, 0xb2);
    private static final Color DARK_BLUE = new Color(0x1e, 0x29, 0x3b);
    private static final Color LIGHT_BG = new Color(0xf8, 0xfa, 0xfc);
    private static final Color TEXT_DARK = new Color(0x33, 0x41, 0x55);
    private static final Color TEXT_MUTED = new Color(0x64, 0x74, 0x8b);
    private static final Color BORDER_COLOR = new Color(0xcb, 0xd5, 0xe1);

    // Header Footer Event Helper
    private static class HeaderFooterPageEvent extends PdfPageEventHelper {
        private final Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, TEXT_MUTED);
        private final Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_MUTED);

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            if (writer.getPageNumber() == 1) {
                return; // Skip cover page
            }
            PdfContentByte cb = writer.getDirectContent();

            // Draw Header
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                    new Phrase("PASSWORD VAULT & SECURITY SYSTEM — COMPLETE TECHNICAL MANUAL", headerFont),
                    54, 750, 0);
            cb.setColorStroke(new Color(0xe2, 0xe8, 0xf0));
            cb.setLineWidth(0.5f);
            cb.moveTo(54, 742);
            cb.lineTo(612 - 54, 742);
            cb.stroke();

            // Draw Footer
            cb.moveTo(54, 50);
            cb.lineTo(612 - 54, 50);
            cb.stroke();

            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                    new Phrase("Confidential — Infosys Project Documentation (Java Generated)", footerFont),
                    54, 36, 0);

            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                    new Phrase("Page " + writer.getPageNumber(), footerFont),
                    612 - 54, 36, 0);
        }
    }

    public static void generatePdf(OutputStream outputStream) throws Exception {
        try (Document document = new Document(PageSize.LETTER, 54, 54, 54, 54)) {
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            writer.setPageEvent(new HeaderFooterPageEvent());
            document.open();

            // Fonts
            Font fontCoverPre = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, INDIGO);
            Font fontCoverTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, NAVY);
            Font fontCoverSubtitle = FontFactory.getFont(FontFactory.HELVETICA, 12, CYAN);
            Font fontMeta = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, TEXT_MUTED);
            Font fontH1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, NAVY);
            Font fontH2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11.5f, INDIGO);
            Font fontH3 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.0f, DARK_BLUE);
            Font fontBody = FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK);
            Font fontBodyBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, TEXT_DARK);
            Font fontBullet = FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK);
            Font fontCode = FontFactory.getFont(FontFactory.COURIER, 8, NAVY);
            Font fontTableHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, Color.WHITE);
            Font fontTableCell = FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_DARK);
            Font fontTableCellBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, TEXT_DARK);

            // ---------------------------------------------------------
            // COVER PAGE
            // ---------------------------------------------------------
            document.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 20)));

            Paragraph pPre = new Paragraph("SECURITY & CRYPTOGRAPHIC ARCHITECTURE", fontCoverPre);
            pPre.setAlignment(Element.ALIGN_CENTER);
            pPre.setSpacingAfter(10);
            document.add(pPre);

            Paragraph pTitle = new Paragraph("Password Vault Project\nComplete Documentation Manual", fontCoverTitle);
            pTitle.setAlignment(Element.ALIGN_CENTER);
            pTitle.setSpacingAfter(15);
            document.add(pTitle);

            Paragraph pSub = new Paragraph("Comprehensive Guide on Client-Side PBKDF2 Key Derivation, AES-256-GCM Zero-Knowledge Encryption, Security Audit & All Project Features", fontCoverSubtitle);
            pSub.setAlignment(Element.ALIGN_CENTER);
            pSub.setSpacingAfter(25);
            document.add(pSub);

            // Metadata Table Box
            PdfPTable metaBox = new PdfPTable(1);
            metaBox.setWidthPercentage(100);
            PdfPCell metaCell = new PdfPCell();
            metaCell.setBackgroundColor(new Color(0xf0, 0xf9, 0xff));
            metaCell.setBorderColor(new Color(0x02, 0x84, 0xc7));
            metaCell.setBorderWidth(1.5f);
            metaCell.setPadding(12);

            Paragraph metaContent = new Paragraph();
            metaContent.setLeading(14);
            metaContent.add(new Chunk("Project Title: ", fontBodyBold));
            metaContent.add(new Chunk("Password Fault / Vault Management System\n", fontBody));
            metaContent.add(new Chunk("Architecture: ", fontBodyBold));
            metaContent.add(new Chunk("Zero-Knowledge Client-Side Encryption (Web Crypto API + Spring Boot)\n", fontBody));
            metaContent.add(new Chunk("Encryption Standards: ", fontBodyBold));
            metaContent.add(new Chunk("PBKDF2 (SHA-256, 100,000 iterations), AES-256-GCM (96-bit IV)\n", fontBody));
            metaContent.add(new Chunk("Backend Tech Stack: ", fontBodyBold));
            metaContent.add(new Chunk("Java 17, Spring Boot 3, Spring Security, JWT, JPA, Hibernate, H2/PostgreSQL\n", fontBody));
            metaContent.add(new Chunk("Frontend Tech Stack: ", fontBodyBold));
            metaContent.add(new Chunk("React, Vite, Tailwind CSS, Lucide Icons, SweetAlert2\n", fontBody));
            metaContent.add(new Chunk("Key Security Features: ", fontBodyBold));
            metaContent.add(new Chunk("Password Generator, Real-time Health Audit, Encrypted Backup/Restore, Auto-Lock Idle Inactivity, OTP Multi-Factor Authentication", fontBody));
            metaCell.addElement(metaContent);
            metaBox.addCell(metaCell);
            document.add(metaBox);

            document.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 40)));

            Paragraph pMetaFooter = new Paragraph("Prepared for Infosys Project Review & Technical Verification\nVersion 1.0.0 — August 2026 (Generated via Java OpenPDF)", fontMeta);
            pMetaFooter.setAlignment(Element.ALIGN_CENTER);
            document.add(pMetaFooter);

            document.newPage();

            // ---------------------------------------------------------
            // SECTION 1: EXECUTIVE SUMMARY & ARCHITECTURE OVERVIEW
            // ---------------------------------------------------------
            addSectionHeader(document, "1. Executive Summary & Architecture", fontH1);

            Paragraph pSec1 = new Paragraph(
                    "The Password Fault / Vault Project is an enterprise-grade, zero-knowledge credential management system designed to eliminate plaintext password storage across servers, network traffic, and persistent databases. The system enforces client-side cryptographic isolation, ensuring that plain text passwords, secure notes, credit cards, and personal identities are encrypted on the client device using the Web Crypto API prior to transmission.", fontBody);
            pSec1.setSpacingAfter(8);
            document.add(pSec1);

            Paragraph pH2_1 = new Paragraph("Core Architecture Principles:", fontH2);
            pH2_1.setSpacingAfter(6);
            document.add(pH2_1);

            addBullet(document, "Zero-Knowledge Security Model: The backend application server and database never receive, process, or store unencrypted passwords or the user's master key.", fontBullet);
            addBullet(document, "Client-Side Key Derivation: Master passwords derive 256-bit symmetric AES keys using PBKDF2 with 100,000 iterations and cryptographic salt.", fontBullet);
            addBullet(document, "Authenticated Symmetric Encryption: Galois/Counter Mode (AES-256-GCM) ensures confidentiality and payload integrity verification.", fontBullet);
            addBullet(document, "Full Feature Suite: Includes password generation, real-time security auditing, auto-rotation, encrypted JSON/CSV backup import & export, idle auto-lock timeout, and OTP verification.", fontBullet);

            document.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 6)));

            // Architecture Comparison Table
            PdfPTable archTable = new PdfPTable(new float[]{110, 185, 209});
            archTable.setWidthPercentage(100);
            addTableHeaderCell(archTable, "Security Aspect", fontTableHeader);
            addTableHeaderCell(archTable, "Traditional Password Vault", fontTableHeader);
            addTableHeaderCell(archTable, "Password Fault Project (Zero-Knowledge)", fontTableHeader);

            addTableCell(archTable, "Password Encryption", fontTableCellBold, LIGHT_BG);
            addTableCell(archTable, "Server-side DB encryption / Plaintext in transit", fontTableCell, LIGHT_BG);
            addTableCell(archTable, "Client-Side AES-256-GCM via Web Crypto API", fontTableCell, LIGHT_BG);

            addTableCell(archTable, "Server Knowledge", fontTableCellBold, Color.WHITE);
            addTableCell(archTable, "Server has master key or access to secrets", fontTableCell, Color.WHITE);
            addTableCell(archTable, "Zero-Knowledge; server stores only ciphertext & IV", fontTableCell, Color.WHITE);

            addTableCell(archTable, "Key Derivation", fontTableCellBold, LIGHT_BG);
            addTableCell(archTable, "Static key or simple MD5/SHA1 hashing", fontTableCell, LIGHT_BG);
            addTableCell(archTable, "PBKDF2 SHA-256 with 100,000 iterations + Salt", fontTableCell, LIGHT_BG);

            addTableCell(archTable, "Session Management", fontTableCellBold, Color.WHITE);
            addTableCell(archTable, "Standard long-lived session cookie", fontTableCell, Color.WHITE);
            addTableCell(archTable, "JWT + 1-Min Idle Inactivity Auto-Lock & Key Purge", fontTableCell, Color.WHITE);

            addTableCell(archTable, "Health Auditing", fontTableCellBold, LIGHT_BG);
            addTableCell(archTable, "Manual or missing", fontTableCell, LIGHT_BG);
            addTableCell(archTable, "Automated scanner with 1-Click Auto-Rotation", fontTableCell, LIGHT_BG);

            document.add(archTable);

            document.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 10)));

            // ---------------------------------------------------------
            // SECTION 2: CRYPTOGRAPHIC DEEP-DIVE & KEY DERIVATION
            // ---------------------------------------------------------
            addSectionHeader(document, "2. Cryptographic Infrastructure & Key Derivation", fontH1);

            Paragraph pSec2 = new Paragraph("The core cryptographic engine is implemented in JavaScript via frontend/src/utils/crypto.js using standard W3C Web Crypto API calls (window.crypto.subtle), eliminating external vulnerable encryption dependencies.", fontBody);
            pSec2.setSpacingAfter(6);
            document.add(pSec2);

            Paragraph pH2_21 = new Paragraph("2.1 Master Key Derivation (PBKDF2 SHA-256)", fontH2);
            pH2_21.setSpacingAfter(4);
            document.add(pH2_21);

            Paragraph pPbkdf2Desc = new Paragraph("When a user logs in, their Master Password and account Salt (Base64) are processed through Password-Based Key Derivation Function 2 (PBKDF2):", fontBody);
            pPbkdf2Desc.setSpacingAfter(6);
            document.add(pPbkdf2Desc);

            addCodeBlock(document, """
                    // PBKDF2 AES-256 Key Derivation Implementation (frontend/src/utils/crypto.js)
                    export async function deriveKey(masterPassword, saltBase64) {
                      const enc = new TextEncoder();
                      const passwordBuffer = enc.encode(masterPassword);
                      const binarySalt = atob(saltBase64);
                      const saltBuffer = new Uint8Array(binarySalt.length);
                      for (let i = 0; i < binarySalt.length; i++) {
                        saltBuffer[i] = binarySalt.charCodeAt(i);
                      }
                      const baseKey = await window.crypto.subtle.importKey(
                        'raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveKey']
                      );
                      return await window.crypto.subtle.deriveKey(
                        { name: 'PBKDF2', salt: saltBuffer, iterations: 100000, hash: 'SHA-256' },
                        baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
                      );
                    }""", fontCode);

            Paragraph pH2_22 = new Paragraph("2.2 AES-256-GCM Encryption & Decryption Mechanics", fontH2);
            pH2_22.setSpacingAfter(4);
            document.add(pH2_22);

            Paragraph pAesDesc = new Paragraph("Each secret item generates a fresh, non-repeating 96-bit (12-byte) Initialization Vector (IV) using window.crypto.getRandomValues. GCM mode guarantees both confidentiality and authentication tags preventing tampering.", fontBody);
            pAesDesc.setSpacingAfter(6);
            document.add(pAesDesc);

            addCodeBlock(document, """
                    // AES-256-GCM Encryption (frontend/src/utils/crypto.js)
                    export async function encryptPassword(plainText, key) {
                      const enc = new TextEncoder();
                      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
                      const encryptedBuffer = await window.crypto.subtle.encrypt(
                        { name: 'AES-GCM', iv }, key, enc.encode(plainText)
                      );
                      return {
                        encryptedPassword: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
                        iv: btoa(String.fromCharCode(...iv))
                      };
                    }""", fontCode);

            document.newPage();

            // ---------------------------------------------------------
            // SECTION 3: HOW TO CREATE, ENCRYPT, AND STORE PASSWORDS
            // ---------------------------------------------------------
            addSectionHeader(document, "3. Step-by-Step Guide: How to Create & Encrypt Passwords", fontH1);

            Paragraph pSec3 = new Paragraph("This section provides an explicit end-to-end operational guide detailing how credentials are created, generated, encrypted client-side, transmitted, stored in the backend database, and subsequently retrieved and decrypted.", fontBody);
            pSec3.setSpacingAfter(8);
            document.add(pSec3);

            document.add(new Paragraph("Step 1: User Authentication & Key Generation", fontH3));
            addBullet(document, "1. User submits login or registration credentials (Username/Email & Password).", fontBullet);
            addBullet(document, "2. Backend verifies account hash via Spring Security PasswordEncoder (BCrypt).", fontBullet);
            addBullet(document, "3. System returns JWT Session Token and account salt.", fontBullet);
            addBullet(document, "4. Frontend immediately executes deriveKey(masterPassword, salt) to derive the 256-bit AES master key in memory.", fontBullet);

            document.add(new Paragraph("Step 2: Password Creation & Generation", fontH3));
            addBullet(document, "1. User clicks Add Item or opens the Password Generator Modal.", fontBullet);
            addBullet(document, "2. User can specify password parameters: Length (8–64 characters), Uppercase (A-Z), Lowercase (a-z), Numbers (0-9), and Symbols (!@#$%^&*).", fontBullet);
            addBullet(document, "3. Generator executes generateSecurePassword(length, options) using cryptographically secure random bytes:", fontBullet);

            addCodeBlock(document, """
                    // Secure Random Password Generator (frontend/src/utils/crypto.js)
                    export function generateSecurePassword(length = 18, options) {
                      const charset = { uppercase: 'A..Z', lowercase: 'a..z', numbers: '0..9', symbols: '!@#$%' };
                      let validChars = '';
                      if (options.uppercase) validChars += charset.uppercase;
                      if (options.lowercase) validChars += charset.lowercase;
                      if (options.numbers) validChars += charset.numbers;
                      if (options.symbols) validChars += charset.symbols;
                      const array = new Uint8Array(length);
                      window.crypto.getRandomValues(array); // CS-PRNG
                      let result = '';
                      for (let i = 0; i < length; i++) result += validChars[array[i] % validChars.length];
                      return result;
                    }""", fontCode);

            document.add(new Paragraph("Step 3: Real-Time Strength Scoring", fontH3));
            Paragraph pStep3 = new Paragraph("As the user types or generates a password, calculatePasswordStrength(password) calculates a score from 0 to 100 based on length and character variance, labeling the result: Weak (<40), Moderate (40-69), Strong (70-89), or Very Strong (90-100).", fontBody);
            pStep3.setSpacingAfter(6);
            document.add(pStep3);

            document.add(new Paragraph("Step 4: Client-Side Encryption & Transmission", fontH3));
            addBullet(document, "1. The plain password is passed into encryptPassword(plainText, key).", fontBullet);
            addBullet(document, "2. Function outputs encryptedPassword (Base64) and iv (Base64).", fontBullet);
            addBullet(document, "3. Frontend sends JSON DTO request to REST endpoint POST /api/vault:", fontBullet);

            addCodeBlock(document, """
                    // Payload sent over REST API to Spring Boot Backend:
                    {
                      "title": "Corporate Email",
                      "username": "user@infosys.com",
                      "encryptedPassword": "q9K3xL1N/8vB...== [BASE64 CIPHERTEXT]",
                      "iv": "u8F3xP0aM1b...== [BASE64 96-BIT IV]",
                      "url": "https://mail.infosys.com",
                      "category": "LOGIN",
                      "favorite": true,
                      "notes": "Primary work email account"
                    }""", fontCode);

            document.add(new Paragraph("Step 5 & 6: Backend Storage & Decryption on Demand", fontH3));
            Paragraph pStep5 = new Paragraph("Spring Boot VaultService.java maps the payload into a VaultItem JPA Entity associated with the authenticated User entity. When credentials are downloaded via GET /api/vault, items remain encrypted until the user explicitly toggles password visibility or copies the secret.", fontBody);
            pStep5.setSpacingAfter(8);
            document.add(pStep5);

            document.newPage();

            // ---------------------------------------------------------
            // SECTION 4: COMPREHENSIVE PROJECT FEATURE INVENTORY
            // ---------------------------------------------------------
            addSectionHeader(document, "4. Comprehensive Project Feature Documentation", fontH1);

            Paragraph pSec4 = new Paragraph("The Password Fault Project incorporates a complete set of security modules designed to manage the entire lifecycle of credentials, backup safety, and session protection.", fontBody);
            pSec4.setSpacingAfter(8);
            document.add(pSec4);

            PdfPTable featTable = new PdfPTable(new float[]{115, 249, 140});
            featTable.setWidthPercentage(100);
            addTableHeaderCell(featTable, "Feature Component", fontTableHeader);
            addTableHeaderCell(featTable, "Technical Description & Implementation", fontTableHeader);
            addTableHeaderCell(featTable, "Security Benefit", fontTableHeader);

            addFeatureRow(featTable, "1. Password Generator Modal", "Generates 8-64 char cryptographically random strings using CS-PRNG (crypto.getRandomValues) with configurable options.", "Prevents weak human-created passwords.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addFeatureRow(featTable, "2. Real-Time Strength Meter", "Evaluates character variance, entropy, and length rules in real time, producing a 0-100 visual score meter.", "Instant feedback during password creation.", fontTableCellBold, fontTableCell, Color.WHITE);
            addFeatureRow(featTable, "3. Security Audit Scanner", "Scans all vault items for weak passwords (score < 50) and reused passwords across accounts.", "Identifies high-risk credential hygiene.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addFeatureRow(featTable, "4. 1-Click Auto-Rotation", "Allows users to rotate weak or reused passwords directly from the Audit modal with 1 click, re-encrypting automatically.", "Rapid remediation of compromised items.", fontTableCellBold, fontTableCell, Color.WHITE);
            addFeatureRow(featTable, "5. Encrypted Backup Export", "Exports vault records to JSON files encrypted with a master passphrase via PBKDF2/AES-GCM or unencrypted JSON/CSV.", "Safe portable offline backups.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addFeatureRow(featTable, "6. Vault Import Tool", "Parses JSON backup files or standard Chrome/Bitwarden CSV exports, batch-encrypting items client-side before storage.", "Seamless migration from existing tools.", fontTableCellBold, fontTableCell, Color.WHITE);
            addFeatureRow(featTable, "7. Idle Inactivity Auto-Lock", "Monitors user inputs. Triggers 10s countdown modal after 1 min idle, automatically logging out and clearing RAM keys.", "Protects unattended physical workstations.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addFeatureRow(featTable, "8. OTP Multi-Factor Auth", "Spring Boot OtpService generates 6-digit one-time passcodes sent via email for user registration and password resets.", "Prevents unauthorized account takeover.", fontTableCellBold, fontTableCell, Color.WHITE);
            addFeatureRow(featTable, "9. Category & Favorites", "Organizes items into LOGIN, CARD, NOTE, IDENTITY categories with quick search and favorite pinning.", "Efficient UI management.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addFeatureRow(featTable, "10. Clipboard Auto-Wipe", "Copies secret to clipboard with automated UI notification and clipboard clearing logic.", "Prevents credential leakage via clipboard history.", fontTableCellBold, fontTableCell, Color.WHITE);

            document.add(featTable);

            document.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 10)));

            // ---------------------------------------------------------
            // SECTION 5: BACKEND REST API & DATABASE DESIGN
            // ---------------------------------------------------------
            addSectionHeader(document, "5. Backend REST API & Database Schema", fontH1);

            Paragraph pSec5 = new Paragraph("The Java Spring Boot backend manages user accounts, JWT security filtering, OTP verification, and relational persistence using JPA Hibernate.", fontBody);
            pSec5.setSpacingAfter(8);
            document.add(pSec5);

            PdfPTable apiTable = new PdfPTable(new float[]{65, 175, 264});
            apiTable.setWidthPercentage(100);
            addTableHeaderCell(apiTable, "HTTP Method", fontTableHeader);
            addTableHeaderCell(apiTable, "Endpoint Path", fontTableHeader);
            addTableHeaderCell(apiTable, "Description & Functionality", fontTableHeader);

            addApiRow(apiTable, "POST", "/api/auth/send-otp", "Sends 6-digit registration OTP to user email.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addApiRow(apiTable, "POST", "/api/auth/verify-otp", "Verifies 6-digit email registration OTP code.", fontTableCellBold, fontTableCell, Color.WHITE);
            addApiRow(apiTable, "POST", "/api/auth/register", "Registers user after OTP verification, returns JWT token.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addApiRow(apiTable, "POST", "/api/auth/login", "Authenticates user against BCrypt hash, returns JWT token.", fontTableCellBold, fontTableCell, Color.WHITE);
            addApiRow(apiTable, "POST", "/api/auth/forgot-password/send-otp", "Sends password reset OTP code to registered email.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addApiRow(apiTable, "POST", "/api/auth/reset-password", "Resets user password after OTP verification.", fontTableCellBold, fontTableCell, Color.WHITE);
            addApiRow(apiTable, "GET", "/api/vault", "Retrieves all encrypted vault items for authenticated user.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addApiRow(apiTable, "POST", "/api/vault", "Saves a new encrypted vault item (title, username, ciphertext, IV).", fontTableCellBold, fontTableCell, Color.WHITE);
            addApiRow(apiTable, "PUT", "/api/vault/{id}", "Updates existing encrypted vault item.", fontTableCellBold, fontTableCell, LIGHT_BG);
            addApiRow(apiTable, "DELETE", "/api/vault/{id}", "Deletes vault record from database.", fontTableCellBold, fontTableCell, Color.WHITE);

            document.add(apiTable);

            document.newPage();

            // ---------------------------------------------------------
            // SECTION 6: POSTMAN TESTING GUIDE
            // ---------------------------------------------------------
            addSectionHeader(document, "6. Postman REST API Testing Guide", fontH1);

            Paragraph pSec6 = new Paragraph("Below are the exact Postman testing endpoints, HTTP methods, headers, and sample JSON payloads for testing authentication and password reset APIs:", fontBody);
            pSec6.setSpacingAfter(8);
            document.add(pSec6);

            document.add(new Paragraph("1. Send OTP (POST http://localhost:8080/api/auth/send-otp)", fontH2));
            addCodeBlock(document, "Header: Content-Type: application/json\nBody:\n{\n  \"email\": \"user@gmail.com\"\n}", fontCode);

            document.add(new Paragraph("2. Verify OTP (POST http://localhost:8080/api/auth/verify-otp)", fontH2));
            addCodeBlock(document, "Header: Content-Type: application/json\nBody:\n{\n  \"email\": \"user@gmail.com\",\n  \"otp\": \"123456\"\n}", fontCode);

            document.add(new Paragraph("3. Register (POST http://localhost:8080/api/auth/register)", fontH2));
            addCodeBlock(document, "Header: Content-Type: application/json\nBody:\n{\n  \"fullName\": \"Rabindra Dakua\",\n  \"username\": \"09Rabindra\",\n  \"email\": \"user@gmail.com\",\n  \"password\": \"Password123!\"\n}", fontCode);

            document.add(new Paragraph("4. Login (POST http://localhost:8080/api/auth/login)", fontH2));
            addCodeBlock(document, "Header: Content-Type: application/json\nBody:\n{\n  \"email\": \"user@gmail.com\",\n  \"password\": \"Password123!\"\n}", fontCode);

            document.add(new Paragraph("5. Reset Password (POST http://localhost:8080/api/auth/reset-password)", fontH2));
            addCodeBlock(document, "Header: Content-Type: application/json\nBody:\n{\n  \"email\": \"user@gmail.com\",\n  \"otp\": \"123456\",\n  \"newPassword\": \"NewPassword123!\"\n}", fontCode);

            // ---------------------------------------------------------
            // SECTION 7: SYSTEM VERIFICATION & APPROVAL
            // ---------------------------------------------------------
            addSectionHeader(document, "7. System Verification & Approval", fontH1);

            PdfPTable signoffBox = new PdfPTable(1);
            signoffBox.setWidthPercentage(100);
            PdfPCell signCell = new PdfPCell();
            signCell.setBackgroundColor(LIGHT_BG);
            signCell.setBorderColor(NAVY);
            signCell.setBorderWidth(1);
            signCell.setPadding(10);

            Paragraph signContent = new Paragraph();
            signContent.setLeading(14);
            signContent.add(new Chunk("DOCUMENTATION APPROVAL & SYSTEM VERIFICATION (JAVA GENERATED)\n\n", fontBodyBold));
            signContent.add(new Chunk("Project Title: Password Vault Management System\n", fontBody));
            signContent.add(new Chunk("Status: Fully Functional & Verified\n", fontBody));
            signContent.add(new Chunk("Cryptographic Engine: PBKDF2 (SHA-256) + AES-256-GCM (Web Crypto API)\n", fontBody));
            signContent.add(new Chunk("Backend: Spring Boot 3 REST API with Security & JWT\n", fontBody));
            signContent.add(new Chunk("Frontend: React + Vite + Tailwind CSS\n", fontBody));
            signContent.add(new Chunk("Report Date: August 2026", fontBody));

            signCell.addElement(signContent);
            signoffBox.addCell(signCell);
            document.add(signoffBox);
        }
    }

    private static void addSectionHeader(Document doc, String title, Font font) throws Exception {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingBefore(12);
        p.setSpacingAfter(6);
        doc.add(p);

        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setFixedHeight(1.0f);
        cell.setBackgroundColor(BORDER_COLOR);
        cell.setBorder(Rectangle.NO_BORDER);
        line.addCell(cell);
        doc.add(line);
        doc.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 6)));
    }

    private static void addBullet(Document doc, String text, Font font) throws Exception {
        Paragraph p = new Paragraph("• " + text, font);
        p.setIndentationLeft(15);
        p.setFirstLineIndent(-10);
        p.setSpacingAfter(4);
        doc.add(p);
    }

    private static void addCodeBlock(Document doc, String codeText, Font font) throws Exception {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(0xf1, 0xf5, 0xf9));
        cell.setBorderColor(BORDER_COLOR);
        cell.setBorderWidth(0.5f);
        cell.setPadding(6);

        Paragraph p = new Paragraph(codeText, font);
        p.setLeading(11);
        cell.addElement(p);
        table.addCell(cell);
        table.setSpacingBefore(4);
        table.setSpacingAfter(6);
        doc.add(table);
    }

    private static void addTableHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(NAVY);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private static void addTableCell(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(5);
        cell.setBorderColor(BORDER_COLOR);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private static void addFeatureRow(PdfPTable table, String name, String desc, String benefit, Font fontBold, Font fontRegular, Color bgColor) {
        addTableCell(table, name, fontBold, bgColor);
        addTableCell(table, desc, fontRegular, bgColor);
        addTableCell(table, benefit, fontRegular, bgColor);
    }

    private static void addApiRow(PdfPTable table, String method, String path, String desc, Font fontBold, Font fontRegular, Color bgColor) {
        addTableCell(table, method, fontBold, bgColor);
        addTableCell(table, path, fontRegular, bgColor);
        addTableCell(table, desc, fontRegular, bgColor);
    }

    public static void main(String[] args) {
        String outputPath = "Password_Vault_Project_Manual.pdf";
        if (args.length > 0) {
            outputPath = args[0];
        }
        try (FileOutputStream fos = new FileOutputStream(outputPath)) {
            generatePdf(fos);
            System.out.println("Java OpenPDF successfully generated PDF: " + outputPath);
        } catch (Exception e) {
            System.err.println("Failed to generate PDF: " + e.getMessage());
        }
    }
}

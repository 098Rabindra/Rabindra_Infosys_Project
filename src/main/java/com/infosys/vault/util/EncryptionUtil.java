package com.infosys.vault.util;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

public class EncryptionUtil {

    private static final String AES_ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits
    private static final int GCM_TAG_LENGTH = 128; // 128 bits
    private static final int PBKDF2_ITERATIONS = 100000;
    private static final int KEY_LENGTH = 256;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static class EncryptedPayload {
        private final String ciphertext;
        private final String iv;

        public EncryptedPayload(String ciphertext, String iv) {
            this.ciphertext = ciphertext;
            this.iv = iv;
        }

        public String getCiphertext() {
            return ciphertext;
        }

        public String getIv() {
            return iv;
        }
    }

    // Derive SecretKey from password and salt using PBKDF2WithHmacSHA256
    public static SecretKey deriveKey(String password, String salt) throws Exception {
        byte[] saltBytes = salt.getBytes(StandardCharsets.UTF_8);
        KeySpec spec = new PBEKeySpec(password.toCharArray(), saltBytes, PBKDF2_ITERATIONS, KEY_LENGTH);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] secret = factory.generateSecret(spec).getEncoded();
        return new SecretKeySpec(secret, AES_ALGORITHM);
    }

    // Encrypt plain text using AES-256-GCM
    public static EncryptedPayload encrypt(String plainText, SecretKey key) throws Exception {
        byte[] iv = new byte[GCM_IV_LENGTH];
        SECURE_RANDOM.nextBytes(iv);

        Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

        byte[] cipherTextBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        String ciphertextBase64 = Base64.getEncoder().encodeToString(cipherTextBytes);
        String ivBase64 = Base64.getEncoder().encodeToString(iv);

        return new EncryptedPayload(ciphertextBase64, ivBase64);
    }

    // Decrypt ciphertext using AES-256-GCM
    public static String decrypt(String ciphertextBase64, String ivBase64, SecretKey key) throws Exception {
        byte[] cipherTextBytes = Base64.getDecoder().decode(ciphertextBase64);
        byte[] ivBytes = Base64.getDecoder().decode(ivBase64);

        Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

        byte[] plainTextBytes = cipher.doFinal(cipherTextBytes);
        return new String(plainTextBytes, StandardCharsets.UTF_8);
    }
}

package com.infosys.vault;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infosys.vault.dto.LoginRequest;
import com.infosys.vault.dto.RegisterRequest;
import com.infosys.vault.dto.VaultItemRequest;
import com.infosys.vault.model.Category;
import com.infosys.vault.model.PermissionLevel;
import com.infosys.vault.model.User;
import com.infosys.vault.model.VaultItem;
import com.infosys.vault.repository.UserRepository;
import com.infosys.vault.repository.VaultItemRepository;
import com.infosys.vault.security.JwtUtils;
import com.infosys.vault.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("all")
public class SecurityWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VaultItemRepository vaultItemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private OtpService otpService;

    private User testUser1;
    private User testUser2;
    private String tokenUser1;
    private String tokenUser2;

    @BeforeEach
    public void setUp() {
        // Cleanup existing test data
        vaultItemRepository.deleteAll();
        userRepository.deleteAll();

        // Create Test User 1 (Owner) with valid format (01Owner)
        testUser1 = new User("Owner User", "01Owner", "owner@vault.test", passwordEncoder.encode("MasterPass123!"));
        testUser1 = userRepository.save(testUser1);
        tokenUser1 = jwtUtils.generateJwtToken(testUser1.getId(), testUser1.getEmail());

        // Create Test User 2 (Recipient) with valid format (02Recipient)
        testUser2 = new User("Recipient User", "02Recipient", "recipient@vault.test", passwordEncoder.encode("MasterPass123!"));
        testUser2 = userRepository.save(testUser2);
        tokenUser2 = jwtUtils.generateJwtToken(testUser2.getId(), testUser2.getEmail());
    }

    // ==========================================
    // 1. AUTHENTICATION WORKFLOW TESTS
    // ==========================================

    @Test
    @DisplayName("1.1 Positive: User Registration with Valid Data")
    void testRegisterSuccess() throws Exception {
        String email = "intern@infosys.test";
        otpService.generateAndSendOtp(email);
        String otp = otpService.getLastOtp(email);
        otpService.verifyOtp(email, otp);

        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test Intern");
        request.setUsername("09TestIntern");
        request.setEmail(email);
        request.setPassword("StrongPass123!");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is("intern@infosys.test")));

        assertTrue(userRepository.existsByEmail("intern@infosys.test"));
    }

    @Test
    @DisplayName("1.2 Negative: User Registration with Duplicate Email")
    void testRegisterDuplicateEmail() throws Exception {
        String email = "owner@vault.test";
        otpService.generateAndSendOtp(email);
        String otp = otpService.getLastOtp(email);
        otpService.verifyOtp(email, otp);

        RegisterRequest request = new RegisterRequest();
        request.setFullName("Duplicate User");
        request.setUsername("99UniqueUser");
        request.setEmail(email); // Duplicate Email
        request.setPassword("StrongPass123!");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Email address already exists")));
    }

    @Test
    @DisplayName("1.3 Positive: Login with Valid Credentials")
    void testLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("owner@vault.test");
        request.setPassword("MasterPass123!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.email", is("owner@vault.test")));
    }

    @Test
    @DisplayName("1.4 Negative: Login with Wrong Password")
    void testLoginInvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("owner@vault.test");
        request.setPassword("WrongPassword999!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid username or password")));
    }

    // ==========================================
    // 2. PASSWORD VAULT CRUD WORKFLOW TESTS
    // ==========================================

    @Test
    @DisplayName("2.1 Positive: Create Vault Credential")
    void testCreateVaultItemSuccess() throws Exception {
        VaultItemRequest request = new VaultItemRequest();
        request.setTitle("GitHub Corporate");
        request.setUsername("infosys_admin");
        request.setEncryptedPassword("Base64AESEncryptedStringExample==");
        request.setIv("RandomIvBase64==");
        request.setUrl("https://github.com/company");
        request.setCategory(Category.GITHUB);
        request.setNotes("Internal corporate repo");

        mockMvc.perform(post("/api/vault/items")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("GitHub Corporate")))
                .andExpect(jsonPath("$.username", is("infosys_admin")));

        assertEquals(1, vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(testUser1.getId()).size());
    }

    @Test
    @DisplayName("2.2 Negative: Prevent Duplicate Vault Item")
    void testCreateDuplicateVaultItem() throws Exception {
        VaultItemRequest request = new VaultItemRequest();
        request.setTitle("AWS Console");
        request.setUsername("admin_user");
        request.setEncryptedPassword("EncryptedSecret==");
        request.setIv("Iv123==");
        request.setCategory(Category.WORK);

        // First creation -> success
        mockMvc.perform(post("/api/vault/items")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Duplicate creation attempt -> bad request
        mockMvc.perform(post("/api/vault/items")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Vault item already exists")));
    }

    @Test
    @DisplayName("2.3 Positive: Read User Vault Items")
    void testGetVaultItems() throws Exception {
        VaultItem item = new VaultItem();
        item.setUser(testUser1);
        item.setTitle("Gmail Account");
        item.setUsername("owner@gmail.com");
        item.setEncryptedPassword("Cipher123==");
        item.setIv("Iv123==");
        item.setCategory(Category.LOGIN);
        item.setPermissionLevel(PermissionLevel.FULL_MANAGEMENT);
        vaultItemRepository.save(item);

        mockMvc.perform(get("/api/vault/items")
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Gmail Account")));
    }

    // ==========================================
    // 3. CREDENTIAL SHARING & ACCESS CONTROL TESTS
    // ==========================================

    @Test
    @DisplayName("3.1 Positive: Share Credential with Valid Recipient")
    void testShareCredentialSuccess() throws Exception {
        VaultItem item = new VaultItem();
        item.setUser(testUser1);
        item.setTitle("Shared Service Account");
        item.setUsername("service_admin");
        item.setEncryptedPassword("SharedCipher==");
        item.setIv("SharedIv==");
        item.setCategory(Category.WORK);
        item.setPermissionLevel(PermissionLevel.FULL_MANAGEMENT);
        item = vaultItemRepository.save(item);

        mockMvc.perform(patch("/api/vault/items/" + item.getId() + "/permission")
                .header("Authorization", "Bearer " + tokenUser1)
                .param("level", "VIEW_ONLY")
                .param("recipientEmail", "recipient@vault.test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shared", is(true)));

        // Verify recipient received cloned item in DB with VIEW_ONLY level
        assertEquals(1, vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(testUser2.getId()).size());
        VaultItem recipientItem = vaultItemRepository.findByUserIdOrderByUpdatedAtDesc(testUser2.getId()).get(0);
        assertEquals(PermissionLevel.VIEW_ONLY, recipientItem.getPermissionLevel());
    }

    @Test
    @DisplayName("3.2 Negative: Share Credential with Non-Existing User")
    void testShareCredentialNonExistingUser() throws Exception {
        VaultItem item = new VaultItem();
        item.setUser(testUser1);
        item.setTitle("Private Vault Item");
        item.setUsername("owner");
        item.setEncryptedPassword("SecretCipher==");
        item.setIv("SecretIv==");
        item.setCategory(Category.LOGIN);
        item = vaultItemRepository.save(item);

        mockMvc.perform(patch("/api/vault/items/" + item.getId() + "/permission")
                .header("Authorization", "Bearer " + tokenUser1)
                .param("level", "EDIT_ACCESS")
                .param("recipientEmail", "unknown_user_9999@vault.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Recipient user not found")));
    }

    @Test
    @DisplayName("3.3 Negative: View Only Recipient Cannot Edit Credential")
    void testViewOnlyRecipientCannotEdit() throws Exception {
        VaultItem recipientItem = new VaultItem();
        recipientItem.setUser(testUser2);
        recipientItem.setTitle("Restricted Credential");
        recipientItem.setUsername("view_only_user");
        recipientItem.setEncryptedPassword("SecretCipher==");
        recipientItem.setIv("SecretIv==");
        recipientItem.setPermissionLevel(PermissionLevel.VIEW_ONLY);
        recipientItem = vaultItemRepository.save(recipientItem);

        VaultItemRequest updateReq = new VaultItemRequest();
        updateReq.setTitle("Restricted Credential Updated");
        updateReq.setUsername("hacked_user");
        updateReq.setEncryptedPassword("HackedCipher==");
        updateReq.setIv("HackedIv==");

        mockMvc.perform(put("/api/vault/items/" + recipientItem.getId())
                .header("Authorization", "Bearer " + tokenUser2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Permission Denied: 'View Only' access level cannot edit")));
    }

    @Test
    @DisplayName("3.4 Negative: Edit Access Recipient Cannot Delete Credential")
    void testEditAccessRecipientCannotDelete() throws Exception {
        VaultItem recipientItem = new VaultItem();
        recipientItem.setUser(testUser2);
        recipientItem.setTitle("Shared Edit Account");
        recipientItem.setUsername("editor_user");
        recipientItem.setEncryptedPassword("Cipher==");
        recipientItem.setIv("Iv==");
        recipientItem.setPermissionLevel(PermissionLevel.EDIT_ACCESS);
        recipientItem = vaultItemRepository.save(recipientItem);

        mockMvc.perform(delete("/api/vault/items/" + recipientItem.getId())
                .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Permission Denied: Only 'Full Management' permission level can delete")));
    }

    // ==========================================
    // 4. SECURITY MONITORING & REPORTS TESTS
    // ==========================================

    @Test
    @DisplayName("4.1 Positive: Fetch Security Audit Logs")
    void testGetAuditLogs() throws Exception {
        mockMvc.perform(get("/api/security/audit-logs")
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("4.2 Positive: Fetch Password Health Report")
    void testGetPasswordHealthReport() throws Exception {
        mockMvc.perform(get("/api/reports/password-health")
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore", notNullValue()));
    }

    @Test
    @DisplayName("4.3 Positive: Fetch Login Activity Report")
    void testGetLoginActivityReport() throws Exception {
        mockMvc.perform(get("/api/reports/login-activity")
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentActivities", notNullValue()));
    }
}

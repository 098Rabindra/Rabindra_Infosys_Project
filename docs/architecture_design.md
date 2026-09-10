# Password Vault Architecture & Security Specification

## 1. Project Objectives
The **Password Fault / Vault Management System** provides secure, zero-knowledge credential storage and management. 
Key guarantees:
- **Zero-Knowledge Vault Storage**: Sensitive secrets (passwords, secure notes) are encrypted on the client side using AES-256-GCM before transmission.
- **Robust Session Control**: Stateless JWT authentication with secure password hashing (BCrypt) on the server.
- **Comprehensive Credential Management**: Categorized vault storage (Logins, Cards, Notes, Identities), search & filter, favorite pinning, and password generator.

---

## 2. Security Workflows & Cryptographic Design

### 2.1 Key Derivation & Encryption Strategy
1. **Master Key Derivation (Client-side)**:
   - When a user logs in, their Master Password is used with **PBKDF2-HMAC-SHA256** (100,000 iterations) and their unique user salt to derive:
     1. **Auth Key**: Used to authenticate with the server.
     2. **Data Encryption Key (DEK)**: Used strictly on the client side to encrypt/decrypt vault items using **AES-256-GCM**.
   - The Master Password and DEK are **NEVER sent over the network** or saved in persistent storage on the backend.

2. **Vault Item Encryption Structure**:
   - Each secret is encrypted into a payload containing:
     - `ciphertext`: Base64 encoded encrypted payload
     - `iv`: 12-byte initialization vector (unique per item)

---

## 3. Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vault Items Table
CREATE TABLE vault_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    encrypted_password TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    url VARCHAR(500),
    category VARCHAR(20) DEFAULT 'LOGIN',
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. API Endpoints Specification

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register user with `username`, `email`, `password`, returns user salt and auth status.
- `POST /api/auth/login`: Authenticate user with `email` and `password`, returns `jwtToken`, `username`, `email`, and `userSalt`.

### Vault Management (`/api/vault`)
- `GET /api/vault/items`: List all vault items for authenticated user.
- `GET /api/vault/items/{id}`: Fetch single vault item.
- `POST /api/vault/items`: Create new vault item.
- `PUT /api/vault/items/{id}`: Update existing vault item.
- `DELETE /api/vault/items/{id}`: Delete vault item.
- `PATCH /api/vault/items/{id}/favorite`: Toggle favorite state.

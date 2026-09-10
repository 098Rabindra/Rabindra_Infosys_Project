# 🚀 Password Vault & Credential Management System

> An enterprise-grade, zero-knowledge credential management system built with Java, Spring Boot, Spring Security, JWT, and React for secure password storage, health auditing, and breach prevention.

---

## 📌 Overview

**Password Vault & Credential Management System** (also known as *Password Fault*) is a modern web application designed to provide zero-knowledge credential management and security auditing. It protects sensitive digital assets—including web logins, payment cards, identity records, and secure notes—using strong encryption and multi-factor verification workflows.

The system features a **Java Spring Boot REST backend** coupled with a **React + Tailwind CSS frontend dashboard**. It supports **PBKDF2 key derivation**, **AES-256-GCM vault encryption**, **stateless JWT authentication**, **Email OTP verification**, **Password Health Analytics**, **Suspicious Activity Tracking**, **Granular Credential Sharing**, and **PDF Security Report Generation**.

---

## ✨ Key Features

* 🔐 **Zero-Knowledge Encryption**: Passwords and secrets are encrypted client-side / server-side using **AES-256-GCM** before persistent storage.
* 📧 **Email OTP Verification**: Two-factor OTP generation & verification for user registration and password resets.
* 💳 **Multi-Category Vault Management**: Store and organize Logins, Credit Cards, Secure Notes, and Personal Identities with instant search and favorite pinning.
* 🔄 **Complete CRUD & Sharing**: Full lifecycle management of vault items with granular sharing permissions (`VIEW`, `EDIT`, `ADMIN`).
* 📊 **Password Health & Breach Analytics**: Real-time password strength analyzer that detects weak, duplicate, or compromised passwords and calculates an overall Vault Health Score.
* 🛡️ **Security Audit & Suspicious Activity Alerts**: Automated tracking of login history, failed access attempts, device details, IP addresses, and real-time security alerts.
* 📄 **Exportable Security Reports**: Downloadable PDF reports covering password health and user login activity powered by OpenPDF.
* 🐳 **Containerized & Deployment Ready**: Fully containerized with Docker & Docker Compose setup supporting PostgreSQL, MySQL, and H2 database configurations.

---

## 🛠️ Technologies Used

### Backend
* **Java 17** & **Spring Boot 3.2.3**
* **Spring Security** (Stateless JWT Authentication & BCrypt Password Hashing)
* **Spring Data JPA** & **Hibernate ORM**
* **Spring Boot Mail** & **Resend API** (OTP Email Delivery)
* **JJWT 0.11.5** (JSON Web Tokens)
* **OpenPDF 1.3.37** (PDF Report Generation)
* **Maven** (Build Tool)

### Frontend
* **React** with **Vite**
* **Tailwind CSS** & **Lucide React** (Modern Glassmorphism UI)
* **Axios** (HTTP REST Client)

### Database
* **PostgreSQL** (Production / Docker)
* **MySQL** & **H2 Database** (Development & Fallback)

### Tools & DevOps
* **Docker** & **Docker Compose**
* **Nginx** (Frontend Reverse Proxy)
* **IntelliJ IDEA** / **VS Code**
* **Git** & **GitHub**
* **Postman** (API Testing)

---

## 🏗️ Project Structure

```text
Password_Fault/
├── docs/
│   ├── architecture_design.md       # Security specs & cryptographic design
│   └── cloud_deployment_guide.md    # Production cloud deployment steps
├── frontend/                        # React + Vite Frontend App
│   ├── src/                         # UI components & services
│   ├── Dockerfile                   # Frontend Nginx container file
│   ├── package.json                 # Frontend dependencies
│   └── tailwind.config.js           # Tailwind CSS configuration
├── src/                             # Spring Boot Backend App
│   ├── main/
│   │   ├── java/com/infosys/vault/
│   │   │   ├── config/              # Security & database configs
│   │   │   ├── controller/          # REST API Controllers
│   │   │   ├── dto/                 # Request/Response DTO models
│   │   │   ├── exception/           # Global exception handling
│   │   │   ├── model/               # JPA Entities (User, VaultItem, AuditLog, etc.)
│   │   │   ├── repository/          # Spring Data Repositories
│   │   │   ├── security/            # JWT Filters & Auth Services
│   │   │   ├── service/             # Business Logic & Encryption Services
│   │   │   └── util/                # PDF Generator, Encryption & Password Utilities
│   │   └── resources/
│   │       ├── application.yml      # Core Spring Boot properties
│   │       └── application-h2.yml   # Dev H2 fallback properties
│   └── test/                        # Backend unit & integration tests
├── Dockerfile                       # Backend Spring Boot container file
├── docker-compose.yml               # Multi-container orchestration (DB, Backend, Frontend)
└── pom.xml                          # Maven build dependencies
```

---

## ⚙️ Installation & Setup

### Prerequisites
* **Java Development Kit (JDK 17 or higher)**
* **Node.js (v18+ or higher)** and **npm**
* **Maven 3.8+**
* **MySQL 8.0+** or **PostgreSQL 14+** (Or use Docker)

---

### Method 1: Local Manual Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Password_Fault.git
cd Password_Fault
```

#### 2. Configure Database

##### Option A: MySQL Database Setup
Create a MySQL database:
```sql
CREATE DATABASE password_vault;
```

Update `src/main/resources/application.yml` or set environment variables:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/password_vault?useSSL=false&serverTimezone=UTC
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: your_mysql_password
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
    hibernate:
      ddl-auto: update
```

##### Option B: PostgreSQL Database Setup (Default)
Create a PostgreSQL database:
```sql
CREATE DATABASE password_vault;
```

Properties in `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/password_vault
    username: postgres
    password: tiger
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update
```

#### 3. Run Backend Application
Using Maven CLI:
```bash
mvn spring-boot:run
```
Or run `PasswordVaultApplication.java` directly from IntelliJ IDEA or Eclipse.

The backend server will start at:
```text
http://localhost:8080
```

#### 4. Run Frontend Application
Open a new terminal in the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```

The frontend dashboard will be available at:
```text
http://localhost:5173
```

---

### Method 2: Docker Compose Setup (Recommended)

Run the complete multi-container stack (PostgreSQL + Backend API + React Nginx Frontend) with a single command:

```bash
docker-compose up -d --build
```

Access services at:
* **Frontend Application**: `http://localhost`
* **Backend REST API**: `http://localhost:8080`
* **PostgreSQL Database**: `localhost:5432`

---

## 🗄️ Database Schema Overview

```sql
-- Users Entity Table
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
    permission_level VARCHAR(20) DEFAULT 'ADMIN',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔗 API Endpoints

### 🔑 Authentication Endpoints (`/api/auth`)

| Method | Endpoint                        | Description                              | Auth Required |
| :---   | :---                            | :---                                     | :---:         |
| `POST` | `/api/auth/send-otp`            | Send OTP code for registration           | ❌            |
| `POST` | `/api/auth/verify-otp`          | Verify registration OTP code             | ❌            |
| `POST` | `/api/auth/register`            | Register new user account                | ❌            |
| `POST` | `/api/auth/login`               | User login (returns JWT token & salt)    | ❌            |
| `POST` | `/api/auth/forgot-password/send-otp` | Send password reset OTP            | ❌            |
| `POST` | `/api/auth/reset-password`      | Reset user password via OTP              | ❌            |
| `POST` | `/api/auth/logout`              | Invalidate user session context          | ✅            |
| `GET`  | `/api/auth/logs`                | Retrieve user login activity logs        | ✅            |
| `DELETE`|`/api/auth/logs`                | Clear all login security activity logs   | ✅            |
| `DELETE`|`/api/auth/logs/{id}`           | Delete a single login security log       | ✅            |

---

### 💳 Vault Management Endpoints (`/api/vault`)

| Method | Endpoint                             | Description                              | Auth Required |
| :---   | :---                                 | :---                                     | :---:         |
| `GET`  | `/api/vault/items`                   | Get all vault items (filter by category) | ✅            |
| `GET`  | `/api/vault/items/{id}`              | Get vault item by ID                     | ✅            |
| `POST` | `/api/vault/items`                   | Create a new encrypted vault item        | ✅            |
| `PUT`  | `/api/vault/items/{id}`              | Update existing vault item details       | ✅            |
| `DELETE`|`/api/vault/items/{id}`              | Delete a vault item                      | ✅            |
| `PATCH`| `/api/vault/items/{id}/favorite`     | Toggle favorite status                   | ✅            |
| `PATCH`| `/api/vault/items/{id}/permission`   | Update sharing permission level          | ✅            |

---

### 🛡️ Security & Audit Endpoints (`/api/security`)

| Method | Endpoint                             | Description                              | Auth Required |
| :---   | :---                                 | :---                                     | :---:         |
| `GET`  | `/api/security/suspicious-activities`| Fetch detected suspicious login attempts | ✅            |
| `GET`  | `/api/security/alerts`               | Fetch real-time security alerts          | ✅            |
| `PATCH`| `/api/security/alerts/{id}/read`     | Mark security alert as read              | ✅            |
| `GET`  | `/api/security/audit-logs`           | Retrieve audit log entries               | ✅            |
| `GET`  | `/api/security/analytics`            | Fetch security analytics summary         | ✅            |

---

### 📊 Reports & System Health (`/api/reports`, `/api/health`)

| Method | Endpoint                             | Description                              | Auth Required |
| :---   | :---                                 | :---                                     | :---:         |
| `GET`  | `/api/reports/password-health`       | Get password health report & scores      | ✅            |
| `GET`  | `/api/reports/login-activity`        | Get login activity audit breakdown       | ✅            |
| `GET`  | `/api/health`                        | Backend service health check             | ❌            |

---

## 📸 Screenshots & UI Preview

### 1. Dashboard Overview
![Dashboard](docs/screenshots/dashboard.png)

### 2. Vault Item Management & Generator
![Vault Items](docs/screenshots/vault.png)

### 3. Password Health & Audit Analytics
![Health Analytics](docs/screenshots/health.png)

---

## 🧪 Testing with Postman

### 1. Register User & Request OTP
```http
POST http://localhost:8080/api/auth/send-otp
Content-Type: application/json

{
  "email": "rabindra@example.com"
}
```

### 2. User Registration
```http
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "rabindra",
  "email": "rabindra@example.com",
  "password": "SecurePassword123!"
}
```

### 3. Authenticate User (Login)
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "rabindra@example.com",
  "password": "SecurePassword123!"
}
```
**Response Sample**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "id": "u-9843-abcd",
  "username": "rabindra",
  "email": "rabindra@example.com",
  "userSalt": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### 4. Create Vault Item
```http
POST http://localhost:8080/api/vault/items
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "title": "GitHub Developer Account",
  "username": "rabindra-dakua",
  "password": "EncryptedBase64PayloadHere==",
  "iv": "12ByteBase64IVHere==",
  "url": "https://github.com",
  "category": "LOGIN",
  "favorite": true,
  "notes": "Personal developer credentials"
}
```

---

## 📦 Future Improvements

* 📱 **Mobile & Extension Support**: Browser extension (Chrome/Firefox) & React Native mobile companion app.
* 🔑 **WebAuthn / FIDO2 Integration**: Hardware key (YubiKey) biometric authentication support.
* 🌐 **Cloud Synchronization**: Automated encrypted backup & multi-device sync with zero-knowledge verification.
* 🔍 **Breach Monitoring**: Live integration with HaveIBeenPwned API for instant dark web leak detection.
* 🛡️ **Role-Based Enterprise Teams**: Shared organizational vaults with role-based access control (RBAC).

---

## 👨‍💻 Author

### Rabindra Dakua
**MCA | Java Backend Developer**

* 🐙 **GitHub**: [github.com/rabindra-dakua](https://github.com/rabindra-dakua) *(Update with your link)*
* 💼 **LinkedIn**: [linkedin.com/in/rabindra-dakua](https://linkedin.com/in/rabindra-dakua) *(Update with your link)*
* 📧 **Email**: [drajapreinsta@gmail.com](mailto:drajapreinsta@gmail.com)

---

## ⭐ Support

If you find this project helpful or educational, please give it a ⭐ on GitHub!

---

## 📄 License

This project is open-sourced under the MIT License for educational and development purposes.

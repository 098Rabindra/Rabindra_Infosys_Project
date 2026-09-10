# SecureVault Cloud Deployment Guide (AWS & Azure)

This document provides a complete guide for deploying the **SecureVault** (Password Fault) application to cloud environments (**AWS** and **Azure**) using Docker, Docker Compose, PostgreSQL, and Nginx.

---

## 🏗️ Architecture Overview

The deployed application follows a 3-tier containerized micro-architecture:

```
[ User Browser ]
       │
       ▼ (Port 80 / 443)
┌───────────── Nginx Reverse Proxy Container ─────────────┐
│  - Serves static React Vite production assets           │
│  - Forwards /api/* requests to Spring Boot Backend      │
└──────────────────────────┬──────────────────────────────┘
                           │ (Internal Port 8080)
                           ▼
┌────────────────── Spring Boot Backend ──────────────────┐
│  - Business logic, JWT auth, AES-256 encryption         │
│  - PDF report generation, SMTP email dispatcher          │
└──────────────────────────┬──────────────────────────────┘
                           │ (Internal Port 5432)
                           ▼
┌────────────────── PostgreSQL Database ──────────────────┐
│  - Persistent SQL store (Users, Vault items, Audit logs)│
│  - Isolated Docker volume (postgres_data)                │
└─────────────────────────────────────────────────────────┘
```

---

## ☁️ Option A: AWS Deployment

### Method 1: AWS EC2 Instance + Docker Compose (Recommended)

#### Step 1: Provision EC2 Instance
1. Log into **AWS Management Console** and navigate to **EC2**.
2. Click **Launch Instance**:
   - **Name**: `securevault-prod`
   - **AMI**: Ubuntu Server 22.04 LTS (64-bit x86)
   - **Instance Type**: `t3.small` or `t2.micro` (Free tier eligible for testing)
   - **Key Pair**: Create or select an existing SSH key pair (`.pem`).
3. **Network & Security Groups**:
   - Allow **SSH (Port 22)** from your IP.
   - Allow **HTTP (Port 80)** from Anywhere (`0.0.0.0/0`).
   - Allow **HTTPS (Port 443)** from Anywhere (`0.0.0.0/0`).

#### Step 2: Server Setup via SSH
Connect to your EC2 instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Install Docker and Docker Compose:
```bash
# Update package list & install prerequisites
sudo apt update && sudo apt install -y curl git docker.io docker-compose-v2

# Add ubuntu user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installations
docker --version
docker compose version
```

#### Step 3: Clone Repository & Configure Environment
```bash
cd /opt
sudo git clone https://github.com/your-username/Password_Fault.git password_vault
sudo chown -R ubuntu:ubuntu /opt/password_vault
cd /opt/password_vault

# Copy environment template
cp .env.example .env

# Edit production configuration
nano .env
```
Fill in secure production secrets in `.env`:
- `POSTGRES_PASSWORD`: Use a strong generated password.
- `APP_JWT_SECRET`: Use a random 64+ character string.
- `SPRING_MAIL_USERNAME` / `SPRING_MAIL_PASSWORD`: Your SMTP email provider credentials.

#### Step 4: Launch Containers
```bash
docker compose up --build -d
```

Verify running services:
```bash
docker compose ps
docker compose logs -f
```
Your app is now live at `http://<EC2_PUBLIC_IP>`.

---

## ☁️ Option B: Azure Deployment

### Method 1: Azure Virtual Machine + Docker Compose

#### Step 1: Provision Azure VM
1. Open **Azure Portal** and navigate to **Virtual Machines**.
2. Click **Create** > **Azure Virtual Machine**:
   - **Resource Group**: `securevault-rg`
   - **Virtual Machine Name**: `securevault-vm`
   - **Image**: Ubuntu Server 22.04 LTS - x64 Gen2
   - **Size**: `Standard_B1ms` or `Standard_B2s`
   - **Authentication type**: SSH public key
3. **Inbound Port Rules**:
   - Select **HTTP (80)**, **HTTPS (443)**, and **SSH (22)**.

#### Step 2: Install Docker & Deploy Application
1. SSH into the VM:
   ```bash
   ssh azureuser@<AZURE_PUBLIC_IP>
   ```
2. Run installation commands:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
   sudo usermod -aG docker $USER
   newgrp docker
   ```
3. Clone and deploy:
   ```bash
   git clone https://github.com/your-username/Password_Fault.git
   cd Password_Fault
   cp .env.example .env
   nano .env
   docker compose up --build -d
   ```

---

## 🔒 Custom Domain & SSL (HTTPS Setup with Nginx & Certbot)

To secure your production app with **HTTPS**:

1. Point your domain (e.g., `vault.yourdomain.com`) A-Record to `<EC2_OR_AZURE_PUBLIC_IP>`.
2. Install Certbot on host VM:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
3. Generate SSL Certificate:
   ```bash
   sudo certbot --nginx -d vault.yourdomain.com
   ```
4. Certbot automatically updates Nginx configuration to enforce HTTPS on Port 443!

---

## 🤖 GitHub Actions Automated Deployment Setup

To enable auto-deployment when pushing code to GitHub `main` branch:

1. In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:

| Secret Name | Description / Value |
|---|---|
| `CLOUD_SERVER_IP` | Public IP of your EC2 / Azure VM |
| `CLOUD_SERVER_USER` | `ubuntu` (AWS) or `azureuser` (Azure) |
| `CLOUD_SSH_PRIVATE_KEY` | Contents of your `.pem` SSH private key |
| `DOCKERHUB_USERNAME` | (Optional) Your Docker Hub username |
| `DOCKERHUB_TOKEN` | (Optional) Your Docker Hub Access Token |

---

## 🚀 Option C: Deploying on Render & Netlify

This split-cloud deployment model hosts:
- **Netlify**: High-performance CDN hosting for the React Frontend.
- **Render**: Free/Low-cost Managed PostgreSQL + Dockerized Spring Boot Backend Web Service.

---

### Step 1: Deploy PostgreSQL Database on Render

1. Log into [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **PostgreSQL**.
3. Name: `password-vault-db`
4. Database: `password_vault`
5. User: `postgres`
6. Region: Select closest region to your users.
7. Click **Create Database**.
8. Once provisioned, copy the **Internal Database URL** and credentials:
   - **Hostname**: `dpg-xxxxxxxxxx-a`
   - **Port**: `5432`
   - **Database**: `password_vault`
   - **Username**: `postgres`
   - **Password**: `<your-render-db-password>`

---

### Step 2: Deploy Spring Boot Backend on Render

1. On Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository (`Password_Fault`).
3. Settings:
   - **Name**: `password-vault-backend`
   - **Region**: Same region as PostgreSQL DB.
   - **Branch**: `main`
   - **Runtime**: **Docker** (Render auto-detects `Dockerfile` in project root).
4. Add **Environment Variables**:

| Key | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `postgres` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<RENDER_DB_HOST>:5432/password_vault` |
| `SPRING_DATASOURCE_USERNAME` | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | `<RENDER_DB_PASSWORD>` |
| `APP_JWT_SECRET` | `9a2f8c4e6b1d3a5f7e8d0c2b4a6f8e1d3c5b7a9f0e2d4c6b8a0f2e4d6c8b0a2f` |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` |
| `SPRING_MAIL_PORT` | `465` |

5. Click **Create Web Service**.
6. Note your backend URL (e.g. `https://password-vault-backend.onrender.com`).

---

### Step 3: Deploy React Frontend on Netlify

1. Log into [Netlify Dashboard](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Connect your GitHub repository.
4. Site settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. In `frontend/netlify.toml` and `frontend/public/_redirects`, ensure your Render backend URL is configured:
   ```
   /api/*  https://password-vault-backend.onrender.com/api/:splat  200!
   /*      /index.html                                            200
   ```
6. Click **Deploy Site**.
7. Netlify will build and host your app on an SSL-encrypted URL (e.g., `https://securevault.netlify.app`).

---

## 🧪 Post-Deployment Sanity Verification Checklist

- [ ] **Frontend Loaded**: Navigate to `http://<YOUR_IP>` or `https://<YOUR_APP>.netlify.app` - Dashboard / Login page renders smoothly.
- [ ] **Database Connection**: Register a new user account. Verify HTTP 201 response.
- [ ] **JWT Auth**: Log in with created credentials. Verify token storage and dashboard redirect.
- [ ] **Vault Storage**: Add a test credential. Verify encryption & storage in PostgreSQL.
- [ ] **Container Resilience**: Run `docker compose restart`. Verify data persistence after restart.

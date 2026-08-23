# A.S. Enterprises BMS — Railway Deployment Guide (Simplified Production)

This guide provides end-to-end instructions for deploying the **A.S. Enterprises Business Management System (BMS)** to [Railway](https://railway.app) using auto-generated `*.up.railway.app` domains and Bearer token authentication.

---

## Architecture Overview

The system consists of two decoupled services and one managed PostgreSQL database:
1. **PostgreSQL Database**: Provisioned via Railway managed PostgreSQL.
2. **Backend Service (`as-enterprises-backend`)**: Java 17 / Spring Boot 3.3.4 (built with `./mvnw` from `backend/`).
3. **Frontend Service (`as-enterprises-frontend`)**: Vite + React SPA (built from `frontend/`).

---

## Step 1 — Connect GitHub Repository

1. Log into [Railway Console](https://railway.app/dashboard).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `as-enterprises-bms`.

---

## Step 2 — Provision Managed PostgreSQL

1. Click **+ New** -> **Database** -> **Add PostgreSQL**.
2. Railway creates the database container and generates environment variables (`POSTGRES_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`).

---

## Step 3 — Deploy Backend Service

1. Click **+ New** -> **GitHub Repo** -> select `as-enterprises-bms`.
2. Name service: `as-enterprises-backend`.
3. In **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `chmod +x mvnw && ./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/as-enterprises-bms-0.0.1-SNAPSHOT.jar`
   - **Healthcheck Path**: `/api/v1/actuator/health`
4. Set Environment Variables:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `SPRING_DATASOURCE_URL=${POSTGRES_URL}`
   - `SPRING_DATASOURCE_USERNAME=${PGUSER}`
   - `SPRING_DATASOURCE_PASSWORD=${PGPASSWORD}`
   - `MAIL_USERNAME=<optional-smtp-username>`
   - `MAIL_PASSWORD=<optional-smtp-password>`
5. Generate Domain: Click **Settings** -> **Networking** -> **Generate Domain** (e.g. `as-enterprises-backend-production.up.railway.app`).

---

## Step 4 — Deploy Frontend Service

1. Click **+ New** -> **GitHub Repo** -> select `as-enterprises-bms`.
2. Name service: `as-enterprises-frontend`.
3. In **Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npx serve -s dist -l ${PORT}`
4. Set Environment Variables:
   - `VITE_API_BASE_URL=https://<your-backend-railway-url>.up.railway.app/api/v1`
5. Generate Domain: Click **Settings** -> **Networking** -> **Generate Domain** (e.g. `as-enterprises-frontend-production.up.railway.app`).

---

## Step 5 — Verification

1. Access your public frontend Railway URL (`https://<frontend-url>.up.railway.app`).
2. Complete workspace setup or log in.
3. Verify `aven_session_token` is stored in `localStorage` and `Authorization: Bearer <token>` is sent on API requests.

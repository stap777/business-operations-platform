# A.S. Enterprises BMS — Environment Variable Reference (Simplified Railway Production)

This document specifies the essential production environment variables for deploying the A.S. Enterprises BMS on Railway using auto-generated `*.up.railway.app` service domains and Bearer token authentication.

---

## Backend Essential Environment Variables (`as-enterprises-backend`)

| Variable | Required | Description | Example / Railway Source |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Yes** | Set active Spring environment to `prod` | `prod` |
| `SPRING_DATASOURCE_URL` | **Yes** | JDBC connection URL for managed PostgreSQL | `${POSTGRES_URL}` or `jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}` |
| `SPRING_DATASOURCE_USERNAME` | **Yes** | Database connection username | `${PGUSER}` |
| `SPRING_DATASOURCE_PASSWORD` | **Yes** | Database connection password | `${PGPASSWORD}` |
| `MAIL_USERNAME` | Optional | Transactional SMTP username for password resets | `your-email@gmail.com` |
| `MAIL_PASSWORD` | Optional | Transactional SMTP app password for password resets | `your-app-password` |

---

## Frontend Essential Environment Variables (`as-enterprises-frontend`)

| Variable | Required | Description | Example / Railway Source |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | Public backend API URL | `https://as-enterprises-backend-production.up.railway.app/api/v1` |

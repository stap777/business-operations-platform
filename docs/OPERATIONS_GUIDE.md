# A.S. Enterprises BMS — Production Operations Guide

This guide details operational procedures for monitoring, updating, backing up, and rolling back the **A.S. Enterprises BMS** application in production.

---

## 1. Updating the Application

### Automatic Deployment via Git
1. Main deployments are triggered automatically when commits are merged into the `main` branch.
2. Railway rebuilds the container image using Maven and Vite commands defined in `railway.json`.
3. Database migrations run automatically on backend boot via **Flyway** (`application-prod.yml` has `flyway.enabled: true`).

### Manual Trigger
1. In Railway Console, select the service (`as-enterprises-backend` or `as-enterprises-frontend`).
2. Click **Deployments** -> **Redeploy**.

---

## 2. Viewing Real-Time Logs

1. In Railway Console, select the desired service.
2. Click the **Deployments** tab and select the active deployment.
3. Open **Logs**:
   - Filter by level (`INFO`, `WARN`, `ERROR`).
   - Use search for transaction tracing or audit diagnostic entries (e.g. `[SESSION-DIAGNOSTIC]`).

---

## 3. Restarting Services

If a service experiences unexpected memory pressure or network drops:
1. Navigate to the service in Railway Console.
2. Click **Settings** -> **Restart Service**.
3. Railway will execute a graceful shutdown signal followed by process restart without downtime if zero-downtime deployment is active.

---

## 4. Rollback Procedure

If a deployed update introduces a critical bug:
1. Open Railway Console -> **Deployments**.
2. Identify the last known good deployment.
3. Click the options menu (`...`) next to that build -> **Rollback to this deployment**.
4. Railway will immediately route traffic back to the previous immutable container image.

---

## 5. Database Backup Expectations & Recovery

### Automated Backups
1. Railway managed PostgreSQL automatically performs daily logical and point-in-time backups (PITR).
2. Daily snapshots are retained per Railway retention policies.

### Manual Backup (Pre-Migration Safety)
To execute a manual database snapshot before running major schema changes:
```bash
pg_dump -h <PGHOST> -p <PGPORT> -U <PGUSER> -d <PGDATABASE> -F c -b -v -f as_bms_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Database Restore
To restore from a dump file:
```bash
pg_restore -h <PGHOST> -p <PGPORT> -U <PGUSER> -d <PGDATABASE> -c -v as_bms_backup_<timestamp>.dump
```

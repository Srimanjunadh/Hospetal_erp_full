# Market Release Readiness Checklist

This checklist outlines the recommended engineering improvements and configurations to implement before deploying the MediClues+ ERP + PMS ecosystem to a production environment.

---

## 🛡️ 1. Security Hardening

- [ ] **Strict CORS Restrictions**
  * Update `ALLOWED_ORIGINS` in production environment variables to permit only your actual public web domains (e.g. `https://portal.medclues.com`, `https://pms.medclues.com`), instead of local hosts.
- [ ] **Secure JWT Cookie Configuration**
  * Ensure user cookies containing session tokens are flagged with:
    * `HttpOnly = True` (prevents cross-site scripting/XSS data retrieval).
    * `Secure = True` (ensures cookies are only sent over encrypted HTTPS connections).
    * `SameSite = 'Lax'` (mitigates cross-site request forgery/CSRF threats).
- [ ] **SSL/TLS Encryption**
  * Ensure all entry point services (Nginx, API Gateway, and Cloud Load Balancers) are configured with valid SSL/TLS certificates (e.g. via Let's Encrypt / Certbot). Run strict HTTPS redirects.
- [ ] **Environment Variable Vault**
  * Move sensitive variables like `DATABASE_URL`, `JWT_SECRET_KEY`, and `RABBITMQ_URL` out of plain `.env` files and load them using secure secret managers (e.g., AWS Secrets Manager, HashiCorp Vault, or GitHub Repository Secrets).

---

## 🗄️ 2. Database & Data Migration

- [ ] **Alembic Migration Setup**
  * Initialize Alembic on the backend project (`alembic init alembic`) to manage database schema updates.
  * Avoid using raw metadata creations (`Base.metadata.create_all`) in production as it does not track database versioning or allow rollbacks.
- [ ] **Automated Backups**
  * Set up scheduled logical dumps (e.g. using `pg_dump` for PostgreSQL) running daily or hourly.
  * Enable Point-In-Time-Recovery (PITR) inside cloud databases (e.g. Neon or AWS RDS) to guarantee rapid disaster recovery.

---

## 📈 3. Observability & Monitoring

- [ ] **Structured JSON Logging**
  * Configure log formatters in Python and Node.js to write output logs as structured JSON rather than plain text. This allows for automated analysis by log streaming engines (GCP Logging, Datadog, or AWS CloudWatch).
- [ ] **Application Performance Monitoring (APM)**
  * Integrate an APM agent (e.g. Sentry, OpenTelemetry, or Prometheus/Grafana) to trace API request latencies, trace database queries, and alert you on unhandled 500 exceptions instantly.

---

## 🚀 4. Deployment & DevOps

- [ ] **Gateway Rate Limiting Configuration**
  * Adjust rate-limiting thresholds (via gateway IP limits or Redis) to protect backend services against Distributed Denial of Service (DDoS) attempts.
- [ ] **Production Build Bundling**
  * Ensure frontends are built using production configurations (`next build` and `vite build`). Use Gzip/Brotli compression configurations on your static asset server (CDN/Cloudflare) to decrease page load times.

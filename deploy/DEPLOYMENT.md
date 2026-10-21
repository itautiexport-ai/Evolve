# Evolve Ubuntu VPS Production Deployment Guide

This guide details the complete deployment of the **Evolve** application on an Ubuntu VPS alongside an existing **Nexus** application.

---

## Architecture Overview

```
                                      Internet
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
             Port 80 (HTTP)                             Port 8080 (HTTP)
                   │                                           │
        [ Nexus App (Untouched) ]                     [ Nginx (Evolve Host) ]
                                                               │
                                       ┌───────────────────────┴───────────────────────┐
                                       │                                               │
                                 Static Assets                                     /api/ & /uploads/
                                       │                                               │
                               /var/www/evolve/dist                             http://127.0.0.1:3001
                                                                                       │
                                                                             [ Evolve Node Backend ]
                                                                             (systemd: evolve.service)
                                                                             (User: evolve - non-root)
                                                                                       │
                                                                             [ Local MySQL (3306) ]
                                                                             (Database: evolve)
                                                                             (User: evolve_app)
                                                                             (Bound to 127.0.0.1 ONLY)
```

- **Nexus App & Port 80**: Completely untouched.
- **Evolve Web App**: Listens on port 8080.
- **Evolve Node Backend**: Runs locally on `127.0.0.1:3001` via systemd (`evolve.service`) under a dedicated non-root user `evolve`.
- **MySQL Database**: Separate `evolve` database with dedicated restricted user `evolve_app`. Strictly bound to `127.0.0.1` and never exposed publicly.

---

## 1. Prerequisites Check

Verify required packages on your Ubuntu VPS:

```bash
# Verify Node.js (version 20+ recommended)
node -v
npm -v

# Verify MySQL and Nginx
mysql --version
nginx -v
```

If Node.js is not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 2. Dedicated Non-Root User Setup

Create a dedicated system user and group `evolve` with no login shell for security:

```bash
sudo useradd -r -s /bin/false -d /var/www/evolve -m evolve
```

---

## 3. Database Setup (Separate MySQL Database & Restricted User)

Log into MySQL as root on the server:

```bash
sudo mysql -u root -p
```

Execute the following SQL commands to create a dedicated database and restricted user that can **only** connect from `127.0.0.1`:

```sql
-- 1. Create separate evolve database
CREATE DATABASE IF NOT EXISTS evolve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create restricted application user strictly on localhost / 127.0.0.1
-- Replace 'YOUR_SECURE_MYSQL_PASSWORD' with a strong generated password
CREATE USER IF NOT EXISTS 'evolve_app'@'127.0.0.1' IDENTIFIED BY 'YOUR_SECURE_MYSQL_PASSWORD';

-- 3. Grant privileges ONLY on the evolve database (no access to Nexus or system databases)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, DROP ON evolve.* TO 'evolve_app'@'127.0.0.1';

-- 4. Apply privileges
FLUSH PRIVILEGES;

-- 5. Exit
EXIT;
```

> **Security Note**: Ensure `/etc/mysql/mysql.conf.d/mysqld.cnf` contains `bind-address = 127.0.0.1`. Never open MySQL port 3306 to `0.0.0.0`.

---

## 4. Deploy Application Code & Set Permissions

Copy the Evolve repository to `/var/www/evolve`:

```bash
sudo mkdir -p /var/www/evolve
sudo cp -r /path/to/extracted/Evolve/* /var/www/evolve/
cd /var/www/evolve

# Install dependencies (including production build tools)
sudo npm install

# Create uploads directory for affirmation audio recordings
sudo mkdir -p /var/www/evolve/uploads/affirmation-audio

# Set ownership to dedicated evolve user
sudo chown -R evolve:evolve /var/www/evolve
sudo chmod -R 750 /var/www/evolve
sudo chmod -R 775 /var/www/evolve/uploads
```

---

## 5. Configure Environment Variables

Create `/var/www/evolve/.env` from `.env.example`:

```bash
sudo cp /var/www/evolve/.env.example /var/www/evolve/.env
```

Generate fresh, high-entropy secrets using OpenSSL for both the database password and JWT signing secret:
```bash
# Generate database password
openssl rand -base64 24

# Generate JWT signing and session secret
openssl rand -base64 32
```

Edit `/var/www/evolve/.env`:
```bash
sudo nano /var/www/evolve/.env
```

Configure with your generated values:
```ini
# Database Configuration (MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=evolve
DB_USER=evolve_app
DB_PASSWORD=YOUR_GENERATED_SECURE_MYSQL_PASSWORD
DB_POOL_MIN=2
DB_POOL_MAX=10

# Backend Server Configuration
API_HOST=127.0.0.1
API_PORT=3001
NODE_ENV=production

# Authentication & Security
JWT_SECRET=YOUR_GENERATED_32_CHAR_JWT_SECRET
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# Origin Validation & CORS Configuration
# For HTTP testing on the VPS:
CORS_ALLOWED_ORIGINS=http://129.121.127.182:8080
```

### HTTP vs. HTTPS Deployment Settings:
- **For HTTP Testing on VPS**:
  - `CORS_ALLOWED_ORIGINS=http://129.121.127.182:8080` (enables cross-origin and same-origin validation matching the VPS public IP and frontend port).
  - `COOKIE_SECURE=false` (allows browsers to store and send the HttpOnly session cookie over unencrypted HTTP).
- **For HTTPS Production Setup** (after configuring domain name & SSL/TLS certificate):
  - `CORS_ALLOWED_ORIGINS=https://evolve.yourdomain.com`
  - `COOKIE_SECURE=true` (enforces that session and CSRF cookies are transmitted exclusively over secure HTTPS connections).
  - `COOKIE_SAMESITE=lax`

Lock down `.env` permissions so only the `evolve` user and root can read it:
```bash
sudo chown evolve:evolve /var/www/evolve/.env
sudo chmod 600 /var/www/evolve/.env
```

---

## 5.1 Setting Up Dedicated Integration Test Database & User

Evolve includes comprehensive end-to-end integration tests that run against actual Express middleware, HTTP endpoints, and an isolated MySQL test database.

**Safety Invariant**: Before ANY integration-test database connection or mutation, Evolve strictly requires `DB_NAME` to equal `evolve_test` exactly. If `DB_NAME` is anything else, the suite immediately aborts before connecting.

To configure an isolated test database and dedicated test user with access restricted **only** to `evolve_test`:

```sql
-- 1. Create dedicated test database
CREATE DATABASE IF NOT EXISTS evolve_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create dedicated test user granted access ONLY to evolve_test (isolated from production 'evolve' database)
CREATE USER IF NOT EXISTS 'evolve_test_user'@'127.0.0.1' IDENTIFIED BY 'YOUR_GENERATED_TEST_PASSWORD';
GRANT ALL PRIVILEGES ON evolve_test.* TO 'evolve_test_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

Run tests:
```bash
# Optional local test run (runs unit/middleware tests; skips DB tests if MySQL is unavailable)
npm test

# Required integration test command (strictly requires DB_NAME=evolve_test and fails if MySQL is unavailable)
TEST_REQUIRE_MYSQL=true DB_NAME=evolve_test DB_USER=evolve_test_user DB_PASSWORD=YOUR_GENERATED_TEST_PASSWORD npm run test:integration
```

## 6. Run Database Migrations

Apply all schema migrations to create tables and permissions:

```bash
cd /var/www/evolve
sudo -u evolve npm run db:migrate
```

Expected output:
```
Applied: 001_init.sql
Applied: 002_masters.sql
Applied: 003_goals.sql
Applied: 004_habits.sql
Applied: 005_gratitude_entries.sql
Applied: 006_weekly_reviews.sql
Applied: 007_music_tracks.sql
Applied: 008_affirmation_audio.sql
Applied: 009_persistence_and_permissions.sql
Migrations complete (9 newly applied).
```

---

## 7. Initialize First Administrator

Run the secure interactive administrator creation tool:

```bash
cd /var/www/evolve
sudo -u evolve npm run admin:create
```

Follow the prompts to enter:
1. Administrator Full Name (e.g. `System Admin`)
2. Administrator Email (e.g. `admin@yourdomain.com`)
3. Administrator Password (minimum 8 characters, confirmed)

This securely hashes the password with bcrypt, grants full administrative access permissions, and logs the action in the audit table.

---

## 8. Build the Frontend Production Bundle

Compile the React TypeScript SPA:

```bash
cd /var/www/evolve
sudo -u evolve npm run build
```

This compiles optimized assets to `/var/www/evolve/dist`.

---

## 9. Configure & Start Systemd Service

Copy the systemd unit file:

```bash
sudo cp /var/www/evolve/deploy/evolve.service /etc/systemd/system/evolve.service
sudo systemctl daemon-reload
sudo systemctl enable evolve
sudo systemctl start evolve
```

Check service status and logs:
```bash
sudo systemctl status evolve
sudo journalctl -u evolve -f
```

You should see:
```
[Evolve Backend] Listening securely on http://127.0.0.1:3001
```

---

## 10. Configure Nginx on Port 8080

Install the Nginx configuration for Evolve:

```bash
sudo cp /var/www/evolve/deploy/nginx-evolve.conf /etc/nginx/sites-available/evolve
sudo ln -s /etc/nginx/sites-available/evolve /etc/nginx/sites-enabled/evolve
```

Test the Nginx configuration:
```bash
sudo nginx -t
```

Reload Nginx without dropping existing connections:
```bash
sudo systemctl reload nginx
```

Now you can access Evolve in your browser at:
`http://<YOUR_VPS_IP_OR_DOMAIN>:8080`

---

## 11. Firewall & Security Verification

Ensure the UFW firewall allows port 8080, while keeping ports 3001 and 3306 strictly internal:

```bash
# Allow Evolve frontend port
sudo ufw allow 8080/tcp

# Verify internal services are NOT listening publicly
sudo ss -tulpn | grep -E '3001|3306'
```

Output should show `127.0.0.1:3001` and `127.0.0.1:3306` (or `::1`), never `0.0.0.0:3001` or `0.0.0.0:3306`.

---

## 12. Automated Daily Database & Uploads Backups

Create a backup script at `/usr/local/bin/backup-evolve.sh`:

```bash
sudo nano /usr/local/bin/backup-evolve.sh
```

Add:
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/evolve"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# 1. Backup MySQL Database
mysqldump -u evolve_app -h 127.0.0.1 -p"YOUR_SECURE_MYSQL_PASSWORD" evolve | gzip > "$BACKUP_DIR/evolve_db_${TIMESTAMP}.sql.gz"

# 2. Backup Uploads Directory
tar -czf "$BACKUP_DIR/evolve_uploads_${TIMESTAMP}.tar.gz" -C /var/www/evolve uploads

# 3. Retention policy: delete backups older than 14 days
find "$BACKUP_DIR" -type f -name "evolve_*" -mtime +14 -delete

echo "[$(date)] Evolve backup completed successfully."
```

Make it executable:
```bash
sudo chmod 700 /usr/local/bin/backup-evolve.sh
```

Add a daily cronjob at 3:00 AM:
```bash
sudo crontab -e
```
Add line:
```cron
0 3 * * * /usr/local/bin/backup-evolve.sh >> /var/log/evolve-backup.log 2>&1
```

---

## 13. Application Updates Workflow

When pulling or deploying updates:

```bash
cd /var/www/evolve

# 1. Pull latest changes
git pull origin main

# 2. Update dependencies
sudo -u evolve npm install

# 3. Run any new migrations
sudo -u evolve npm run db:migrate

# 4. Rebuild frontend
sudo -u evolve npm run build

# 5. Restart backend service
sudo systemctl restart evolve

# 6. Verify health
curl -s http://127.0.0.1:3001/api/health
```

# Deployment guide — VPS + custom domain

Target: Ubuntu 22.04 / 24.04 LTS VPS, your own domain, HTTPS via Let's Encrypt.

We'll do this in **5 phases**. Roughly 60–90 minutes start-to-finish.

---

## Phase 1 — Buy a domain (10 min)

**Recommended registrars** (cheap, no upsell games):

| Registrar | Why |
|---|---|
| **Cloudflare Registrar** | At-cost (~$10/yr for `.com`), free Cloudflare DNS, free DDoS protection. Best if you also want Cloudflare as DNS. |
| **Porkbun** | Cheap, simple UI, no upsells, free WHOIS privacy. |

Avoid GoDaddy / Namecheap — renewal prices jump after year one.

**What to do:**

1. Search for your domain at the registrar.
2. Buy 1 year (renew yearly). Skip every add-on they push.
3. After purchase, note where DNS is managed (registrar or Cloudflare). We'll add records in Phase 4.

---

## Phase 2 — Prep your VPS (15 min)

SSH in as `root` (or your provider's default user):

```bash
ssh root@<vps-ip>
```

### Create a non-root user

```bash
adduser deploy            # set a strong password
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/   # copy your SSH key
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Test from a **new terminal** (don't close your root session yet):

```bash
ssh deploy@<vps-ip>
sudo whoami    # should print 'root'
```

### Disable root SSH login + password auth

Edit `/etc/ssh/sshd_config`:

```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart ssh
```

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Phase 3 — Install Node, Postgres, nginx, PM2 (15 min)

As `deploy`:

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Postgres 16
sudo apt install -y postgresql postgresql-contrib

# nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# PM2 (process manager that keeps Next.js running)
sudo npm install -g pm2
```

### Create the database

```bash
sudo -u postgres psql
```

In the psql prompt:

```sql
CREATE USER stocksapp WITH PASSWORD 'PICK_A_STRONG_PASSWORD';
CREATE DATABASE stocksapp OWNER stocksapp;
GRANT ALL PRIVILEGES ON DATABASE stocksapp TO stocksapp;
\q
```

Test connection:
```bash
psql -h localhost -U stocksapp -d stocksapp
# enter password, should land in psql prompt; \q to exit
```

---

## Phase 4 — Deploy the app (20 min)

### 4a. Push code to GitHub

On your **Windows machine**, in `Desktop\Projects\stocks-app`:

```powershell
git add .
git commit -m "Initial commit"
gh repo create stocks-app --private --source=. --remote=origin --push
```

If you don't have `gh`, create the repo manually at github.com, then:

```powershell
git remote add origin git@github.com:<you>/stocks-app.git
git push -u origin main
```

### 4b. Clone on the VPS

```bash
cd ~
git clone git@github.com:<you>/stocks-app.git   # or https:// if you don't have SSH keys to GitHub yet
cd stocks-app
npm ci
```

If `git clone` over SSH fails, use the HTTPS URL and you'll be prompted for credentials.

### 4c. Configure `.env` on the VPS

```bash
nano .env
```

```env
DATABASE_URL="postgresql://stocksapp:YOUR_STRONG_PASSWORD@localhost:5432/stocksapp?schema=public"
AUTH_SECRET="<output of: openssl rand -base64 32>"
NEXTAUTH_URL="https://yourdomain.com"
```

Generate the secret:
```bash
openssl rand -base64 32
```

### 4d. Migrate + build + start

```bash
npx prisma migrate deploy
npm run build
pm2 start npm --name stocks-app -- start
pm2 startup    # follow the printed command to enable boot-time start
pm2 save
```

App now runs on `127.0.0.1:3000`. Test:

```bash
curl http://localhost:3000
```

### 4e. Point your domain at the VPS

In your registrar's DNS settings (Cloudflare, Porkbun, etc.):

| Type | Name | Value |
|---|---|---|
| A | `@` | `<vps-ip>` |
| A | `www` | `<vps-ip>` |

Wait 1–5 min for DNS to propagate. Verify:
```bash
dig +short yourdomain.com
```
Should return your VPS IP.

### 4f. nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/stocks-app
```

Paste (replace `yourdomain.com` twice):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # gzip for assets
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Enable + reload:

```bash
sudo ln -s /etc/nginx/sites-available/stocks-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t            # syntax check
sudo systemctl reload nginx
```

Visit `http://yourdomain.com` — your site should load.

---

## Phase 5 — HTTPS (5 min)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will:
1. Verify ownership via HTTP.
2. Get a Let's Encrypt cert.
3. Rewrite your nginx config to listen on 443 + redirect HTTP→HTTPS.
4. Set up a systemd timer for auto-renewal.

Visit `https://yourdomain.com`. Done.

---

## Ongoing — deploying updates

Make changes locally, push to GitHub, then on the VPS:

```bash
cd ~/stocks-app
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload stocks-app
```

(Optional) Save this as `~/stocks-app/deploy.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload stocks-app
echo "Deployed."
```

```bash
chmod +x ~/stocks-app/deploy.sh
```

Then deploys are just `./deploy.sh`.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| `502 Bad Gateway` | Is Next.js running? `pm2 status`. Logs: `pm2 logs stocks-app`. |
| DB connection errors | `sudo systemctl status postgresql`, verify `DATABASE_URL` matches the user/password you created. |
| Certbot fails | DNS not propagated yet — wait 5 min and retry. Firewall blocking port 80 — check `sudo ufw status`. |
| Slow first load on quote pages | Yahoo API can be slow; check the cache by querying `QuoteCache` in Prisma Studio. |

Logs:
```bash
pm2 logs stocks-app          # app logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u postgresql -f
```

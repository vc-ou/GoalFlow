# Deploy GoalFlow On Tencent Cloud CVM

This guide deploys the GoalFlow API to your own Tencent Cloud CVM with Docker Compose, MongoDB, Nginx, and your own HTTPS domain.

## Assumptions

- Server OS: Ubuntu 22.04 or 24.04.
- Domain example: `api.example.com`.
- Repository path on server: `/opt/goalflow`.
- API runs behind Nginx at `https://api.example.com`.

Replace `api.example.com` with your real domain in every command.

## 1. DNS And Firewall

1. Add an `A` record for `api.example.com` pointing to your CVM public IP.
2. In Tencent Cloud security group, allow inbound TCP ports `22`, `80`, and `443`.
3. In the server firewall, allow Nginx:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 2. Install Runtime

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in so the Docker group takes effect, then install the Docker Compose plugin if your image does not include it:

```bash
docker compose version
```

## 3. Clone And Configure

```bash
sudo mkdir -p /opt/goalflow
sudo chown "$USER":"$USER" /opt/goalflow
git clone git@github.com:vc-ou/GoalFlow.git /opt/goalflow
cd /opt/goalflow
cp .env.production.example .env.production
```

Edit `.env.production`:

```bash
nano .env.production
```

Set at least:

```env
MONGO_INITDB_ROOT_PASSWORD=<long random password>
MONGODB_URI=mongodb://goalflow:<same password>@mongo:27017/goalflow?authSource=admin
JWT_SECRET=<long random secret>
WECHAT_APP_SECRET=<your mini program AppSecret>
ADMIN_PASSWORD=<long random password>
```

Keep:

```env
DEV_USE_INMEMORY_DB=false
PORT=80
WECHAT_APP_ID=wxcc801d3d81d4ac7c
```

## 4. Start API And MongoDB

```bash
cd /opt/goalflow
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml logs -f api
```

Local health check on the server:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/health/version
```

Expected:

```json
{"ok":true}
```

## 5. Configure Nginx And HTTPS

Copy the example Nginx config:

```bash
sudo cp deploy/nginx-goalflow.conf.example /etc/nginx/sites-available/goalflow
sudo sed -i 's/api.example.com/YOUR_DOMAIN_HERE/g' /etc/nginx/sites-available/goalflow
sudo ln -s /etc/nginx/sites-available/goalflow /etc/nginx/sites-enabled/goalflow
sudo nginx -t
sudo systemctl reload nginx
```

Install Certbot and issue the certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN_HERE
```

External health check:

```bash
curl https://YOUR_DOMAIN_HERE/health
curl https://YOUR_DOMAIN_HERE/health/version
```

## 6. Configure Mini Program

Update root `.env` locally before building the mini program:

```env
VITE_API_BASE_URL=https://YOUR_DOMAIN_HERE/api
```

Build and upload:

```bash
pnpm --filter @goalflow/mobile build:mp-weixin
/Applications/wechatwebdevtools.app/Contents/MacOS/cli upload \
  --project /Users/vc/Documents/GoalFlow/apps/mobile/dist/mp-weixin \
  --version 0.2.0 \
  --desc "Use custom API domain" \
  --qr-output /tmp/goalflow-wechat/upload-qr.png \
  --qr-format image \
  --lang zh
```

In WeChat Mini Program admin, add request legal domain:

```text
https://YOUR_DOMAIN_HERE
```

Then set version `0.2.0` as the experience version or submit it for review.

## 7. Update Deployment Later

```bash
cd /opt/goalflow
git pull
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml logs -f api
```

## 8. Useful Operations

View logs:

```bash
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f mongo
```

Restart:

```bash
docker compose -f docker-compose.production.yml restart api
```

Backup MongoDB:

```bash
docker compose -f docker-compose.production.yml exec mongo mongodump \
  --archive=/tmp/goalflow.archive \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin
docker compose -f docker-compose.production.yml cp mongo:/tmp/goalflow.archive ./goalflow.archive
```

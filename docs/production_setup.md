# Production Installation Guide

Follow these steps to deploy the **Persian Mafia Companion** on your server using Docker and Cloudflare Tunnel.

## 1. Server Preparation

Ensure your server has Docker and Docker Compose installed.

### Install Docker (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ca-certificates cursor curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2. Get the Code

Clone the repository directly onto your server:

```bash
git clone https://github.com/nimaema/Mafia_web.git
cd Mafia_web
```

## 3. Configure Environment Variables

Create a `.env` file in the project root. This is the most critical step for production stability.

```bash
nano .env
```

Paste and fill in the following values (replace placeholders with actual values):

```env
# Database
DATABASE_URL="postgresql://mafia:mafiapass@db:5432/mafiadb"

# NextAuth (Auth.js)
NEXTAUTH_URL="https://playmafia.live"
NEXTAUTH_SECRET="REPLACE_WITH_SECURE_32_CHAR_SECRET"
AUTH_SECRET="REPLACE_WITH_SECURE_32_CHAR_SECRET"

# Google SSO
GOOGLE_CLIENT_ID="REPLACE_WITH_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="REPLACE_WITH_GOOGLE_CLIENT_SECRET"

# Pusher
PUSHER_APP_ID="REPLACE_WITH_PUSHER_APP_ID"
NEXT_PUBLIC_PUSHER_KEY="REPLACE_WITH_PUSHER_KEY"
PUSHER_SECRET="REPLACE_WITH_PUSHER_SECRET"
NEXT_PUBLIC_PUSHER_CLUSTER="REPLACE_WITH_PUSHER_CLUSTER"

# Cloudflare Tunnel Token
TUNNEL_TOKEN="REPLACE_WITH_CLOUDFLARE_TUNNEL_TOKEN"

# SMTP (Optional but recommended for registration)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@playmafia.live"
```

> [!TIP]
> You can generate a secure secret using: `openssl rand -base64 32`

## 4. Setting up Cloudflare Tunnel

1.  Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2.  Navigate to **Networks** -> **Tunnels**.
3.  Click **Create a Tunnel**.
4.  Name it (e.g., `mafia-prod`) and Save.
5.  Under **Install and run a connector**, choose **Docker**.
6.  Copy the `token` part of the command shown (it's a long string after `--token`).
7.  Paste this token into your `.env` file as `TUNNEL_TOKEN`.
8.  In the **Public Hostname** tab of the tunnel settings:
    *   **Subdomain**: (leave blank if using root domain)
    *   **Domain**: `playmafia.live`
    *   **Service Type**: `HTTP`
    *   **URL**: `app:3000` (Matches the container name and port in docker-compose)

## 5. Deployment

Once the `.env` is ready, start the containers:

```bash
docker compose up -d --build
```

### Verify Installation

*   **Check logs**: `docker compose logs -f app`
*   **Check containers**: `docker compose ps`
*   **Database Migration**: The application should automatically run migrations on startup. If not, run:
    ```bash
    docker compose exec app npx prisma migrate deploy
    ```

## 6. Maintenance

To update the app when you push new changes to GitHub:

```bash
git pull
docker compose up -d --build
```

---

> [!IMPORTANT]
> Ensure your Google Cloud Console has `https://playmafia.live/api/auth/callback/google` added to the **Authorized redirect URIs**.

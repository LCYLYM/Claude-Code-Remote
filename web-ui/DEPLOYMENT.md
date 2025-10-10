# Deployment Guide

This guide covers deploying Claude Code Remote Web UI to production environments.

## 📋 Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Node.js >= 18.0.0
- npm or yarn
- systemd (for service management)
- nginx (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

## 🚀 Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build tools
sudo apt install -y build-essential

# Install nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone and Build

```bash
# Clone repository
git clone https://github.com/LCYLYM/Claude-Code-Remote.git
cd Claude-Code-Remote/web-ui

# Install dependencies
npm install

# Build for production
npm run build
```

### 3. Configure Environment

```bash
# Create production environment file
cd server
cp .env.example .env
nano .env
```

Edit `.env`:

```env
NODE_ENV=production
PORT=9999
HOST=127.0.0.1

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Database
DATABASE_PATH=/var/lib/claude-remote/claude-remote.db

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/claude-remote/server.log

# CORS (your frontend domain)
CORS_ORIGIN=https://your-domain.com
```

### 4. Create System User

```bash
# Create dedicated user
sudo useradd -r -s /bin/false claude-remote

# Create directories
sudo mkdir -p /var/lib/claude-remote
sudo mkdir -p /var/log/claude-remote
sudo chown -R claude-remote:claude-remote /var/lib/claude-remote
sudo chown -R claude-remote:claude-remote /var/log/claude-remote

# Copy application
sudo mkdir -p /opt/claude-remote
sudo cp -r . /opt/claude-remote/
sudo chown -R claude-remote:claude-remote /opt/claude-remote
```

### 5. Create systemd Service

```bash
sudo nano /etc/systemd/system/claude-remote.service
```

```ini
[Unit]
Description=Claude Code Remote Web UI
After=network.target

[Service]
Type=simple
User=claude-remote
Group=claude-remote
WorkingDirectory=/opt/claude-remote
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/claude-remote/server/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/claude-remote/server.log
StandardError=append:/var/log/claude-remote/error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/claude-remote /var/log/claude-remote

[Install]
WantedBy=multi-user.target
```

Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable claude-remote
sudo systemctl start claude-remote
sudo systemctl status claude-remote
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/claude-remote
```

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static files (client build)
    root /opt/claude-remote/client/dist;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://127.0.0.1:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

Enable site and reload nginx:

```bash
sudo ln -s /etc/nginx/sites-available/claude-remote /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

### 8. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 📊 Monitoring

### Check Service Status

```bash
# Service status
sudo systemctl status claude-remote

# View logs
sudo journalctl -u claude-remote -f

# Application logs
tail -f /var/log/claude-remote/server.log
tail -f /var/log/claude-remote/error.log
```

### Health Check

```bash
# Backend health
curl http://localhost:9999/health

# Frontend
curl https://your-domain.com
```

## 🔄 Updates

```bash
cd /opt/claude-remote

# Pull latest changes
sudo -u claude-remote git pull

# Rebuild
sudo -u claude-remote npm run build

# Restart service
sudo systemctl restart claude-remote
```

## 🐳 Docker Deployment

### Dockerfile (Server)

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install

# Copy source
COPY server ./server

# Build
WORKDIR /app/server
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/server/package*.json ./
RUN npm install --production

# Copy built files
COPY --from=builder /app/server/dist ./dist

# Create data directory
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/claude-remote.db

EXPOSE 9999

CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  claude-remote:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "9999:9999"
    volumes:
      - ./data:/data
      - ./logs:/var/log/claude-remote
    environment:
      - NODE_ENV=production
      - PORT=9999
      - HOST=0.0.0.0
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_PATH=/data/claude-remote.db
      - LOG_LEVEL=info
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
    networks:
      - claude-network

networks:
  claude-network:
    driver: bridge
```

Run with Docker Compose:

```bash
docker-compose up -d
```

## 🔧 Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u claude-remote -n 50

# Check permissions
sudo ls -la /opt/claude-remote
sudo ls -la /var/lib/claude-remote
sudo ls -la /var/log/claude-remote
```

### WebSocket connection fails

```bash
# Check nginx configuration
sudo nginx -t

# Check if backend is running
curl http://localhost:9999/health

# Check firewall
sudo ufw status
```

### Database errors

```bash
# Check database permissions
sudo ls -la /var/lib/claude-remote/

# Reset database (CAUTION: deletes data)
sudo rm /var/lib/claude-remote/claude-remote.db
sudo systemctl restart claude-remote
```

## 🔐 Security Hardening

### Fail2ban for rate limiting

```bash
sudo apt install fail2ban

# Create jail for nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600
```

### Regular Updates

```bash
# Setup unattended upgrades
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-claude-remote.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/claude-remote"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp /var/lib/claude-remote/claude-remote.db $BACKUP_DIR/claude-remote-$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "claude-remote-*.db" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-claude-remote.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-claude-remote.sh
```

## 📈 Performance Optimization

### Node.js Optimization

```bash
# Increase max memory
sudo nano /etc/systemd/system/claude-remote.service

# Add:
Environment=NODE_OPTIONS="--max-old-space-size=2048"
```

### Database Optimization

```sql
-- Run periodically
VACUUM;
ANALYZE;
REINDEX;
```

### Nginx Caching

Add to nginx config:

```nginx
# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📞 Support

For deployment issues:
- 📧 Email: support@example.com
- 🐛 GitHub Issues: https://github.com/LCYLYM/Claude-Code-Remote/issues
- 💬 Discussions: https://github.com/LCYLYM/Claude-Code-Remote/discussions

---

Last updated: 2025-01-10

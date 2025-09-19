# GrabtoGo Deployment Guide

## Overview

This guide covers deploying the GrabtoGo platform to production, including all components: API, Web App, Admin Dashboard, and Mobile App.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Domain with SSL certificates
- Cloud provider accounts (AWS, etc.)

## Infrastructure Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Bandwidth**: 100 Mbps

### Recommended Production Setup
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 500GB SSD
- **Bandwidth**: 1 Gbps
- **Load Balancer**: Yes
- **CDN**: Yes
- **Monitoring**: Yes

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/grabtogo
sudo chown $USER:$USER /opt/grabtogo
cd /opt/grabtogo
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/grabtogo.git .
git checkout main
```

### 3. Environment Variables

Create production environment file:

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production values:

```bash
# Database
DATABASE_URL=postgresql://prod_user:secure_password@db-host:5432/grabtogo_prod
DIRECT_URL=postgresql://prod_user:secure_password@db-host:5432/grabtogo_prod

# Redis
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=secure_redis_password

# Authentication
CLERK_SECRET_KEY=sk_live_your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_key

# Payments
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=grabtogo-production-assets

# Domain
DOMAIN=grabtogo.in
API_DOMAIN=api.grabtogo.in
ADMIN_DOMAIN=admin.grabtogo.in

# Security
JWT_SECRET=your_very_long_and_secure_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project
```

### 4. SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate certificates
sudo certbot certonly --standalone -d grabtogo.in -d www.grabtogo.in
sudo certbot certonly --standalone -d api.grabtogo.in
sudo certbot certonly --standalone -d admin.grabtogo.in

# Copy certificates to project
sudo cp /etc/letsencrypt/live/grabtogo.in/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/grabtogo.in/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*
```

#### Option B: Custom Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Copy your certificates
cp your-domain.pem ssl/fullchain.pem
cp your-domain.key ssl/privkey.pem
```

## Database Setup

### 1. PostgreSQL Installation

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create production database
sudo -u postgres createuser -P grabtogo_prod  # Enter password when prompted
sudo -u postgres createdb -O grabtogo_prod grabtogo_prod
```

### 2. Database Migration

```bash
# Generate Prisma client
cd services/api
npm install
npx prisma generate

# Run migrations
npx prisma db push

# Seed initial data (optional)
npm run db:seed
```

## Redis Setup

```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf

# Add password protection
requirepass your_secure_redis_password

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

## Nginx Configuration

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/grabtogo
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;

# Upstream servers
upstream api_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

upstream web_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream admin_backend {
    server 127.0.0.1:3002;
    keepalive 32;
}

# API Server
server {
    listen 443 ssl http2;
    server_name api.grabtogo.in;

    ssl_certificate /opt/grabtogo/ssl/fullchain.pem;
    ssl_certificate_key /opt/grabtogo/ssl/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Web Application
server {
    listen 443 ssl http2;
    server_name grabtogo.in www.grabtogo.in;

    ssl_certificate /opt/grabtogo/ssl/fullchain.pem;
    ssl_certificate_key /opt/grabtogo/ssl/privkey.pem;

    # SSL Configuration (same as above)

    # Rate limiting
    limit_req zone=web burst=50 nodelay;

    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://web_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# Admin Dashboard
server {
    listen 443 ssl http2;
    server_name admin.grabtogo.in;

    ssl_certificate /opt/grabtogo/ssl/fullchain.pem;
    ssl_certificate_key /opt/grabtogo/ssl/privkey.pem;

    # Additional security for admin
    allow 203.0.113.0/24;  # Your office IP range
    deny all;

    location / {
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name grabtogo.in www.grabtogo.in api.grabtogo.in admin.grabtogo.in;
    return 301 https://$server_name$request_uri;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/grabtogo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Deployment

### 1. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### 2. Database Migration

```bash
# Run migrations
docker-compose -f docker-compose.production.yml exec api npm run db:migrate

# Seed data (if needed)
docker-compose -f docker-compose.production.yml exec api npm run db:seed
```

### 3. Verify Deployment

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs -f

# Health checks
curl https://api.grabtogo.in/health
curl https://grabtogo.in/api/health
curl https://admin.grabtogo.in/api/health
```

## Mobile App Deployment

### iOS App Store

1. **Prepare for submission:**
```bash
cd apps/mobile
eas build --platform ios --profile production
```

2. **Upload to App Store:**
```bash
eas submit --platform ios --latest
```

### Google Play Store

1. **Build production APK:**
```bash
cd apps/mobile
eas build --platform android --profile production
```

2. **Upload to Play Store:**
```bash
eas submit --platform android --latest
```

## Monitoring Setup

### 1. Application Monitoring

```bash
# Install monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
# Grafana: https://monitoring.grabtogo.in:3000
# Prometheus: https://monitoring.grabtogo.in:9090
```

### 2. Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/grabtogo

/var/log/grabtogo/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f docker-compose.production.yml restart api web admin
    endscript
}
```

### 3. Backup Configuration

```bash
# Create backup script
sudo nano /opt/grabtogo/scripts/backup.sh

#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/backups/grabtogo"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/grabtogo/uploads

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql s3://grabtogo-backups/
aws s3 cp $BACKUP_DIR/files_$DATE.tar.gz s3://grabtogo-backups/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Make executable
chmod +x /opt/grabtogo/scripts/backup.sh

# Add to crontab
echo "0 2 * * * /opt/grabtogo/scripts/backup.sh" | sudo crontab -
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2ban Setup

```bash
# Install Fail2ban
sudo apt install fail2ban -y

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200

# Restart Fail2ban
sudo systemctl restart fail2ban
```

### 3. Regular Updates

```bash
# Create update script
sudo nano /opt/grabtogo/scripts/update.sh

#!/bin/bash
cd /opt/grabtogo

# Pull latest code
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker-compose -f docker-compose.production.yml exec api npm run db:migrate

# Health check
sleep 30
curl -f https://api.grabtogo.in/health || exit 1
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**
```bash
# Check database status
docker-compose -f docker-compose.production.yml exec postgres pg_isready

# View database logs
docker-compose -f docker-compose.production.yml logs postgres
```

2. **SSL Certificate Issues:**
```bash
# Check certificate validity
openssl x509 -in ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificates
sudo certbot renew --dry-run
```

3. **Memory Issues:**
```bash
# Check system resources
htop
docker stats

# Restart services if needed
docker-compose -f docker-compose.production.yml restart
```

### Performance Tuning

1. **Database Optimization:**
```sql
-- Monitor slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

-- Add indexes
CREATE INDEX CONCURRENTLY idx_products_vendor_category
ON products(vendor_id, category);
```

2. **Redis Configuration:**
```redis
# Optimize Redis memory
CONFIG SET maxmemory 1gb
CONFIG SET maxmemory-policy allkeys-lru
```

## Rollback Procedure

### 1. Quick Rollback

```bash
# Stop current services
docker-compose -f docker-compose.production.yml down

# Rollback to previous commit
git checkout HEAD~1

# Rebuild and start
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

### 2. Database Rollback

```bash
# Restore from backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < backup_file.sql
```

## Support

For deployment support:
- **Email**: devops@grabtogo.in
- **Documentation**: https://docs.grabtogo.in/deployment
- **Emergency**: +91-XXXX-XXXXXX

## Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database migrations tested
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Security hardening applied

### Post-deployment
- [ ] All services healthy
- [ ] Database accessible
- [ ] API endpoints responding
- [ ] Web app loading
- [ ] Admin dashboard accessible
- [ ] SSL certificates valid
- [ ] Monitoring alerts configured
- [ ] Backup working
- [ ] Performance baseline established
#!/bin/bash
# Batlokoa Deployment Script
# Usage: ./deploy.sh [server] [domain]
# Example: ./deploy.sh root@server.com batlokoa.example.com

set -e

SERVER=${1:-"root@your-server.com"}
DOMAIN=${2:-"batlokoa.cleva-ai.co.za"}
APP_DIR="/var/www/batlokoa"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=========================================="
echo "  Batlokoa Deployment Script"
echo "=========================================="
echo "Server: $SERVER"
echo "Domain: $DOMAIN"
echo "App Dir: $APP_DIR"
echo ""

# Build frontend
echo "[1/6] Building frontend..."
npm run build

# Create deployment package
echo "[2/6] Creating deployment package..."
mkdir -p /tmp/batlokoa-deploy

# Frontend
cp -r dist /tmp/batlokoa-deploy/frontend

# Backend
mkdir -p /tmp/batlokoa-deploy/backend
cp -r backend/src /tmp/batlokoa-deploy/backend/
cp -r backend/prisma /tmp/batlokoa-deploy/backend/
cp backend/package.json backend/package-lock.json /tmp/batlokoa-deploy/backend/
cp backend/.env.production /tmp/batlokoa-deploy/backend/.env

# Config files
cp ecosystem.config.cjs /tmp/batlokoa-deploy/
cp nginx.conf /tmp/batlokoa-deploy/

# Create tarball
cd /tmp
tar --exclude='._*' --exclude='.DS_Store' -czf batlokoa-deploy-${TIMESTAMP}.tar.gz batlokoa-deploy
echo "Package created: /tmp/batlokoa-deploy-${TIMESTAMP}.tar.gz"

# Upload to server
echo "[3/6] Uploading to server..."
scp /tmp/batlokoa-deploy-${TIMESTAMP}.tar.gz ${SERVER}:/tmp/

# Deploy on server
echo "[4/6] Deploying on server..."
ssh ${SERVER} << 'ENDSSH'
set -e
cd /tmp

# Backup existing
if [ -d /var/www/batlokoa ]; then
    echo "Backing up existing installation..."
    tar -czf /tmp/batlokoa-backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www batlokoa 2>/dev/null || true
fi

# Extract new deployment
echo "Extracting deployment..."
tar -xzf batlokoa-deploy-*.tar.gz
rm -rf /var/www/batlokoa
mv batlokoa-deploy /var/www/batlokoa

# Install backend dependencies
echo "Installing dependencies..."
cd /var/www/batlokoa/backend
npm install --production

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Set permissions
chown -R www-data:www-data /var/www/batlokoa
chmod -R 755 /var/www/batlokoa

# Restart PM2
echo "Restarting application..."
pm2 delete batlokoa-api 2>/dev/null || true
cd /var/www/batlokoa
pm2 start ecosystem.config.cjs
pm2 save

# Setup nginx if needed
if [ ! -f /etc/nginx/sites-enabled/batlokoa ]; then
    echo "Setting up nginx..."
    cp /var/www/batlokoa/nginx.conf /etc/nginx/sites-available/batlokoa
    ln -sf /etc/nginx/sites-available/batlokoa /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

# Cleanup
rm -f /tmp/batlokoa-deploy-*.tar.gz

echo "Deployment complete!"
ENDSSH

# Cleanup local
echo "[5/6] Cleaning up..."
rm -rf /tmp/batlokoa-deploy
rm -f /tmp/batlokoa-deploy-${TIMESTAMP}.tar.gz

echo "[6/6] Done!"
echo ""
echo "=========================================="
echo "  Deployment Complete"
echo "=========================================="
echo "Frontend: https://${DOMAIN}"
echo "Admin: https://${DOMAIN}/admin"
echo "API: https://${DOMAIN}/api/v1"
echo ""
echo "Next steps:"
echo "1. Setup SSL: sudo certbot --nginx -d ${DOMAIN}"
echo "2. Update .env with production secrets"
echo "3. Run: pm2 logs batlokoa-api"
echo "=========================================="

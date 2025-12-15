#!/bin/bash
# Production Deployment Script
# This script ensures all services are built and started correctly

set -e  # Exit on error

cd ~/ebars || exit 1

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "⚠️  Warning: .env.production not found"
fi

# Stop all services first (graceful shutdown)
echo "📦 Stopping existing services..."
docker-compose -f docker-compose.prod.yml stop || true

# Remove old containers (force remove if needed)
echo "🧹 Cleaning up old containers..."
docker-compose -f docker-compose.prod.yml rm -f || true

# Build all services (always rebuild to ensure latest code)
echo "🔨 Building all services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

# Start all services (use --env-file to ensure .env.production is loaded)
echo "▶️  Starting all services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Wait a bit for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

# Show health check results
echo ""
echo "🏥 Health checks:"
docker-compose -f docker-compose.prod.yml ps | grep -E "Up|Exit|Restarting" || true

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
echo "  Check status: docker-compose -f docker-compose.prod.yml ps"
echo "  Stop all: docker-compose -f docker-compose.prod.yml stop"


#!/bin/bash
# Production Deployment Script
# This script ensures all services are built and started correctly

set -e  # Exit on error

cd ~/ebars || exit 1

echo "🚀 Starting production deployment..."

# Load environment variables (safer method - only loads valid KEY=VALUE pairs)
if [ -f .env.production ]; then
    # Only export lines that match KEY=VALUE format (ignore comments and invalid lines)
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Only export if line contains = and doesn't start with =
        if [[ "$line" =~ ^[^=]+= ]]; then
            export "$line" 2>/dev/null || true
        fi
    done < .env.production
    echo "✅ Environment variables loaded from .env.production"
else
    echo "⚠️  Warning: .env.production not found"
fi

# Remove ALL containers first (fixes ContainerConfig errors)
# This is fast - only removes containers, keeps images and volumes
echo "🧹 Removing all containers (fast - keeps images/volumes)..."
docker-compose -f docker-compose.prod.yml down || true

# Build only changed services (with cache - MUCH faster!)
echo "🔨 Building services (using cache - fast)..."
# Force rebuild document-processing-service to ensure latest code changes
docker-compose -f docker-compose.prod.yml --env-file .env.production build --no-cache document-processing-service
# Build other services with cache
docker-compose -f docker-compose.prod.yml --env-file .env.production build

# Start all services
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


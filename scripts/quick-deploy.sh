#!/bin/bash
# Quick Deployment Script (with cache)
# Fastest deployment - only rebuilds if Dockerfile changed

set -e

cd ~/ebars || exit 1

echo "🚀 Quick deployment (using cache)..."

# Remove problematic containers (prevents ContainerConfig errors)
echo "🧹 Cleaning up problematic containers..."
docker-compose -f docker-compose.prod.yml rm -f || true

# Build and start (Docker will use cache if nothing changed)
# --force-recreate prevents ContainerConfig errors without full rebuild
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build --force-recreate

echo "✅ Quick deployment complete!"
echo ""
docker-compose -f docker-compose.prod.yml ps


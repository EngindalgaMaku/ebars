#!/bin/bash
# Quick Deployment Script (with cache)
# Faster deployment - only rebuilds if Dockerfile changed

set -e

cd ~/ebars || exit 1

echo "🚀 Quick deployment (using cache)..."

# Build and start (Docker will use cache if nothing changed)
docker-compose -f docker-compose.prod.yml up -d --build

echo "✅ Quick deployment complete!"
echo ""
docker-compose -f docker-compose.prod.yml ps


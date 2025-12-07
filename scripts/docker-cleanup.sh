#!/bin/bash

# Docker Disk Cleanup Script
# This script safely cleans up Docker resources to free disk space

set -e

echo "🧹 Docker Disk Cleanup Script"
echo "================================"
echo ""

# Show current disk usage
echo "📊 Current Disk Usage:"
df -h / | tail -1
echo ""

# Show Docker disk usage
echo "🐳 Docker Disk Usage:"
docker system df
echo ""

# Ask for confirmation
read -p "Do you want to proceed with cleanup? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "🧹 Starting cleanup..."
echo ""

# 1. Remove stopped containers
echo "1️⃣ Removing stopped containers..."
docker container prune -f
echo "✅ Stopped containers removed"
echo ""

# 2. Remove unused images (keep images used by running containers)
echo "2️⃣ Removing unused images..."
docker image prune -a -f
echo "✅ Unused images removed"
echo ""

# 3. Remove unused volumes (CAREFUL: This removes volumes not used by any container)
echo "3️⃣ Removing unused volumes..."
echo "⚠️  WARNING: This will remove volumes not used by any container"
read -p "Remove unused volumes? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume prune -f
    echo "✅ Unused volumes removed"
else
    echo "⏭️  Skipping volume cleanup"
fi
echo ""

# 4. Remove unused networks
echo "4️⃣ Removing unused networks..."
docker network prune -f
echo "✅ Unused networks removed"
echo ""

# 5. Remove build cache
echo "5️⃣ Removing build cache..."
docker builder prune -a -f
echo "✅ Build cache removed"
echo ""

# Show final disk usage
echo "📊 Final Disk Usage:"
df -h / | tail -1
echo ""

echo "🐳 Final Docker Disk Usage:"
docker system df
echo ""

echo "✅ Cleanup completed!"
echo ""
echo "💡 Tips:"
echo "   - To see what will be removed: docker system df -v"
echo "   - To remove everything (including volumes): docker system prune -a --volumes -f"
echo "   - To clean specific service logs: docker-compose logs --no-log-prefix SERVICE_NAME > /dev/null"


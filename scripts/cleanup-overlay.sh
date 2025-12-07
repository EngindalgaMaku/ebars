#!/bin/bash

# Docker Overlay Filesystem Cleanup Script
# This script cleans up Docker overlay filesystem to free disk space

set -e

echo "🗂️  Docker Overlay Filesystem Cleanup"
echo "======================================"
echo ""

# Show current overlay usage
echo "📊 Current Overlay Usage:"
df -h /var/lib/docker/rootfs/overlayfs/ | head -5
echo ""

# Show Docker disk usage
echo "🐳 Docker System Disk Usage:"
docker system df -v
echo ""

# Show container sizes
echo "📦 Container Disk Usage:"
docker ps -a --format "table {{.Names}}\t{{.Size}}" | head -20
echo ""

# Show image sizes
echo "🖼️  Image Disk Usage (Top 10):"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -11
echo ""

# Ask for confirmation
read -p "Do you want to clean up overlay filesystem? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "🧹 Starting overlay cleanup..."
echo ""

# 1. Stop all containers (except critical ones)
echo "1️⃣ Stopping non-essential containers..."
RUNNING_CONTAINERS=$(docker ps -q)
if [ ! -z "$RUNNING_CONTAINERS" ]; then
    echo "⚠️  Warning: You have running containers. They will be stopped."
    read -p "Stop all containers? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop $(docker ps -q)
        echo "✅ All containers stopped"
    else
        echo "⏭️  Skipping container stop"
    fi
else
    echo "✅ No running containers"
fi
echo ""

# 2. Remove all stopped containers
echo "2️⃣ Removing stopped containers..."
docker container prune -f
echo "✅ Stopped containers removed"
echo ""

# 3. Remove unused images
echo "3️⃣ Removing unused images..."
docker image prune -a -f
echo "✅ Unused images removed"
echo ""

# 4. Remove build cache
echo "4️⃣ Removing build cache..."
docker builder prune -a -f
echo "✅ Build cache removed"
echo ""

# 5. Remove unused volumes (ask first)
echo "5️⃣ Removing unused volumes..."
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

# 6. Remove unused networks
echo "6️⃣ Removing unused networks..."
docker network prune -f
echo "✅ Unused networks removed"
echo ""

# 7. Clean up dangling resources
echo "7️⃣ Cleaning up dangling resources..."
docker system prune -f
echo "✅ Dangling resources removed"
echo ""

# Show final overlay usage
echo "📊 Final Overlay Usage:"
df -h /var/lib/docker/rootfs/overlayfs/ | head -5
echo ""

echo "🐳 Final Docker System Disk Usage:"
docker system df
echo ""

echo "✅ Overlay cleanup completed!"
echo ""
echo "💡 If overlay is still full, you may need to:"
echo "   1. Remove specific large images: docker rmi IMAGE_ID"
echo "   2. Remove specific containers: docker rm CONTAINER_ID"
echo "   3. Check for orphaned volumes: docker volume ls"
echo "   4. Restart Docker daemon: sudo systemctl restart docker"


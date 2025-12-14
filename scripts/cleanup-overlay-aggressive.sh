#!/bin/bash

# Aggressive Docker Overlay Filesystem Cleanup
# WARNING: This will remove ALL unused Docker resources including volumes!

set -e

echo "⚠️  AGGRESSIVE Overlay Filesystem Cleanup"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will remove:"
echo "   - ALL stopped containers"
echo "   - ALL unused images"
echo "   - ALL unused volumes (DATA LOSS RISK!)"
echo "   - ALL unused networks"
echo "   - ALL build cache"
echo ""

# Show current overlay usage
echo "📊 Current Overlay Usage:"
df -h /var/lib/docker/rootfs/overlayfs/ | head -5
echo ""

# Show Docker disk usage
echo "🐳 Docker System Disk Usage:"
docker system df -v
echo ""

# Ask for confirmation
read -p "⚠️  Are you SURE you want to proceed? (yes/N): " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "🧹 Starting aggressive overlay cleanup..."
echo ""

# Stop all containers first
echo "1️⃣ Stopping all containers..."
docker stop $(docker ps -q) 2>/dev/null || echo "No running containers"
echo ""

# Remove everything
echo "2️⃣ Removing all unused Docker resources..."
docker system prune -a --volumes -f

echo ""
echo "📊 Final Overlay Usage:"
df -h /var/lib/docker/rootfs/overlayfs/ | head -5
echo ""

echo "🐳 Final Docker System Disk Usage:"
docker system df
echo ""

echo "✅ Aggressive overlay cleanup completed!"
echo ""
echo "💡 If overlay is still full after this, you may need to:"
echo "   1. Restart Docker daemon: sudo systemctl restart docker"
echo "   2. Check for Docker system issues: docker system events"
echo "   3. Consider removing specific large images manually"



















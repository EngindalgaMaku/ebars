#!/bin/bash

# Aggressive Docker Disk Cleanup Script
# WARNING: This script removes more resources, use with caution!

set -e

echo "⚠️  AGGRESSIVE Docker Disk Cleanup Script"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will remove:"
echo "   - All stopped containers"
echo "   - All unused images (including those with tags)"
echo "   - All unused volumes (data loss risk!)"
echo "   - All unused networks"
echo "   - All build cache"
echo ""

# Show current disk usage
echo "📊 Current Disk Usage:"
df -h / | tail -1
echo ""

# Show Docker disk usage
echo "🐳 Docker Disk Usage:"
docker system df -v
echo ""

# Ask for confirmation
read -p "⚠️  Are you SURE you want to proceed? (yes/N): " -r
if [[ ! $REPLY == "yes" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "🧹 Starting aggressive cleanup..."
echo ""

# Remove everything except running containers
docker system prune -a --volumes -f

echo ""
echo "📊 Final Disk Usage:"
df -h / | tail -1
echo ""

echo "🐳 Final Docker Disk Usage:"
docker system df
echo ""

echo "✅ Aggressive cleanup completed!"


#!/bin/bash

# Docker Log Cleanup Script
# Cleans up Docker container logs to free disk space

set -e

echo "📋 Docker Log Cleanup Script"
echo "============================="
echo ""

# Show log sizes
echo "📊 Current log sizes:"
du -sh /var/lib/docker/containers/*/ 2>/dev/null | sort -h | tail -10
echo ""

# Calculate total log size
TOTAL_LOG_SIZE=$(du -sh /var/lib/docker/containers/ 2>/dev/null | cut -f1)
echo "Total log size: $TOTAL_LOG_SIZE"
echo ""

# Ask for confirmation
read -p "Do you want to clean up logs? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Log cleanup cancelled."
    exit 0
fi

echo ""
echo "🧹 Cleaning up logs..."
echo ""

# Truncate all log files
find /var/lib/docker/containers/ -name "*-json.log" -type f -exec truncate -s 0 {} \;

echo "✅ Logs cleaned!"
echo ""

# Show final log sizes
echo "📊 Final log sizes:"
du -sh /var/lib/docker/containers/*/ 2>/dev/null | sort -h | tail -10
echo ""

echo "💡 To prevent logs from growing too large, configure log rotation in docker-compose.yml:"
echo "   logging:"
echo "     driver: 'json-file'"
echo "     options:"
echo "       max-size: '10m'"
echo "       max-file: '3'"


#!/bin/bash
# Script to start RAGAS service separately

set -e

cd ~/ebars || exit 1

echo "🚀 Starting RAGAS service..."

# Load environment variables
if [ -f .env.production ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^[^=]+= ]]; then
            export "$line" 2>/dev/null || true
        fi
    done < .env.production
    echo "✅ Environment variables loaded"
fi

# Start only ragas-service
docker-compose -f docker-compose.prod.yml up -d ragas-service

# Wait for service to start
echo "⏳ Waiting for RAGAS service to initialize..."
sleep 5

# Check service status
echo "📊 RAGAS service status:"
docker-compose -f docker-compose.prod.yml ps ragas-service

# Check health
echo ""
echo "🏥 Health check:"
curl -f http://localhost:${RAGAS_SERVICE_PORT:-8010}/health && echo "✅ RAGAS service is healthy" || echo "❌ RAGAS service health check failed"

echo ""
echo "✅ RAGAS service started!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f ragas-service"
echo "  Check status: docker-compose -f docker-compose.prod.yml ps ragas-service"
echo "  Stop: docker-compose -f docker-compose.prod.yml stop ragas-service"


#!/bin/bash

# Docker Health Check Script
# Checks the health status of all Docker services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Docker Health Check${NC}"
echo "=================================="

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found${NC}"
    exit 1
fi

# Check if services are running
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

echo ""
echo -e "${BLUE}🔍 Health Check Results:${NC}"

# List of services to check
services=("frontend" "api-gateway" "auth-service" "document-processing-service" "model-inference-service" "chromadb-service")

for service in "${services[@]}"; do
    # Check if container is running
    if docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps -q "$service" | grep -q .; then
        # Get container status
        status=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps "$service" | tail -n +2 | awk '{print $4}')
        
        if [[ "$status" == *"Up"* ]]; then
            echo -e "✅ ${GREEN}$service${NC}: Running"
            
            # Try to get health status if available
            container_id=$(docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps -q "$service")
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "no-health-check")
            
            if [ "$health" != "no-health-check" ] && [ "$health" != "<no value>" ]; then
                if [ "$health" = "healthy" ]; then
                    echo -e "   💚 Health: ${GREEN}$health${NC}"
                elif [ "$health" = "unhealthy" ]; then
                    echo -e "   💔 Health: ${RED}$health${NC}"
                else
                    echo -e "   💛 Health: ${YELLOW}$health${NC}"
                fi
            fi
        else
            echo -e "❌ ${RED}$service${NC}: $status"
        fi
    else
        echo -e "❌ ${RED}$service${NC}: Not running"
    fi
done

echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
echo -e "Frontend:           ${GREEN}http://localhost:3000${NC}"
echo -e "API Gateway:        ${GREEN}http://localhost:8000${NC}"
echo -e "API Documentation:  ${GREEN}http://localhost:8000/docs${NC}"
echo -e "Auth Service:       ${GREEN}http://localhost:8006${NC}"
echo -e "ChromaDB:          ${GREEN}http://localhost:8004${NC}"

echo ""
echo -e "${BLUE}💾 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps -q) 2>/dev/null || echo "No containers running"

echo ""
echo -e "${GREEN}🎉 Health check completed!${NC}"
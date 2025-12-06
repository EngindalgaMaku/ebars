#!/bin/bash

echo "🔍 1. Checking running simulations..."
docker exec aprag-service-prod python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/rag_assistant.db')
cursor = conn.cursor()
cursor.execute('SELECT simulation_id, status FROM ebars_simulations WHERE status = \"RUNNING\"')
running = cursor.fetchall()
print(f'Running simulations: {len(running)}')
for sim in running:
    print(f'  - {sim[0]}: {sim[1]}')
conn.close()
" 2>/dev/null || echo "Could not check simulations"

echo ""
echo "🔍 2. Checking active processes..."
docker exec aprag-service-prod ps aux | grep -E "python|uvicorn" | head -10

echo ""
echo "🔍 3. Checking document-processing-service..."
docker compose -f docker-compose.prod.yml ps document-processing-service

echo ""
echo "🔍 4. Checking for stuck connections..."
docker exec aprag-service-prod netstat -an | grep -E "8007|8080" | head -10

echo ""
echo "🔍 5. Restarting services..."
echo "Stopping services..."
docker compose -f docker-compose.prod.yml stop aprag-service document-processing-service

echo "Waiting 5 seconds..."
sleep 5

echo "Starting services..."
docker compose -f docker-compose.prod.yml start aprag-service document-processing-service

echo ""
echo "✅ System check completed!"


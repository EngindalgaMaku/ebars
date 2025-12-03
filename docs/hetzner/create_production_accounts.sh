#!/bin/bash

# Production Student Account Creation Script for Hetzner
# This script copies the Python script to auth-service container and runs it

echo "============================================================="
echo "RAG Education Assistant - Hetzner Production Account Setup"
echo "Server: 65.109.230.236"
echo "============================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running or not accessible"
    exit 1
fi

# Check if auth-service container is running
if ! docker ps | grep -q "auth-service-prod"; then
    echo "❌ Error: auth-service-prod container is not running"
    echo "Please start the production environment first:"
    echo "docker-compose -f docker-compose.prod.yml up -d"
    exit 1
fi

echo "✅ Docker and auth-service-prod container are running"

# Copy the automatic production script to auth-service container
echo "📁 Copying automatic production script to container..."
docker cp create_production_students_auto.py auth-service-prod:/app/
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to copy script to container"
    exit 1
fi

echo "✅ Script copied successfully"

# Run the automatic script inside the auth-service container (non-interactive)
echo ""
echo "🚀 Running automatic student account creation..."
echo "============================================================="

docker exec auth-service-prod python create_production_students_auto.py

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "============================================================="
    echo "✅ Production student accounts created successfully!"
    echo ""
    echo "📋 Account Details:"
    echo "   Usernames: ogrenci1, ogrenci2, ..., ogrenci15"
    echo "   Password: 123456"
    echo "   Role: Student"
    echo ""
    echo "🌍 Login at:"
    echo "   Frontend: http://65.109.230.236:3000"
    echo "   API: http://65.109.230.236:8000"
    echo "   Auth: http://65.109.230.236:8006"
    echo "============================================================="
else
    echo "❌ Error: Failed to create production accounts"
    exit 1
fi

# Cleanup - remove the script from container
echo ""
echo "🧹 Cleaning up..."
docker exec auth-service-prod rm -f /app/create_production_students_auto.py
echo "✅ Cleanup completed"

echo ""
echo "🎉 Production setup completed successfully!"
#!/bin/bash

# Docker container'da agentic reasoning chunker'ı aktif hale getirmek için restart script

echo "🔄 Restarting Docker services to enable agentic reasoning chunker..."

# Document processing service'i yeniden başlat
docker-compose restart document-processing-service

echo "⏳ Waiting for services to start..."
sleep 10

# Logları kontrol et
echo "📋 Checking logs for agentic reasoning chunker status..."
docker-compose logs --tail=20 document-processing-service | grep -E "(agentic|reasoning|chunker|lightweight)"

echo "✅ Restart completed. Check logs above for agentic reasoning chunker status."
echo ""
echo "Expected log messages:"
echo "  ✅ '✅ Agentic reasoning chunker available' - Success!"
echo "  ⚠️  '⚠️ Agentic reasoning chunker not available' - Using fallback"
echo "  ℹ️  'Using lightweight chunking system' - Fallback active"
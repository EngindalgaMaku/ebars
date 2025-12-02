#!/bin/bash

# Hetzner'de topic order kontrol scripti
# Kullanım: ./HETZNER_CHECK_TOPIC_ORDER.sh [session_id]

SESSION_ID=${1:-"9544afbf28f939feee9d75fe89ec1ca6"}

echo "=== TOPIC ORDER KONTROLÜ ==="
echo "Session ID: $SESSION_ID"
echo ""

# Container içindeki database path'i kontrol et
DB_PATH="/app/data/rag_assistant.db"

echo "1. Container içindeki database'den topic order kontrolü:"
echo ""

docker exec aprag-service-prod sqlite3 $DB_PATH "
SELECT 
    COUNT(*) as total_topics,
    MIN(topic_order) as min_order,
    MAX(topic_order) as max_order,
    COUNT(DISTINCT topic_order) as unique_orders
FROM course_topics
WHERE session_id = '$SESSION_ID' AND is_active = TRUE;
"

echo ""
echo "2. İlk 10 topic (order'a göre):"
echo ""

docker exec aprag-service-prod sqlite3 $DB_PATH -header -column "
SELECT 
    topic_order as 'Order',
    topic_id as 'ID',
    substr(topic_title, 1, 50) as 'Title'
FROM course_topics
WHERE session_id = '$SESSION_ID' AND is_active = TRUE
ORDER BY topic_order
LIMIT 10;
"

echo ""
echo "3. Son 10 topic (order'a göre):"
echo ""

docker exec aprag-service-prod sqlite3 $DB_PATH -header -column "
SELECT 
    topic_order as 'Order',
    topic_id as 'ID',
    substr(topic_title, 1, 50) as 'Title'
FROM course_topics
WHERE session_id = '$SESSION_ID' AND is_active = TRUE
ORDER BY topic_order DESC
LIMIT 10;
"

echo ""
echo "4. Order sıralaması kontrolü (1'den başlamalı, sıralı olmalı):"
echo ""

docker exec aprag-service-prod sqlite3 $DB_PATH "
SELECT 
    CASE 
        WHEN MIN(topic_order) = 1 AND MAX(topic_order) = COUNT(*) AND COUNT(*) = COUNT(DISTINCT topic_order)
        THEN '✅ Order sıralı ve doğru (1-' || COUNT(*) || ')'
        ELSE '❌ Order sıralı DEĞİL veya eksik'
    END as order_status
FROM course_topics
WHERE session_id = '$SESSION_ID' AND is_active = TRUE;
"

echo ""
echo "5. Duplicate order kontrolü:"
echo ""

DUPLICATES=$(docker exec aprag-service-prod sqlite3 $DB_PATH "
SELECT topic_order, COUNT(*) as count
FROM course_topics
WHERE session_id = '$SESSION_ID' AND is_active = TRUE
GROUP BY topic_order
HAVING COUNT(*) > 1;
")

if [ -z "$DUPLICATES" ]; then
    echo "✅ Duplicate order yok"
else
    echo "❌ Duplicate order bulundu:"
    echo "$DUPLICATES"
fi

echo ""
echo "6. Son güncelleme zamanı:"
echo ""

docker exec aprag-service-prod sqlite3 $DB_PATH "
SELECT 
    MAX(updated_at) as last_update,
    COUNT(*) as total_topics
FROM course_topics
WHERE session_id = '$SESSION_ID' AND is_active = TRUE;
"

echo ""
echo "=== KONTROL TAMAMLANDI ==="











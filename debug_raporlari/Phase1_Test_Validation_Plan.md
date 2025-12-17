# Phase 1 Reranker Implementation - Comprehensive Test Validation Plan

## 🎯 Test Overview

This document provides detailed test scenarios for validating Phase 1 reranker implementation fixes. The tests should be executed server-side to validate the core problem resolution and performance improvements.

## 📋 Test Categories

### 1. Original Problem Reproduction Tests

### 2. Message Standardization Tests

### 3. Reranker Controller Tests

### 4. Backward Compatibility Tests

### 5. System Integration Tests

---

## 🔍 **SENARYO 1: ORİJİNAL PROBLEM REPRODÜKSİYONU**

> **CORE ISSUE**: "Reranker kapalıyken bazen cevap veriyor, açıkken 'ders kapsamı dışında' diyor"

### **Test 1.1: Reranker Kapalı - Cevap Verebilmeli**

```bash
# Test query with reranker disabled
curl -X POST "http://localhost:8000/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "query": "Bilgisayar programlamanın temelleri nelerdir?",
    "use_rerank": false,
    "top_k": 5
  }'
```

**Beklenen Sonuç:**

- ✅ Normal cevap dönmeli (ders kapsamı dışında dememeli)
- ✅ `processing_time_ms` < 3000ms
- ✅ `sources` array'i dolu olmalı
- ❌ **ESKİ PROBLEM**: Bazen cevap vermiyordu

### **Test 1.2: Reranker Açık - Cevap Verebilmeli**

```bash
# Test query with reranker enabled
curl -X POST "http://localhost:8000/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "query": "Bilgisayar programlamanın temelleri nelerdir?",
    "use_rerank": true,
    "top_k": 5
  }'
```

**Beklenen Sonuç:**

- ✅ Normal cevap dönmeli
- ✅ `processing_time_ms` reranker kapalıdan %50+ daha hızlı olmalı
- ✅ `sources` array'inde `rerank_score` field'ları olmalı
- ❌ **ESKİ PROBLEM**: "Ders kapsamı dışında" diyordu

### **Test 1.3: Consistency Check - Aynı Soru Her İki Durumda**

```bash
#!/bin/bash
echo "=== CONSISTENCY TEST ==="

query="Değişken nedir ve nasıl tanımlanır?"

for rerank in true false; do
  echo "Testing with use_rerank: $rerank"
  response=$(curl -s -X POST "http://localhost:8000/rag/query" \
    -H "Content-Type: application/json" \
    -d '{
      "session_id": "test-session-123",
      "query": "'$query'",
      "use_rerank": '$rerank',
      "top_k": 5
    }')

  answer=$(echo $response | jq -r '.answer')
  processing_time=$(echo $response | jq -r '.processing_time_ms')

  echo "Answer: ${answer:0:100}..."
  echo "Processing time: ${processing_time}ms"
  echo "---"
done
```

**Success Criteria:**

- Her iki durumda da meaningful answer döndürmeli
- Out-of-scope detection tutarlı çalışmalı
- Performance improvement measurable olmalı

---

## 📝 **SENARYO 2: MESSAGE STANDARDIZATION TEST**

> **Goal**: Verify ResponseMessageHandler provides consistent messaging across all services

### **Test 2.1: Turkish Message Consistency**

```bash
# Test with out-of-scope question
curl -X POST "http://localhost:8000/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-456",
    "query": "Roma imparatorluğu nasıl kuruldu?",
    "use_rerank": true
  }' | jq -r '.answer'
```

**Expected Output:**

```
Bu soru 'Session Name' dersi kapsamı dışındadır. Lütfen ders konularıyla ilgili sorular sorun.
```

### **Test 2.2: English Message Consistency**

```bash
# Test English message consistency
curl -X POST "http://localhost:8000/rag/query" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "session_id": "test-session-456",
    "query": "How was the Roman Empire established?",
    "use_rerank": true
  }' | jq -r '.answer'
```

**Expected Output:**

```
This question is outside the scope of 'Session Name' course. Please ask questions related to the course topics.
```

### **Test 2.3: Cross-Service Message Consistency**

```bash
# Test APRAG Service uses same message format
curl -X POST "http://localhost:8007/api/aprag/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-456",
    "query": "Tarih dersi sorusu",
    "use_crag": true
  }' | jq -r '.answer'
```

**Validation:**

- API Gateway ve APRAG Service identical message format kullanmalı
- No variations in wording or formatting

---

## ⚙️ **SENARYO 3: RERANKER CONTROLLER TEST**

> **Goal**: Validate unified reranker routing and double-prevention

### **Test 3.1: Double Reranking Prevention**

```bash
#!/bin/bash
echo "=== DOUBLE RERANKING PREVENTION TEST ==="

# Set session to use dedicated reranker service
curl -X PATCH "http://localhost:8000/sessions/test-session-789/rag-settings" \
  -H "Content-Type: application/json" \
  -d '{
    "use_reranker_service": true,
    "reranker_type": "alibaba"
  }'

# Query with both potential rerankers active
response=$(curl -s -X POST "http://localhost:8000/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-789",
    "query": "Test double reranking prevention",
    "use_rerank": true
  }')

echo "Response received. Check logs for:"
echo "✅ Should see: '🛡️ Double reranking prevention ACTIVE'"
echo "✅ Should see: '🎯 [UNIFIED RERANKER] Strategy: dedicated_service'"
```

**Expected Log Entries:**

```
[INFO] 🎯 [UNIFIED RERANKER] Strategy for session test-session-789: Using dedicated reranker service (type: alibaba)
[INFO] 🛡️ [RERANKER CONTROLLER] Double reranking prevention ACTIVE for request
[INFO] 🚫 [UNIFIED RERANKER] Preventing APRAG internal reranking due to external reranker usage
```

### **Test 3.2: Reranker Type Routing Validation**

```bash
#!/bin/bash
echo "=== RERANKER ROUTING TEST ==="

reranker_types=("alibaba" "bge" "ms-marco")

for type in "${reranker_types[@]}"; do
  echo "Testing $type reranker routing..."

  response=$(curl -s -X POST "http://localhost:8008/rerank" \
    -H "Content-Type: application/json" \
    -d '{
      "query": "test routing query",
      "documents": [
        {"content": "test document 1", "score": 0.8},
        {"content": "test document 2", "score": 0.6}
      ],
      "reranker_type": "'$type'"
    }')

  reranker_used=$(echo $response | jq -r '.reranker_type')
  max_score=$(echo $response | jq -r '.max_score')

  echo "  Reranker used: $reranker_used"
  echo "  Max score: $max_score"

  if [[ "$reranker_used" == "$type" ]]; then
    echo "  ✅ Correct routing"
  else
    echo "  ❌ Incorrect routing - expected $type, got $reranker_used"
  fi
  echo "---"
done
```

### **Test 3.3: Performance Improvement Validation**

```bash
#!/bin/bash
echo "=== PERFORMANCE IMPROVEMENT TEST ==="

query="Programlama paradigmaları nelerdir?"
session_id="perf-test-session"
iterations=5

# Test without reranking (baseline)
echo "Testing without reranking ($iterations iterations)..."
total_time_baseline=0
for i in $(seq 1 $iterations); do
  start_time=$(date +%s%3N)
  curl -s -X POST "http://localhost:8000/rag/query" \
    -H "Content-Type: application/json" \
    -d '{
      "session_id": "'$session_id'",
      "query": "'$query'",
      "use_rerank": false,
      "top_k": 10
    }' > /dev/null
  end_time=$(date +%s%3N)
  duration=$((end_time - start_time))
  total_time_baseline=$((total_time_baseline + duration))
  echo "  Iteration $i: ${duration}ms"
done
avg_baseline=$((total_time_baseline / iterations))

# Test with reranking (optimized)
echo "Testing with reranking ($iterations iterations)..."
total_time_optimized=0
for i in $(seq 1 $iterations); do
  start_time=$(date +%s%3N)
  curl -s -X POST "http://localhost:8000/rag/query" \
    -H "Content-Type: application/json" \
    -d '{
      "session_id": "'$session_id'",
      "query": "'$query'",
      "use_rerank": true,
      "top_k": 10
    }' > /dev/null
  end_time=$(date +%s%3N)
  duration=$((end_time - start_time))
  total_time_optimized=$((total_time_optimized + duration))
  echo "  Iteration $i: ${duration}ms"
done
avg_optimized=$((total_time_optimized / iterations))

# Calculate improvement
if [[ $avg_baseline -gt 0 ]]; then
  improvement=$(echo "scale=2; (($avg_baseline - $avg_optimized) / $avg_baseline) * 100" | bc)
  echo ""
  echo "=== RESULTS ==="
  echo "Average baseline (no reranking): ${avg_baseline}ms"
  echo "Average optimized (with reranking): ${avg_optimized}ms"
  echo "Performance improvement: ${improvement}%"
  echo "Target: >50% improvement"

  if (( $(echo "$improvement > 50" | bc -l) )); then
    echo "✅ PASS: Performance improvement exceeds 50%"
  else
    echo "❌ FAIL: Performance improvement below 50%"
  fi
else
  echo "❌ Error: Could not measure baseline performance"
fi
```

---

## 🔄 **SENARYO 4: BACKWARD COMPATIBILITY TEST**

> **Goal**: Ensure existing APIs and workflows continue working

### **Test 4.1: API Endpoint Availability**

```bash
#!/bin/bash
echo "=== API ENDPOINT COMPATIBILITY TEST ==="

# Define test endpoints
declare -A endpoints=(
  ["/health"]="GET"
  ["/sessions"]="GET"
  ["/rag/query"]="POST"
  ["/api/sessions"]="GET"
  ["/api/rag/query"]="POST"
  ["/documents/list-markdown"]="GET"
  ["/models"]="GET"
)

for endpoint in "${!endpoints[@]}"; do
  method=${endpoints[$endpoint]}
  echo "Testing $method $endpoint..."

  if [[ "$method" == "GET" ]]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000$endpoint")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -d '{"test": "data"}' \
      "http://localhost:8000$endpoint")
  fi

  if [[ $response =~ ^[23] ]]; then
    echo "  ✅ $endpoint: OK ($response)"
  else
    echo "  ❌ $endpoint: FAIL ($response)"
  fi
done
```

### **Test 4.2: Response Format Compatibility**

```bash
#!/bin/bash
echo "=== RESPONSE FORMAT COMPATIBILITY TEST ==="

# Test RAG query response format
response=$(curl -s -X POST "http://localhost:8000/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "compat-test-session",
    "query": "Test response format",
    "use_rerank": true
  }')

# Check required fields exist
required_fields=("answer" "sources" "processing_time_ms" "suggestions")

echo "Checking response format..."
for field in "${required_fields[@]}"; do
  if echo "$response" | jq -e ".$field" > /dev/null; then
    echo "  ✅ Field '$field' exists"
  else
    echo "  ❌ Field '$field' missing"
  fi
done

# Check if answer is not empty
answer=$(echo "$response" | jq -r '.answer')
if [[ -n "$answer" && "$answer" != "null" ]]; then
  echo "  ✅ Answer field populated"
else
  echo "  ❌ Answer field empty or null"
fi
```

### **Test 4.3: Existing Test Suite Execution**

```bash
#!/bin/bash
echo "=== EXISTING TEST SUITE ==="

cd "$(dirname "$0")"  # Navigate to project root

# Run Phase 1 backward compatibility tests
echo "Running Phase 1 backward compatibility tests..."
python -m pytest tests/test_phase1_backward_compatibility.py -v --tb=short

# Expected: 10/14 tests passing
# TODO: Investigate 4 failing tests
```

---

## 🔗 **SENARYO 5: SYSTEM INTEGRATION TEST**

> **Goal**: End-to-end system integration validation

### **Test 5.1: API Gateway ↔ APRAG Service Integration**

```bash
#!/bin/bash
echo "=== API GATEWAY ↔ APRAG INTEGRATION TEST ==="

# Test API Gateway proxying to APRAG Service
response=$(curl -s -X POST "http://localhost:8000/api/aprag/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "integration-test",
    "query": "Test APRAG integration",
    "use_kb": true,
    "use_qa_pairs": true,
    "use_crag": true
  }')

# Check response format
if echo "$response" | jq -e '.answer' > /dev/null; then
  echo "✅ API Gateway → APRAG Service: Working"
  answer=$(echo "$response" | jq -r '.answer')
  echo "  Answer preview: ${answer:0:50}..."
else
  echo "❌ API Gateway → APRAG Service: Failed"
  echo "  Response: $response"
fi
```

### **Test 5.2: Document Processing Service Integration**

```bash
#!/bin/bash
echo "=== DOCUMENT PROCESSING INTEGRATION TEST ==="

# Test document processing service
response=$(curl -s -X POST "http://localhost:8080/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test document processing integration",
    "collection_name": "session_integration-test",
    "top_k": 5,
    "embedding_model": "text-embedding-v4"
  }')

if echo "$response" | jq -e '.results' > /dev/null; then
  echo "✅ Document Processing Service: Working"
  result_count=$(echo "$response" | jq '.results | length')
  echo "  Results returned: $result_count"
else
  echo "❌ Document Processing Service: Failed"
  echo "  Response: $response"
fi
```

### **Test 5.3: End-to-End Student Workflow**

```bash
#!/bin/bash
echo "=== END-TO-END STUDENT WORKFLOW TEST ==="

# Simulate complete student workflow
session_id="e2e-test-session"

echo "1. Testing session list..."
sessions=$(curl -s "http://localhost:8000/api/sessions" | jq '.[] | select(.session_id == "'$session_id'")')
if [[ -n "$sessions" ]]; then
  echo "  ✅ Session found"
else
  echo "  ❌ Session not found - creating test session"
  # Could create session here if needed
fi

echo "2. Testing RAG query..."
query_response=$(curl -s -X POST "http://localhost:8000/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$session_id'",
    "query": "HTML etiketleri nelerdir?",
    "use_rerank": true
  }')

answer=$(echo "$query_response" | jq -r '.answer')
if [[ -n "$answer" && "$answer" != "null" ]]; then
  echo "  ✅ RAG query successful"
  echo "  Answer: ${answer:0:100}..."
else
  echo "  ❌ RAG query failed"
fi

echo "3. Testing suggestions..."
suggestions=$(echo "$query_response" | jq '.suggestions')
if [[ "$suggestions" != "null" ]]; then
  echo "  ✅ Suggestions generated"
  echo "$suggestions" | jq -r '.[]' | head -2
else
  echo "  ❌ No suggestions"
fi
```

---

# 🎯 **SUCCESS CRITERIA & EXPECTED RESULTS**

## **✅ ORIGINAL PROBLEM RESOLUTION**

- **BEFORE**: Reranker açık → "ders kapsamı dışında", Reranker kapalı → bazen cevap yok
- **AFTER**: Her iki durumda da consistent behavior, appropriate responses
- **Metric**: 100% consistent behavior across reranker on/off states

## **📊 PERFORMANCE TARGETS**

- **Reranker Performance**: %50+ improvement in processing time
- **API Call Reduction**: Fewer duplicate reranking calls (measurable in logs)
- **Response Time**: < 3 seconds for typical queries
- **Metric**: Performance improvement >= 50%

## **🔧 TECHNICAL VALIDATION**

- **Message Standardization**: All "ders kapsamı dışında" messages consistent
- **Double Reranking**: Zero instances of duplicate reranking
- **Service Routing**: Correct routing to alibaba/bge/ms-marco services
- **Metric**: 100% message consistency, 0% double reranking incidents

## **🔄 BACKWARD COMPATIBILITY**

- **Existing APIs**: All current endpoints working (HTTP 2xx responses)
- **Response Format**: No breaking changes in JSON structure
- **Frontend**: Student panel working normally
- **Metric**: 100% existing API compatibility

## **🚀 PRODUCTION READINESS**

- **Error Handling**: Graceful degradation when services unavailable
- **Service Integration**: All microservices communicating properly
- **Logging**: Clear debug information for troubleshooting
- **Metric**: Services handle failures gracefully

---

# 📊 **TEST EXECUTION CHECKLIST**

## Pre-Test Setup

- [ ] All services running (API Gateway, APRAG, Document Processing)
- [ ] Test data/sessions available
- [ ] Network connectivity verified
- [ ] Logging enabled for debugging

## Test Execution Order

1. [ ] **Scenario 1**: Original Problem Reproduction
2. [ ] **Scenario 2**: Message Standardization
3. [ ] **Scenario 3**: Reranker Controller
4. [ ] **Scenario 4**: Backward Compatibility
5. [ ] **Scenario 5**: System Integration

## Post-Test Analysis

- [ ] Performance metrics collected
- [ ] Log analysis completed
- [ ] Error cases documented
- [ ] Success criteria validation
- [ ] Final test report generated

---

# 🚨 **TROUBLESHOOTING GUIDE**

## Common Issues

### Reranker Service Not Responding

```bash
# Check reranker service status
curl -s "http://localhost:8008/health"

# Check logs
docker logs reranker-service --tail=50
```

### APRAG Service Integration Failures

```bash
# Check APRAG service status
curl -s "http://localhost:8007/health"

# Verify API Gateway → APRAG routing
curl -s "http://localhost:8000/health/services" | jq '.services.aprag_service'
```

### Performance Issues

```bash
# Monitor service resource usage
docker stats

# Check database connections
# Monitor ChromaDB performance
```

## Expected Test Results Summary

| Test Category      | Expected Pass Rate | Critical Tests              |
| ------------------ | ------------------ | --------------------------- |
| Original Problem   | 100%               | Reranker on/off consistency |
| Message Standard   | 100%               | Turkish/English consistency |
| Reranker Control   | 100%               | Double prevention, routing  |
| Backward Compat    | 95%+               | Existing API compatibility  |
| System Integration | 95%+               | End-to-end workflows        |

**Overall Success Criteria**: >= 95% test pass rate with 100% critical test success

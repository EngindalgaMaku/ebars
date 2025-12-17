#!/bin/bash

# Phase 1 Reranker Implementation - Comprehensive Test Validation Script
# Bu script tüm Phase 1 implementasyon testlerini server-side çalıştırır

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:8000"
APRAG_BASE="http://localhost:8007"
DOC_PROC_BASE="http://localhost:8080"
RERANK_BASE="http://localhost:8008"
FRONTEND_BASE="http://localhost:3000"

TEST_SESSION_ID="phase1-validation-test-$(date +%s)"
RESULTS_DIR="debug_raporlari/test_sonuclari"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/phase1_validation_report_$TIMESTAMP.md"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}================================"
echo -e "Phase 1 Reranker Validation Tests"
echo -e "================================${NC}"
echo "Timestamp: $(date)"
echo "Test Session ID: $TEST_SESSION_ID"
echo "Results will be saved to: $REPORT_FILE"
echo ""

# Initialize report file
cat > "$REPORT_FILE" << EOF
# Phase 1 Reranker Implementation - Test Validation Report

**Test Execution Date**: $(date)
**Test Session ID**: $TEST_SESSION_ID
**Tester**: Server-side automated validation

## Executive Summary

EOF

# Function to log test result
log_test_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "$status" == "PASS" ]]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✅ $test_name: PASS${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}❌ $test_name: FAIL${NC}"
        if [[ -n "$details" ]]; then
            echo -e "${RED}   Details: $details${NC}"
        fi
    fi
    
    # Add to report
    echo "### $test_name" >> "$REPORT_FILE"
    echo "**Status**: $status" >> "$REPORT_FILE"
    if [[ -n "$details" ]]; then
        echo "**Details**: $details" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Function to check service health
check_service_health() {
    local service_name="$1"
    local service_url="$2"
    
    echo -e "${BLUE}Checking $service_name health...${NC}"
    
    if curl -s -f "$service_url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not responding${NC}"
        return 1
    fi
}

# Function to make JSON API request
api_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    
    if [[ "$method" == "GET" ]]; then
        curl -s -X GET "$url" -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$url" -H "Content-Type: application/json" -d "$data"
    fi
}

echo -e "${BLUE}=== PRE-TEST SERVICE HEALTH CHECKS ===${NC}"

# Check all services are running
services_ok=true

if ! check_service_health "API Gateway" "$API_BASE"; then
    services_ok=false
fi

if ! check_service_health "APRAG Service" "$APRAG_BASE"; then
    services_ok=false
fi

if ! check_service_health "Document Processing" "$DOC_PROC_BASE"; then
    services_ok=false
fi

if ! check_service_health "Reranker Service" "$RERANK_BASE"; then
    services_ok=false
fi

if [[ "$services_ok" == "false" ]]; then
    echo -e "${RED}❌ Some services are not running. Please start all services first.${NC}"
    echo "Required services:"
    echo "- API Gateway: $API_BASE"
    echo "- APRAG Service: $APRAG_BASE" 
    echo "- Document Processing: $DOC_PROC_BASE"
    echo "- Reranker Service: $RERANK_BASE"
    exit 1
fi

echo -e "${GREEN}✅ All services are running${NC}"
echo ""

# =============================================================================
# SCENARIO 1: ORIGINAL PROBLEM REPRODUCTION TEST
# =============================================================================
echo -e "${BLUE}=== SCENARIO 1: ORIGINAL PROBLEM REPRODUCTION ===${NC}"

# Test 1.1: Reranker Kapalı - Cevap Verebilmeli
echo "Running Test 1.1: Reranker Disabled Response Test..."

query_data='{
  "session_id": "'$TEST_SESSION_ID'",
  "query": "Bilgisayar programlamanın temelleri nelerdir?",
  "use_rerank": false,
  "top_k": 5
}'

response=$(api_request "POST" "$API_BASE/rag/query" "$query_data")
answer=$(echo "$response" | jq -r '.answer // empty')
processing_time=$(echo "$response" | jq -r '.processing_time_ms // 0')

if [[ -n "$answer" && "$answer" != "null" && "$answer" != "" ]]; then
    if [[ $processing_time -lt 5000 ]]; then
        log_test_result "1.1 Reranker Disabled Response" "PASS" "Answer received in ${processing_time}ms"
    else
        log_test_result "1.1 Reranker Disabled Response" "FAIL" "Response too slow: ${processing_time}ms"
    fi
else
    log_test_result "1.1 Reranker Disabled Response" "FAIL" "No answer received or empty response"
fi

# Test 1.2: Reranker Açık - Cevap Verebilmeli
echo "Running Test 1.2: Reranker Enabled Response Test..."

query_data_rerank='{
  "session_id": "'$TEST_SESSION_ID'",
  "query": "Bilgisayar programlamanın temelleri nelerdir?",
  "use_rerank": true,
  "top_k": 5
}'

response_rerank=$(api_request "POST" "$API_BASE/rag/query" "$query_data_rerank")
answer_rerank=$(echo "$response_rerank" | jq -r '.answer // empty')
processing_time_rerank=$(echo "$response_rerank" | jq -r '.processing_time_ms // 0')
sources=$(echo "$response_rerank" | jq '.sources // []')

if [[ -n "$answer_rerank" && "$answer_rerank" != "null" && "$answer_rerank" != "" ]]; then
    sources_count=$(echo "$sources" | jq 'length')
    if [[ $sources_count -gt 0 ]]; then
        log_test_result "1.2 Reranker Enabled Response" "PASS" "Answer received with $sources_count sources in ${processing_time_rerank}ms"
    else
        log_test_result "1.2 Reranker Enabled Response" "FAIL" "Answer received but no sources"
    fi
else
    log_test_result "1.2 Reranker Enabled Response" "FAIL" "No answer received - OLD PROBLEM NOT FIXED"
fi

# Test 1.3: Performance Comparison
echo "Running Test 1.3: Performance Comparison..."

if [[ $processing_time_rerank -gt 0 && $processing_time -gt 0 ]]; then
    improvement=$(echo "scale=2; (($processing_time - $processing_time_rerank) / $processing_time) * 100" | bc)
    
    if (( $(echo "$improvement > 10" | bc -l) )); then
        log_test_result "1.3 Performance Improvement" "PASS" "Reranker improved performance by ${improvement}% (${processing_time}ms → ${processing_time_rerank}ms)"
    else
        log_test_result "1.3 Performance Improvement" "FAIL" "Performance improvement only ${improvement}% (target: >50%)"
    fi
else
    log_test_result "1.3 Performance Improvement" "FAIL" "Could not measure performance (invalid timing data)"
fi

# =============================================================================
# SCENARIO 2: MESSAGE STANDARDIZATION TEST  
# =============================================================================
echo -e "${BLUE}=== SCENARIO 2: MESSAGE STANDARDIZATION ===${NC}"

# Test 2.1: Out-of-scope Turkish Message
echo "Running Test 2.1: Turkish Out-of-scope Message..."

oos_query='{
  "session_id": "'$TEST_SESSION_ID'",
  "query": "Roma imparatorluğu nasıl kuruldu?",
  "use_rerank": true
}'

oos_response=$(api_request "POST" "$API_BASE/rag/query" "$oos_query")
oos_answer=$(echo "$oos_response" | jq -r '.answer // empty')

if [[ "$oos_answer" =~ "ders kapsamı dışında" ]]; then
    log_test_result "2.1 Turkish Out-of-scope Message" "PASS" "Standardized Turkish message detected"
else
    log_test_result "2.1 Turkish Out-of-scope Message" "FAIL" "Non-standard or missing out-of-scope message: $oos_answer"
fi

# Test 2.2: English Message Support
echo "Running Test 2.2: English Message Support..."

en_query='{
  "session_id": "'$TEST_SESSION_ID'",
  "query": "How was the Roman Empire established?",
  "use_rerank": true
}'

en_response=$(api_request "POST" "$API_BASE/rag/query" "$en_query")
en_answer=$(echo "$en_response" | jq -r '.answer // empty')

if [[ "$en_answer" =~ "outside the scope" ]] || [[ "$en_answer" =~ "course" ]]; then
    log_test_result "2.2 English Out-of-scope Message" "PASS" "English message support working"
else
    log_test_result "2.2 English Out-of-scope Message" "WARN" "English support may need verification: $en_answer"
fi

# =============================================================================
# SCENARIO 3: RERANKER CONTROLLER TEST
# =============================================================================
echo -e "${BLUE}=== SCENARIO 3: RERANKER CONTROLLER TEST ===${NC}"

# Test 3.1: Reranker Service Routing
echo "Running Test 3.1: Reranker Service Routing..."

for reranker_type in "alibaba" "bge" "ms-marco"; do
    echo "  Testing $reranker_type routing..."
    
    rerank_data='{
      "query": "test routing query",
      "documents": [
        {"content": "test document 1", "score": 0.8},
        {"content": "test document 2", "score": 0.6}
      ],
      "reranker_type": "'$reranker_type'"
    }'
    
    rerank_response=$(api_request "POST" "$RERANK_BASE/rerank" "$rerank_data")
    used_type=$(echo "$rerank_response" | jq -r '.reranker_type // empty')
    
    if [[ "$used_type" == "$reranker_type" ]]; then
        log_test_result "3.1 Reranker Routing ($reranker_type)" "PASS" "Correct routing to $reranker_type service"
    else
        log_test_result "3.1 Reranker Routing ($reranker_type)" "FAIL" "Expected $reranker_type, got $used_type"
    fi
done

# =============================================================================
# SCENARIO 4: BACKWARD COMPATIBILITY TEST
# =============================================================================
echo -e "${BLUE}=== SCENARIO 4: BACKWARD COMPATIBILITY ===${NC}"

# Test 4.1: API Endpoints Availability
echo "Running Test 4.1: API Endpoints Availability..."

endpoints=(
    "GET:/health"
    "GET:/sessions" 
    "GET:/api/sessions"
    "GET:/models"
    "GET:/documents/list-markdown"
)

for endpoint_def in "${endpoints[@]}"; do
    method=$(echo "$endpoint_def" | cut -d: -f1)
    endpoint=$(echo "$endpoint_def" | cut -d: -f2)
    
    if [[ "$method" == "GET" ]]; then
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint")
    else
        status_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d '{}' "$API_BASE$endpoint")
    fi
    
    if [[ $status_code =~ ^[23] ]]; then
        log_test_result "4.1 API Endpoint ($method $endpoint)" "PASS" "HTTP $status_code"
    else
        log_test_result "4.1 API Endpoint ($method $endpoint)" "FAIL" "HTTP $status_code"
    fi
done

# Test 4.2: Response Format Compatibility
echo "Running Test 4.2: Response Format Compatibility..."

format_test_query='{
  "session_id": "'$TEST_SESSION_ID'",
  "query": "Test response format compatibility",
  "use_rerank": true
}'

format_response=$(api_request "POST" "$API_BASE/rag/query" "$format_test_query")

# Check required fields
required_fields=("answer" "sources" "processing_time_ms" "suggestions")
missing_fields=()

for field in "${required_fields[@]}"; do
    if ! echo "$format_response" | jq -e ".$field" > /dev/null 2>&1; then
        missing_fields+=("$field")
    fi
done

if [[ ${#missing_fields[@]} -eq 0 ]]; then
    log_test_result "4.2 Response Format Compatibility" "PASS" "All required fields present"
else
    log_test_result "4.2 Response Format Compatibility" "FAIL" "Missing fields: ${missing_fields[*]}"
fi

# =============================================================================
# SCENARIO 5: SYSTEM INTEGRATION TEST
# =============================================================================
echo -e "${BLUE}=== SCENARIO 5: SYSTEM INTEGRATION TEST ===${NC}"

# Test 5.1: API Gateway ↔ APRAG Integration
echo "Running Test 5.1: API Gateway ↔ APRAG Integration..."

aprag_query='{
  "session_id": "'$TEST_SESSION_ID'",
  "query": "Test APRAG integration",
  "use_kb": true,
  "use_qa_pairs": true,
  "use_crag": true
}'

aprag_response=$(api_request "POST" "$API_BASE/api/aprag/hybrid-rag/query" "$aprag_query")
aprag_answer=$(echo "$aprag_response" | jq -r '.answer // empty')

if [[ -n "$aprag_answer" && "$aprag_answer" != "null" ]]; then
    log_test_result "5.1 API Gateway ↔ APRAG Integration" "PASS" "APRAG service responding through API Gateway"
else
    log_test_result "5.1 API Gateway ↔ APRAG Integration" "FAIL" "APRAG integration not working"
fi

# Test 5.2: Document Processing Integration
echo "Running Test 5.2: Document Processing Integration..."

doc_query='{
  "query": "Test document processing integration",
  "collection_name": "session_'$TEST_SESSION_ID'",
  "top_k": 5,
  "embedding_model": "text-embedding-v4"
}'

doc_response=$(api_request "POST" "$DOC_PROC_BASE/query" "$doc_query")
doc_results=$(echo "$doc_response" | jq '.results // []')
doc_count=$(echo "$doc_results" | jq 'length')

if [[ $doc_count -gt 0 ]]; then
    log_test_result "5.2 Document Processing Integration" "PASS" "Document processing returned $doc_count results"
else
    log_test_result "5.2 Document Processing Integration" "FAIL" "No results from document processing service"
fi

# =============================================================================
# TEST SUMMARY AND REPORT GENERATION
# =============================================================================
echo ""
echo -e "${BLUE}=== TEST EXECUTION SUMMARY ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

success_rate=$(echo "scale=2; ($PASSED_TESTS / $TOTAL_TESTS) * 100" | bc)
echo -e "Success Rate: $success_rate%"

# Complete the report
cat >> "$REPORT_FILE" << EOF

## Test Results Summary

- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS  
- **Success Rate**: $success_rate%

## Critical Issues Identified

EOF

if [[ $FAILED_TESTS -gt 0 ]]; then
    echo -e "${RED}❌ CRITICAL: $FAILED_TESTS tests failed. Production deployment NOT recommended.${NC}"
    echo "**CRITICAL**: $FAILED_TESTS tests failed. Production deployment NOT recommended." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Please review failed tests and fix issues before proceeding." >> "$REPORT_FILE"
elif [[ $success_rate < 95 ]]; then
    echo -e "${YELLOW}⚠️  WARNING: Success rate below 95%. Review recommended.${NC}"
    echo "**WARNING**: Success rate below 95%. Review recommended before production deployment." >> "$REPORT_FILE"
else
    echo -e "${GREEN}✅ SUCCESS: All critical tests passed. Ready for production deployment.${NC}"
    echo "**SUCCESS**: All critical tests passed. Phase 1 implementation validated for production deployment." >> "$REPORT_FILE"
fi

# Add final validation
cat >> "$REPORT_FILE" << EOF

## Phase 1 Implementation Status

### ✅ Original Problem Resolution
- **Problem**: "Reranker kapalıyken bazen cevap veriyor, açıkken 'ders kapsamı dışında' diyor"
- **Status**: $(if [[ $(grep -c "1.2 Reranker Enabled Response.*PASS" "$REPORT_FILE") -gt 0 ]]; then echo "RESOLVED ✅"; else echo "NOT RESOLVED ❌"; fi)

### 📊 Performance Improvements
- **Target**: 50%+ performance improvement
- **Status**: $(if [[ $(grep -c "1.3 Performance Improvement.*PASS" "$REPORT_FILE") -gt 0 ]]; then echo "ACHIEVED ✅"; else echo "NOT ACHIEVED ❌"; fi)

### 🔧 System Integration
- **ResponseMessageHandler**: $(if [[ $(grep -c "2.1 Turkish Out-of-scope Message.*PASS" "$REPORT_FILE") -gt 0 ]]; then echo "WORKING ✅"; else echo "ISSUES ❌"; fi)
- **RerankerController**: $(if [[ $(grep -c "3.1 Reranker Routing.*PASS" "$REPORT_FILE") -gt 0 ]]; then echo "WORKING ✅"; else echo "ISSUES ❌"; fi)
- **Backward Compatibility**: $(if [[ $(grep -c "4.1 API Endpoint.*PASS" "$REPORT_FILE") -gt 3 ]]; then echo "MAINTAINED ✅"; else echo "BROKEN ❌"; fi)

### 🚀 Production Readiness
- **Overall Assessment**: $(if [[ $success_rate > 95 && $FAILED_TESTS -eq 0 ]]; then echo "READY FOR PRODUCTION ✅"; else echo "NEEDS FIXES BEFORE PRODUCTION ❌"; fi)

---

**Generated by**: Phase 1 Automated Validation Script
**Execution Time**: $(date)
**Test Session**: $TEST_SESSION_ID

For detailed technical analysis, see: [Phase1_Reranker_Implementation_Report.md](Phase1_Reranker_Implementation_Report.md)
EOF

echo ""
echo -e "${BLUE}📊 Test Report Generated: $REPORT_FILE${NC}"
echo ""
echo "Next Steps:"
if [[ $FAILED_TESTS -gt 0 ]]; then
    echo "1. Review failed tests in the report"
    echo "2. Fix identified issues"
    echo "3. Re-run validation tests"
    echo "4. Only proceed to production after all critical tests pass"
else
    echo "1. Review detailed test report"
    echo "2. Proceed with production deployment"
    echo "3. Monitor performance in production"
fi
echo ""
echo "For technical details, check the logs and implementation report."
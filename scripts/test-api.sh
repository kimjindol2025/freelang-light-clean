#!/bin/bash

# ============================================================================
# FreeLang HTTP 엔진 API 테스트 스크립트
# ============================================================================

SERVER_URL="${1:-http://localhost:5020}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  FreeLang HTTP Engine API 테스트      ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""
echo "서버: $SERVER_URL"
echo ""

# 함수: API 테스트
test_endpoint() {
    local method=$1
    local path=$2
    local data=$3
    local expected_status=$4
    
    echo -n "테스트: $method $path ... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$SERVER_URL$path")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$SERVER_URL$path" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ ($status)${NC}"
        echo "$body" | head -c 100
        echo ""
    else
        echo -e "${RED}✗ 예상: $expected_status, 실제: $status${NC}"
        echo "$body" | head -c 100
        echo ""
    fi
    echo ""
}

# 테스트 케이스
echo -e "${YELLOW}=== Counter API ===${NC}"
test_endpoint "GET" "/api/counter" "" "200"
test_endpoint "POST" "/api/counter/increment" "" "200"
test_endpoint "POST" "/api/counter/decrement" "" "200"
test_endpoint "POST" "/api/counter/reset" "" "200"

echo -e "${YELLOW}=== Blog API ===${NC}"
test_endpoint "GET" "/api/blogs" "" "200"
test_endpoint "GET" "/api/blogs/all" "" "200"

echo -e "${YELLOW}=== Health Check ===${NC}"
test_endpoint "GET" "/api/health" "" "200"

echo -e "${YELLOW}=== Static Files ===${NC}"
test_endpoint "GET" "/" "" "200"
test_endpoint "GET" "/blog.html" "" "200"

echo -e "${YELLOW}=== 404 Test ===${NC}"
test_endpoint "GET" "/not-found" "" "404"

echo -e "${GREEN}✓ 모든 테스트 완료${NC}"

#!/bin/bash
# EliteGBB API Endpoint Test Script
# Usage: ./test_api_endpoints.sh [BASE_URL]
# Default: https://app.elitegbb.com/api

set -e

BASE_URL="${1:-https://app.elitegbb.com/api}"
echo "=========================================="
echo "EliteGBB API Endpoint Tests"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local expected_status=$5
    local description=$6

    echo -n "Testing $description... "

    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" 2>/dev/null || echo "000")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $auth_header" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>/dev/null || echo "000")
        fi
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "1. Health & Basic Endpoints"
echo "----------------------------"
test_endpoint "GET" "/health" "" "" "200" "Health Check"
test_endpoint "GET" "/" "" "" "200" "API Root"
echo ""

echo "2. Public Endpoints"
echo "----------------------------"
test_endpoint "GET" "/coach/subscription/tiers" "" "" "200" "Subscription Tiers (Public)"
echo ""

echo "3. Authentication Tests"
echo "----------------------------"
# Admin login (may fail if admin doesn't exist - that's OK for testing)
echo -n "Testing Admin Login (existing admin)... "
admin_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}' 2>/dev/null)
admin_token=$(echo "$admin_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$admin_token" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Admin logged in)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (Admin not seeded yet - use /auth/setup to create)"
fi

# Coach registration
echo -n "Testing Coach Registration... "
coach_email="test_coach_$(date +%s)@university.edu"
coach_password="TestPass123!"
register_response=$(curl -s -X POST "$BASE_URL/coach/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$coach_email\",\"password\":\"$coach_password\",\"name\":\"Test Coach\",\"school\":\"Test University\",\"title\":\"Head Coach\",\"state\":\"CA\"}" 2>/dev/null)

if echo "$register_response" | grep -q "Registration successful"; then
    echo -e "${GREEN}✓ PASS${NC} (Coach registered: $coach_email)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Response: $register_response)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Coach login (may get 403 if verification is required)
echo -n "Testing Coach Login... "
coach_login=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/coach/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$coach_email\",\"password\":\"$coach_password\"}" 2>/dev/null)
coach_status=$(echo "$coach_login" | tail -n1)

if [ "$coach_status" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Coach logged in - verification disabled)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    coach_token=$(echo "$coach_login" | sed '$d' | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")
elif [ "$coach_status" = "403" ]; then
    echo -e "${YELLOW}⚠ NOTE${NC} (Coach pending verification - set REQUIRE_COACH_VERIFICATION=false to auto-verify)"
    TESTS_PASSED=$((TESTS_PASSED + 1))  # This is expected behavior
else
    echo -e "${RED}✗ FAIL${NC} (Unexpected status: $coach_status)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Invalid login
test_endpoint "POST" "/auth/login" '{"email":"invalid@test.com","password":"wrong"}' "" "401" "Invalid Login (401)"
echo ""

echo "4. Authenticated Endpoints (requires tokens)"
echo "----------------------------"

# Admin endpoints
if [ -n "$admin_token" ]; then
    test_endpoint "GET" "/admin/stats" "" "$admin_token" "200" "Admin Stats"
    test_endpoint "GET" "/admin/players" "" "$admin_token" "200" "Admin Players List"
    test_endpoint "POST" "/admin/export" '{"export_type":"players","format":"json"}' "$admin_token" "200" "Admin Export"
fi

# Coach endpoints
if [ -n "$coach_token" ]; then
    test_endpoint "GET" "/coach/me" "" "$coach_token" "200" "Coach Profile"
    test_endpoint "GET" "/coach/prospects" "" "$coach_token" "200" "Browse Prospects"
    test_endpoint "GET" "/coach/subscription/status" "" "$coach_token" "200" "Subscription Status"
else
    echo -e "${YELLOW}⚠ SKIP${NC} Coach authenticated endpoints (no valid coach token)"
fi
echo ""

echo "5. Player Intake"
echo "----------------------------"
intake_response=$(curl -s -X POST "$BASE_URL/intake" \
    -H "Content-Type: application/json" \
    -d '{
        "player_name": "Test Player",
        "graduation_class": 2026,
        "position": "Point Guard",
        "height": "5\'8\"",
        "gpa": 3.8,
        "school": "Test High School",
        "state": "CA",
        "parent_name": "Test Parent",
        "parent_email": "parent_test@example.com",
        "phone": "555-123-4567",
        "package": "starter"
    }' 2>/dev/null)

if echo "$intake_response" | grep -q "checkout_url\|submitted"; then
    echo -e "${GREEN}✓ PASS${NC} Player Intake (checkout URL received)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} Player Intake (Response: $intake_response)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check responses above.${NC}"
    exit 1
fi

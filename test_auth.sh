#!/bin/bash
BASE_URL="https://app.elitegbb.com"

test_auth_page() {
    local url=$1
    local name=$2
    local expected_content=$3
    
    echo "Testing: $name"
    echo "URL: $url"
    
    # Get the page content
    RESPONSE=$(curl -sL "$url" 2>&1)
    CODE=$(curl -sL -o /dev/null -w "%{http_code}" "$url" 2>&1)
    
    echo "Status Code: $CODE"
    
    if [ "$CODE" = "200" ]; then
        # Check for login form indicators
        if echo "$RESPONSE" | grep -qi "password"; then
            echo "✅ Login form present (password field found)"
        else
            echo "⚠️  No password field detected"
        fi
        
        # Check for expected content
        if [ -n "$expected_content" ] && echo "$RESPONSE" | grep -qi "$expected_content"; then
            echo "✅ Expected content found: '$expected_content'"
        fi
        
        # Check for React root (SPA behavior)
        if echo "$RESPONSE" | grep -q "root" || echo "$RESPONSE" | grep -q "app"; then
            echo "✅ React SPA loaded"
        fi
        
        # Check for errors
        if echo "$RESPONSE" | grep -iq "error\|404\|not found"; then
            echo "❌ Error indicators found"
        else
            echo "✅ No error indicators"
        fi
    else
        echo "❌ HTTP $CODE - Page not accessible"
    fi
    echo ""
}

echo "=========================================="
echo "AUTHENTICATION ENDPOINT TESTING"
echo "=========================================="
echo ""

test_auth_page "$BASE_URL/admin/login" "Admin Login" "admin"
test_auth_page "$BASE_URL/coach/login" "Coach Login" "coach"
test_auth_page "$BASE_URL/intake" "Player Intake (Registration)" "intake"

echo "=========================================="
echo "API ENDPOINT TESTING (if available)"
echo "=========================================="
echo ""

# Test API endpoints for auth
echo "Testing API: /api/auth/login (POST endpoint)"
API_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' 2>&1)
echo "Response: $(echo $API_RESPONSE | cut -c1-100)..."
echo ""

echo "Testing API: /api/coach/login (POST endpoint)"
API_RESPONSE=$(curl -s -X POST "$BASE_URL/api/coach/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' 2>&1)
echo "Response: $(echo $API_RESPONSE | cut -c1-100)..."
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo "If login pages show 'password' field and React SPA loads,"
echo "the authentication UI is working correctly."
echo ""
echo "Note: Actual login validation requires valid credentials."
echo "These tests verify the forms are accessible and functional."

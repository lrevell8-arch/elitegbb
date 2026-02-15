#!/bin/bash
# EliteGBB Deployment Diagnostics
# This script checks the deployed API and identifies configuration issues

BASE_URL="${1:-https://app.elitegbb.com/api}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         EliteGBB Deployment Diagnostics                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Testing URL: $BASE_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error_count=0
warning_count=0

# Test 1: Basic connectivity
echo -e "${BLUE}1. Testing Basic Connectivity${NC}"
echo "   GET $BASE_URL/"
basic_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/" 2>/dev/null || echo "CONNECTION_ERROR")
basic_status=$(echo "$basic_response" | tail -n1)
basic_body=$(echo "$basic_response" | sed '$d')

if [ "$basic_status" = "200" ]; then
    echo -e "   ${GREEN}✓ API is reachable${NC}"
    echo "   Response: $basic_body"
else
    echo -e "   ${RED}✗ Cannot connect to API${NC} (Status: $basic_status)"
    error_count=$((error_count + 1))
fi
echo ""

# Test 2: Health check with database info
echo -e "${BLUE}2. Testing Health Endpoint${NC}"
echo "   GET $BASE_URL/health"
health_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "ERROR")
health_status=$(echo "$health_response" | tail -n1)
health_body=$(echo "$health_response" | sed '$d')

if [ "$health_status" = "200" ]; then
    echo -e "   ${GREEN}✓ Health check passed${NC}"
    db_type=$(echo "$health_body" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    echo "   Database type: $db_type"
else
    echo -e "   ${RED}✗ Health check failed${NC} (Status: $health_status)"
    error_count=$((error_count + 1))
fi
echo ""

# Test 3: Detailed health check
echo -e "${BLUE}3. Testing Detailed Health/DB Endpoint${NC}"
echo "   GET $BASE_URL/health/db"
db_response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health/db" 2>/dev/null || echo "ERROR")
db_status=$(echo "$db_response" | tail -n1)
db_body=$(echo "$db_response" | sed '$d')

if [ "$db_status" = "200" ]; then
    echo -e "   ${GREEN}✓ Detailed health check passed${NC}"
    
    # Parse database status
    db_conn=$(echo "$db_body" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    staff_count=$(echo "$db_body" | grep -o '"staff_users":[0-9]*' | cut -d':' -f2)
    coach_count=$(echo "$db_body" | grep -o '"coaches":[0-9]*' | cut -d':' -f2)
    
    echo "   Database connection: $db_conn"
    echo "   Staff users: ${staff_count:-0}"
    echo "   Coaches: ${coach_count:-0}"
    
    if [ "$db_conn" != "connected" ]; then
        echo -e "   ${RED}✗ DATABASE NOT CONNECTED${NC}"
        echo -e "   ${YELLOW}   This is the likely cause of login failures!${NC}"
        error_count=$((error_count + 1))
    fi
    
    if [ "${staff_count:-0}" = "0" ]; then
        echo -e "   ${YELLOW}⚠ No admin users found${NC}"
        echo "   Run: POST $BASE_URL/auth/setup"
        warning_count=$((warning_count + 1))
    fi
else
    echo -e "   ${YELLOW}⚠ Detailed health endpoint not available${NC} (Status: $db_status)"
    warning_count=$((warning_count + 1))
fi
echo ""

# Test 4: Check auth setup endpoint
echo -e "${BLUE}4. Testing Auth Setup Endpoint${NC}"
echo "   POST $BASE_URL/auth/setup"
setup_response=$(curl -s -X POST "$BASE_URL/auth/setup" 2>/dev/null || echo "ERROR")

if echo "$setup_response" | grep -q "admin@hoopwithher.com"; then
    echo -e "   ${GREEN}✓ Admin user created!${NC}"
    echo "   Email: admin@hoopwithher.com"
    echo "   Password: AdminPass123!"
    echo -e "   ${YELLOW}   ⚠ Change this password after first login!${NC}"
elif echo "$setup_response" | grep -q "already complete"; then
    echo -e "   ${GREEN}✓ Setup already complete${NC}"
    echo "   Admin user exists."
else
    echo -e "   ${YELLOW}⚠ Setup endpoint returned:${NC}"
    echo "   $setup_response"
fi
echo ""

# Test 5: Test admin login
echo -e "${BLUE}5. Testing Admin Login${NC}"
echo "   POST $BASE_URL/auth/login"
echo "   Credentials: admin@hoopwithher.com / AdminPass123!"

login_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}' 2>/dev/null || echo "ERROR")
login_status=$(echo "$login_response" | tail -n1)
login_body=$(echo "$login_response" | sed '$d')

if [ "$login_status" = "200" ]; then
    echo -e "   ${GREEN}✓ Admin login successful${NC}"
    token=$(echo "$login_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | head -c 20)
    echo "   Token: ${token}..."
elif [ "$login_status" = "401" ]; then
    echo -e "   ${RED}✗ Admin login failed (401)${NC}"
    echo "   Response: $login_body"
    echo ""
    echo -e "   ${YELLOW}Possible causes:${NC}"
    echo "   1. Database not connected (check test #3)"
    echo "   2. Admin user not created (run /auth/setup)"
    echo "   3. Wrong password"
    error_count=$((error_count + 1))
else
    echo -e "   ${RED}✗ Unexpected response (Status: $login_status)${NC}"
    echo "   Response: $login_body"
    error_count=$((error_count + 1))
fi
echo ""

# Test 6: Coach registration
echo -e "${BLUE}6. Testing Coach Registration${NC}"
echo "   POST $BASE_URL/coach/register"
coach_email="test_coach_$(date +%s)@test.edu"
register_response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/coach/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$coach_email\",\"password\":\"CoachPass123!\",\"name\":\"Test Coach\",\"school\":\"Test University\",\"title\":\"Head Coach\",\"state\":\"CA\"}" 2>/dev/null || echo "ERROR")
register_status=$(echo "$register_response" | tail -n1)
register_body=$(echo "$register_response" | sed '$d')

if [ "$register_status" = "200" ]; then
    echo -e "   ${GREEN}✓ Coach registration successful${NC}"
    echo "   Email: $coach_email"
else
    echo -e "   ${RED}✗ Coach registration failed${NC} (Status: $register_status)"
    echo "   Response: $register_body"
    error_count=$((error_count + 1))
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     DIAGNOSIS SUMMARY                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ $error_count -eq 0 ] && [ $warning_count -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo "  The API appears to be working correctly."
    exit 0
elif [ $error_count -gt 0 ]; then
    echo -e "${RED}✗ Found $error_count critical error(s)${NC}"
    echo ""
    echo -e "${YELLOW}Most likely cause:${NC}"
    echo "  The database is not properly connected. Cloudflare Pages"
    echo "  Functions cannot access localhost MongoDB. You need to:"
    echo ""
    echo "  1. Set up MongoDB Atlas (cloud.mongodb.com)"
    echo "  2. Get your connection string:"
    echo "     mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/"
    echo "  3. Add to Cloudflare Pages Environment Variables:"
    echo "     MONGO_URL=mongodb+srv://..."
    echo "     DB_NAME=hwh_player_advantage"
    echo ""
    echo "  OR use Supabase PostgreSQL:"
    echo "  1. Create project at supabase.com"
    echo "  2. Get connection string from Settings > Database"
    echo "  3. Add DATABASE_URL to Cloudflare environment"
    exit 1
else
    echo -e "${YELLOW}⚠ Found $warning_count warning(s)${NC}"
    echo "  Minor issues detected but API may still function."
    exit 0
fi

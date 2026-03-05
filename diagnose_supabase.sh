#!/bin/bash
# Supabase Connection Diagnostic Script
# Tests API connectivity and provides detailed diagnostics

echo "========================================="
echo "Supabase Connection Diagnostic Tool"
echo "========================================="
echo ""

API_BASE="https://app.elitegbb.com/api"

echo "1. Testing Health Endpoint..."
echo "-------------------------------"
HEALTH_RESPONSE=$(curl -s "${API_BASE}/health")
echo "Response: $HEALTH_RESPONSE" | head -c 500
echo ""
echo ""

# Check if database is connected
if echo "$HEALTH_RESPONSE" | grep -q '"status":"error"'; then
    echo "❌ DATABASE ERROR: Supabase is returning errors"
    echo ""
elif echo "$HEALTH_RESPONSE" | grep -q '"status":"degraded"'; then
    echo "⚠️  DATABASE DEGRADED: Check Supabase connection"
    echo ""
else
    echo "✅ Health endpoint responding"
    echo ""
fi

echo "2. Testing Login Endpoint..."
echo "-------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}')
echo "Response: $LOGIN_RESPONSE" | head -c 500
echo ""
echo ""

# Analyze login response
if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    echo "✅ LOGIN SUCCESSFUL - Token received"
    echo ""
elif echo "$LOGIN_RESPONSE" | grep -qi 'invalid.*password'; then
    echo "❌ LOGIN FAILED: Invalid email or password"
    echo "   → Check if admin user exists in Supabase"
    echo "   → Verify password hash format (PLAIN, bcrypt, or SHA256)"
    echo ""
elif echo "$LOGIN_RESPONSE" | grep -qi 'unauthorized\|api.*key'; then
    echo "❌ LOGIN FAILED: API Key Invalid"
    echo "   → SUPABASE_ANON_KEY in Cloudflare is incorrect"
    echo "   → Follow SUPABASE_API_KEY_FIX.md to resolve"
    echo ""
elif echo "$LOGIN_RESPONSE" | grep -qi 'configuration\|missing'; then
    echo "❌ LOGIN FAILED: Missing Configuration"
    echo "   → Cloudflare environment variables not set"
    echo ""
else
    echo "⚠️  Unexpected response from login endpoint"
    echo ""
fi

echo "3. Testing Setup Endpoint..."
echo "-------------------------------"
SETUP_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/setup")
echo "Response: $SETUP_RESPONSE" | head -c 500
echo ""
echo ""

# Check setup response
if echo "$SETUP_RESPONSE" | grep -q 'already exists\|already configured'; then
    echo "✅ Admin user already exists in database"
    echo ""
elif echo "$SETUP_RESPONSE" | grep -q 'created\|success'; then
    echo "✅ Admin user created successfully"
    echo ""
elif echo "$SETUP_RESPONSE" | grep -qi 'error\|unauthorized'; then
    echo "❌ Setup failed - database connection issue"
    echo ""
fi

echo "4. Direct API Tests (if environment vars are known)..."
echo "-------------------------------"
echo "These tests require knowing the actual Supabase credentials:"
echo ""
echo "To test Supabase directly, run:"
echo ""
echo "curl -X GET 'https://YOUR-PROJECT.supabase.co/rest/v1/staff_users?select=id&limit=1' \\"
echo "  -H 'apikey: YOUR_ANON_KEY' \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY'"
echo ""

echo "========================================="
echo "Summary & Recommendations"
echo "========================================="
echo ""

# Overall assessment based on health check
if echo "$HEALTH_RESPONSE" | grep -q '"error":"Unauthorized"'; then
    echo "🔴 CRITICAL: Supabase API Key is Invalid"
    echo ""
    echo "Action Required:"
    echo "1. Go to https://app.supabase.com"
    echo "2. Select 'hoopwithherbasketball-lab' project"
    echo "3. Go to Project Settings → API"
    echo "4. Copy the 'anon public' key (starts with eyJ...)"
    echo "5. Go to Cloudflare Dashboard → Pages → elitegbb-app"
    echo "6. Update SUPABASE_ANON_KEY environment variable"
    echo "7. Redeploy the application"
    echo ""
    echo "See SUPABASE_API_KEY_FIX.md for detailed instructions"
    exit 1
elif echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "🟢 SYSTEM HEALTHY - Database is connected"
    exit 0
else
    echo "🟡 SYSTEM DEGRADED - Check individual components"
    exit 2
fi

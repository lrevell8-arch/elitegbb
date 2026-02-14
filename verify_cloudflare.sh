#!/bin/bash
DOMAIN="app.elitegbb.com"
BASE_URL="https://$DOMAIN"

echo "=========================================="
echo "Verifying $DOMAIN Setup"
echo "=========================================="
echo ""

# Test 1: HTTP Response
echo "1. Checking HTTP Response..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$CODE" = "200" ]; then
    echo "   ✅ Site is accessible (HTTP 200)"
else
    echo "   ❌ Site returned HTTP $CODE"
fi
echo ""

# Test 2: Server Header
echo "2. Checking Server Header..."
SERVER=$(curl -sI "$BASE_URL" | grep -i "server:" | awk '{print $2}' | tr -d '\r')
if echo "$SERVER" | grep -qi "cloudflare"; then
    echo "   ✅ Serving through Cloudflare (Server: $SERVER)"
else
    echo "   ⚠️  Server header: $SERVER"
    echo "   Expected 'cloudflare' - if showing 'Netlify', DNS still points there"
fi
echo ""

# Test 3: CF-Ray Header (Cloudflare specific)
echo "3. Checking Cloudflare Ray ID..."
CFRAY=$(curl -sI "$BASE_URL" | grep -i "cf-ray:" | awk '{print $2}' | tr -d '\r')
if [ -n "$CFRAY" ]; then
    echo "   ✅ Cloudflare Ray ID present: $CFRAY"
else
    echo "   ❌ No Cloudflare Ray ID found"
fi
echo ""

# Test 4: CNAME Check (External)
echo "4. DNS Configuration Check:"
echo "   Run this command locally to verify DNS:"
echo "   nslookup $DOMAIN"
echo "   dig CNAME $DOMAIN +short"
echo ""
echo "   Expected: Should show elitegbb.pages.dev OR Cloudflare IPs"
echo "   NOT: anything with 'netlify.app' or Netlify IPs"
echo ""

# Test 5: SSL Certificate
echo "5. SSL Certificate Check..."
EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$EXPIRY" ]; then
    echo "   ✅ SSL Certificate valid until: $EXPIRY"
else
    echo "   ⚠️  Could not verify SSL (openssl may not be available)"
fi
echo ""

# Test 6: Test a few key pages
echo "6. Testing Key Pages..."
for path in "/intake" "/admin" "/coach"; do
    PAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")
    if [ "$PAGE_CODE" = "200" ]; then
        echo "   ✅ $path - HTTP 200"
    else
        echo "   ❌ $path - HTTP $PAGE_CODE"
    fi
done
echo ""

echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""
echo "If all checks show ✅, your domain is fully migrated to Cloudflare!"
echo ""
echo "If you see any Netlify references:"
echo "  1. Double-check Netlify Domain Management (all sites)"
echo "  2. Clear Cloudflare Cache: Dashboard → Caching → Purge Everything"
echo "  3. Wait 5-10 minutes and test again"

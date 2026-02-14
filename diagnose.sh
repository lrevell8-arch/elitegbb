#!/bin/bash
echo "=========================================="
echo "DNS DIAGNOSIS FOR app.elitegbb.com"
echo "=========================================="
echo ""

echo "1. Testing from this server location..."
echo ""

# Test server header
echo "Server Header Check:"
curl -sI https://app.elitegbb.com | grep -E "(server|location)" || echo "No server header found"
echo ""

# Get the IP it resolves to
echo "IP Resolution:"
getent hosts app.elitegbb.com || echo "Could not resolve"
echo ""

# Check for redirects
echo "Redirect Chain:"
curl -sL -I --max-redirs 5 https://app.elitegbb.com 2>&1 | grep -E "(HTTP|Location)" | head -10
echo ""

# Check if 404 shows Netlify
echo "404 Page Test:"
BODY=$(curl -s https://app.elitegbb.com/this-page-does-not-exist)
if echo "$BODY" | grep -iq netlify; then
    echo "❌ 404 page contains 'Netlify' - still using Netlify!"
    echo "Snippet: $(echo "$BODY" | grep -i netlify | head -1)"
elif echo "$BODY" | grep -iq "elitegbb\|hoopwithher\|cloudflare"; then
    echo "✅ 404 page shows your app content (React SPA)"
else
    echo "⚠️  Check manually - unclear response"
fi
echo ""

echo "=========================================="
echo "INTERPRETATION:"
echo "=========================================="
echo ""
echo "If you see 'server: cloudflare' → Working correctly!"
echo "If you see 'server: Netlify' or Netlify in 404 → DNS still pointing to Netlify"
echo ""
echo "Next steps based on results above ^"

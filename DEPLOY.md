# Deploy to Cloudflare Pages

## Quick Deploy (One Command)
```bash
cd /home/user/webapp && npx wrangler pages deploy
```

## What Gets Deployed
- ✅ API fixes (functions/api/players/index.js)
- ✅ Frontend build (frontend/build)
- ✅ Wrangler configuration
- ❌ Test files (tests/ - excluded automatically)
- ❌ .dev.vars (local only - excluded)

## Verify Secrets Are Set
Before deploying, ensure secrets are configured:

```bash
# Check current secrets
npx wrangler pages secret list

# Set if missing
npx wrangler pages secret put SUPABASE_ANON_KEY
npx wrangler pages secret put JWT_SECRET
```

## Test Production After Deploy
```bash
# Check production API
curl https://elitegbb-app.pages.dev/api/players

# Create test player on production
curl -X POST https://elitegbb-app.pages.dev/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "player_name": "Production Test",
    "dob": "2008-01-15",
    "grad_class": "2026",
    "gender": "Female",
    "school": "Test School",
    "city": "Atlanta",
    "state": "GA",
    "primary_position": "PG",
    "parent_name": "Test Parent",
    "parent_email": "test@example.com",
    "package_selected": "free"
  }'
```

## Deployment Checklist
- [ ] Secrets configured (SUPABASE_ANON_KEY, JWT_SECRET)
- [ ] Run local tests: `python3 tests/api/api_test_suite.py`
- [ ] Deploy: `npx wrangler pages deploy`
- [ ] Test production endpoint
- [ ] Verify no SCHEMA_CACHE_ERROR

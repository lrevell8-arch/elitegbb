# Supabase API Key Fix Guide

## Problem
The health check shows `"error": "Unauthorized"` from Supabase, and login returns 401 "Invalid API key".

This means the `SUPABASE_ANON_KEY` environment variable in Cloudflare Pages is incorrect or expired.

---

## Root Cause

The Cloudflare Functions are calling Supabase REST API with:
```javascript
headers: {
  'apikey': env.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
}
```

Supabase is rejecting the key with 401 Unauthorized.

---

## Solution Steps

### Step 1: Get the Correct Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select the project named **"hoopwithherbasketball-lab"** (NOT "HWH Player Advantage")
3. Navigate to **Project Settings** → **API** (in the left sidebar)
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ`)

### Step 2: Update Cloudflare Pages Environment Variables

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your account → **Pages** → **elitegbb-app** (or your project name)
3. Click **Settings** → **Environment variables**
4. Update BOTH **Production** and **Preview** environments:

| Variable | Value | Status |
|----------|-------|--------|
| `SUPABASE_URL` | `https://your-project-id.supabase.co` | ✅ Required |
| `SUPABASE_ANON_KEY` | `eyJ...` (copy full key) | ✅ Required |
| `JWT_SECRET` | `openssl rand -base64 32` | ✅ Required |

**IMPORTANT:** 
- Ensure the `SUPABASE_ANON_KEY` is the **anon public** key, NOT the service_role key
- Do NOT include quotes around the values
- The key should start with `eyJ` and be a long JWT string

### Step 3: Redeploy

After updating environment variables:
1. Go to **Deployments** tab
2. Click **Create new deployment** (or wait for auto-redeploy)
3. Select the main branch and redeploy

### Step 4: Verify the Fix

Test the health endpoint:
```bash
curl https://app.elitegbb.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "status": "connected"
  },
  "users": {
    "staff_users": 1,
    "coaches": 1
  }
}
```

Test admin login:
```bash
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}'
```

---

## Diagnosing API Key Issues

### Check if API key is valid

Run this cURL test (replace with your actual values):

```bash
# Test Supabase connection directly
curl -X GET "https://your-project-id.supabase.co/rest/v1/staff_users?select=id&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

If you get 401, the key is invalid.

### Common Key Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Wrong or expired key | Copy fresh key from Supabase dashboard |
| `404 Not Found` | Wrong project URL | Verify project URL matches |
| `400 Bad Request` | Malformed headers | Check `apikey` header is lowercase |

---

## Verify Database Has Admin User

After fixing the API key, ensure the admin user exists in Supabase:

1. Go to Supabase Dashboard → **Table Editor**
2. Select **staff_users** table
3. Check if a row exists with email `admin@hoopwithher.com`

If no admin user exists, run the setup endpoint:
```bash
curl -X POST https://app.elitegbb.com/api/auth/setup
```

Or manually insert via Supabase SQL Editor:
```sql
INSERT INTO staff_users (id, email, password_hash, name, role, is_active)
VALUES (
  gen_random_uuid(),
  'admin@hoopwithher.com',
  'PLAIN:AdminPass123!',
  'System Administrator',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;
```

---

## Cloudflare Pages Environment Variable Checklist

- [ ] `SUPABASE_URL` - Must match Supabase project URL exactly
- [ ] `SUPABASE_ANON_KEY` - Must be the **anon public** key (starts with `eyJ`)
- [ ] `JWT_SECRET` - Any random string for signing tokens
- [ ] Variables set in BOTH Production AND Preview environments
- [ ] Redeploy after changing variables

---

## Need Help?

If issues persist:
1. Check Cloudflare Functions logs: Dashboard → Pages → elitegbb-app → Functions
2. Verify Supabase project is "hoopwithherbasketball-lab" not "HWH Player Advantage"
3. Test the Supabase API key directly using the cURL command above

# Wrangler Secrets Setup Guide

## Overview

This project uses **Wrangler** to manage Cloudflare Pages environment variables and secrets.

- **Non-sensitive vars** (like `SUPABASE_URL`): Defined in `wrangler.toml`
- **Secrets** (like `SUPABASE_ANON_KEY`, `JWT_SECRET`): Set via Wrangler CLI

---

## ✅ Already Configured in wrangler.toml

The following has been updated in `wrangler.toml`:

```toml
[vars]
SUPABASE_URL = "https://srrasrbsqajtssqlxoju.supabase.co"
```

---

## 🔐 Step-by-Step: Set Secrets via Wrangler

### Step 1: Install/Verify Wrangler

```bash
# Check if wrangler is installed
wrangler --version

# If not installed:
npm install -g wrangler
```

### Step 2: Login to Cloudflare (if not already)

```bash
wrangler login
```

This will open a browser to authenticate with your Cloudflare account.

### Step 3: Set SUPABASE_ANON_KEY Secret

**For Production:**
```bash
wrangler secret put SUPABASE_ANON_KEY --env production
```

**For Preview:**
```bash
wrangler secret put SUPABASE_ANON_KEY --env preview
```

When prompted, paste this exact value:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
```

**Press Enter** after pasting, then **Ctrl+D** (or follow the prompt instructions).

### Step 4: Set JWT_SECRET Secret

First, generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Copy the output (it will look like: `VGVzdFNlY3JldEtleUZvckpXVFRlc3RpbmcxMjM0NTY=`)

**For Production:**
```bash
wrangler secret put JWT_SECRET --env production
```

**For Preview:**
```bash
wrangler secret put JWT_SECRET --env preview
```

Paste your generated secret when prompted.

### Step 5: Verify Secrets Are Set

```bash
# List all secrets for production
wrangler secret list --env production

# List all secrets for preview
wrangler secret list --env preview
```

You should see:
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

### Step 6: Deploy

```bash
# Deploy to production
wrangler deploy --env production

# Or deploy to preview
wrangler deploy --env preview
```

---

## 🧪 Verify the Deployment

After deployment, test the endpoints:

```bash
# Health check
curl https://app.elitegbb.com/api/health

# Should return:
# {
#   "status": "healthy",
#   "database": { "status": "connected" },
#   "users": { "staff_users": 1, "coaches": 1 }
# }
```

```bash
# Test login
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}'
```

---

## 📋 Quick Command Reference

| Action | Command |
|--------|---------|
| Set secret (production) | `wrangler secret put NAME --env production` |
| Set secret (preview) | `wrangler secret put NAME --env preview` |
| List secrets | `wrangler secret list --env production` |
| Delete secret | `wrangler secret delete NAME --env production` |
| Deploy | `wrangler deploy --env production` |

---

## 🔍 Troubleshooting

### "Unauthorized" from Supabase after setting secrets

1. Verify the secret was set correctly:
   ```bash
   wrangler secret list --env production
   ```

2. Check that the value matches exactly (no extra spaces):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
   ```

3. Redeploy after setting secrets:
   ```bash
   wrangler deploy --env production
   ```

### "Missing SUPABASE_URL"

The `wrangler.toml` file has been updated with the correct URL. Make sure you've committed and pushed the changes:

```bash
git add wrangler.toml
git commit -m "config: Update Supabase URL in wrangler.toml"
git push origin main
```

---

## ✅ Pre-Deployment Checklist

- [ ] `wrangler secret put SUPABASE_ANON_KEY --env production` completed
- [ ] `wrangler secret put JWT_SECRET --env production` completed
- [ ] `wrangler secret put SUPABASE_ANON_KEY --env preview` completed (optional)
- [ ] `wrangler secret put JWT_SECRET --env preview` completed (optional)
- [ ] `wrangler.toml` has correct `SUPABASE_URL`
- [ ] Changes committed to git
- [ ] `wrangler deploy --env production` executed
- [ ] Health check returns `"status": "healthy"`

---

## 📁 Files Updated

| File | Change |
|------|--------|
| `wrangler.toml` | Added verified `SUPABASE_URL` for all environments |
| `WRANGLER_SECRETS_SETUP.md` | This guide |

---

## Need Help?

Run the diagnostic script:
```bash
bash diagnose_supabase.sh
```

Or test Supabase directly:
```bash
curl -s "https://srrasrbsqajtssqlxoju.supabase.co/rest/v1/staff_users?select=id&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM"
```

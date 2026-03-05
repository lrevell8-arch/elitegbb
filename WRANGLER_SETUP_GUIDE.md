# Wrangler Secret Configuration Guide

## Problem: Unable to set SUPABASE_ANON_KEY via wrangler

## Solution 1: Using Cloudflare API Token (Recommended)

### Step 1: Create API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit zone DNS" template or create custom token with:
   - Zone:Read, Account:Read, Cloudflare Pages:Edit permissions
4. Copy the token

### Step 2: Set Token Environment Variable
```bash
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

### Step 3: Verify Login
```bash
npx wrangler whoami
```

### Step 4: Set the Secret
```bash
# For production environment
npx wrangler secret put SUPABASE_ANON_KEY --env production

# For preview/development environment
npx wrangler secret put SUPABASE_ANON_KEY --env preview

# For default environment
npx wrangler secret put SUPABASE_ANON_KEY
```

When prompted, paste:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
```

---

## Solution 2: Using .env file for Local Development

For **local development only**, you can create a `.dev.vars` file:

```bash
cat > /home/user/webapp/.dev.vars << 'EOF'
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
JWT_SECRET=your-generated-jwt-secret-here
EOF
```

This works for `wrangler pages dev` (local development server).

---

## Solution 3: Using Cloudflare Dashboard (Manual)

If command line doesn't work, set secrets via dashboard:

1. Go to https://dash.cloudflare.com
2. Navigate to "Pages" in the sidebar
3. Select your project: `elitegbb-app`
4. Go to "Settings" > "Environment variables"
5. Add the following secrets:
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `JWT_SECRET`: (generate with `openssl rand -base64 32`)

---

## Solution 4: Using Wrangler Config File (Not Recommended for Secrets)

⚠️ **Warning**: Only use this for local development, never commit secrets!

Create `wrangler.toml` with secrets (add to .gitignore!):
```toml
# This is NOT recommended for production secrets
[vars]
SUPABASE_ANON_KEY = "your-key-here"
```

---

## Verification

After setting the secret, verify it's working:

```bash
# Test the API endpoint
npx wrangler pages dev

# In another terminal, test the endpoint
curl -X POST http://localhost:8788/api/players \
  -H "Content-Type: application/json" \
  -d '{"test":"connection"}'
```

You should see "Missing required fields" instead of "Database connection not configured".

---

## Quick Fix: Deploy with Environment Variables

For immediate testing, deploy with the secret inline:

```bash
# Set the secret for production
npx wrangler secret put SUPABASE_ANON_KEY --env production << 'EOF'
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
EOF
```

Or using environment variable:
```bash
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM"
echo "$SUPABASE_ANON_KEY" | npx wrangler secret put SUPABASE_ANON_KEY
```

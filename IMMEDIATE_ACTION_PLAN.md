# 🚨 Immediate Action Plan - Fix Cloudflare Environment Variables

## Current Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Supabase Project** | ✅ OK | `srrasrbsqajtssqlxoju` |
| **Supabase API Key** | ✅ VALID | Tested and working |
| **Database Tables** | ✅ EXIST | staff_users, coaches |
| **Admin User** | ✅ EXISTS | admin@hoopwithher.com |
| **Coach User** | ✅ EXISTS | coach@university.edu |
| **Cloudflare Connection** | ❌ FAILED | Wrong API key configured |

## Root Cause

Cloudflare Pages environment variables have the **WRONG** `SUPABASE_ANON_KEY`.
The key currently configured returns "Unauthorized" from Supabase.

---

## ✅ Confirmed Correct Credentials

Based on testing, these are the EXACT values that work:

### SUPABASE_URL
```
https://srrasrbsqajtssqlxoju.supabase.co
```

### SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
```

### JWT_SECRET
Generate with:
```bash
openssl rand -base64 32
```
Example output:
```
VGVzdFNlY3JldEtleUZvckpXVFRlc3RpbmcxMjM0NTY=
```

---

## 🔧 Step-by-Step Fix Instructions

### Step 1: Go to Cloudflare Dashboard

1. Open https://dash.cloudflare.com
2. Sign in to your account
3. Navigate to **Pages** in the left sidebar
4. Click on **elitegbb-app** project

### Step 2: Access Environment Variables

1. Click **Settings** tab
2. Click **Environment variables** in the submenu
3. You will see two sections: **Production** and **Preview**

### Step 3: Update Production Environment

Click **Add variables** or edit existing ones:

| Variable Name | Value |
|--------------|-------|
| `SUPABASE_URL` | `https://srrasrbsqajtssqlxoju.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM` |
| `JWT_SECRET` | `YOUR_GENERATED_SECRET` |

**IMPORTANT:**
- Do NOT add quotes around the values
- Paste the full key (it's long!)
- Make sure there's no extra whitespace

### Step 4: Update Preview Environment (Same Values)

Repeat Step 3 for the **Preview** environment section.

### Step 5: Save Changes

Click **Save** to apply the environment variables.

### Step 6: Trigger Redeployment

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** (three dots)
4. Select **Retry deployment**

Or create a new deployment:
1. Click **Create new deployment**
2. Select **main** branch
3. Click **Save and Deploy**

---

## 🧪 Verification Steps

After deployment completes (wait 1-2 minutes), test these endpoints:

### Test 1: Health Check
```bash
curl https://app.elitegbb.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T00:30:00.000Z",
  "database": {
    "type": "supabase",
    "status": "connected"
  },
  "users": {
    "staff_users": 1,
    "coaches": 1,
    "total": 2
  },
  "environment": {
    "supabase_url_configured": true,
    "jwt_secret_configured": true
  }
}
```

### Test 2: Admin Login
```bash
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}'
```

**Expected Response:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "f9a150ef-0bc7-439e-aed8-909a39f69829",
    "email": "admin@hoopwithher.com",
    "name": "System Administrator",
    "role": "admin"
  }
}
```

### Test 3: Access Admin Dashboard

1. Open https://app.elitegbb.com/login
2. Enter: `admin@hoopwithher.com`
3. Password: `AdminPass123!`
4. Should successfully log in and redirect to admin dashboard

---

## 📋 Quick Reference: Copy-Paste Values

### For Cloudflare Environment Variables Form:

**Variable 1:**
- Name: `SUPABASE_URL`
- Value: `https://srrasrbsqajtssqlxoju.supabase.co`

**Variable 2:**
- Name: `SUPABASE_ANON_KEY`
- Value: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
```

**Variable 3:**
- Name: `JWT_SECRET`
- Value: (generate with `openssl rand -base64 32`)

---

## 🐛 Troubleshooting

### If health check still shows "degraded" after redeploy:

1. **Wait 2-3 minutes** - Cloudflare may need time to propagate
2. **Clear cache**: Add `?nocache=1` to the URL
3. **Check Functions logs**:
   - Cloudflare Dashboard → Pages → elitegbb-app → Functions
   - Look for recent errors
4. **Verify variables**: Double-check the exact values were pasted correctly

### If login returns "Invalid email or password":

The API key is working but the password may be wrong. Reset it:

```bash
# Query current password hash format
curl -s "https://srrasrbsqajtssqlxoju.supabase.co/rest/v1/staff_users?select=email,password_hash&email=eq.admin@hoopwithher.com" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM"
```

---

## ✅ Success Criteria

- [ ] Health check returns `"status": "healthy"`
- [ ] Login endpoint returns a valid JWT token
- [ ] Admin dashboard accessible at https://app.elitegbb.com
- [ ] All API endpoints responding correctly

---

**Need Help?** Run the diagnostic script:
```bash
cd /home/user/webapp && bash diagnose_supabase.sh
```

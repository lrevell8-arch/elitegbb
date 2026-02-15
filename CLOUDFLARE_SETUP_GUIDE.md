# EliteGBB Cloudflare Pages + Supabase Setup Guide

## Overview

**Architecture:**
- **Frontend:** React app (Cloudflare Pages)
- **Backend API:** Cloudflare Functions (serverless)
- **Database:** Supabase (PostgreSQL)

**CRITICAL:** Use **"hoopwithherbasketball-lab's Project"** in Supabase (NOT "HWH Player Advantage")

---

## Step 1: Configure Supabase Database

### 1.1 Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select project: **"hoopwithherbasketball-lab's Project"**
3. Navigate to: Project Settings > API
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ`)

### 1.2 Run the Database Setup Script

1. In Supabase dashboard, go to: SQL Editor > New query
2. Copy and paste the contents of `/backend/setup_hoopwithherbasketball_lab.sql`
3. Click **Run**

This will:
- Create the `coaches` table with all required columns
- Add indexes for performance
- Set up Row Level Security (RLS) policies
- Create the update trigger for `updated_at`
- Add a test coach account

### 1.3 Verify the Setup

Run this SQL to confirm everything is working:

```sql
-- Check coaches table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
ORDER BY ordinal_position;

-- Should show: id, email, password_hash, name, school, title, state, 
--              is_active, is_verified, saved_players, created_at, updated_at
```

---

## Step 2: Configure Cloudflare Pages Environment Variables

### 2.1 Add Environment Variables

1. Go to: https://dash.cloudflare.com
2. Navigate to: Pages > elitegbb-app > Settings > Environment Variables
3. Add these variables:

| Variable Name | Value | Source |
|--------------|-------|--------|
| `SUPABASE_URL` | `https://[PROJECT_ID].supabase.co` | Supabase Project Settings > API |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase Project Settings > API (anon key) |
| `JWT_SECRET` | Generate random 32+ character string | Use: `openssl rand -base64 32` |
| `STRIPE_API_KEY` | `sk_live_...` | Stripe Dashboard (optional) |

### 2.2 Production vs Preview

Set these variables for **both** Production and Preview environments:
- Click "Add variable" for each
- Check both "Production" and "Preview" checkboxes

---

## Step 3: Verify Frontend Environment

### 3.1 Check Build Configuration

The file `/frontend/.env.production` should have:

```env
REACT_APP_BACKEND_URL=
REACT_APP_API_URL=/api
REACT_APP_ENV=production
```

**Note:** `REACT_APP_BACKEND_URL` is empty because Cloudflare Functions use the same domain (`/api/*` routes).

### 3.2 Build Settings in Cloudflare

In Cloudflare Pages dashboard:
- **Build command:** `npm run build` (or `cd frontend && npm run build`)
- **Build output directory:** `frontend/build`
- **Root directory:** `/`

---

## Step 4: Deploy and Test

### 4.1 Deploy the Application

1. Push code to GitHub (main branch)
2. Cloudflare Pages will auto-deploy
3. Check deployment logs for errors

### 4.2 Test the Endpoints

After deployment, test these URLs:

```bash
# Health check
curl https://app.elitegbb.com/api/health

# Admin login
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}'

# List coaches (requires auth token)
curl https://app.elitegbb.com/api/admin/coaches \
  -H "Authorization: Bearer [TOKEN]"
```

### 4.3 Test Admin Coaches Interface

1. Go to: `https://app.elitegbb.com/admin/login`
2. Login with admin credentials
3. Navigate to: "Coach Management" in the sidebar
4. You should see:
   - List of coaches
   - "Add Coach" button (opens dialog)
   - Filter tabs (All, Pending, Verified)
   - Verify/Unverify buttons for each coach

---

## Step 5: Common Issues & Fixes

### Issue: PGRST204 Error (Missing Column)

**Error:** `Could not find the 'is_verified' column of 'coaches'`

**Fix:** Run the setup SQL script again:
1. Go to Supabase SQL Editor
2. Run: `/backend/setup_hoopwithherbasketball_lab.sql`
3. Refresh schema cache: `NOTIFY pgrst, 'reload schema';`

### Issue: 401 Unauthorized on Admin Endpoints

**Cause:** Missing or invalid JWT_SECRET

**Fix:** 
1. Generate new secret: `openssl rand -base64 32`
2. Add to Cloudflare environment variables
3. Redeploy the application

### Issue: Build Failures

**Common causes:**
- Missing ESLint plugin: Already fixed in `craco.config.js`
- JSX syntax errors: Already fixed in `CoachAuth.js`

**Check:** Look at Cloudflare Pages build logs for specific errors.

### Issue: "Cannot find module '@/lib/utils'"

**Fix:** The path alias `@/` is configured in `craco.config.js`. If this error occurs:
1. Check that `craco.config.js` exists in `/frontend/`
2. Verify the alias points to `'@': path.resolve(__dirname, 'src')`

---

## API Endpoints Reference

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - Admin login
- `POST /api/auth/me` - Get current user
- `POST /api/coach/login` - Coach login
- `POST /api/player/login` - Player login

### Admin Endpoints (Requires Admin JWT)
- `GET /api/admin/coaches` - List all coaches
- `POST /api/admin/coaches` - Create new coach
- `PATCH /api/admin/coaches/:coachId/verify` - Toggle coach verification

### Coach Endpoints (Requires Coach JWT)
- `GET /api/coach/dashboard` - Coach dashboard data
- `GET /api/coach/messages` - Coach messages

---

## File Structure Reference

```
/home/user/webapp/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminCoaches.js      # Coach management UI
│   │   │   ├── CoachAuth.js         # Coach login/register
│   │   │   ├── Landing.js           # Homepage with navigation
│   │   │   └── ...
│   │   ├── components/ui/           # Radix UI components (.jsx)
│   │   ├── context/                 # Auth contexts
│   │   └── App.js                   # Route definitions
│   ├── .env.production
│   └── craco.config.js
│
├── functions/                   # Cloudflare Functions (API)
│   ├── api/
│   │   ├── admin/coaches/
│   │   │   ├── index.js             # List/create coaches
│   │   │   └── [coachId]/verify.js  # Verify/unverify coach (NEW)
│   │   ├── coach/login.js           # Coach authentication
│   │   └── auth/login.js            # Admin authentication
│   └── utils/jwt.js                 # JWT utilities
│
├── backend/                   # SQL setup files
│   ├── setup_hoopwithherbasketball_lab.sql  # Main setup script
│   ├── verify_supabase_project.sql          # Verification queries
│   └── ...
│
└── wrangler.toml              # Cloudflare configuration
```

---

## Next Steps

1. **Set up Stripe** (for subscriptions): Add `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET`
2. **Custom domain**: Configure `app.elitegbb.com` in Cloudflare Pages > Custom domains
3. **Analytics**: Add Cloudflare Web Analytics
4. **Monitoring**: Set up uptime monitoring for `/api/health`

---

## Support

If you encounter issues:
1. Check Cloudflare Pages deployment logs
2. Check browser console for frontend errors
3. Use the test scripts in `/test_api_endpoints.sh`
4. Run `/diagnose_deployment.sh` for automated diagnostics

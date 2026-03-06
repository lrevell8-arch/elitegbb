# Player Login Blank Screen - Debug & Resolution Guide

## Problem Summary
When users log in as a player, they see a **blank screen** instead of the Player Portal dashboard.

## Root Cause Analysis

The blank screen occurs due to one of these issues:

### 1. **Missing API Configuration (Most Likely)**
The frontend requires `REACT_APP_BACKEND_URL` environment variable. Without it, API calls fail silently.

### 2. **Database Migration Not Applied**
The players table is missing columns added by the evaluation builder migration (e.g., `verified`, `payment_status`).

### 3. **No Test Data Loaded**
No players exist in the database, or test players haven't been created.

### 4. **JWT Verification Mismatch**
The JWT secret used to sign tokens doesn't match between login endpoint and profile endpoint.

### 5. **CORS Issues**
The API may reject requests from the frontend origin.

---

## Step-by-Step Resolution

### Step 1: Run the Debug Script

```bash
cd /home/user/webapp
export REACT_APP_BACKEND_URL="https://app.elitegbb.com"
export SUPABASE_URL="https://srrasrbsqajtssqlxoju.supabase.co"
export SUPABASE_ANON_KEY="<your-anon-key>"

node scripts/debug_player_login.js
```

This will test:
- API reachability
- Player login endpoint
- Profile fetch with token
- Database connectivity

### Step 2: Verify Environment Variables

The frontend **MUST** have these environment variables set:

```bash
# Frontend (.env file or build environment)
REACT_APP_BACKEND_URL=https://app.elitegbb.com

# Backend/Worker (secrets)
SUPABASE_URL=https://srrasrbsqajtssqlxoju.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
JWT_SECRET=<consistent-secret-across-all-endpoints>
```

**Critical**: The `JWT_SECRET` must be identical across:
- `/functions/api/player/login.js`
- `/functions/api/player/profile/index.js`
- `/functions/api/auth/me.js`

### Step 3: Apply Database Migration

Open the Supabase SQL Editor:
https://app.supabase.com/project/srrasrbsqajtssqlxoju/sql/new

Run the complete migration from:
`backend/schema_migration_for_evaluation_builder.sql`

**Key sections that affect player login:**

```sql
-- Ensure players table has required columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE players ADD COLUMN IF NOT EXISTS package_selected TEXT;

-- Fix player password hashing if needed
-- Players need password_hash column with proper format
```

### Step 4: Load Test Data

If no players exist, run the test data loader:

```bash
cd /home/user/webapp
export SUPABASE_URL="https://srrasrbsqajtssqlxoju.supabase.co"
export SUPABASE_ANON_KEY="<your-anon-key>"
export BACKEND_URL="https://app.elitegbb.com"

node scripts/load_test_projects.js
```

**Expected output:**
```
✅ Created player: Maya Johnson (MJ2028)
✅ Created player: Sophia Williams (SW2029)
✅ Created player: Zoe Martinez (ZM2027)
✅ Created player: Ava Thompson (AT2029)
✅ Created player: Isabella Chen (IC2028)

Totals:
- Players created: 5
- Intake submissions: 5
- Projects created: 5
- Deliverables created: 15
```

### Step 5: Verify Player Can Login

Test credentials from the loader:
- **Player Key**: `MJ2028` (or any of the 5 created)
- **Password**: `test123`

**Login flow:**
1. User enters credentials at `/player/login`
2. Frontend calls `POST /api/player/login`
3. Backend validates, returns JWT token
4. Frontend stores token in `localStorage` (key: `hwh_player_token`)
5. Frontend redirects to `/player`
6. PlayerPortal component loads, calls `GET /api/player/profile` with token
7. If profile loads → dashboard displays
8. If profile fails → blank screen or redirect to login

### Step 6: Check Browser Console

Open browser DevTools (F12) → Console tab. Look for:

```
❌ "Failed to load resource: net::ERR_CONNECTION_REFUSED"
   → API URL is wrong or server is down

❌ "CORS policy: No 'Access-Control-Allow-Origin' header"
   → CORS not configured on API

❌ "Cannot read property 'X' of undefined"
   → JavaScript error in component, likely missing data from API

❌ "401 Unauthorized" or "Invalid token"
   → JWT secret mismatch or expired token
```

---

## Code Flow Analysis

### Authentication Flow

```
PlayerLogin.js
    ↓ (user submits form)
usePlayerAuth.login()
    ↓ (axios POST /api/player/login)
/functions/api/player/login.js
    ↓ (validates, generates JWT)
Returns: { token, player }
    ↓
localStorage.setItem('hwh_player_token', token)
    ↓ (navigate to /player)
PlayerPortal.js
    ↓ (useEffect in PlayerAuthContext)
usePlayerAuth.initAuth()
    ↓ (axios GET /api/player/profile with Bearer token)
/functions/api/player/profile/index.js
    ↓ (verifyJWT, fetch from Supabase)
Returns: player object
    ↓
PlayerPortal renders dashboard
```

### Blank Screen Points

The blank screen can occur at:

1. **PlayerPortal line 227-233**: `authLoading` is true but never becomes false
   - `initAuth()` promise never resolves
   - API request hangs

2. **PlayerPortal line 235-248**: Player is null after loading
   - API returned error
   - Token was cleared
   - But redirect to login didn't happen

3. **JavaScript crash**: Component throws before rendering
   - Missing player data property
   - API returned unexpected format

---

## Quick Fixes

### Fix 1: Add Missing Environment Variable

For local development, create `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8787
```

For production (Cloudflare Pages), add in dashboard:
- Variable name: `REACT_APP_BACKEND_URL`
- Value: `https://app.elitegbb.com`

### Fix 2: Enable CORS on API

Ensure all API endpoints return these headers:
```javascript
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

### Fix 3: Ensure Consistent JWT Secret

Check that all files use the same fallback or env variable:
```javascript
// In login.js, profile/index.js, auth/me.js
const secret = env.JWT_SECRET || 'fallback-secret-key-change-in-production';
```

### Fix 4: Verify Player Data Format

The profile endpoint must return these fields (PlayerPortal expects them):
```javascript
{
  player_name: string,
  preferred_name: string | null,
  player_key: string,
  grad_class: string | number,
  gender: string,
  package_selected: string | null,
  payment_status: string | null,
  verified: boolean,
  profile_image_url: string | null,
  // ... other fields
}
```

---

## Testing Checklist

- [ ] Debug script runs without errors
- [ ] Environment variables are set in all locations
- [ ] Database migration applied successfully
- [ ] Test data loaded (5 players exist)
- [ ] Player can login via API directly (use debug script)
- [ ] Browser console shows no CORS errors
- [ ] Browser console shows no 401/403 errors
- [ ] JWT token is stored in localStorage after login
- [ ] Profile API returns valid player data

---

## Files Involved

| File | Purpose |
|------|---------|
| `frontend/src/pages/PlayerLogin.js` | Login form component |
| `frontend/src/pages/PlayerPortal.js` | Dashboard component (shows blank screen) |
| `frontend/src/context/PlayerAuthContext.js` | Auth state management |
| `functions/api/player/login.js` | Login API endpoint |
| `functions/api/player/profile/index.js` | Profile fetch/update endpoint |
| `scripts/debug_player_login.js` | Diagnostic script |
| `scripts/load_test_projects.js` | Test data loader |
| `backend/schema_migration_for_evaluation_builder.sql` | Database migration |

---

## Emergency Workaround

If you need to quickly verify the UI without fixing the backend:

1. Open browser DevTools → Application tab → Local Storage
2. Manually add: `hwh_player_token` = any valid JWT
3. Refresh the page

To generate a test JWT for local debugging:
```javascript
// Run in a Node.js script with jwt library
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { user_id: 'test-id', player_key: 'MJ2028', role: 'player', name: 'Test Player' },
  'fallback-secret-key-change-in-production',
  { expiresIn: '24h' }
);
console.log(token);
```

---

## Contact & Support

If issues persist after following this guide:
1. Run the debug script and save output
2. Check browser console for errors
3. Verify all environment variables
4. Check Cloudflare Functions logs (if deployed)
5. Check Supabase logs for database errors

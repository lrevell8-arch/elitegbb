# 🔧 Database Setup Guide for Cloudflare Pages

## The Problem

**Every login fails** because the backend cannot connect to the database. In Cloudflare's serverless environment:

❌ `mongodb://localhost:27017` **DOES NOT WORK**  
✅ You need a **cloud database** (MongoDB Atlas or Supabase)

---

## Quick Fix Option 1: MongoDB Atlas (Recommended - Easiest)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for free (M0 cluster - no credit card needed)
3. Create a new project called "EliteGBB"

### Step 2: Create Cluster
1. Click "Build a Cluster"
2. Choose **M0 (FREE)** tier
3. Select region closest to your users (e.g., AWS US-East-1)
4. Click "Create Cluster" (takes 3-5 minutes)

### Step 3: Configure Access
1. **Database Access** (left sidebar):
   - Click "Add New Database User"
   - Username: `elitegbb_user`
   - Password: Generate a strong password (save it!)
   - Privileges: "Read and write to any database"
   - Click "Add User"

2. **Network Access** (left sidebar):
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add Cloudflare IPs)
   - Confirm

### Step 4: Get Connection String
1. Click "Databases" → "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Python" driver, version "3.12 or later"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://elitegbb_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 5: Add to Cloudflare
1. Go to Cloudflare Dashboard → Pages → elitegbb-app → Settings → Environment Variables
2. Add these variables:
   
   | Variable | Value |
   |----------|-------|
   | `MONGO_URL` | `mongodb+srv://elitegbb_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/hwh_player_advantage?retryWrites=true&w=majority` |
   | `DB_NAME` | `hwh_player_advantage` |
   | `USE_SUPABASE` | `false` |

3. **Important**: Replace `<password>` with your actual password!

### Step 6: Redeploy
1. In Cloudflare Dashboard → Pages → Deployments
2. Click "Retry deployment" on the latest build

---

## Quick Fix Option 2: Supabase PostgreSQL

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free
3. Create new project

### Step 2: Get Connection String
1. In your project, go to Settings → Database
2. Under "Connection String", select "URI"
3. Copy the string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 3: Add to Cloudflare
1. Cloudflare Dashboard → Pages → elitegbb-app → Settings → Environment Variables
2. Add:
   
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres` |
   | `USE_SUPABASE` | `true` |

3. Replace `YOUR_PASSWORD` with your actual password

---

## Verify the Fix

### Method 1: Use the diagnostic script
```bash
chmod +x diagnose_deployment.sh
./diagnose_deployment.sh https://app.elitegbb.com/api
```

### Method 2: Quick curl test
```bash
# Check database connectivity
curl https://app.elitegbb.com/api/health/db

# Should return:
# {
#   "status": "healthy",
#   "database": { "status": "connected", ... },
#   "users": { "staff_users": 0, ... }
# }
```

### Method 3: Create admin user
```bash
# After database is connected, create admin:
curl -X POST https://app.elitegbb.com/api/auth/setup

# Should return:
# {
#   "message": "Initial admin user created successfully",
#   "admin_email": "admin@hoopwithher.com",
#   "admin_password": "AdminPass123!"
# }
```

### Method 4: Test login
```bash
# Test admin login
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hoopwithher.com", "password": "AdminPass123!"}'

# Should return a token
```

---

## Troubleshooting

### Issue: "Authentication failed" when connecting to MongoDB
**Solution**: Double-check your password in the connection string. Special characters need URL encoding.

### Issue: "IP not in whitelist"
**Solution**: In MongoDB Atlas → Network Access → Add `0.0.0.0/0` (allow all IPs) or Cloudflare's IP ranges.

### Issue: "SSL/TLS handshake failed"
**Solution**: Add `&ssl=true&tlsAllowInvalidCertificates=true` to your MONGO_URL (development only).

### Issue: Still can't connect after setup
**Solution**: Check Cloudflare Functions logs:
1. Cloudflare Dashboard → Pages → elitegbb-app → Functions
2. Check the logs for your recent requests
3. Look for connection error messages

---

## Architecture Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Cloudflare CDN │  (Static assets - frontend)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloudflare      │  (Serverless Functions - backend API)
│ Pages Functions │
└────────┬────────┘
         │ Database Connection
         ▼
┌─────────────────┐
│ MongoDB Atlas   │  (Cloud Database)
│   OR            │
│ Supabase        │
└─────────────────┘
```

---

## Cost Comparison

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **MongoDB Atlas** | 512 MB storage, 1M reads/month | $9/month for 2GB |
| **Supabase** | 500 MB storage, 2M requests/month | $25/month for 8GB |

Both are excellent choices. MongoDB Atlas is easier if you're already familiar with MongoDB.

---

## Next Steps After Database Setup

1. ✅ Run `/api/auth/setup` to create admin user
2. ✅ Test admin login with `admin@hoopwithher.com` / `AdminPass123!`
3. ✅ Change admin password after first login
4. ✅ Configure Stripe webhook endpoint in Stripe Dashboard
5. ✅ Test player intake and coach registration flows

---

## Support

If you're still having issues:
1. Run: `./diagnose_deployment.sh`
2. Share the output for troubleshooting
3. Check Cloudflare Functions logs for detailed errors

**Common mistake**: Forgetting to redeploy after adding environment variables. Cloudflare needs a new deployment to pick up env var changes!

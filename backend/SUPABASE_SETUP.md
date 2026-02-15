# Supabase Setup Guide for EliteGBB

This guide walks you through setting up Supabase as the database for EliteGBB on Cloudflare Pages.

## 🎯 Why Supabase?

- **Free tier** includes 500MB database + 2GB storage
- **PostgreSQL** reliability with JSON support
- **Built-in Auth** (optional, but we use custom JWT)
- **Row Level Security** for fine-grained access control
- **Realtime subscriptions** for live updates
- **Easy connection** from Cloudflare Functions

## 📋 Prerequisites

- [Supabase account](https://supabase.com) (free)
- [Cloudflare account](https://cloudflare.com) with Pages project

## 🚀 Setup Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose your organization
4. Set project name: `elitegbb-prod` (or any name)
5. Choose region closest to your users (e.g., `US East`)
6. Click **"Create new project"**
7. Wait 1-2 minutes for database to provision

### Step 2: Get Your Credentials

Once project is ready:

1. **Get API URL and Anon Key:**
   - Go to **Project Settings** → **API**
   - Copy `URL` (e.g., `https://xxxxxxxxxxxx.supabase.co`)
   - Copy `anon public` key

2. **Get Database Connection String:**
   - Go to **Project Settings** → **Database**
   - Under **Connection string** → **URI**
   - Copy the connection string: `postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres`
   - Replace `[PASSWORD]` with your actual database password

### Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the entire contents of [`supabase_schema.sql`](./supabase_schema.sql)
4. Click **"Run"** to execute

This creates:
- `staff_users` - Admin/editor/viewer accounts
- `coaches` - Coach accounts
- `players` - Player profiles from intake forms
- `projects` - Evaluation projects
- `deliverables` - Project deliverables
- `password_reset_tokens` - Password reset flow
- `payment_transactions` - Stripe payment records
- `coach_messages` - Coach messaging

### Step 4: Configure Cloudflare Pages

Add these environment variables to your Cloudflare Pages project:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Pages** → **elitegbb-app** → **Settings** → **Environment Variables**
3. Add **Production** environment variables:

```bash
# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# Demo Mode (set to false for production)
DEMO_MODE=false

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Stripe (for payments)
STRIPE_API_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (AWS SES)
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
SES_FROM_EMAIL=noreply@elitegbb.com

# Feature Flags
USE_SUPABASE=true
ENABLE_PAYMENTS=true
ENABLE_EMAILS=true

# Coach Settings
REQUIRE_COACH_VERIFICATION=true
```

4. Click **"Save"**

### Step 5: Deploy

1. Trigger a new deployment in Cloudflare Pages
2. Or push a new commit to trigger auto-deploy

### Step 6: Test

Once deployed, test these endpoints:

```bash
# Health check
curl https://app.elitegbb.com/api/health

# Admin login
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}'

# Coach login
curl -X POST https://app.elitegbb.com/api/coach/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@university.edu","password":"CoachPass123!"}'
```

## 🔧 Troubleshooting

### "Connection refused" or timeout errors
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that `DATABASE_URL` doesn't contain `placeholder`
- Ensure database password is correct

### "Permission denied" errors
- Verify Row Level Security (RLS) policies in Supabase
- Check that tables were created successfully in SQL Editor

### Tables don't exist
- Re-run the `supabase_schema.sql` in Supabase SQL Editor
- Check for any SQL errors in the output

### Test users not working
- Check `staff_users` and `coaches` tables have the seeded data
- Password hashes may need regeneration if bcrypt settings differ

### ERROR: column "state" does not exist
If intake form fails with this error, the `state` column is missing from the `players` table.

**Quick Fix:** Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE players ADD COLUMN IF NOT EXISTS state TEXT;
```

Or run the full migration: [`supabase_migration_add_state.sql`](./supabase_migration_add_state.sql)

## 📚 Supabase Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Python Client](https://supabase.com/docs/reference/python/introduction)

## 🔄 Database Migration from MongoDB

If you have existing MongoDB data:

1. Export from MongoDB:
   ```bash
   mongoexport --collection=coaches --out=coaches.json
   mongoexport --collection=players --out=players.json
   ```

2. Transform to CSV/SQL and import via Supabase Dashboard:
   - Go to **Table Editor** → **Import data**
   - Or use SQL `INSERT` statements

## 🎮 Alternative: DEMO_MODE

For quick testing without Supabase setup:

```bash
DEMO_MODE=true
```

This uses in-memory storage (resets on deploy). Not for production.

## 📞 Support

- Supabase: [supabase.com/support](https://supabase.com/support)
- Cloudflare: [community.cloudflare.com](https://community.cloudflare.com)
- EliteGBB Issues: [GitHub Issues](https://github.com/lrevell8-arch/elitegbb/issues)

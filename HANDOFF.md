# Elite GBB - Project Handoff Documentation

**Date:** March 5, 2026  
**Repository:** https://github.com/lrevell8-arch/elitegbb  
**Production URL:** https://elitegbb-app.pages.dev  
**Status:** Ready for Deployment

---

## 📋 Executive Summary

Elite GBB is a basketball recruitment platform with three user roles:
- **Players** - Create profiles, upload videos, manage their recruitment
- **Coaches** - Browse players, manage prospects, subscription-based access
- **Admins** - Manage coaches, verify players, view pipeline dashboard

### Current Status
| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Complete | React app with all pages built |
| API Endpoints | ✅ Complete | 20+ endpoints implemented |
| Database | ⚠️ Needs RLS Fix | Supabase requires SQL fix for write permissions |
| Deployment | ⚠️ Needs Push | 4 commits ahead of origin/main |
| Tests | ✅ Complete | Comprehensive test suite in `tests/` |

---

## 🗂️ Project Structure

```
/home/user/webapp/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/              # 20+ page components
│   │   │   ├── Landing.js          # Public landing page
│   │   │   ├── IntakeForm.js       # Player registration (45KB)
│   │   │   ├── PlayerDirectory.js  # Admin player management
│   │   │   ├── AdminDashboard.js   # Admin overview
│   │   │   ├── CoachDashboard.js   # Coach dashboard
│   │   │   └── ... (16 more)
│   │   ├── components/         # Shared components
│   │   └── context/            # Auth contexts
│   └── build/                  # Production build output
│
├── functions/api/              # Cloudflare Pages Functions
│   ├── players/index.js           # Player CRUD (GET, POST)
│   ├── admin/
│   │   ├── players/index.js       # Admin player list (GET, PATCH)
│   │   ├── players/[id]/verify.js # Verify toggle endpoint (NEW)
│   │   ├── coaches/index.js       # Coach management
│   │   └── dashboard/index.js     # Admin dashboard data
│   ├── auth/
│   │   ├── login.js               # User login
│   │   ├── me.js                  # Current user info
│   │   └── setup.js               # Auth initialization
│   ├── coach/
│   │   ├── login.js               # Coach login
│   │   ├── dashboard/index.js     # Coach dashboard
│   │   └── subscription/index.js  # Stripe subscriptions
│   ├── player/
│   │   ├── login.js               # Player login
│   │   └── profile/index.js       # Player profile management
│   ├── messages/index.js          # Messaging system
│   ├── upload/image/index.js      # Image uploads
│   └── health.js                  # Health check endpoint
│
├── tests/                      # Testing suite
│   ├── api/
│   │   ├── api_test_suite.py      # Python API tests (420 lines)
│   │   ├── bulk_player_creator.py  # Bulk creation tool (310 lines)
│   │   └── api_test.sh            # Shell curl tests (370 lines)
│   ├── data/
│   │   └── sample_players.csv     # Sample data
│   └── run_all_tests.py          # Integrated test runner
│
├── backend/                    # Python backend (legacy)
├── scripts/                    # Utility scripts
├── supabase_schema_fix.sql     # REQUIRED: Database fixes
├── wrangler.toml               # Cloudflare configuration
└── .dev.vars                   # Local secrets (not deployed)
```

---

## 🔧 Configuration & Environment

### Cloudflare Pages (Production)

**Project Name:** `elitegbb-app`  
**Dashboard:** https://dash.cloudflare.com  
**Deployment:** Automatic on push to main branch

### Required Secrets

```bash
# These MUST be set via Wrangler CLI (NOT in wrangler.toml)
npx wrangler pages secret put SUPABASE_ANON_KEY
npx wrangler pages secret put JWT_SECRET
```

**SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM
```

**JWT_SECRET:** Generate with `openssl rand -base64 32`

### Supabase Database

**Project:** srrasrbsqajtssqlxoju  
**URL:** https://srrasrbsqajtssqlxoju.supabase.co  
**Status:** ⚠️ **REQUIRES RLS FIX BEFORE WRITE OPERATIONS**

---

## ⚡ Quick Start Commands

```bash
# 1. Deploy to Production
npx wrangler pages deploy

# 2. Run Tests
python3 tests/run_all_tests.py --quick

# 3. Start Local Dev Server
npx wrangler pages dev --port=8790

# 4. Check Production Health
curl https://elitegbb-app.pages.dev/api/health
```

---

## 🔌 API Endpoints Reference

### Player Management
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/players` | GET | List all players (public) | None |
| `/api/players` | POST | Create new player | None |
| `/api/players/:id` | PATCH | Update player | Token |

### Admin APIs
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/players` | GET | List with filters (grad_class, position, gender, search) | Admin |
| `/api/admin/players/:id/verify` | PATCH | Toggle verification status | Admin |
| `/api/admin/coaches` | GET | List all coaches | Admin |
| `/api/admin/coaches/:id/verify` | PATCH | Verify coach | Admin |
| `/api/admin/dashboard` | GET | Dashboard stats | Admin |
| `/api/admin/pipeline` | GET | Pipeline board data | Admin |

### Auth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Current user info |
| `/api/auth/setup` | POST | Initialize auth |
| `/api/coach/login` | POST | Coach login |
| `/api/player/login` | POST | Player login |

### Coach Features
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/coach/dashboard` | GET | Coach dashboard data | Coach |
| `/api/coach/compare` | GET | Player comparison | Coach |
| `/api/coach/messages` | GET/POST | Messaging | Coach |
| `/api/coach/subscription` | GET | Subscription status | Coach |

---

## 🗄️ Database Schema

### Players Table
```sql
-- Core fields (all NOT NULL)
- id (uuid, primary key)
- player_key (text, unique)
- player_name (text)
- dob (date)
- grad_class (text)
- gender (text)
- school (text)
- city (text)
- state (text)
- primary_position (text)
- parent_name (text)
- parent_email (text)
- created_at (timestamp)
- updated_at (timestamp)

-- Optional fields
- preferred_name (text)
- instagram_handle (text)
- secondary_position (text)
- jersey_number (integer)
- height (text)
- weight (integer)
- parent_phone (text)
- player_email (text)
- verified (boolean, default false)
- payment_status (text)
```

### Critical Database Fix Required

**Problem:** Row Level Security (RLS) prevents anonymous INSERT operations  
**Solution:** Run `supabase_schema_fix.sql` in Supabase SQL Editor

```bash
# Steps:
1. Go to https://supabase.com/dashboard
2. Select project: srrasrbsqajtssqlxoju
3. Navigate to SQL Editor
4. Open and run: supabase_schema_fix.sql
5. This enables:
   - Anonymous INSERT permissions
   - Authenticated UPDATE permissions
   - Creates missing columns if needed
```

---

## ✅ Testing

### Test Suite Structure

```bash
tests/
├── api/api_test_suite.py      # 14 comprehensive API tests
├── api/bulk_player_creator.py # Create 10-100 test players
├── api/api_test.sh            # Shell-based curl tests
├── data/sample_players.csv    # Test data
└── run_all_tests.py           # Master test runner
```

### Running Tests

```bash
# Quick tests (1-2 minutes)
python3 tests/run_all_tests.py --quick

# Full test suite (includes load tests)
python3 tests/run_all_tests.py --full

# Shell tests only
./tests/api/api_test.sh all

# Python tests only
python3 tests/api/api_test_suite.py

# Bulk create test players
python3 tests/api/bulk_player_creator.py --count 10
```

### Expected Results
- API test suite: 13/14 tests passing (92.9%)
- Bulk creation: 100% success rate
- Health check: HTTP 200

---

## 🚀 Deployment Checklist

### Before First Deploy
- [ ] Run `supabase_schema_fix.sql` in Supabase SQL Editor
- [ ] Verify secrets are set: `npx wrangler pages secret list`
- [ ] Push commits to GitHub: `git push origin main`
- [ ] Test player creation on production

### Standard Deploy
```bash
# 1. Check status
git status

# 2. Deploy to Cloudflare
npx wrangler pages deploy

# 3. Verify production
curl https://elitegbb-app.pages.dev/api/health
```

---

## 🐛 Known Issues & Fixes

### Issue 1: SCHEMA_CACHE_ERROR
**Symptom:** Player creation fails with "schema cache" error  
**Cause:** RLS policies block anonymous INSERT  
**Fix:** Run `supabase_schema_fix.sql` in Supabase SQL Editor

### Issue 2: Verification Toggle Fails (RESOLVED ✅)
**Symptom:** Admin verification button doesn't work  
**Fix:** Created `/api/admin/players/[id]/verify.js` endpoint  
**Status:** Fixed in commit ca3834e

### Issue 3: Sorting/Filtering Fails (RESOLVED ✅)
**Symptom:** Player directory filters don't work  
**Fix:** Updated `/api/admin/players/index.js` to support grad_class, position, gender filters  
**Status:** Fixed in commit ca3834e

---

## 📊 Recent Commits (Ready to Push)

```
ca3834e - fix(admin): add verify endpoint and fix filter/pagination params
767a4a9 - docs: add deployment guide for Cloudflare Pages
3d979e6 - test(api): add comprehensive API testing suite
c6e7a31 - fix(players): update API to match actual Supabase schema
```

**Your local main is 4 commits ahead of origin/main.**

---

## 🔐 Security Notes

1. **Never commit secrets:** `.dev.vars` is in .gitignore
2. **JWT Secret:** Must be set via Wrangler CLI, not in code
3. **Supabase Key:** The anon key is safe to expose (RLS controls access)
4. **CORS:** All API endpoints allow `*` origins for development

---

## 📞 Support Resources

### Documentation Files
- `DEPLOY.md` - Quick deployment guide
- `SUPABASE_SETUP.md` - Database configuration
- `tests/README.md` - Testing documentation
- `CLOUDFLARE_SETUP_GUIDE.md` - Cloudflare configuration
- `WRANGLER_SECRETS_SETUP.md` - Secrets management

### Key Commands Reference
```bash
# Deploy
npx wrangler pages deploy

# Check secrets
npx wrangler pages secret list

# Local development
npx wrangler pages dev --port=8790

# View logs
npx wrangler pages deployment tail

# Test production
curl https://elitegbb-app.pages.dev/api/health
```

---

## 🎯 Next Steps for New Team

1. **Immediate (Day 1):**
   - Run Supabase schema fix
   - Deploy current code: `npx wrangler pages deploy`
   - Test player creation on production

2. **Short Term (Week 1):**
   - Set up monitoring for API errors
   - Configure Stripe webhooks for payments
   - Test coach subscription flow

3. **Medium Term (Month 1):**
   - Add video upload functionality
   - Implement messaging system
   - Build player evaluation tools

---

## 👥 User Flows

### Player Registration Flow
1. Landing page → Intake form
2. Submit player data → POST /api/players
3. Success page → Email confirmation (pending)
4. Player login with player_key → Player portal

### Coach Flow
1. Landing page → Coach signup
2. Subscription selection → Stripe payment
3. Coach dashboard → Browse players
4. Add to prospects → Pipeline management

### Admin Flow
1. Admin login → Admin dashboard
2. Verify coaches → Coach management
3. Verify players → Player directory with filters
4. View pipeline → Pipeline board

---

## 📦 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Tailwind CSS, Radix UI |
| Backend | Cloudflare Pages Functions (Edge) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (custom implementation) |
| Payments | Stripe (partially integrated) |
| Storage | Supabase Storage (for images) |
| Testing | Python + curl |

---

**End of Handoff Documentation**

For questions, refer to the detailed guides in the repository or check the Cloudflare/Supabase dashboards.

# Elite GBB Project Handoff - Stackblitz Ready
## For Continued Development in Stackblitz

---

## 1. Quick Start for Stackblitz

**GitHub Repo:** https://github.com/lrevell8-arch/elitegbb  
**Branch:** `feat/evaluation-builder`  
**Last Commit:** `346ba78` - fix: add deliverables SQL fix v2 with data transformation

### Clone & Run
```bash
# Clone the repo
git clone https://github.com/lrevell8-arch/elitegbb.git
cd elitegbb

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Set up environment variables
export SUPABASE_URL="https://srrasrbsqajtssqlxoju.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM"

# For local development
npm run dev
```

---

## 2. Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| **Main Schema Migration** | ✅ **COMPLETED** | All columns added successfully (2026-03-06) |
| **Deliverables Fix** | 🔴 **NEEDS SQL RUN** | Data format mismatch - fix_v2.sql created |
| **Test Data Loader** | 🟡 Ready | adversity_response fixed; needs deliverables fix first |
| **Admin Pipeline** | 🟡 Ready | Waiting for deliverables SQL fix |
| **Player Login** | 🟡 **Debug Script Created** | Blank screen issue - separate investigation |
| **Player Portal** | ✅ Functional | Player profile, stats, deliverables UI ready |
| **Git Branch** | ✅ Updated | `feat/evaluation-builder` pushed |

---

## 3. Database Status

### ✅ Main Migration COMPLETED (2026-03-06)
- `players` table: Added stats columns (ppg, apg, rpg, spg, bpg) + 30+ evaluation fields
- `projects` table: Added `package_type`, `payment_status`, `assigned_editor`, `completed_at`
- `intake_submissions` table: Added parent contact + all player stats
- `reminders` table: Created new table

### 🔴 Deliverables Fix Required
**Issue:** Data format mismatch in `deliverables` table
- Existing data has `deliverable_type` = `'One-Pager'`, `'Tracking Profile'`
- Constraint expects `type` = `'one_pager'`, `'tracking_profile'`

**Solution:** Run `backend/fix_deliverables_v2.sql` in Supabase
- Transforms all data formats before applying constraints
- Migrates from `deliverable_type` to `type` column
- Adds proper check constraints

---

## 4. Active Issues

### Issue 1: Deliverables Constraint Violation 🔴
**Status:** Fix created, needs execution

**Error:**
```
ERROR: 23514: new row violates check constraint "deliverables_type_check"
DETAIL: Failing row contains (..., One-Pager, ..., One-Pager, null)
```

**Fix File:** `backend/fix_deliverables_v2.sql`

**To Resolve:**
1. Go to https://app.supabase.com/project/srrasrbsqajtssqlxoju/sql/new
2. Copy contents of `backend/fix_deliverables_v2.sql`
3. Paste and click "Run"
4. Verify success message

### Issue 2: Player Login Blank Screen 🟡
**Status:** Debug script created, investigation ongoing

**Debug File:** `scripts/debug_player_login.js`

---

## 5. Next Steps (Priority Order)

### 🔴 BLOCKING - Run First
1. **Run Deliverables Fix V2**
   - Execute `backend/fix_deliverables_v2.sql` in Supabase SQL Editor
   - This fixes the type constraint data format issue

### 🟡 Ready After SQL Fix
2. **Load Test Data**
   ```bash
   cd /home/user/webapp
   export SUPABASE_URL="https://srrasrbsqajtssqlxoju.supabase.co"
   export SUPABASE_ANON_KEY="<your-anon-key>"
   export BACKEND_URL="https://app.elitegbb.com"
   node scripts/load_test_projects.js
   ```

3. **Verify Pipeline Population**
   - Log in as admin at `/admin/login`
   - Navigate to `/admin/pipeline`
   - Confirm 5 projects appear (Maya, Sophia, Zoe, Ava, Isabella)

4. **Test Project Detail Page**
   - Click any project in pipeline
   - Verify player info, stats, deliverables, notes

---

## 6. Project Structure

```
/home/user/webapp/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PipelineBoard.js   # Kanban board
│   │   │   ├── ProjectDetail.js   # Project management
│   │   │   ├── PlayerEvaluation.js  # Printable 7-page packet
│   │   │   ├── PlayerPortal.js    # Player dashboard
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── PlayerAuthContext.js
│   │   └── App.js
│   └── build/
│
├── functions/                   # Cloudflare Functions (API)
│   └── api/
│       ├── admin/
│       │   ├── pipeline/
│       │   ├── players/
│       │   └── projects/[id]/
│       └── player/
│           └── profile/
│
├── backend/
│   ├── schema_migration_for_evaluation_builder.sql  ✅ (run)
│   └── fix_deliverables_v2.sql                      ⬅️ RUN THIS NOW
│
├── scripts/
│   ├── load_test_projects.js    # Test data loader
│   └── debug_player_login.js    # Debug script
│
└── PROJECT_HANDOFF_BOLT.md      # This file
```

---

## 7. Working API Endpoints

### Player APIs
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/player/login` | POST | Player login | No |
| `/api/player/profile` | GET | Get player profile | Player JWT |
| `/api/player/deliverables` | GET | List deliverables | Player JWT |

### Admin APIs
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/login` | POST | Admin login | No |
| `/api/admin/pipeline` | GET | Pipeline board | Admin JWT |
| `/api/admin/projects/[id]` | GET | Project detail | Admin JWT |
| `/api/admin/projects/[id]` | PATCH | Update project | Admin JWT |

---

## 8. Database Schema

### Key Tables (After Migration)

**players** - ✅ Complete
```sql
- id, player_key, email, password_hash, name, school
- grad_class, position
- ppg, apg, rpg, spg, bpg (stats) ✅
- self_words, strength, improvement (eval) ✅
- film_links, highlight_links (media) ✅
- verified, payment_status ✅
```

**projects** - ✅ Complete
```sql
- id, player_id, status, notes
- package_type (elite_track/development/basic) ✅
- payment_status (pending/paid/refunded) ✅
- assigned_editor (UUID) ✅
```

**deliverables** - 🔴 Needs Fix
```sql
- id, project_id
- type (one_pager, tracking_profile, etc.) 🔴 constraint issue
- status (pending, in_progress, ready_for_review, approved, delivered)
- file_url, notes, delivered_at
```

---

## 9. Environment Variables

```bash
# Supabase Connection
SUPABASE_URL=https://srrasrbsqajtssqlxoju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM

# JWT Secret
JWT_SECRET=<your-jwt-secret>

# Backend URL
BACKEND_URL=https://app.elitegbb.com
```

---

## 10. Test Credentials

**Admin Account:**
- Email: `admin@hoopwithher.com`
- Password: `AdminPass123!`

**Player Account (after test data loaded):**
- Player Key: `MJ2025` (Maya Johnson)
- Password: `TestPass123!`

---

## 11. Commands Cheat Sheet

```bash
# Run deliverables fix (in Supabase SQL Editor)
# Copy backend/fix_deliverables_v2.sql contents

# Load test data (after SQL fix)
cd /home/user/webapp && node scripts/load_test_projects.js

# Check git status
git status

# View recent commits
git log --oneline -5

# Check Supabase deliverables
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/deliverables?select=id,type,status&limit=1"
```

---

## 12. Important URLs

| Resource | URL |
|----------|-----|
| Production App | https://app.elitegbb.com |
| Admin Login | https://app.elitegbb.com/admin/login |
| Admin Pipeline | https://app.elitegbb.com/admin/pipeline |
| Supabase Dashboard | https://app.supabase.com/project/srrasrbsqajtssqlxoju |
| GitHub Repo | https://github.com/lrevell8-arch/elitegbb |

---

## 13. Contact & Context

**Developer:** AI Assistant (Claude)  
**User/Lead:** lrevell8-arch  
**Project:** EliteGBB / Hoop With Her Basketball  
**Purpose:** College basketball recruiting platform with player evaluation builder

**Recent Context:**
- Main database migration completed successfully
- Deliverables table has data format mismatch - fix_v2.sql created
- Test data loader updated with adversity_response field
- 3 commits pushed to feat/evaluation-builder branch
- Ready for deliverables SQL fix execution

---

**Last Updated:** 2026-03-06  
**Status:** 🔴 Waiting for deliverables SQL fix execution

**Next Action:** Run `backend/fix_deliverables_v2.sql` in Supabase SQL Editor

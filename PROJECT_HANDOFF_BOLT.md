# Elite GBB Project Handoff - Stackblitz Ready
## For Continued Development in Stackblitz

---

## 1. Quick Start for Stackblitz

**GitHub Repo:** https://github.com/lrevell8-arch/elitegbb  
**Branch:** `feat/evaluation-builder`  
**Last Commit:** `b32a605` - docs: add player login blank screen debug guide

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
| **Schema Migration** | ✅ **COMPLETED** | All columns added successfully (2026-03-06) |
| **Admin Pipeline** | 🟡 Ready | Migration complete - ready for test data |
| **Player Login** | 🟡 **Debug Script Created** | Blank screen issue - investigation in progress |
| **Player Portal** | ✅ Functional | Player profile, stats, deliverables UI ready |
| **Test Data Loader** | 🟡 Ready | Works for players; needs schema fix for projects |
| **Git Branch** | ✅ Updated | `feat/evaluation-builder` pushed |

---

## 3. ✅ Database Migration COMPLETED

**Status:** ✅ **SUCCESS** - Migration executed on 2026-03-06

### What Was Added:
- `players` table: Added `ppg`, `apg`, `rpg`, `spg`, `bpg` stats columns + 30+ evaluation fields
- `projects` table: Added `package_type`, `payment_status`, `assigned_editor`, `completed_at`
- `intake_submissions` table: Added `parent_email`, `parent_name`, `parent_phone` + all player stats
- `deliverables` table: Added `type`, `status`, `file_url`, `notes`, `delivered_at`
- `reminders` table: Created new table for follow-up reminders

### Fix Applied:
- Updated invalid `deliverables.status` values before adding constraint
- All constraints now properly enforced

### Next Step: Load Test Data
➡️ See Section 9 (Next Steps) to populate database with 5 test players and projects

---

## 4. Active Issue: Player Login Blank Screen

### Problem
When using "Login As Player" from admin panel, the player portal shows a **blank screen** after redirect.

### Debug Script Created
**File:** `scripts/debug_player_login.js`
- Tests JWT token structure for impersonation
- Validates `/api/player/profile` response
- Checks PlayerAuthContext state initialization
- Logs all debug info to console

### Run Debug Script
```bash
cd /home/user/webapp
export SUPABASE_URL="https://srrasrbsqajtssqlxoju.supabase.co"
export SUPABASE_ANON_KEY="<your-anon-key>"
export BACKEND_URL="https://app.elitegbb.com"
export ADMIN_TOKEN="<admin-jwt-token>"
export PLAYER_TOKEN="<player-jwt-token>"

node scripts/debug_player_login.js
```

### Player Auth Architecture

**Context:** `frontend/src/context/PlayerAuthContext.js`
- Manages `player`, `token`, `loading`, `isImpersonating` state
- Initializes auth from localStorage tokens
- Fetches profile via `GET /api/player/profile`
- Exports: `login()`, `logout()`, `updateProfile()`, `changePassword()`, `uploadImage()`

**Player Portal Page:** `frontend/src/pages/PlayerPortal.js`
- Uses `usePlayerAuth()` hook to access player data
- Tabbed interface: Profile, Stats, Deliverables, Connections, Upgrade, Security
- Editable profile form with image upload
- Password change functionality

**Profile API:** `functions/api/player/profile/index.js`
- `GET` - Returns authenticated player's profile
- `PATCH` - Updates whitelist of fields (name, school, position, stats)
- `POST` - Changes password (requires current password)

### Possible Causes Being Investigated
1. JWT payload structure mismatch between admin impersonation and player login
2. Player profile API returning incomplete data
3. PlayerAuthContext initialization error
4. Player object null causing React render crash

---

## 5. Project Structure

```
/home/user/webapp/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminLogin.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── PipelineBoard.js   # Kanban board
│   │   │   ├── ProjectDetail.js   # Project management
│   │   │   ├── PlayerDirectory.js
│   │   │   ├── PlayerEvaluation.js  # Printable 7-page packet
│   │   │   ├── PlayerLogin.js
│   │   │   ├── PlayerPortal.js    # Player dashboard (tabbed UI)
│   │   │   ├── CoachLogin.js
│   │   │   ├── CoachDashboard.js
│   │   │   ├── IntakeForm.js
│   │   │   └── Landing.js
│   │   ├── components/ui/       # shadcn components
│   │   ├── context/
│   │   │   ├── AuthContext.js   # Admin auth
│   │   │   ├── CoachAuthContext.js
│   │   │   └── PlayerAuthContext.js  # ⭐ Player auth state
│   │   ├── hooks/
│   │   └── App.js
│   └── build/
│
├── functions/                   # Cloudflare Functions (API)
│   ├── api/
│   │   ├── health.js
│   │   ├── auth/login.js        # Admin login
│   │   ├── admin/
│   │   │   ├── pipeline/        # Pipeline board API
│   │   │   ├── players/         # Player management
│   │   │   │   ├── index.js     # List/search players
│   │   │   │   └── [id]/impersonate.js  # ⭐ Login As Player
│   │   │   └── projects/
│   │   │       └── [id]/index.js  # Project detail API
│   │   ├── player/
│   │   │   ├── login.js         # Player login
│   │   │   └── profile/index.js # ⭐ Player profile (GET/PATCH/POST)
│   │   ├── coach/
│   │   └── upload/image.js
│   └── utils/jwt.js
│
├── backend/
│   └── schema_migration_for_evaluation_builder.sql  # ⭐ RUN THIS FIRST
│
├── scripts/
│   ├── load_test_projects.js    # Test data loader
│   ├── load_simple_players.js
│   └── debug_player_login.js    # ⭐ Debug script for blank screen
│
├── PROJECT_HANDOFF_BOLT.md      # This file
└── PLAYER_LOGIN_DEBUG.md        # Debug guide for blank screen
```

---

## 6. Working API Endpoints

### Player APIs
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/player/login` | POST | Player login (player_key, password) | No |
| `/api/player/profile` | GET | Get full player profile | Player JWT |
| `/api/player/profile` | PATCH | Update profile fields | Player JWT |
| `/api/player/profile` | POST | Change password | Player JWT |
| `/api/player/deliverables` | GET | List player deliverables | Player JWT |
| `/api/player/connections` | GET | List connections (coaches) | Player JWT |

### Admin APIs
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/login` | POST | Admin login | No |
| `/api/admin/pipeline` | GET | Pipeline board data | Admin JWT |
| `/api/admin/pipeline` | PATCH | Update project status | Admin JWT |
| `/api/admin/players` | GET | List all players | Admin JWT |
| `/api/admin/players/[id]/impersonate` | POST | Generate player JWT for Login As | Admin JWT |
| `/api/admin/projects/[id]` | GET | Project detail with deliverables | Admin JWT |
| `/api/admin/projects/[id]` | PATCH | Update project status/notes | Admin JWT |

### Public APIs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + user counts |
| `/api/coaches` | GET | Public coach directory |
| `/api/players` | GET | Public player directory |

---

## 7. Database Schema (Supabase)

### Key Tables

**players**
```sql
- id: uuid (PK)
- player_key: string (unique, e.g., "MJ2025")
- email: string (unique)
- password_hash: string
- name: string
- school: string
- grad_class: string (e.g., "2025")
- position: string (e.g., "PG/SG")
- ppg, apg, rpg, spg, bpg: float  # ⭐ Need migration
- self_words, strength, improvement: text  # ⭐ Need migration
- film_links, highlight_links: jsonb  # ⭐ Need migration
- verified: boolean
- created_at, updated_at: timestamp
```

**projects**
```sql
- id: uuid (PK)
- player_id: uuid (FK → players)
- status: enum ('requested', 'in_review', 'drafting', 'design', 'delivered')
- package_type: enum ('elite_track', 'development', 'basic')  # ⭐ Need migration
- payment_status: enum ('pending', 'paid', 'refunded')  # ⭐ Need migration
- assigned_editor: uuid (FK → staff_users)  # ⭐ Need migration
- notes: text
- created_at, updated_at: timestamp
```

**intake_submissions**
```sql
- id: uuid (PK)
- player_id: uuid (FK → players)
- parent_email: string  # ⭐ Need migration
- parent_name: string  # ⭐ Need migration
- ... other intake fields
- created_at: timestamp
```

**deliverables**
```sql
- id: uuid (PK)
- project_id: uuid (FK → projects)
- type: enum ('recruiting_one_pager', 'tracking_profile', 'film_index')  # ⭐ Need migration
- status: enum ('pending', 'complete')  # ⭐ Need migration
- file_url: string  # ⭐ Need migration
- created_at, updated_at: timestamp
```

**staff_users** (Admins)
```sql
- id: uuid (PK)
- email: string (unique)
- name: string
- role: enum ('admin', 'editor')
- is_active: boolean
```

---

## 8. Environment Variables

### Required for Development
```bash
# Supabase Connection
SUPABASE_URL=https://srrasrbsqajtssqlxoju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmFzcmJzcWFqdHNzcWx4b2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDc5NDIsImV4cCI6MjA4NTIyMzk0Mn0._lp8BQqbN0XXEB_FrlF8ZEgZSdC5IWoVzMkt30LFlOM

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=<your-jwt-secret>

# Backend URL
BACKEND_URL=https://app.elitegbb.com  # or http://localhost:8787 for local

# For debug scripts
ADMIN_TOKEN=<admin-jwt-token>
PLAYER_TOKEN=<player-jwt-token>
```

### Frontend (.env.production)
```bash
REACT_APP_BACKEND_URL=https://app.elitegbb.com
REACT_APP_API_URL=/api
REACT_APP_ENV=production
```

---

## 9. Next Steps (Priority Order)

### 🔴 BLOCKING - Must Complete First
1. **Run Database Migration** (critical!)
   - Execute `backend/schema_migration_for_evaluation_builder.sql` in Supabase
   - Verify columns added to all tables

2. **Fix Player Login Blank Screen**
   - Run `node scripts/debug_player_login.js` to diagnose
   - Check JWT payload structure in impersonation flow
   - Verify PlayerAuthContext initialization
   - Test Player Portal rendering

### 🟡 Ready to Execute (After Migration)
3. **Load Test Data**
   ```bash
   node scripts/load_test_projects.js
   ```

4. **Verify Pipeline Population**
   - Log in as admin
   - Navigate to `/admin/pipeline`
   - Confirm 5 projects appear

5. **Test Project Detail Page**
   - Click project in pipeline
   - Verify player info, stats, deliverables, notes

6. **Test Evaluation Packet**
   - Click "Evaluation Packet" button
   - Verify 7-page printable layout

### 🟢 Future Enhancements
7. Deliverable generation workflow
8. Project status updates
9. Deploy to production

---

## 10. Test Credentials

**Admin Account:**
- Email: `admin@hoopwithher.com`
- Password: `AdminPass123!`

**Player Account (after test data loaded):**
- Player Key: `MJ2025` (Maya Johnson)
- Password: `TestPass123!`

**Player IDs for Testing:**
| Player | ID | Player Key |
|--------|-----|------------|
| Maya Johnson | `<uuid>` | MJ2025 |
| Sophia Williams | `<uuid>` | SW2026 |
| Zoe Martinez | `<uuid>` | ZM2024 |
| Ava Thompson | `<uuid>` | AT2026 |
| Isabella Chen | `<uuid>` | IC2025 |

---

## 11. Key Files for Common Changes

| Task | File(s) |
|------|---------|
| Fix player login blank screen | `frontend/src/context/PlayerAuthContext.js`, `frontend/src/pages/PlayerPortal.js` |
| Add API endpoint | `functions/api/<path>/index.js` |
| Update player UI | `frontend/src/pages/PlayerPortal.js` |
| Update player profile API | `functions/api/player/profile/index.js` |
| Change database schema | `backend/schema_migration_for_evaluation_builder.sql` |
| Load test data | `scripts/load_test_projects.js` |
| Debug auth issues | `scripts/debug_player_login.js` |

---

## 12. Documentation Files

| File | Purpose |
|------|---------|
| `PROJECT_HANDOFF_BOLT.md` | This file - Stackblitz handoff |
| `PROJECT_HANDOFF.md` | Main project handoff |
| `PLAYER_LOGIN_DEBUG.md` | Debug guide for blank screen issue |
| `EVALUATION_BUILDER_TESTING.md` | Testing guide for evaluation builder |
| `scripts/debug_player_login.js` | Debug script for player login |

---

## 13. Important URLs

| Resource | URL |
|----------|-----|
| Production App | https://app.elitegbb.com |
| Admin Login | https://app.elitegbb.com/admin/login |
| Admin Pipeline | https://app.elitegbb.com/admin/pipeline |
| Player Portal | https://app.elitegbb.com/player |
| Supabase Dashboard | https://app.supabase.com/project/srrasrbsqajtssqlxoju |
| GitHub Repo | https://github.com/lrevell8-arch/elitegbb |

---

## 14. Commands Cheat Sheet

```bash
# Check git status
git status

# View recent commits
git log --oneline -5

# Pull latest changes
git pull origin feat/evaluation-builder

# Run debug script
cd /home/user/webapp && node scripts/debug_player_login.js

# Load test data
cd /home/user/webapp && node scripts/load_test_projects.js

# Check Supabase schema
curl -H "apikey: $SUPABASE_ANON_KEY" \
  $SUPABASE_URL/rest/v1/players?select=id,name,ppg,apg,rpg

# Test player login API
curl -X POST https://app.elitegbb.com/api/player/login \
  -H "Content-Type: application/json" \
  -d '{"player_key":"MJ2025","password":"TestPass123!"}'

# Get player profile (with token)
curl https://app.elitegbb.com/api/player/profile \
  -H "Authorization: Bearer <player-jwt-token>"
```

---

## 15. Contact & Context

**Developer:** AI Assistant (Claude)  
**User/Lead:** lrevell8-arch  
**Project:** EliteGBB / Hoop With Her Basketball  
**Purpose:** College basketball recruiting platform with player evaluation builder

**Recent Context:**
- Debug script created for player login blank screen issue
- Database migration SQL ready but not yet executed
- Player portal UI functional but needs schema migration for full functionality
- PlayerAuthContext and PlayerPortal components fully implemented
- Git branch `feat/evaluation-builder` pushed and ready

---

**Last Updated:** 2026-03-06  
**Status:** Ready for Stackblitz - Migration & Player Login Fix Needed

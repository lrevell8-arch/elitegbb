# Elite GBB Project - Developer Handoff Document
**Date:** 2026-02-15  
**Repository:** https://github.com/lrevell8-arch/elitegbb  
**Status:** Active Development - Core Features Implemented

---

## 1. Project Overview

**Elite GBB** is a basketball recruiting platform with three user portals:
- **Admin Portal** - Staff management, player pipeline, coach oversight
- **Coach Portal** - College coaches view/save player profiles
- **Player Portal** - Athletes manage profiles, stats, connect with coaches

**Architecture:**
- **Frontend:** React (Create React App) + React Router + Tailwind CSS
- **Backend:** Cloudflare Functions (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (HS256) via Web Crypto API
- **Hosting:** Cloudflare Pages (https://app.elitegbb.com)

---

## 2. File Structure

```
/home/user/webapp/
├── frontend/                          # React Frontend
│   ├── public/
│   │   ├── _redirects                 # SPA routing fix (/* -> /index.html 200)
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                     # Main routing with 3 auth providers
│   │   ├── index.js
│   │   ├── context/
│   │   │   ├── AuthContext.js         # Admin auth
│   │   │   ├── CoachAuthContext.js    # Coach auth
│   │   │   └── PlayerAuthContext.js   # Player auth (NEW)
│   │   ├── pages/
│   │   │   ├── Landing.js             # Public landing page
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminLogin.js
│   │   │   ├── CoachDashboard.js
│   │   │   ├── CoachAuth.js
│   │   │   ├── PlayerLogin.js         # Player login (NEW)
│   │   │   ├── PlayerPortal.js        # Player dashboard (NEW)
│   │   │   └── [other pages...]
│   │   └── components/
│   ├── package.json
│   └── build/                         # Production build output
│
├── functions/                         # Cloudflare Functions (Backend)
│   ├── utils/
│   │   └── jwt.js                     # JWT generate/verify with Web Crypto
│   ├── api/
│   │   ├── [[path]].js.bak           # DISABLED catch-all (was blocking routes)
│   │   ├── auth/
│   │   │   ├── login.js              # POST /api/auth/login (admin/staff)
│   │   │   ├── me.js                 # GET /api/auth/me
│   │   │   └── setup.js              # POST /api/auth/setup (create first admin)
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── index.js          # GET /api/admin/dashboard (stats)
│   │   │   ├── coaches/
│   │   │   │   └── index.js          # GET/POST/PATCH /api/admin/coaches
│   │   │   └── players/
│   │   │       └── index.js          # GET /api/admin/players (full data)
│   │   ├── coach/
│   │   │   └── login.js              # POST /api/coach/login
│   │   ├── coaches/
│   │   │   └── index.js              # GET /api/coaches (public list)
│   │   ├── player/                   # NEW - Player portal APIs
│   │   │   ├── login.js              # POST /api/player/login
│   │   │   ├── profile/
│   │   │   │   └── index.js          # GET/PATCH/POST /api/player/profile
│   │   │   └── connections/
│   │   │       └── index.js          # GET/POST/DELETE /api/player/connections
│   │   ├── players/
│   │   │   └── index.js              # POST /api/players (create from intake)
│   │   ├── messages/
│   │   │   └── index.js              # GET/POST /api/messages
│   │   ├── projects/
│   │   │   └── index.js              # GET/POST /api/projects
│   │   ├── upload/
│   │   │   └── image/
│   │   │       └── index.js          # POST /api/upload/image (base64)
│   │   └── health.js                 # GET /api/health
│   └── [other handlers...]
│
└── scripts/                           # Utility Scripts
    ├── activate-coach.js              # Linux/Mac: Activate disabled coach
    ├── activate-coach.ps1             # Windows PowerShell
    ├── activate-coach.bat             # Windows CMD wrapper
    ├── create-coach.js                # Linux/Mac: Create new coach
    ├── create-coach.ps1               # Windows PowerShell
    ├── create-coach.bat               # Windows CMD wrapper
    └── create-coach-browser.js        # Browser console script

```

---

## 3. Completed Features

### ✅ Authentication System (All 3 Portals)

| Portal | Login Endpoint | JWT Payload | Context |
|--------|----------------|-------------|---------|
| **Admin** | POST /api/auth/login | `{sub, email, role, name}` | AuthContext.js |
| **Coach** | POST /api/coach/login | `{sub, email, role, name, school}` | CoachAuthContext.js |
| **Player** | POST /api/player/login | `{user_id, player_key, role, name, email}` | PlayerAuthContext.js |

**Password Hashing:**
- SHA-256 with 16-char salt (base64) for new accounts
- Bcrypt fallback supported (starts with `$2`)
- Password format: `<16-char-salt><sha256-hash-base64>`

**Sample Hash for `CoachPass123!`:**
```
AbCdEfGhIjKlMnOpqRstUw==5d41402abc4b2a76b9719d911017c592
```

### ✅ API Endpoints Implemented

#### Admin APIs
```
GET    /api/admin/dashboard        - Statistics (players, coaches, projects, messages)
GET    /api/admin/coaches          - List all coaches with filters
POST   /api/admin/coaches          - Create new coach (is_active=true, is_verified=true)
PATCH  /api/admin/coaches          - Update coach (activate/deactivate, edit info)
GET    /api/admin/players          - List all players (admin view)
```

#### Coach APIs
```
POST   /api/coach/login            - Authenticate, returns JWT + user data
GET    /api/coaches                - Public list of verified coaches
```

#### Player APIs (NEW - Recently Added)
```
POST   /api/player/login           - Authenticate with player_key + password
GET    /api/player/profile         - Get own profile (JWT required)
PATCH  /api/player/profile         - Update profile fields
POST   /api/player/profile         - Change password (current + new)
GET    /api/player/connections     - List coach connections
POST   /api/player/connections     - Add coach connection
DELETE /api/player/connections     - Remove coach connection
```

#### Player Management
```
POST   /api/players                - Create player from intake form
                                  - Generates unique player_key (P-XXXXXX)
                                  - Sets payment_status: 'pending'
                                  - Returns player record
GET    /api/players                - List players (limited fields for non-admin)
```

#### Upload
```
POST   /api/upload/image           - Upload base64 image (JPEG/PNG/GIF/WebP, max 2MB)
                                  - Stores as data-URI in players/coaches table
                                  - Type: 'player' or 'coach'
```

#### Utility
```
GET    /api/health                 - Health check + DB connection status
POST   /api/auth/setup             - Create first admin (if no users exist)
                                  - Default: admin@hoopwithher.com / AdminPass123!
```

### ✅ Frontend Components

#### Routes (App.js)
```javascript
// Public
/                      -> Landing
/intake                -> IntakeForm (player registration)
/success               -> SuccessPage
/forgot-password       -> ForgotPassword
/reset-password        -> ResetPassword

// Admin (protected by AdminRoute)
/admin/login           -> AdminLogin
/admin                 -> AdminDashboard
/admin/pipeline        -> PipelineBoard
/admin/players        -> PlayerDirectory
/admin/projects/:id    -> ProjectDetail
/admin/projects/:id/evaluation -> PlayerEvaluation
/admin/coaches         -> AdminCoaches

// Coach (protected by CoachRoute)
/coach/login          -> CoachAuth
/coach                -> CoachDashboard
/coach/prospect/:id   -> CoachProspectDetail
/coach/subscription   -> CoachSubscription
/coach/messages       -> CoachMessages
/coach/compare        -> CoachCompare

// Player (NEW - protected by PlayerRoute)
/player/login         -> PlayerLogin
/player               -> PlayerPortal (main dashboard)
```

#### Player Portal (PlayerPortal.js) - NEW
**Features:**
- **Profile Tab:** Edit name, graduation_year, school, state, phone, socials
- **Stats Tab:** Edit height, weight, positions, PPG, APG, RPG, FG%, 3P%
- **Connections Tab:** View coaches who saved your profile
- **Security Tab:** Change password
- **Avatar Upload:** Base64 image upload (≤2MB)

**PlayerAuthContext Methods:**
- `login(player_key, password)` - Authenticate, store token
- `logout()` - Clear token
- `updateProfile(data)` - PATCH /api/player/profile
- `changePassword(current, new)` - POST /api/player/profile
- `uploadImage(base64Image)` - POST /api/upload/image

---

## 4. Database Schema

### Tables (Supabase)

#### `staff_users` (Admin/Staff)
```sql
id: uuid (primary key)
email: string (unique)
password_hash: string (sha256 or bcrypt)
name: string
role: enum ('admin', 'editor', 'viewer')
is_active: boolean
is_verified: boolean
created_at: timestamp
```

**Default Admin:**
- Email: `admin@hoopwithher.com`
- Password: `AdminPass123!`
- Created via: POST /api/auth/setup

#### `coaches`
```sql
id: uuid (primary key)
email: string (unique)
password_hash: string
name: string
school: string
title: string (default: 'Coach')
state: string (2-letter code)
profile_image_url: string (data-URI or URL)
is_active: boolean (default: true)
is_verified: boolean (default: true)
saved_players: uuid[] (array of player IDs)
created_at: timestamp
updated_at: timestamp
```

#### `players`
```sql
id: uuid (primary key)
player_key: string (unique, format: P-XXXXXX)
password_hash: string
email: string
name: string
graduation_year: integer
school: string
state: string
phone: string
profile_image_url: string (data-URI)

-- Stats
height: string (e.g., "5'10\")
weight: integer (lbs)
positions: string[] (array like ['PG', 'SG'])
ppg: float (points per game)
apg: float (assists per game)
rpg: float (rebounds per game)
fg_percent: float
three_p_percent: float

-- Socials
instagram: string
twitter: string
youtube: string

-- Parent Info
parent_name: string
parent_email: string
parent_phone: string

-- Status
is_verified: boolean
payment_status: enum ('pending', 'paid', 'waived')
video_url: string
coach_notes: text
created_at: timestamp
updated_at: timestamp
```

#### `player_connections`
```sql
id: uuid (primary key)
player_id: uuid (foreign key -> players.id)
coach_id: uuid (foreign key -> coaches.id)
status: enum ('pending', 'accepted', 'declined')
message: text
created_at: timestamp
```

---

## 5. Environment Variables (Cloudflare)

Required in Cloudflare Pages/Functions:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=your-secret-key-min-32-characters-long
```

---

## 6. Recent Fixes & Routing

### SPA Routing Fix (Completed)
- **Problem:** React Router routes (e.g., /admin/pipeline) returned 404 on refresh
- **Solution:** Created `frontend/public/_redirects`:
  ```
  /* /index.html 200
  ```
- **Commits:** 923e541, c509fb7

### Removed Greedy Catch-All
- **Problem:** `functions/api/[[path]].js` was intercepting ALL /api/* requests
- **Solution:** Renamed to `[[path]].js.bak`, allowing specific route handlers to work
- **Status:** Specific handlers now active (auth, admin, coach, players, messages, projects, etc.)

---

## 7. Testing Guide

### Test Admin Login
```bash
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hoopwithher.com","password":"AdminPass123!"}'
```

### Test Coach Creation (via Admin)
```bash
# 1. Get admin token
TOKEN=$(curl -s -X POST https://app.elitegbb.com/api/auth/login ...)

# 2. Create coach
curl -X POST https://app.elitegbb.com/api/admin/coaches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@university.edu",
    "password": "CoachPass123!",
    "name": "Coach Name",
    "school": "University Name"
  }'
```

### Test Coach Login
```bash
curl -X POST https://app.elitegbb.com/api/coach/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@university.edu","password":"CoachPass123!"}'
```

### Test Player Creation (Intake)
```bash
curl -X POST https://app.elitegbb.com/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "graduation_year": 2026,
    "school": "High School",
    "state": "CA",
    "password": "PlayerPass123!"
  }'
```

---

## 8. Known Issues & Pending Work

### Current Issues
| Issue | Status | Notes |
|-------|--------|-------|
| Coach table empty | ⚠️ Need data | Use create-coach.ps1 or Supabase insert |
| Image storage | ⚠️ Base64 | Currently stores images as data-URIs in DB. Consider Cloudflare R2 for scale |
| Password hashing | ⚠️ Mixed | Some old accounts may use bcrypt, new use SHA-256. Code handles both |

### Pending Features
| Feature | Priority | Notes |
|---------|----------|-------|
| Coach profile image upload | Medium | Endpoint exists, needs UI |
| Player video upload | Low | URL field exists, needs file upload |
| Email notifications | Low | Not implemented |
| Payment integration | Low | payment_status field ready |
| Admin player verification | Medium | is_verified workflow needed |
| Coach saved players view | Medium | saved_players array exists, needs UI |

---

## 9. Deployment

**Platform:** Cloudflare Pages  
**URL:** https://app.elitegbb.com

### Deploy Steps
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Functions deploy automatically with Pages

# 3. Push to main triggers auto-deploy
git push origin main
```

**Config (wrangler.toml if needed):**
```toml
[site]
bucket = "./frontend/build"
```

---

## 10. Quick Start for New Developer

1. **Clone & Install**
   ```bash
   git clone https://github.com/lrevell8-arch/elitegbb.git
   cd elitegbb/frontend && npm install
   ```

2. **Setup Database**
   - Go to Supabase dashboard
   - Create tables: `staff_users`, `coaches`, `players`, `player_connections`
   - Run: POST /api/auth/setup to create first admin

3. **Create Test Coach**
   ```bash
   cd scripts
   ./create-coach.ps1 -Email "test@example.com" -Password "Pass123!" -Name "Test Coach" -School "Test University"
   ```

4. **Run Frontend Locally**
   ```bash
   cd frontend
   npm start  # Runs on http://localhost:3000
   ```

5. **Test Player Portal**
   - Go to http://localhost:3000/intake
   - Fill form → creates player
   - Go to http://localhost:3000/player/login
   - Login with player_key and password

---

## 11. Contact & Resources

- **Repository:** https://github.com/lrevell8-arch/elitegbb
- **Live Site:** https://app.elitegbb.com
- **Admin URL:** https://app.elitegbb.com/admin/login
- **Coach URL:** https://app.elitegbb.com/coach/login
- **Player URL:** https://app.elitegbb.com/player/login

---

## Changelog (Recent)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-15 | 9583eaf | Add coach creation scripts (Windows PS/CMD/Browser) |
| 2026-02-15 | a8af12d | Add Windows PowerShell activation scripts |
| 2026-02-15 | f604907 | Add coach activation script for disabled accounts |
| Earlier | [multiple] | Player portal implementation (login, profile, connections, upload) |
| Earlier | [multiple] | SPA routing fix (_redirects), catch-all removal |
| Earlier | [multiple] | Admin dashboard, coach APIs, player intake |

---

**END OF HANDOFF DOCUMENT**

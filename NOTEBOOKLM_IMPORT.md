# Elite GBB Basketball Recruiting Platform - Project Knowledge Base

## Project Identity
**Name:** Elite GBB  
**Domain:** https://app.elitegbb.com  
**GitHub:** https://github.com/lrevell8-arch/elitegbb  
**Type:** Basketball recruiting platform for high school athletes and college coaches  
**Organization:** HoopWithHer

---

## Executive Summary

Elite GBB is a full-stack basketball recruiting platform with three distinct user portals:
1. **Admin Portal** - Staff management of players, coaches, and recruitment pipeline
2. **Coach Portal** - College coaches view player profiles, save prospects, and manage subscriptions
3. **Player Portal** - Athletes create profiles, track stats, upload media, and connect with coaches

The platform uses a serverless architecture deployed on Cloudflare with Supabase as the backend database.

---

## Architecture Overview

### Tech Stack
- **Frontend:** React (Create React App), React Router v6, Tailwind CSS, Lucide React icons
- **Backend:** Cloudflare Functions (serverless edge functions)
- **Database:** Supabase (PostgreSQL with REST API)
- **Authentication:** JWT (HS256) using Web Crypto API (no external auth libraries)
- **Hosting:** Cloudflare Pages
- **Image Storage:** Base64 data URIs stored in database (simplified approach)

### File Structure
```
frontend/                    # React application
├── public/_redirects         # SPA routing configuration
├── src/App.js               # Main routing with 3 auth providers
├── src/context/             # Auth contexts (Admin, Coach, Player)
├── src/pages/               # All page components
└── build/                   # Production output

functions/                   # Cloudflare Functions (backend API)
├── utils/jwt.js            # JWT generation and verification
├── api/auth/               # Admin authentication
├── api/admin/              # Admin dashboard and management
├── api/coach/              # Coach login
├── api/player/             # Player portal APIs
├── api/players/            # Player management (intake)
├── api/upload/             # Image upload handler
└── api/health.js           # Health check endpoint

scripts/                     # Utility scripts
├── create-coach.*          # Create new coach accounts
└── activate-coach.*        # Activate disabled coaches
```

---

## Authentication System

### Three Separate Auth Flows

**Admin/Staff Authentication:**
- Endpoint: POST /api/auth/login
- Table: staff_users
- JWT Payload: {sub, email, role, name}
- Default Admin: admin@hoopwithher.com / AdminPass123!
- Role options: admin, editor, viewer

**Coach Authentication:**
- Endpoint: POST /api/coach/login
- Table: coaches
- JWT Payload: {sub, email, role, name, school}
- Fields checked: is_active, is_verified
- Password hashing: SHA-256 with salt OR bcrypt fallback

**Player Authentication:**
- Endpoint: POST /api/player/login
- Table: players
- JWT Payload: {user_id, player_key, role, name, email}
- Login uses: player_key (format P-XXXXXX) + password
- Player keys are auto-generated on registration

### Password Hashing
Format: 16-character-salt + base64-encoded-SHA256-hash
Example hash for "CoachPass123!": AbCdEfGhIjKlMnOpqRstUw==5d41402abc4b2a76b9719d911017c592

The code also accepts bcrypt hashes (starting with $2) for backward compatibility.

---

## Database Schema

### staff_users Table
Purpose: Admin and staff user accounts
- id: uuid (primary key)
- email: string (unique)
- password_hash: string
- name: string
- role: enum (admin, editor, viewer)
- is_active: boolean
- is_verified: boolean
- created_at: timestamp

### coaches Table
Purpose: College coach accounts
- id: uuid (primary key)
- email: string (unique, lowercase)
- password_hash: string
- name: string
- school: string (university/college name)
- title: string (default: "Coach")
- state: string (2-letter state code)
- profile_image_url: string (data-URI or external URL)
- is_active: boolean (must be true to login)
- is_verified: boolean (must be true to login)
- saved_players: uuid[] (array of player IDs the coach has saved)
- created_at: timestamp
- updated_at: timestamp

### players Table
Purpose: Athlete profiles
- id: uuid (primary key)
- player_key: string (unique, format P-XXXXXX, auto-generated)
- password_hash: string
- email: string
- name: string
- graduation_year: integer
- school: string (high school name)
- state: string
- phone: string
- profile_image_url: string (data-URI)
- height: string (e.g., "5'10\"
- weight: integer (lbs)
- positions: string[] (array like ["PG", "SG"])
- ppg: float (points per game)
- apg: float (assists per game)
- rpg: float (rebounds per game)
- fg_percent: float (field goal percentage)
- three_p_percent: float (3-point percentage)
- instagram: string
- twitter: string
- youtube: string
- parent_name: string
- parent_email: string
- parent_phone: string
- is_verified: boolean
- payment_status: enum (pending, paid, waived)
- video_url: string
- coach_notes: text
- created_at: timestamp
- updated_at: timestamp

### player_connections Table
Purpose: Track relationships between players and coaches
- id: uuid (primary key)
- player_id: uuid (foreign key to players.id)
- coach_id: uuid (foreign key to coaches.id)
- status: enum (pending, accepted, declined)
- message: text
- created_at: timestamp

---

## Complete API Reference

### Authentication Endpoints

POST /api/auth/login
- Body: {email, password}
- Response: {token, user: {id, email, name, role}}
- Error codes: 400 (missing fields), 401 (invalid/disabled), 500 (config error)

POST /api/auth/setup
- Creates first admin user if staff_users table is empty
- Default: admin@hoopwithher.com / AdminPass123!
- Response: {message, admin_email, warning}

POST /api/coach/login
- Body: {email, password}
- Checks: is_active and is_verified must be true
- Response: {token, user: {id, email, name, school, title, state, role, is_verified, saved_players}}
- Error: "Account is disabled" if is_active=false
- Error: "Account pending verification" if is_verified=false

POST /api/player/login
- Body: {player_key, password}
- player_key must be uppercase (P-XXXXXX)
- Response: {token, player: {...}} (password_hash excluded)
- Verifies is_verified status

### Admin Management Endpoints

GET /api/admin/dashboard
- Auth: Bearer token (admin or editor role)
- Returns statistics: {total_players, total_coaches, total_projects, total_messages, recent_intakes, recent_projects, coaches_summary: {active, inactive}}

GET /api/admin/coaches
- Auth: Bearer token (admin or editor)
- Returns: {coaches: [], total: number}
- Selects: id, email, name, school, title, state, is_active, is_verified, saved_players, created_at, updated_at

POST /api/admin/coaches
- Auth: Bearer token (admin or editor)
- Body: {email, password, name, school, title, state}
- Automatically sets: is_active: true, is_verified: true, saved_players: []
- Creates password hash using SHA-256
- Response: {success: true, coach: {...}}

PATCH /api/admin/coaches
- Auth: Bearer token (admin or editor)
- Body: {id, ...updateData}
- Use to activate/deactivate coaches: {id, is_active: true, is_verified: true}
- Response: {success: true, coach: {...}}

GET /api/admin/players
- Auth: Bearer token
- Returns full player data for admin view

### Player Management Endpoints

POST /api/players
- Public endpoint (no auth required)
- Creates player from intake form submission
- Body: {name, email, graduation_year, school, state, phone, password, parent_name, parent_email, parent_phone}
- Auto-generates: player_key (P-XXXXXX format), payment_status: "pending"
- Returns: Full player record

GET /api/players
- Auth optional (admin gets full data, public gets limited)
- Returns array of players with subset of fields

### Player Portal Endpoints (Player-Side)

GET /api/player/profile
- Auth: Bearer token (player role)
- Returns: Full player profile (excludes password_hash)
- Fields include: id, player_key, name, email, stats, contact info, socials, parent info

PATCH /api/player/profile
- Auth: Bearer token
- Body: Profile fields to update
- Allowed fields: name, email, phone, graduation_year, school, state, height, weight, positions, ppg, apg, rpg, fg_percent, three_p_percent, instagram, twitter, youtube, parent_name, parent_email, parent_phone, profile_image_url
- Auto-sets: updated_at to current timestamp

POST /api/player/profile
- Special endpoint for password changes
- Body: {current_password, new_password}
- Verifies current password before updating
- Returns success message

### Player Connections Endpoints

GET /api/player/connections
- Auth: Bearer token (player role)
- Returns: Player's coach connections with status
- Joins with coaches table to return coach name, school, etc.

POST /api/player/connections
- Auth: Bearer token
- Body: {coach_id, message} (optional message)
- Creates new connection with status "pending"
- Prevents duplicates (checks existing connections)
- Returns: {success: true, connection: {...}}

DELETE /api/player/connections
- Auth: Bearer token
- Body: {connection_id}
- Verifies connection belongs to authenticated player
- Removes the connection
- Returns: {success: true, message}

### Upload Endpoints

POST /api/upload/image
- Auth: Bearer token (player, coach, admin, or editor)
- Body: {image: "base64encodedstring", type: "player" | "coach"}
- Validation: Must be JPEG, PNG, GIF, or WebP (checked via magic bytes)
- Size limit: 2MB maximum
- Authorization: Players/coaches can only update their own record; admins/editors can update any
- Updates: players.profile_image_url or coaches.profile_image_url
- Stores: Full data-URI (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
- Returns: {success: true, image_url: "..."}

### Health Check

GET /api/health
- No auth required
- Returns: {status: "healthy", database: "connected", timestamp, staff_users_count}
- Used for monitoring and uptime checks

---

## Frontend Routes

### Public Routes (No Auth Required)
- / - Landing page with marketing content
- /intake - Player registration form
- /success - Intake form success confirmation
- /forgot-password - Password reset request
- /reset-password - Password reset confirmation

### Admin Routes (AdminRoute Protection)
- /admin/login - Admin authentication
- /admin - AdminDashboard (main stats and overview)
- /admin/pipeline - PipelineBoard (player recruitment pipeline)
- /admin/players - PlayerDirectory (all players list)
- /admin/projects/:projectId - ProjectDetail
- /admin/projects/:projectId/evaluation - PlayerEvaluation
- /admin/coaches - AdminCoaches (coach management)

### Coach Routes (CoachRoute Protection)
- /coach/login - Coach authentication
- /coach - CoachDashboard (main coach view)
- /coach/prospect/:playerId - CoachProspectDetail (individual player view)
- /coach/subscription - CoachSubscription
- /coach/subscription/success - Subscription success
- /coach/messages - CoachMessages
- /coach/compare - CoachCompare (compare multiple players)

### Player Routes (PlayerRoute Protection) - NEW
- /player/login - PlayerLogin (login with player_key + password)
- /player - PlayerPortal (main player dashboard with tabs)

---

## Frontend Components Deep Dive

### PlayerPortal.js (Player Dashboard)
Four-tab interface:

1. **Profile Tab**
   - View and edit personal information
   - Fields: name, email, phone, graduation_year, school, state
   - Social links: instagram, twitter, youtube
   - Avatar image with click-to-upload

2. **Stats Tab**
   - Physical stats: height, weight, positions (multi-select)
   - Performance stats: PPG, APG, RPG, FG%, 3P%
   - Editable inline with save button

3. **Connections Tab**
   - List of coaches who have saved/connected with player
   - Shows coach name, school, title
   - Status indicators (pending, accepted, etc.)

4. **Security Tab**
   - Change password form
   - Requires current password + new password + confirmation
   - Validation: minimum length, passwords must match

### PlayerAuthContext.js
React Context providing:
- player: Current player object
- token: JWT token
- loading: Auth initialization state
- isAuthenticated: Boolean
- login(player_key, password): Authenticate and store token
- logout(): Clear token and reset state
- updateProfile(data): PATCH to /api/player/profile
- changePassword(current, new): POST to /api/player/profile
- uploadImage(base64Image): POST to /api/upload/image
- getAuthHeaders(): Returns {Authorization: "Bearer <token>"}

### Authentication Guards
AdminRoute: Checks AuthContext, redirects to /admin/login if not authenticated
CoachRoute: Checks CoachAuthContext, redirects to /coach/login if not authenticated
PlayerRoute: Checks PlayerAuthContext, redirects to /player/login if not authenticated

---

## Key Implementation Details

### JWT Implementation
Uses Web Crypto API (no external libraries):
- Algorithm: HS256 (HMAC-SHA256)
- Expiration: 24 hours from issue
- Signature: HMAC of base64(header) + "." + base64(payload)
- Secret from environment: JWT_SECRET

### CORS Handling
All API endpoints return headers:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization

### Player Key Generation
Format: P-XXXXXX (6 random alphanumeric characters)
Generation: crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()
Example keys: P-A1B2C3, P-X7Y8Z9

### Image Upload Flow
1. User selects file in browser
2. FileReader converts to base64
3. Validate: size < 2MB, valid image type
4. POST to /api/upload/image with {image: base64String, type: "player"}
5. Backend validates magic bytes (not just extension)
6. Server PATCHes player/coach record with data-URI
7. Image displays directly from data-URI (no external storage needed)

### Supabase REST Queries
All backend functions use native fetch() to Supabase REST API:
- URL pattern: ${SUPABASE_URL}/rest/v1/${table}
- Headers: apikey, Authorization (Bearer), Content-Type
- Query params: eq., select, order, limit
- Prefer header: return=representation for POST/PATCH

---

## Environment Variables

Required in Cloudflare Pages/Functions:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=minimum-32-character-secret-key
```

Optional fallback in code uses 'fallback-secret-key-change-in-production'

---

## Utility Scripts

### create-coach.ps1 (Windows PowerShell)
Purpose: Create new coach accounts
Parameters: -Email, -Password, -Name, -School, -Title, -State
Flow: Admin login → Check existing → Create coach → Display credentials

### activate-coach.ps1 (Windows PowerShell)
Purpose: Activate disabled coach accounts
Parameters: -CoachEmail
Flow: Admin login → Find coach by email → Check is_active → PATCH to activate

### create-coach-browser.js
Purpose: Browser console script for creating coaches
Usage: Paste in DevTools console while logged in as admin
Advantage: No PowerShell/CMD needed, works on any OS

---

## Testing Commands

### Test Admin Login
curl -X POST https://app.elitegbb.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@hoopwithher.com\",\"password\":\"AdminPass123!\"}"

### Test Create Coach
curl -X POST https://app.elitegbb.com/api/admin/coaches -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"email\":\"coach@test.edu\",\"password\":\"Pass123!\",\"name\":\"Coach Name\",\"school\":\"Test University\"}"

### Test Coach Login
curl -X POST https://app.elitegbb.com/api/coach/login -H "Content-Type: application/json" -d "{\"email\":\"coach@test.edu\",\"password\":\"Pass123!\"}"

### Test Health Check
curl https://app.elitegbb.com/api/health

---

## Recent Changes (Chronological)

Most Recent First:

1. **Added PROJECT_HANDOFF.md** - Comprehensive developer documentation for team handoff

2. **Added create-coach scripts** - PowerShell, CMD, and browser console scripts for creating coaches (since coaches table was empty)

3. **Added activate-coach scripts** - Scripts to reactivate disabled coach accounts

4. **Implemented Player Portal** - Complete player-facing dashboard:
   - PlayerLogin.js - Login with player_key
   - PlayerPortal.js - Four-tab dashboard (profile, stats, connections, security)
   - PlayerAuthContext.js - Authentication context with methods
   - API endpoints: /api/player/login, /api/player/profile, /api/player/connections, /api/upload/image

5. **Fixed SPA Routing** - Added frontend/public/_redirects with "/* /index.html 200" to fix React Router 404s on refresh

6. **Removed Greedy Catch-All** - Renamed functions/api/[[path]].js to [[path]].js.bak to allow specific route handlers

7. **Implemented Admin Dashboard API** - GET /api/admin/dashboard with statistics aggregation

8. **Created Coach Management APIs** - GET/POST/PATCH /api/admin/coaches for coach CRUD

9. **Implemented Player Intake** - POST /api/players with player_key generation

---

## Current Status & Known Issues

### Working Features
- All three authentication systems (Admin, Coach, Player)
- Admin dashboard and coach management
- Player intake form and player portal
- Image uploads (base64 storage)
- Coach connections (save players, view connections)
- SPA routing with proper redirects

### Current Limitations
- Coaches table is empty (needs accounts created via scripts or Supabase)
- Images stored as base64 in database (functional but not scalable to thousands of users)
- No email notification system implemented
- No payment processing implemented (payment_status field exists but not wired to Stripe/PayPal)

### Pending Features
- Email notifications for new connections
- Video upload (beyond just URL field)
- Advanced search and filtering
- Coach subscription payment integration
- Bulk import/export of players
- Analytics and reporting dashboard

---

## Quick Commands for Developers

### Create First Admin (if none exists)
curl -X POST https://app.elitegbb.com/api/auth/setup

### Windows: Create Coach Account
powershell -ExecutionPolicy Bypass -File scripts/create-coach.ps1 -Email "coach@university.edu" -Password "CoachPass123!" -Name "Coach Name" -School "University Name"

### Windows: Activate Disabled Coach
powershell -ExecutionPolicy Bypass -File scripts/activate-coach.ps1 -CoachEmail "coach@university.edu"

### Local Development
frontend: npm start (port 3000)
functions: npx wrangler pages dev (if using Wrangler locally)

---

## Project Completion Checklist

- [x] Project architecture defined
- [x] Database schema designed
- [x] Admin authentication implemented
- [x] Coach authentication implemented
- [x] Player authentication implemented
- [x] Admin dashboard with statistics
- [x] Coach management (create, update, list)
- [x] Player intake form
- [x] Player portal (profile, stats, connections, security)
- [x] Image upload system
- [x] Coach-player connection system
- [x] SPA routing fixes
- [x] Health check endpoint
- [x] Utility scripts for Windows
- [x] Comprehensive documentation
- [ ] Populate coaches table with initial data
- [ ] Email notification system
- [ ] Payment integration
- [ ] Production image storage (R2/S3)

---

## Contact Information

**Repository:** https://github.com/lrevell8-arch/elitegbb  
**Live Application:** https://app.elitegbb.com  
**Default Admin:** admin@hoopwithher.com / AdminPass123!  
**Organization:** HoopWithHer

---

*Document Version: 2026-02-15*  
*Purpose: Import into Google NotebookLM for AI-assisted development and Q&A*
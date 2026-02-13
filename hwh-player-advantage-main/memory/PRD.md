# HWH Player Advantage™ - Product Requirements Document

## Original Problem Statement
Build a full production-ready web application called "HWH Player Advantage™" for Hoop With Her. The system must intake player data, store it in Supabase (or MongoDB fallback), generate recruiting deliverables, track production status in a pipeline, and send automated emails. It must support both middle school and high school athletes, girls and boys.

## Architecture Summary
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (with Supabase PostgreSQL support prepared)
- **Payments**: Stripe integration for package purchases
- **Auth**: JWT-based authentication (Admin + Coach portals)

## User Personas
1. **Parent/Guardian**: Submits player intake form, receives confirmation
2. **Player**: Subject of the recruitment profile
3. **Admin Staff**: Manages pipeline, generates deliverables, tracks projects
4. **Editor Staff**: Can update deliverables and project status
5. **Viewer Staff**: Read-only access to player data
6. **Coach**: Browses verified prospects, saves players of interest

## Core Requirements (Static)
- Multi-step public intake form (9 steps)
- Player information collection
- Package selection (Starter $99, Development $199, Elite Track $399)
- Stripe checkout for payments
- Admin dashboard with pipeline kanban
- Player directory with filters
- Deliverable management
- Coach Portal for recruiting

## What's Been Implemented (2026-01-29)
### Public Features
- ✅ Multi-step intake form with validation
- ✅ Player info, parent contact, team context, stats collection
- ✅ Self-evaluation section
- ✅ Film/social links collection
- ✅ Package selection with pricing
- ✅ Consent checkboxes and digital signature
- ✅ Stripe checkout integration (test mode)
- ✅ Success page with payment status polling

### Admin Features
- ✅ JWT-based authentication
- ✅ Admin dashboard with stats
- ✅ Pipeline kanban board (drag-and-drop ready)
- ✅ Player directory with search/filter
- ✅ Project detail view
- ✅ Deliverables checklist
- ✅ Mock PDF generation
- ✅ Internal notes system
- ✅ Reminder scheduling
- ✅ Coach account management (verify/revoke)

### Coach Portal
- ✅ Coach registration with school/title
- ✅ Admin verification workflow
- ✅ Browse verified prospects
- ✅ Filter by class, position, gender, state, min PPG
- ✅ Save/bookmark players of interest
- ✅ Detailed prospect profiles
- ✅ Stats, film links, self-evaluation display
- ✅ Saved players list with notes

### Coach Subscription System (NEW)
- ✅ Three-tier subscription (Basic $99/mo, Premium $299/mo, Elite $499/mo)
- ✅ Stripe checkout integration for subscriptions
- ✅ Tier-based content gating
- ✅ Basic: Browse prospects, save up to 25 players, basic stats
- ✅ Premium: Contact info access, full film links, export lists
- ✅ Elite: Direct messaging, prospect comparison tool, priority support
- ✅ Feature comparison table
- ✅ Upgrade prompts for gated features

### Coach Messaging (Elite Feature)
- ✅ Direct messaging to Hoop With Her
- ✅ Inbox/Sent message views
- ✅ Compose message interface
- ✅ Player reference in messages
- ✅ Elite tier gating with upgrade prompt

### Prospect Comparison Tool (Elite Feature)
- ✅ Compare 2-5 players side-by-side
- ✅ Stats comparison table with highlighting
- ✅ Profile comparison cards
- ✅ Auto-generated insights
- ✅ Search and add players interface
- ✅ Elite tier gating with upgrade prompt

### Technical Implementation
- ✅ MongoDB database with indexes
- ✅ RESTful API with proper routes
- ✅ Authentication middleware
- ✅ Email logging (mock)
- ✅ Responsive dark theme UI
- ✅ Brand colors (#0134bd, #fb6c1d)

## Prioritized Backlog
### P0 (Critical) - COMPLETE
- [x] Intake form submission ✅
- [x] Admin authentication ✅
- [x] Pipeline board ✅
- [x] Stripe payment integration ✅
- [x] Coach Portal ✅
- [x] Coach subscription tiers ✅
- [x] Messaging system ✅
- [x] Comparison tool ✅

### P1 (High Priority)
- [ ] Supabase PostgreSQL production deployment
- [ ] Real email sending (SendGrid/Resend)
- [ ] Actual PDF generation (WeasyPrint)
- [ ] Verified Prospect Badge PNG generation

### P2 (Medium Priority)
- [ ] Coach-to-coach direct messaging
- [ ] Drag-and-drop pipeline status updates
- [ ] Email templates with branding
- [ ] Bulk operations for admin
- [ ] Export functionality

### P3 (Nice to Have)
- [ ] Player public profile pages
- [ ] Coach messaging system
- [ ] Analytics dashboard
- [ ] Mobile app

## Next Tasks
1. Set Supabase DATABASE_URL with actual password for production
2. Implement real email sending with SendGrid
3. Implement actual PDF generation with templates
4. Add coach-to-coach direct messaging (between Elite coaches)
5. Create branded email templates

## Credentials (Development)
### Admin
- Email: admin@hoopwithher.com
- Password: AdminPass123!

### Coach (Verified, Free Tier)
- Email: coach@university.edu
- Password: CoachPass123!

## Package Pricing - Players
| Package | Price | Deliverables |
|---------|-------|--------------|
| Starter | $99 | One-Pager, Verified Badge |
| Development | $199 | + Tracking Profile, Film Index |
| Elite Track | $399 | + Referral Note, Mid/End Season Updates |

## Subscription Pricing - Coaches
| Tier | Price | Features |
|------|-------|----------|
| Basic | $99/mo | Browse prospects, Save 25 players, Basic stats |
| Premium | $299/mo | + Contact info, Film links, Export lists |
| Elite | $499/mo | + Messaging, Comparison tool, Priority support |

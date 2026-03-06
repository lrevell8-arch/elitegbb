# Evaluation Builder Testing Guide

This guide explains how to test the evaluation builder functionality for the Hoop With Her platform.

## Overview

The evaluation builder consists of:
1. **Project Detail Page** (`/admin/projects/:projectId`) - Shows project info, player data, deliverables
2. **Evaluation Packet** (`/admin/projects/:projectId/evaluation`) - Printable 7-page scouting packet

## Setup

### 1. Environment Variables

Ensure you have the following environment variables set:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export BACKEND_URL="http://localhost:8787"  # or your deployed URL
```

### 2. Load Test Data

Run the test data loader to create sample projects:

```bash
cd /home/user/webapp
node scripts/load_test_projects.js
```

This will create:
- 5 sample players with complete profiles
- 5 intake submissions with self-evaluations
- 5 projects with various package types and statuses
- Associated deliverables for each project

### 3. Verify the API Endpoint

The endpoint `/api/admin/projects/[id]` should now be available. Test it with:

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "${BACKEND_URL}/api/admin/projects/PROJECT_ID"
```

## Testing the Evaluation Builder

### Test Case 1: Project Detail Page

1. Log in as admin at `/admin/login`
2. Navigate to `/admin/pipeline` to see all projects
3. Click on any project card to view the Project Detail page
4. Verify the following sections display correctly:
   - Player Information (name, class, position, school, etc.)
   - Contact Information (parent details)
   - Stats Snapshot (PPG, APG, RPG, etc.)
   - Self Evaluation (strengths, improvement areas, pride tags)
   - Film & Links (YouTube/Hudl links)
   - Package Info (elite_track/development/basic)
   - Deliverables checklist with status
   - Internal Notes section

### Test Case 2: Evaluation Packet

1. From the Project Detail page, click the **"Evaluation Packet"** button
2. Verify the printable packet loads with all 7 pages:
   - **Page 1**: Front cover with player name and branding
   - **Page 2-3**: Full scouting report with:
     - Player Information
     - Physical Profile
     - Skill Assessment (Offense & Defense)
     - Basketball IQ
     - Statistical Snapshot
     - Intangibles
     - Strengths & Development Areas
   - **Page 4**: Quick Scout Sheet (courtside reference)
   - **Page 5**: Coach's Notes (lined paper for handwritten notes)
   - **Page 6**: Development Framework Reference
   - **Page 7**: Back cover with mission statement

3. Test the **Print/Save PDF** button - it should trigger browser print dialog
4. Verify print styling hides the navigation header and shows all pages

### Test Case 3: Deliverable Generation

1. In Project Detail, locate the Deliverables section
2. Click **"Generate"** on a pending deliverable
3. Verify the status updates to "complete"
4. Test downloading completed deliverables

### Test Case 4: Project Status Updates

1. Use the status dropdown to change project status
2. Verify status updates correctly in the pipeline
3. Test adding internal notes and saving

## Sample Test Data

After running the loader, you'll have these players:

| Player | Class | Position | Package | Status |
|--------|-------|----------|---------|--------|
| Maya Johnson | 2028 | PG/SG | elite_track | requested |
| Sophia Williams | 2029 | SF/PF | development | in_review |
| Zoe Martinez | 2027 | SG/SF | elite_track | drafting |
| Ava Thompson | 2029 | PG | basic | design |
| Isabella Chen | 2028 | C/PF | elite_track | delivered |

## Troubleshooting

### Blank Page on Evaluation Packet

If the evaluation packet shows a blank page:
1. Check browser console for errors
2. Verify the admin token is valid: `localStorage.getItem('hwh_token')`
3. Test the API endpoint directly with curl
4. Check that the project ID exists in the database

### Missing Player Data

If player data doesn't display:
1. Verify the player record exists in Supabase
2. Check that intake_submission exists for the player
3. Ensure the API response includes the `player` and `intake_submission` fields

### Print Styles Not Applied

If print styles don't work:
1. Verify the `<style jsx>` block is in the PlayerEvaluation component
2. Check browser print preview settings
3. Try using Chrome's print to PDF feature

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/projects/:id` | GET | Get project details with player, intake, deliverables, reminders |
| `/api/admin/projects/:id` | PATCH | Update project status, notes, payment_status |
| `/api/admin/pipeline` | GET | Get all projects grouped by status |
| `/api/admin/pipeline` | PATCH | Update project status (drag & drop) |

## Files Modified/Created

1. `functions/api/admin/projects/[id]/index.js` - NEW: Project detail endpoint
2. `scripts/load_test_projects.js` - NEW: Test data loader
3. `frontend/src/pages/PlayerEvaluation.js` - EXISTING: Evaluation packet UI
4. `frontend/src/pages/ProjectDetail.js` - EXISTING: Project detail UI

## Next Steps

After testing confirms everything works:
1. Commit the changes
2. Deploy to Cloudflare Pages
3. Test on the live environment
4. Add more sample data as needed

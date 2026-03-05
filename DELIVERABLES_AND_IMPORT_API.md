# Elite GBB - Deliverables & Bulk Import API Documentation

## Overview

This document describes the PDF/PNG deliverable generation and bulk import features for the Elite GBB platform.

---

## 📄 PDF Deliverables API

Generate professional PDF deliverables for players with HWH branding.

**Base URL:** `/api/admin/deliverables/pdf/{type}/{playerId}`

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/deliverables/pdf/one-pager/{playerId}` | Player One-Pager (Recruiting Profile) |
| `GET /api/admin/deliverables/pdf/tracking-profile/{playerId}` | Tracking Profile (Detailed Stats & Progress) |
| `GET /api/admin/deliverables/pdf/film-index/{playerId}` | Film Index (Highlight Links & Notes) |

### Authentication
All endpoints require Admin JWT token in the Authorization header:
```
Authorization: Bearer <admin_jwt_token>
```

### PDF Types

#### 1. Player One-Pager
Recruiting profile summary featuring:
- Player photo area (placeholder)
- Name, position, class, school
- Key statistics (PPG, RPG, APG, SPG, FG%, 3PT%, FT%)
- Physical attributes (height, weight, gender)
- Contact information
- HWH branding colors (#0134bd blue, #fb6c1d orange)

#### 2. Tracking Profile
Detailed progress tracking featuring:
- Timeline of profile creation and updates
- Performance metrics with target comparisons
- Progress bars for profile completion, verification status, stats entry
- Scouting notes section
- Color-coded status indicators

#### 3. Film Index
Video/film management featuring:
- Film list with URLs
- Duration and type categorization
- Coach feedback notes section
- Quick stats summary
- QR code placeholder

### Example Requests

```bash
# Generate One-Pager
curl -H "Authorization: Bearer <token>" \
  https://elitegbb-app.pages.dev/api/admin/deliverables/pdf/one-pager/123-456-789

# Generate Tracking Profile
curl -H "Authorization: Bearer <token>" \
  https://elitegbb-app.pages.dev/api/admin/deliverables/pdf/tracking-profile/123-456-789

# Generate Film Index
curl -H "Authorization: Bearer <token>" \
  https://elitegbb-app.pages.dev/api/admin/deliverables/pdf/film-index/123-456-789
```

### Response
Returns HTML with print-friendly CSS. Use browser print to PDF or integrate with PDF conversion service.

```html
<!-- HTML response with embedded print styles -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Print-optimized styles with HWH branding */
    @media print {
      body { width: 8.5in; height: 11in; }
    }
  </style>
</head>
<body>
  <!-- PDF content -->
</body>
</html>
```

---

## 🏆 Verified Prospect Badge API

Generate branded PNG/SVG badges for verified players.

**Base URL:** `/api/admin/deliverables/badge/{playerId}`

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/admin/deliverables/badge/{playerId}` | Generate badge (default SVG) |
| `GET /api/admin/deliverables/badge/{playerId}?format=html` | HTML preview page |
| `GET /api/admin/deliverables/badge/{playerId}?format=png` | JSON with base64 data |
| `GET /api/admin/deliverables/badge/{playerId}?variant=compact` | Compact badge (300x120) |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `svg` | Output format: `svg`, `html`, `png` |
| `variant` | string | `full` | Badge variant: `full` (400x400), `compact` (300x120) |

### Authentication
Admin JWT token required in Authorization header.

### Badge Features

**Full Badge (400x400):**
- Star burst background with gradient
- Basketball icon
- Player name
- Position and class year
- "ELITE GBB" branding
- Gold verification checkmark (if verified)
- Player ID serial number
- Decorative corner elements

**Compact Badge (300x120):**
- Horizontal layout for email signatures
- Basketball icon
- Player name
- Class year with verification status
- ELITE GBB branding

### Example Requests

```bash
# Get SVG badge (direct)
curl -H "Authorization: Bearer <token>" \
  https://elitegbb-app.pages.dev/api/admin/deliverables/badge/123-456-789

# Get HTML preview page
curl -H "Authorization: Bearer <token>" \
  "https://elitegbb-app.pages.dev/api/admin/deliverables/badge/123-456-789?format=html"

# Get compact badge for email
curl -H "Authorization: Bearer <token>" \
  "https://elitegbb-app.pages.dev/api/admin/deliverables/badge/123-456-789?variant=compact&format=svg"
```

### Response Examples

**SVG Format (default):**
```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <!-- Badge SVG content -->
</svg>
```

**PNG Format (JSON response):**
```json
{
  "success": true,
  "player": {
    "id": "123-456-789",
    "name": "Emma Johnson",
    "verified": true
  },
  "badge": {
    "format": "svg-base64",
    "data": "PHN2Zy...",
    "width": 400,
    "height": 400,
    "downloadUrl": "data:image/svg+xml;base64,PHN2Zy...",
    "filename": "Emma_Johnson_Badge.svg"
  }
}
```

---

## 📊 Bulk Import API

Admin-only bulk import for coaches and players via CSV/XLSX.

### Coaches Import

**Endpoint:** `POST /api/admin/import/coaches`

**Template Download:** `GET /api/admin/import/coaches?format=csv`

#### CSV Format

```csv
name,email,school,title,state,auto_verify
John Smith,coach.smith@school.edu,Lincoln High School,Head Coach,TX,false
Sarah Johnson,sjohnson@academy.org,West Academy,Assistant Coach,CA,false
Mike Williams,mwilliams@district.edu,Central District,Athletic Director,FL,true
```

#### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Coach full name |
| `email` | Yes | Unique email address |
| `school` | Yes | School/organization name |
| `title` | Yes | Job title |
| `state` | Yes | 2-letter state code |
| `auto_verify` | No | Auto-verify coach (true/false) |

#### Request Options

**File Upload (multipart/form-data):**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@coaches.csv" \
  https://elitegbb-app.pages.dev/api/admin/import/coaches
```

**JSON Payload:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "coaches": [
      {"name": "John Smith", "email": "john@school.edu", "school": "Lincoln HS", "title": "Head Coach", "state": "TX"}
    ],
    "options": {"dryRun": false, "autoVerify": true}
  }' \
  https://elitegbb-app.pages.dev/api/admin/import/coaches
```

#### Response

```json
{
  "success": true,
  "summary": {
    "total": 50,
    "created": 48,
    "failed": 1,
    "skipped": 1
  },
  "created": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john@school.edu",
      "school": "Lincoln HS",
      "verified": false
    }
  ],
  "errors": [
    {
      "row": 5,
      "name": "Jane Doe",
      "email": "jane@school.edu",
      "error": "Coach with this email already exists"
    }
  ]
}
```

### Players Import

**Endpoint:** `POST /api/admin/import/players`

**Template Download:** `GET /api/admin/import/players?format=csv`

#### CSV Format

```csv
player_name,preferred_name,position,secondary_position,grad_class,gender,school,city,state,height,weight,jersey_number,instagram_handle,parent_name,parent_email,parent_phone,player_email
Emma Johnson,Em,Guard,Forward,2026,Female,Lincoln High School,Austin,TX,5'8",140,14,@emmahoops,Jennifer Johnson,jennifer@email.com,512-555-0101,emma.j@email.com
Sophia Williams,Sophie,Center,,2025,Female,West Academy,Los Angeles,CA,6'2",165,32,@sophiahoops,Maria Williams,maria@email.com,213-555-0202,sophia@email.com
```

#### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `player_name` | Yes | Full name |
| `grad_class` | Yes | Graduation year (YYYY) |
| `gender` | Yes | Male/Female |
| `school` | Yes | School name |
| `city` | Yes | City |
| `state` | Yes | 2-letter state code |
| `position` | No | Primary position (default: Guard) |
| `secondary_position` | No | Secondary position |
| `height` | No | Height (e.g., 5'8") |
| `weight` | No | Weight in lbs |
| `jersey_number` | No | Jersey number |
| `instagram_handle` | No | Instagram handle (@username) |
| `parent_name` | No | Parent/guardian name |
| `parent_email` | No | Parent email |
| `parent_phone` | No | Parent phone |
| `player_email` | No | Player email |
| `preferred_name` | No | Nickname/preferred name |

#### Features

- **Duplicate Detection:** Checks existing players by name + school + grad_class
- **Auto-generated Player Key:** Unique P-XXXXXX identifier
- **Temp Password Generation:** Secure random password with SHA-256 hash
- **Position Defaulting:** Defaults to 'Guard' if not specified

#### Request Examples

**File Upload:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@players.csv" \
  https://elitegbb-app.pages.dev/api/admin/import/players
```

**JSON Payload:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {
        "player_name": "Emma Johnson",
        "position": "Guard",
        "grad_class": "2026",
        "gender": "Female",
        "school": "Lincoln High",
        "city": "Austin",
        "state": "TX"
      }
    ]
  }' \
  https://elitegbb-app.pages.dev/api/admin/import/players
```

#### Response

```json
{
  "success": true,
  "summary": {
    "total": 100,
    "created": 98,
    "failed": 1,
    "skipped": 1
  },
  "created": [
    {
      "id": "uuid",
      "player_key": "P-A7B2C9",
      "player_name": "Emma Johnson",
      "school": "Lincoln High",
      "grad_class": "2026"
    }
  ],
  "tempCredentials": {
    "P-A7B2C9": {
      "player_name": "Emma Johnson",
      "temp_password": "aBc7xYz9",
      "login_url": "https://elitegbb-app.pages.dev/player/login"
    }
  },
  "_note": "Temp credentials are shown for demo only. In production, emails are sent directly."
}
```

---

## 🎨 Branding Guidelines

### HWH Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#0134bd` | Headers, primary elements |
| Secondary Orange | `#fb6c1d` | Accents, badges, highlights |
| White | `#ffffff` | Backgrounds, text on dark |
| Black | `#1a1a1a` | Body text |
| Gray | `#6b7280` | Secondary text |
| Gold | `#ffd700` | Verified badges, premium accents |

### Typography

- **Headlines:** Inter, Arial Black, sans-serif (bold/800 weight)
- **Body:** Inter, Arial, sans-serif (regular/600 weight)
- **Stats/Numbers:** Inter, monospace (heavy weight)

---

## 🔐 Security Notes

1. **Admin Only:** All import and deliverable endpoints require admin role
2. **Password Security:** Temp passwords use SHA-256 with random salts
3. **Duplicate Prevention:** Email validation for coaches, name+school+class for players
4. **Development Mode:** Temp passwords shown only in development environment
5. **Production:** Email integration for password delivery

---

## 📋 Testing Checklist

### Deliverables
- [ ] One-Pager generates with player data
- [ ] Tracking Profile shows correct timeline
- [ ] Film Index includes all video links
- [ ] Badge shows verified checkmark
- [ ] Compact badge renders correctly
- [ ] HWH brand colors applied consistently

### Bulk Import
- [ ] Coaches CSV import creates accounts
- [ ] Players CSV import generates player keys
- [ ] Duplicate detection works
- [ ] Validation catches missing required fields
- [ ] Template downloads work
- [ ] JSON payload import works
- [ ] XLSX format parsing works

---

## 🚀 Next Steps / Future Enhancements

1. **PDF Conversion:** Integrate with external PDF API (e.g., Puppeteer, DocRaptor)
2. **Email Integration:** Connect SendGrid/Mailgun for welcome emails
3. **PNG Rendering:** Server-side PNG generation from SVG
4. **Batch Badge Generation:** Generate badges for multiple players at once
5. **Import Preview:** Dry-run mode showing changes before commit
6. **Progress Tracking:** WebSocket updates for large imports

---

**Last Updated:** March 5, 2025
**API Version:** 1.0
**Contact:** lrevell8@icloud.com

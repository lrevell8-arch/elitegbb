# EliteGBB API Test Credentials & Endpoint Guide

**Base URL:** `https://app.elitegbb.com/api`

---

## 🔑 Test Credentials Summary

| Role | Email | Password | Status | Notes |
|------|-------|----------|--------|-------|
| **Admin** | `admin@hoopwithher.com` | `AdminPass123!` | Must be seeded | Full dashboard access |
| **Coach (Verified)** | `coach@university.edu` | `CoachPass123!` | Must be seeded | Can login immediately |
| **Coach (New)** | `newcoach@school.edu` | `AnyPass123!` | Auto-created | Needs verification or set `REQUIRE_COACH_VERIFICATION=false` |
| **Player** | N/A | N/A | Anonymous | Intake form submission |

---

## 🚀 Quick Test Script

### 1. Health Check (No Auth Required)
```bash
curl -s https://app.elitegbb.com/api/health | jq .
```
**Expected:** `{"status": "healthy", "database": "supabase|mongodb"}`

---

## 👤 Admin Endpoints

### Create Admin User (First Time Setup)
```bash
curl -X POST https://app.elitegbb.com/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hoopwithher.com",
    "password": "AdminPass123!",
    "name": "System Administrator"
  }'
```

### Admin Login
```bash
curl -X POST https://app.elitegbb.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hoopwithher.com",
    "password": "AdminPass123!"
  }' | jq .
```
**Response:** `{"token": "eyJhbGciOiJIUzI1NiIs...", "user": {...}}`

### Admin Dashboard Stats
```bash
export ADMIN_TOKEN="your_token_here"

curl -s https://app.elitegbb.com/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

### Export Players (CSV)
```bash
curl -X POST https://app.elitegbb.com/api/admin/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"export_type": "players", "format": "csv"}' | jq .
```

---

## 🏀 Coach Endpoints

### Coach Registration
```bash
curl -X POST https://app.elitegbb.com/api/coach/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcoach@university.edu",
    "password": "CoachPass123!",
    "name": "Coach Smith",
    "school": "State University",
    "title": "Head Coach",
    "state": "CA"
  }' | jq .
```
**Expected Response:**
```json
{
  "id": "uuid",
  "email": "testcoach@university.edu",
  "name": "Coach Smith",
  "message": "Registration successful. Your account is pending verification."
}
```

### Coach Login
```bash
curl -X POST https://app.elitegbb.com/api/coach/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcoach@university.edu",
    "password": "CoachPass123!"
  }' | jq .
```

**With Verification Required (default):**
```json
{"detail": "Account pending verification. Please wait for admin approval or contact support."}
```
Status: `403 Forbidden`

**With Verification Disabled (`REQUIRE_COACH_VERIFICATION=false`):**
```json
{"token": "eyJhbGciOiJIUzI1NiIs...", "user": {...}}
```
Status: `200 OK`

### Verify Coach (Admin Action via MongoDB)
```bash
# Connect to MongoDB and verify the coach
mongosh "mongodb://localhost:27017/hwh_player_advantage" --eval '
db.coaches.updateOne(
  {email: "testcoach@university.edu"},
  {$set: {is_verified: true}}
)
'
```

### Get Coach Profile
```bash
export COACH_TOKEN="your_coach_token_here"

curl -s https://app.elitegbb.com/api/coach/me \
  -H "Authorization: Bearer $COACH_TOKEN" | jq .
```

### Browse Prospects
```bash
curl -s "https://app.elitegbb.com/api/coach/prospects?state=CA&class=2026" \
  -H "Authorization: Bearer $COACH_TOKEN" | jq .
```

---

## 💳 Coach Subscription (Stripe)

### Get Subscription Tiers (Public)
```bash
curl -s https://app.elitegbb.com/api/coach/subscription/tiers | jq .
```
**Response:**
```json
{
  "tiers": {
    "basic": {"price": 99.00, "features": [...]},
    "premium": {"price": 299.00, "features": [...]},
    "elite": {"price": 499.00, "features": [...]}
  }
}
```

### Create Checkout Session (Coach must be logged in)
```bash
curl -X POST https://app.elitegbb.com/api/coach/subscription/checkout \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "premium",
    "success_url": "https://app.elitegbb.com/coach/subscription/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://app.elitegbb.com/coach/subscription"
  }' | jq .
```
**Response:** `{"url": "https://checkout.stripe.com/pay/cs_..."}`

### Check Subscription Status
```bash
curl -s https://app.elitegbb.com/api/coach/subscription/status \
  -H "Authorization: Bearer $COACH_TOKEN" | jq .
```

---

## 👤 Player Intake (Stripe Payment)

### Submit Player Intake + Create Checkout
```bash
curl -X POST https://app.elitegbb.com/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "player_name": "Jane Doe",
    "graduation_class": 2026,
    "position": "Point Guard",
    "height": "5\\'8\\"",
    "gpa": 3.8,
    "school": "Lincoln High School",
    "state": "CA",
    "parent_name": "John Doe",
    "parent_email": "parent@example.com",
    "phone": "555-123-4567",
    "package": "development",
    "video_url": "https://youtube.com/watch?v=...",
    "stats": {"ppg": 15.5, "apg": 6.2}
  }' | jq .
```
**Response:**
```json
{
  "message": "Intake submitted successfully",
  "checkout_url": "https://checkout.stripe.com/pay/cs_...",
  "player_id": "uuid"
}
```

### Check Payment Status
```bash
curl -s https://app.elitegbb.com/api/payments/status/cs_xxxxxxxxx | jq .
```

---

## 🔐 Password Reset

### Request Password Reset (Sends Email via SES)
```bash
curl -X POST https://app.elitegbb.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "testcoach@university.edu"}' | jq .
```
**Response:** `{"message": "If an account exists with this email, a password reset link has been sent."}`

### Reset Password (Use Token from Email)
```bash
curl -X POST https://app.elitegbb.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_from_email",
    "new_password": "NewPass123!"
  }' | jq .
```

---

## ⚙️ Environment Configuration

### Current Settings (Cloudflare Env Vars)

| Variable | Production Value | Purpose |
|----------|------------------|---------|
| `EMAIL_PROVIDER` | `ses` | Send real emails via AWS SES |
| `REQUIRE_COACH_VERIFICATION` | `true` | Coaches need admin approval |
| `STRIPE_API_KEY` | `sk_live_...` | Live Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook verification |

### To Enable Immediate Coach Login (Skip Verification):
In Cloudflare Dashboard → set `REQUIRE_COACH_VERIFICATION=false`

---

## 🧪 Automated Test Suite

Run the full test suite:
```bash
cd /home/user/webapp/backend
cd /home/user/webapp/backend
pytest tests/test_hwh_api.py -v
```

Or with environment variable:
```bash
REACT_APP_BACKEND_URL=https://app.elitegbb.com pytest tests/test_hwh_api.py -v
```

---

## 🔍 Debugging Tips

### Check MongoDB Data
```bash
# List all coaches
mongosh "mongodb://localhost:27017/hwh_player_advantage" --eval 'db.coaches.find().pretty()'

# Check specific coach
mongosh "mongodb://localhost:27017/hwh_player_advantage" --eval 'db.coaches.findOne({email: "testcoach@university.edu"})'

# Verify a coach
mongosh "mongodb://localhost:27017/hwh_player_advantage" --eval 'db.coaches.updateOne({email: "testcoach@university.edu"}, {$set: {is_verified: true}})'

# List all password reset tokens
mongosh "mongodb://localhost:27017/hwh_player_advantage" --eval 'db.password_reset_tokens.find().pretty()'
```

### Check Email Logs (if EMAIL_PROVIDER=mock)
```bash
# View server logs
cloudflared logs tail

# Or check Cloudflare Pages Functions logs in Dashboard
```

### Test Stripe Webhook
```bash
curl -X POST https://app.elitegbb.com/api/webhook/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"test": true}'
```

---

## 🚨 Common Issues & Solutions

### Issue: Coach login returns 403 "pending verification"
**Solution:** Either:
1. Set `REQUIRE_COACH_VERIFICATION=false` in Cloudflare env vars, OR
2. Verify the coach manually in MongoDB:
   ```javascript
   db.coaches.updateOne({email: "coach@example.com"}, {$set: {is_verified: true}})
   ```

### Issue: Password reset emails not received
**Solution:** Check:
1. `EMAIL_PROVIDER` is set to `ses` (not `mock`)
2. AWS SES credentials are configured in Cloudflare
3. `SES_FROM_EMAIL` is verified in AWS SES console
4. Check spam folders

### Issue: Stripe checkout not working
**Solution:** Check:
1. `STRIPE_API_KEY` is live key (sk_live_...) in Cloudflare
2. `STRIPE_WEBHOOK_SECRET` is configured
3. Webhook endpoint URL is correct in Stripe dashboard
4. Success/Cancel URLs are publicly accessible

---

## 📋 Test Checklist

- [ ] Health check returns 200
- [ ] Admin can login and get token
- [ ] Admin can view stats and export data
- [ ] Coach can register
- [ ] Coach can login (if verification disabled or manually verified)
- [ ] Coach subscription tiers are accessible
- [ ] Coach can create Stripe checkout session
- [ ] Player intake creates Stripe checkout URL
- [ ] Password reset email is sent (check SES/logs)
- [ ] Password reset token works
- [ ] Stripe webhook receives events

---

**Last Updated:** 2026-02-15
**API Version:** 1.0

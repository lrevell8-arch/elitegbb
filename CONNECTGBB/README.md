# CONNECTGBB (Next.js + Cloudflare Pages)

## Cloudflare Pages setup (connect.elitegbb.com)

**Project name:** connectgbb  
**Root directory:** `CONNECTGBB`  
**Build command:** `npm run pages:build`  
**Build output directory:** `.open-next/assets`

### Required environment variables
Set these in both **Production** and **Preview** environments:

- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (webhooks)
- `STRIPE_WEBHOOK_SECRET` (webhooks)
- `NEXT_PUBLIC_STRIPE_PRICE_ID_DEVELOPMENT`
- `NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE`

### Local development

```bash
npm install
npm run dev
```

### Local Cloudflare preview

```bash
npm run pages:build
npm run pages:preview
```

### Notes
- Build output lives in `.open-next/assets`.
- API routes require Supabase credentials at runtime.
- Stripe webhooks require `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

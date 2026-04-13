# Cloudflare Deployment Hotfix Notes

## 1) Build failure: Next.js peer dependency conflict

If your Cloudflare build fails with `npm ERR! ERESOLVE could not resolve` for `@cloudflare/next-on-pages`, you have two safe options:

1. Pin Next.js to a supported range for your installed `@cloudflare/next-on-pages`.
2. Keep your current Next version and set:

```bash
NPM_FLAGS=--legacy-peer-deps
```

This repository now sets `NPM_FLAGS=--legacy-peer-deps` in both `wrangler.toml` files to reduce install-time peer dependency build failures.

## 2) Runtime 500 on live deployment

Use `GET /api/debug/env` and verify these runtime variables are configured:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

The debug endpoint reports booleans only (never secret values), including `SUPABASE_SERVICE_ROLE_KEY` presence.

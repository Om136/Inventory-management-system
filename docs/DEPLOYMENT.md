# Deployment

This repo is a monorepo:

- `apps/backend` (Express API)
- `apps/frontend` (Next.js)
- `packages/db` (Prisma + Postgres adapter)

## Target hosting

- Frontend: Vercel
- Backend: Render

## Backend on Render (recommended)

Deploy from the repo root so npm workspaces can resolve `packages/db`.

Render settings:

- Service type: Web Service
- Root Directory: (repo root)
- Build Command: `npm ci`
- Start Command: `npm run start:backend`
- Health Check Path: `/health`

Required Render environment variables:

- `DATABASE_URL` (Neon Postgres connection string; include `sslmode=require`)
- `NODE_ENV=production`
- `TRUST_PROXY=1`
- `CORS_ORIGIN=https://YOUR_VERCEL_DOMAIN`

Optional stability variable:

- `DB_KEEPALIVE_MS=300000` (DB ping every 5 minutes)

Blueprint (optional): see [render.yaml](../render.yaml).

Post-deploy validation:

- `GET https://YOUR_RENDER_URL/health`
- `GET https://YOUR_RENDER_URL/health/db`

## Frontend on Vercel

Vercel settings:

- Root Directory: `apps/frontend`
- Framework preset: Next.js

Required Vercel environment variable:

- `NEXT_PUBLIC_API_BASE_URL=https://YOUR_RENDER_BACKEND_DOMAIN`

Set it for Production (and Preview if you want preview URLs working).

## CORS wiring

After Vercel assigns your production domain:

- Set Render `CORS_ORIGIN=https://YOUR_VERCEL_PROD_DOMAIN`

If you need preview deployments to access the API:

- Add preview domains to `CORS_ORIGIN` (comma-separated), or
- Temporarily set `CORS_ORIGIN=*` while testing (less secure).

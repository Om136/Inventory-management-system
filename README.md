# Inventory Management System

An inventory visibility system for tracking stock across locations, logging stock movements, and surfacing low/dead stock.

## What you can do

- View inventory by product/location with health status (Healthy / Low / Dead)
- Move stock using movement types: IN, OUT, DAMAGE, TRANSFER
- View full audit trail of movements
- Admin tools: create/edit products, create locations
- Download an inventory snapshot as an Excel file

## Tech stack

- Frontend: Next.js (App Router) + Tailwind
- Backend: Express.js
- Database: Postgres (Neon) via Prisma

## Project structure

- `apps/backend` (Express API)
- `apps/frontend` (Next.js app)
- `packages/db` (Prisma + Postgres adapter)

Key pages:

- `/dashboard` (alerts + health)
- `/inventory` (read-only inventory)
- `/move-stock` (log stock movements)
- `/movements` (audit trail)
- `/admin` (master data + export)

Key API endpoints:

- `GET /health` (service health)
- `GET /health/db` (database connectivity)
- `GET /exports/inventory-snapshot.xlsx` (Excel export)

## Local development

### 1) Configure environment

Backend requires `DATABASE_URL`.

- Copy `apps/backend/.env.example` to `apps/backend/.env` and fill values.

Frontend needs the backend URL.

- Copy `apps/frontend/.env.example` to `apps/frontend/.env.local` (or `.env`) and set `NEXT_PUBLIC_API_BASE_URL`.

### 2) Install dependencies

From repo root:

```bash
npm install
```

Useful scripts (run from repo root):

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run build:frontend`
- `npm run start:backend`
- `npm run start:frontend`
- `npm run seed`

### Seed demo data (optional)

This will create a mix of Products/Locations/Stock and Stock Movements (IN/OUT/DAMAGE/TRANSFER) so you can see Dashboard alerts, Inventory status, and the Movements page populated.

Requirements:

- `DATABASE_URL` must be set (pointing to your dev/demo database).

Run (safe default: skips if products already exist):

```bash
npm run seed
```

Force seed even if products exist:

PowerShell:

```powershell
$env:SEED_FORCE = "1"; npm run seed
```

Reset (deletes Product/Location/Stock/Movements and reseeds):

PowerShell:

```powershell
$env:SEED_RESET = "1"; npm run seed
```

### 3) Run backend + frontend (two terminals)

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Frontend: http://localhost:3000
Backend: http://localhost:4000

## Troubleshooting

### Render fails with Prisma error: "Cannot find module '.prisma/client/default'"

This means Prisma Client was not generated in the build.

Fix:

- Keep Render build command as `npm ci` (it runs workspace postinstall hooks).
- If you override the build command, include generate with the correct schema path:
  - `npx prisma generate --schema packages/db/prisma/schema.prisma`

### Frontend works locally but fails on Vercel (API errors)

Checklist:

- Vercel env var `NEXT_PUBLIC_API_BASE_URL` points to your Render URL (https).
- Render env var `CORS_ORIGIN` equals your Vercel domain (https).

### Render is up but DB calls fail

- Check `https://YOUR_RENDER_URL/health/db`
- Verify `DATABASE_URL` includes `sslmode=require` for Neon.

## Deploy: Frontend on Vercel + Backend on Render

### 1) Deploy backend (Render)

Recommended approach for this monorepo: deploy from the repo root (so npm workspaces can resolve `packages/db`).

- Service type: **Web Service**
- Root Directory: (leave empty / repo root)
- Build Command: `npm ci`
- Start Command: `npm run start:backend`
- Health Check Path: `/health`

**Render environment variables**

- `DATABASE_URL` (required)
- `NODE_ENV=production`
- `TRUST_PROXY=1`
- `CORS_ORIGIN=https://YOUR_VERCEL_DOMAIN` (recommended)
  - You can provide multiple origins as a comma-separated list.
  - If you want to temporarily allow all origins, set `CORS_ORIGIN=*` (less secure).

Optional stability setting:

- `DB_KEEPALIVE_MS=300000` (pings DB every 5 minutes; helps avoid long-idle disconnect issues)

After deploy, copy your Render backend URL (for example `https://inventory-backend.onrender.com`).

Optional: there is a starter Render blueprint file at [render.yaml](render.yaml).

Post-deploy validation:

- Open `https://YOUR_RENDER_URL/health`
- Open `https://YOUR_RENDER_URL/health/db`

### 2) Deploy frontend (Vercel)

- Project root directory: `apps/frontend`
- Framework preset: Next.js

**Vercel environment variables**

- `NEXT_PUBLIC_API_BASE_URL=https://YOUR_RENDER_BACKEND_DOMAIN`

Set this for **Production** at minimum. If you use Preview deployments, set it for Preview too.

### 3) Connect CORS

Once Vercel gives you the production domain, set Render:

- `CORS_ORIGIN=https://YOUR_VERCEL_PROD_DOMAIN`

If you also want Vercel Preview to work, either:

- add specific preview domains to `CORS_ORIGIN` (comma-separated), or
- temporarily set `CORS_ORIGIN=*` during testing.

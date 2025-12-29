# Inventory Management System

Monorepo with:
- `apps/backend` (Express API)
- `apps/frontend` (Next.js app)
- `packages/db` (Prisma + Postgres adapter)

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

### Seed demo data (optional)

This will create a mix of Products/Locations/Stock and Stock Movements (IN/OUT/DAMAGE/TRANSFER) so you can see Dashboard alerts, Inventory status, and the Movements page populated.

Requirements:
- `DATABASE_URL` must be set (pointing to your dev database).

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
Backend:  http://localhost:4000

## Production / deployment notes

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

After deploy, copy your Render backend URL (for example `https://inventory-backend.onrender.com`).

Optional: there is a starter Render blueprint file at [render.yaml](render.yaml).

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

### Backend (Express)

- Start command: `npm run start:backend`
- Required env:
  - `DATABASE_URL`
- Recommended env:
  - `NODE_ENV=production`
  - `CORS_ORIGIN=https://your-frontend-domain` (or comma-separated list)

### Frontend (Next.js)

- Build command: `npm run build:frontend`
- Start command (Node hosting): `npm run start:frontend`
- Required env:
  - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain`

### Typical hosting setup

- Deploy backend as a Web Service (Render/Railway/Fly/etc.)
- Deploy frontend on Vercel (or any Node hosting)
- Point `NEXT_PUBLIC_API_BASE_URL` to the backend URL
- Set backend `CORS_ORIGIN` to the frontend URL

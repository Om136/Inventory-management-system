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

## Docs

- Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Troubleshooting: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

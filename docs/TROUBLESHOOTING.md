# Troubleshooting

## Render fails with Prisma error: "Cannot find module '.prisma/client/default'"

Cause: Prisma Client was not generated during the build.

Fix:

- Keep Render build command as `npm ci` (it runs workspace postinstall hooks), OR
- If you override the build command, include generate with the correct schema path:
  - `npx prisma generate --schema packages/db/prisma/schema.prisma`

## Frontend works locally but fails on Vercel (API errors)

Checklist:

- Vercel env var `NEXT_PUBLIC_API_BASE_URL` points to your Render URL (https).
- Render env var `CORS_ORIGIN` equals your Vercel domain (https).

## Render is up but DB calls fail

- Check `GET https://YOUR_RENDER_URL/health/db`
- Verify `DATABASE_URL` is correct and includes `sslmode=require` for Neon.

## Backend crashes after long idle (Neon)

Mitigations used in this project:

- DB pool auto-recovery on pool errors
- Optional periodic DB keep-alive ping (set `DB_KEEPALIVE_MS`)

If you still see issues:

- Prefer Neon pooled connection string (if available)
- Check Render logs for connection errors/timeouts

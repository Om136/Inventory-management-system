require("dotenv/config");

const { createApp } = require("./app");
const { disconnectDb } = require("db");
const { prisma } = require("./utils/prisma");

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = createApp();

function startDbKeepAlive() {
  const isProd = process.env.NODE_ENV === "production";

  // Default: enable in production every 5 minutes, off in dev unless explicitly set.
  const defaultMs = isProd ? 5 * 60 * 1000 : 0;
  const intervalMsRaw = process.env.DB_KEEPALIVE_MS;
  const intervalMs = intervalMsRaw ? Number(intervalMsRaw) : defaultMs;

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;

  setInterval(async () => {
    try {
      // Lightweight ping. Uses Prisma so it exercises the same adapter/pool.
      await prisma().$queryRaw`SELECT 1`;
    } catch (err) {
      console.error("[db] keepalive ping failed (will reset connections)", err);
      try {
        await disconnectDb();
      } catch {
        // ignore
      }
    }
  }, intervalMs).unref?.();
}

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  startDbKeepAlive();
});

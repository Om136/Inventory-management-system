const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

let prismaSingleton;
let poolSingleton;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Provide it in your environment (e.g. apps/backend/.env or packages/db/.env)."
    );
  }
  return databaseUrl;
}

function getPool() {
  if (!poolSingleton) {
    const connectionString = getDatabaseUrl();

  
    const needsSsl = /sslmode=require/i.test(connectionString);

    poolSingleton = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      max: 10,
      keepAlive: true,
      keepAliveInitialDelayMillis: 30_000,
    });

    
    poolSingleton.on("error", (err) => {
      console.error("[db] pool error (will reset connections)", err);

      const poolToClose = poolSingleton;
      poolSingleton = undefined;

      const prismaToClose = prismaSingleton;
      prismaSingleton = undefined;

      if (prismaToClose) {
        prismaToClose.$disconnect().catch(() => {});
      }
      if (poolToClose) {
        poolToClose.end().catch(() => {});
      }
    });
  }
  return poolSingleton;
}

function getPrisma() {
  if (!prismaSingleton) {
    const adapter = new PrismaPg(getPool());
    prismaSingleton = new PrismaClient({ adapter });
  }
  return prismaSingleton;
}

async function disconnectDb() {
  if (prismaSingleton) {
    await prismaSingleton.$disconnect();
    prismaSingleton = undefined;
  }
  if (poolSingleton) {
    await poolSingleton.end();
    poolSingleton = undefined;
  }
}

module.exports = {
  getPrisma,
  getPool,
  disconnectDb,
};

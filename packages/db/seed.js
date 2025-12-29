require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to packages/db/.env (or your environment) before running the seed script."
    );
  }
  return databaseUrl;
}

function needsSsl(connectionString) {
  return /sslmode=require/i.test(connectionString);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const databaseUrl = getDatabaseUrl();
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: needsSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getOrCreateLocation(name) {
  const existing = await prisma.location.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.location.create({ data: { name } });
}

async function upsertProduct({ skuCode, name, unit, reorderLevel }) {
  return prisma.product.upsert({
    where: { skuCode },
    update: { name, unit, reorderLevel },
    create: { skuCode, name, unit, reorderLevel },
  });
}

async function ensureStockRow({ productId, locationId }) {
  return prisma.stock.upsert({
    where: { productId_locationId: { productId, locationId } },
    update: {},
    create: { productId, locationId, quantity: 0 },
  });
}

async function applyMovement({
  productId,
  type,
  quantity,
  fromLocationId = null,
  toLocationId = null,
  reason = null,
  createdAt,
}) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity: ${quantity}`);
  }

  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity,
        fromLocationId,
        toLocationId,
        reason,
        createdAt,
      },
    });

    if (fromLocationId) {
      const stock = await tx.stock.upsert({
        where: {
          productId_locationId: { productId, locationId: fromLocationId },
        },
        update: {},
        create: { productId, locationId: fromLocationId, quantity: 0 },
      });

      const nextQty = Number(stock.quantity) - quantity;
      if (nextQty < -1e-9) {
        throw new Error(
          `Insufficient stock for productId=${productId} at locationId=${fromLocationId}. Have ${stock.quantity}, need ${quantity}.`
        );
      }

      await tx.stock.update({
        where: { id: stock.id },
        data: { quantity: nextQty },
      });
    }

    if (toLocationId) {
      await tx.stock.upsert({
        where: {
          productId_locationId: { productId, locationId: toLocationId },
        },
        update: { quantity: { increment: quantity } },
        create: { productId, locationId: toLocationId, quantity },
      });
    }

    return movement;
  });
}

async function main() {
  const isReset = process.env.SEED_RESET === "1";
  const isForce = process.env.SEED_FORCE === "1";

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0 && !isReset && !isForce) {
    console.log(
      "ℹ️  Seed skipped: database already contains products. Set SEED_FORCE=1 to seed anyway, or SEED_RESET=1 to wipe and reseed."
    );
    return;
  }

  if (isReset) {
    console.log("⚠️  SEED_RESET=1: deleting existing data...");
    await prisma.stockMovement.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.location.deleteMany();
    await prisma.product.deleteMany();
  }

  // 1) Locations
  const warehouse = await getOrCreateLocation("Main Warehouse - Bengaluru");
  const siteA = await getOrCreateLocation("Construction Site - Whitefield");
  const siteB = await getOrCreateLocation("Construction Site - Electronic City");
  const yard = await getOrCreateLocation("Yard - Peenya");
  const damaged = await getOrCreateLocation("Scrap / Damaged Goods");

  // 2) Products (mix of units + reorder levels)
  const cement = await upsertProduct({
    skuCode: "CEM-UT-53",
    name: "UltraTech Cement 53 Grade",
    unit: "Bags",
    reorderLevel: 50,
  });
  const steel = await upsertProduct({
    skuCode: "STL-TMT-12",
    name: "TMT Steel Bar 12mm",
    unit: "Tons",
    reorderLevel: 5,
  });
  const sand = await upsertProduct({
    skuCode: "SND-RIV-01",
    name: "River Sand (washed)",
    unit: "Tons",
    reorderLevel: 10,
  });
  const bricks = await upsertProduct({
    skuCode: "BRK-RED-01",
    name: "Red Clay Bricks",
    unit: "Pallets",
    reorderLevel: 20,
  });
  const paint = await upsertProduct({
    skuCode: "PNT-INT-20",
    name: "Interior Paint 20L",
    unit: "Cans",
    reorderLevel: 10,
  });

  // 3) Ensure stock rows exist (so inventory shows multiple combos)
  await Promise.all([
    ensureStockRow({ productId: cement.id, locationId: warehouse.id }),
    ensureStockRow({ productId: cement.id, locationId: siteA.id }),
    ensureStockRow({ productId: cement.id, locationId: siteB.id }),
    ensureStockRow({ productId: steel.id, locationId: warehouse.id }),
    ensureStockRow({ productId: steel.id, locationId: siteB.id }),
    ensureStockRow({ productId: sand.id, locationId: warehouse.id }),
    ensureStockRow({ productId: sand.id, locationId: siteA.id }),
    ensureStockRow({ productId: bricks.id, locationId: warehouse.id }),
    ensureStockRow({ productId: bricks.id, locationId: siteA.id }),
    ensureStockRow({ productId: paint.id, locationId: warehouse.id }),
    ensureStockRow({ productId: paint.id, locationId: yard.id }),
    ensureStockRow({ productId: paint.id, locationId: damaged.id }),
  ]);

  // 4) Movements (mix of IN / TRANSFER / OUT / DAMAGE)
  //    We backdate createdAt so Dashboard "Days Idle" + Movements page show variety.

  // Cement: healthy at warehouse, dead+low at Site A
  await applyMovement({
    productId: cement.id,
    type: "IN",
    quantity: 800,
    toLocationId: warehouse.id,
    reason: "Vendor delivery",
    createdAt: daysAgo(90),
  });

  await applyMovement({
    productId: cement.id,
    type: "TRANSFER",
    quantity: 120,
    fromLocationId: warehouse.id,
    toLocationId: siteA.id,
    reason: "Issued to Site A",
    createdAt: daysAgo(70),
  });

  await applyMovement({
    productId: cement.id,
    type: "OUT",
    quantity: 110,
    fromLocationId: siteA.id,
    reason: "Foundation work consumption",
    createdAt: daysAgo(65),
  });

  await applyMovement({
    productId: cement.id,
    type: "DAMAGE",
    quantity: 5,
    fromLocationId: siteA.id,
    reason: "Bags spoiled due to moisture",
    createdAt: daysAgo(62),
  });

  await applyMovement({
    productId: cement.id,
    type: "IN",
    quantity: 500,
    toLocationId: warehouse.id,
    reason: "Top-up purchase",
    createdAt: daysAgo(2),
  });

  // Steel: low stock in warehouse and at Site B
  await applyMovement({
    productId: steel.id,
    type: "IN",
    quantity: 20,
    toLocationId: warehouse.id,
    reason: "Steel received",
    createdAt: daysAgo(30),
  });

  await applyMovement({
    productId: steel.id,
    type: "TRANSFER",
    quantity: 18,
    fromLocationId: warehouse.id,
    toLocationId: siteB.id,
    reason: "Issued to Site B",
    createdAt: daysAgo(5),
  });

  await applyMovement({
    productId: steel.id,
    type: "OUT",
    quantity: 16,
    fromLocationId: siteB.id,
    reason: "Rebar installed",
    createdAt: daysAgo(1),
  });

  // Sand: healthy, moved recently
  await applyMovement({
    productId: sand.id,
    type: "IN",
    quantity: 40,
    toLocationId: warehouse.id,
    reason: "Sand delivery",
    createdAt: daysAgo(45),
  });
  await applyMovement({
    productId: sand.id,
    type: "TRANSFER",
    quantity: 10,
    fromLocationId: warehouse.id,
    toLocationId: siteA.id,
    reason: "Issued to Site A",
    createdAt: daysAgo(20),
  });
  await applyMovement({
    productId: sand.id,
    type: "OUT",
    quantity: 6,
    fromLocationId: siteA.id,
    reason: "Plastering",
    createdAt: daysAgo(3),
  });

  // Bricks: show out-of-stock at Site A
  await applyMovement({
    productId: bricks.id,
    type: "IN",
    quantity: 50,
    toLocationId: warehouse.id,
    reason: "Bricks received",
    createdAt: daysAgo(25),
  });
  await applyMovement({
    productId: bricks.id,
    type: "TRANSFER",
    quantity: 20,
    fromLocationId: warehouse.id,
    toLocationId: siteA.id,
    reason: "Issued to Site A",
    createdAt: daysAgo(10),
  });
  await applyMovement({
    productId: bricks.id,
    type: "OUT",
    quantity: 20,
    fromLocationId: siteA.id,
    reason: "Masonry work",
    createdAt: daysAgo(5),
  });

  // Paint: dead stock sitting for a long time + some damaged
  await applyMovement({
    productId: paint.id,
    type: "IN",
    quantity: 30,
    toLocationId: warehouse.id,
    reason: "Paint stocked",
    createdAt: daysAgo(130),
  });
  await applyMovement({
    productId: paint.id,
    type: "TRANSFER",
    quantity: 25,
    fromLocationId: warehouse.id,
    toLocationId: yard.id,
    reason: "Moved to yard storage",
    createdAt: daysAgo(100),
  });
  await applyMovement({
    productId: paint.id,
    type: "DAMAGE",
    quantity: 2,
    fromLocationId: yard.id,
    reason: "Cans punctured",
    createdAt: daysAgo(95),
  });
  await applyMovement({
    productId: paint.id,
    type: "TRANSFER",
    quantity: 3,
    fromLocationId: yard.id,
    toLocationId: damaged.id,
    reason: "Moved to damaged goods",
    createdAt: daysAgo(90),
  });

  console.log("✅ Database seeded with demo inventory + movements!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

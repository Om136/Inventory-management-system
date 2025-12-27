require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to packages/db/.env (or your environment) before running the seed script."
  );
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create Locations
  const warehouse = await prisma.location.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Main Warehouse - Bengaluru" },
  });

  const siteA = await prisma.location.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "Construction Site - Whitefield" },
  });

  // 2. Create Products (AEC Materials)
  const cement = await prisma.product.upsert({
    where: { skuCode: "CEM-UT-53" },
    update: {
      name: "UltraTech Cement 53 Grade",
      unit: "Bags",
      reorderLevel: 50,
    },
    create: {
      skuCode: "CEM-UT-53",
      name: "UltraTech Cement 53 Grade",
      unit: "Bags",
      reorderLevel: 50,
    },
  });

  const steel = await prisma.product.upsert({
    where: { skuCode: "STL-TMT-12" },
    update: {
      name: "TMT Steel Bar 12mm",
      unit: "Tons",
      reorderLevel: 5,
    },
    create: {
      skuCode: "STL-TMT-12",
      name: "TMT Steel Bar 12mm",
      unit: "Tons",
      reorderLevel: 5,
    },
  });

  // 3. Add Initial Stock
  await prisma.stock.upsert({
    where: {
      productId_locationId: { productId: cement.id, locationId: warehouse.id },
    },
    update: { quantity: 500 },
    create: { productId: cement.id, locationId: warehouse.id, quantity: 500 },
  });

  await prisma.stock.upsert({
    where: {
      productId_locationId: { productId: steel.id, locationId: warehouse.id },
    },
    update: { quantity: 20 },
    create: { productId: steel.id, locationId: warehouse.id, quantity: 20 },
  });

  console.log("✅ Database seeded with AEC materials!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

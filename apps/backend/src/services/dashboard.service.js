const { prisma } = require("../utils/prisma");

const DEAD_DAYS = 60;

function diffDays(a, b) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function computeStatus({ quantity, reorderLevel, daysIdle }) {
  if (daysIdle > DEAD_DAYS) return "DEAD";
  if (quantity <= reorderLevel) return "LOW";
  return "HEALTHY";
}

async function getInventoryHealth() {
  const db = prisma();

  // NOTE: We use raw SQL to efficiently compute "last movement date" per (product, location).
  // A movement affects a location if it is either the fromLocation or toLocation.
  const rows = await db.$queryRaw`
    SELECT
      s."productId" AS "productId",
      s."locationId" AS "locationId",
      s."quantity" AS "quantity",
      s."updatedAt" AS "updatedAt",

      p."skuCode" AS "skuCode",
      p."name" AS "productName",
      p."unit" AS "unit",
      p."reorderLevel" AS "reorderLevel",

      l."name" AS "locationName",

      MAX(m."createdAt") AS "lastMovementAt"
    FROM "Stock" s
    JOIN "Product" p ON p."id" = s."productId"
    JOIN "Location" l ON l."id" = s."locationId"
    LEFT JOIN "StockMovement" m
      ON m."productId" = s."productId"
      AND (m."fromLocationId" = s."locationId" OR m."toLocationId" = s."locationId")
    GROUP BY
      s."productId",
      s."locationId",
      s."quantity",
      s."updatedAt",
      p."skuCode",
      p."name",
      p."unit",
      p."reorderLevel",
      l."name"
    ORDER BY p."skuCode" ASC, l."name" ASC;
  `;

  const now = new Date();

  return rows.map((r) => {
    const last = r.lastMovementAt || r.updatedAt;
    const daysIdle = diffDays(now, new Date(last));
    const status = computeStatus({
      quantity: Number(r.quantity),
      reorderLevel: Number(r.reorderLevel),
      daysIdle,
    });

    return {
      product: {
        id: r.productId,
        skuCode: r.skuCode,
        name: r.productName,
        unit: r.unit,
        reorderLevel: r.reorderLevel,
      },
      location: {
        id: r.locationId,
        name: r.locationName,
      },
      quantity: Number(r.quantity),
      lastMovementAt: r.lastMovementAt,
      daysIdle,
      status,
    };
  });
}

async function getAlerts() {
  const rows = await getInventoryHealth();
  return {
    low: rows.filter((r) => r.status === "LOW"),
    dead: rows.filter((r) => r.status === "DEAD"),
  };
}

module.exports = { getInventoryHealth, getAlerts };

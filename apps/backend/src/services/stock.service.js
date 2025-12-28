const { prisma } = require("../utils/prisma");

async function listStock() {
  const db = prisma();

  const stocks = await db.stock.findMany({
    include: {
      product: true,
      location: true,
    },
    orderBy: [{ productId: "asc" }, { locationId: "asc" }],
  });

  return stocks.map((row) => ({
    product: {
      id: row.product.id,
      skuCode: row.product.skuCode,
      name: row.product.name,
      unit: row.product.unit,
      reorderLevel: row.product.reorderLevel,
    },
    location: {
      id: row.location.id,
      name: row.location.name,
    },
    quantity: row.quantity,
    updatedAt: row.updatedAt,
  }));
}

module.exports = { listStock };

const { prisma } = require("../utils/prisma");

async function createProduct({ skuCode, name, unit, reorderLevel }) {
  const db = prisma();
  return db.product.create({
    data: {
      skuCode,
      name,
      unit,
      reorderLevel,
    },
  });
}

async function listProducts() {
  const db = prisma();
  return db.product.findMany({ orderBy: { id: "asc" } });
}

async function getProductById(id) {
  const db = prisma();
  return db.product.findUnique({ where: { id } });
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
};

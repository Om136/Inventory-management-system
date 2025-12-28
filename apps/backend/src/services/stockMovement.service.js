const { prisma } = require("../utils/prisma");
const { getInventoryRow } = require("./dashboard.service");

function validationError(message) {
  const err = new Error(message);
  err.name = "ValidationError";
  return err;
}

async function ensureProductAndLocationsExist(tx, { productId, fromLocationId, toLocationId }) {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) throw validationError("Product not found");

  if (fromLocationId) {
    const from = await tx.location.findUnique({ where: { id: fromLocationId } });
    if (!from) throw validationError("fromLocationId not found");
  }

  if (toLocationId) {
    const to = await tx.location.findUnique({ where: { id: toLocationId } });
    if (!to) throw validationError("toLocationId not found");
  }

  return product;
}

async function decrementStock(tx, { productId, locationId, quantity }) {
  const stock = await tx.stock.findUnique({
    where: {
      productId_locationId: { productId, locationId },
    },
  });

  const current = stock ? stock.quantity : 0;
  const next = current - quantity;
  if (next < 0) throw validationError("Insufficient stock (would go negative)");

  if (!stock) {
    // If current=0, next can only be 0, otherwise we already threw.
    return tx.stock.create({ data: { productId, locationId, quantity: next } });
  }

  return tx.stock.update({
    where: { id: stock.id },
    data: { quantity: next },
  });
}

async function incrementStock(tx, { productId, locationId, quantity }) {
  return tx.stock.upsert({
    where: {
      productId_locationId: { productId, locationId },
    },
    create: { productId, locationId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

async function moveStock({ productId, fromLocationId, toLocationId, quantity, type, reason }) {
  const db = prisma();

  const result = await db.$transaction(async (tx) => {
    await ensureProductAndLocationsExist(tx, { productId, fromLocationId, toLocationId });

    let fromStock = null;
    let toStock = null;

    if (type === "IN") {
      toStock = await incrementStock(tx, {
        productId,
        locationId: toLocationId,
        quantity,
      });
    } else if (type === "OUT" || type === "DAMAGE") {
      fromStock = await decrementStock(tx, {
        productId,
        locationId: fromLocationId,
        quantity,
      });
    } else if (type === "TRANSFER") {
      fromStock = await decrementStock(tx, {
        productId,
        locationId: fromLocationId,
        quantity,
      });

      toStock = await incrementStock(tx, {
        productId,
        locationId: toLocationId,
        quantity,
      });
    } else {
      throw validationError("Unsupported movement type");
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        fromLocationId,
        toLocationId,
        quantity,
        type,
        reason: reason || null,
      },
    });

    return {
      movement,
      stock: {
        from: fromStock,
        to: toStock,
      },
    };
  });

  // Post-transaction: attach backend-computed intelligence for the affected rows.
  // This keeps frontend dumb: it can render status/daysIdle immediately.
  const inventory = {
    from: fromLocationId
      ? await getInventoryRow({ productId, locationId: fromLocationId })
      : null,
    to: toLocationId
      ? await getInventoryRow({ productId, locationId: toLocationId })
      : null,
  };

  return { ...result, inventory };
}

module.exports = { moveStock };

const {
  moveStock: moveStockService,
  listStockMovements: listStockMovementsService,
} = require("../services/stockMovement.service");

const MOVEMENT_TYPES = new Set(["IN", "OUT", "DAMAGE", "TRANSFER"]);

function toInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i;
}

function toFloat(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseLimit(value) {
  if (value == null) return 50;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i <= 0) return null;
  return Math.min(200, i);
}

async function moveStock(req, res) {
  try {
    const { productId, fromLocationId, toLocationId, quantity, type, reason } =
      req.body || {};

    const productIdInt = toInt(productId);
    if (!productIdInt || productIdInt <= 0) {
      return res
        .status(400)
        .json({ error: { message: "productId is required" } });
    }

    if (!type || typeof type !== "string" || !MOVEMENT_TYPES.has(type)) {
      return res.status(400).json({
        error: { message: "type must be one of IN, OUT, DAMAGE, TRANSFER" },
      });
    }

    const qty = toFloat(quantity);
    if (!qty || qty <= 0) {
      return res
        .status(400)
        .json({ error: { message: "quantity must be > 0" } });
    }

    const fromId = fromLocationId == null ? null : toInt(fromLocationId);
    const toId = toLocationId == null ? null : toInt(toLocationId);

    if ((type === "OUT" || type === "DAMAGE") && (!fromId || fromId <= 0)) {
      return res.status(400).json({
        error: { message: `${type} requires fromLocationId` },
      });
    }

    if (type === "IN" && (!toId || toId <= 0)) {
      return res
        .status(400)
        .json({ error: { message: "IN requires toLocationId" } });
    }

    if (type === "TRANSFER") {
      if (!fromId || fromId <= 0 || !toId || toId <= 0) {
        return res
          .status(400)
          .json({
            error: {
              message: "TRANSFER requires fromLocationId and toLocationId",
            },
          });
      }
      if (fromId === toId) {
        return res
          .status(400)
          .json({
            error: { message: "TRANSFER requires different locations" },
          });
      }
    }

    const result = await moveStockService({
      productId: productIdInt,
      fromLocationId: fromId,
      toLocationId: toId,
      quantity: qty,
      type,
      reason: typeof reason === "string" ? reason.trim() : null,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err && err.name === "ValidationError") {
      return res.status(400).json({ error: { message: err.message } });
    }

    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

async function listStockMovements(req, res) {
  try {
    const limit = parseLimit(req.query.limit);
    if (req.query.limit != null && limit == null) {
      return res
        .status(400)
        .json({ error: { message: "limit must be a positive integer" } });
    }

    const cursorId = req.query.cursor == null ? null : toInt(req.query.cursor);
    if (req.query.cursor != null && (!cursorId || cursorId <= 0)) {
      return res
        .status(400)
        .json({ error: { message: "cursor must be a positive integer" } });
    }

    const result = await listStockMovementsService({ limit, cursorId });
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

module.exports = { moveStock, listStockMovements };

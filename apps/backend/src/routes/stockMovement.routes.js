const express = require("express");

const {
  moveStock,
  listStockMovements,
} = require("../controllers/stockMovement.controller");

function createStockMovementRouter() {
  const router = express.Router();

  router.post("/stock/move", moveStock);
  router.get("/stock/movements", listStockMovements);

  return router;
}

module.exports = { createStockMovementRouter };

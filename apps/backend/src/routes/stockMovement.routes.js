const express = require("express");

const { moveStock } = require("../controllers/stockMovement.controller");

function createStockMovementRouter() {
  const router = express.Router();

  router.post("/stock/move", moveStock);

  return router;
}

module.exports = { createStockMovementRouter };

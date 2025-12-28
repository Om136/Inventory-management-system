const express = require("express");

const { listStock } = require("../controllers/stock.controller");

function createStockRouter() {
  const router = express.Router();

  router.get("/stock", listStock);

  return router;
}

module.exports = { createStockRouter };

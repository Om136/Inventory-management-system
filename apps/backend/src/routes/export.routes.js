const express = require("express");

const {
  downloadInventorySnapshot,
} = require("../controllers/export.controller");

function createExportRouter() {
  const router = express.Router();

  // Inventory Snapshot Export (Excel)
  router.get("/exports/inventory-snapshot.xlsx", downloadInventorySnapshot);

  return router;
}

module.exports = { createExportRouter };

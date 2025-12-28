const express = require("express");

const { getInventoryHealth } = require("../controllers/dashboard.controller");

function createDashboardRouter() {
  const router = express.Router();

  router.get("/dashboard/inventory", getInventoryHealth);

  return router;
}

module.exports = { createDashboardRouter };

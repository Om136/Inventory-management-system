const express = require("express");

const { getInventoryHealth, getAlerts } = require("../controllers/dashboard.controller");

function createDashboardRouter() {
  const router = express.Router();

  router.get("/dashboard/inventory", getInventoryHealth);
  router.get("/dashboard/alerts", getAlerts);

  return router;
}

module.exports = { createDashboardRouter };

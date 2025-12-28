const { createHealthRouter } = require("./health.routes");
const { createProductRouter } = require("./product.routes");
const { createLocationRouter } = require("./location.routes");
const { createStockRouter } = require("./stock.routes");
const { createStockMovementRouter } = require("./stockMovement.routes");
const { createDashboardRouter } = require("./dashboard.routes");

function registerRoutes(app) {
  app.use(createHealthRouter());
  app.use(createProductRouter());
  app.use(createLocationRouter());
  app.use(createStockRouter());
  app.use(createStockMovementRouter());
  app.use(createDashboardRouter());
}

module.exports = { registerRoutes };

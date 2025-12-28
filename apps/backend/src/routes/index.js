const { createHealthRouter } = require("./health.routes");
const { createProductRouter } = require("./product.routes");
const { createLocationRouter } = require("./location.routes");
const { createStockRouter } = require("./stock.routes");
const { createStockMovementRouter } = require("./stockMovement.routes");

function registerRoutes(app) {
  app.use(createHealthRouter());
  app.use(createProductRouter());
  app.use(createLocationRouter());
  app.use(createStockRouter());
  app.use(createStockMovementRouter());
}

module.exports = { registerRoutes };

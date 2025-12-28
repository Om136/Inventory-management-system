const { createHealthRouter } = require("./health.routes");
const { createProductRouter } = require("./product.routes");
const { createLocationRouter } = require("./location.routes");

function registerRoutes(app) {
  app.use(createHealthRouter());
  app.use(createProductRouter());
  app.use(createLocationRouter());
}

module.exports = { registerRoutes };

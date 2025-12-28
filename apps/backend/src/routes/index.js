const { createHealthRouter } = require("./health.routes");
const { createProductRouter } = require("./product.routes");

function registerRoutes(app) {
  app.use(createHealthRouter());
  app.use(createProductRouter());
}

module.exports = { registerRoutes };

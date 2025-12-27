const { createHealthRouter } = require("./health.routes");

function registerRoutes(app) {
  app.use(createHealthRouter());
}

module.exports = { registerRoutes };

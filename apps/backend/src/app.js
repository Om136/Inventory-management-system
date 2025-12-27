const express = require("express");
const cors = require("cors");

const { registerRoutes } = require("./routes");

function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  registerRoutes(app);

  return app;
}

module.exports = { createApp };

const express = require("express");
const cors = require("cors");

const { registerRoutes } = require("./routes");

function parseCorsOrigin(value) {
  if (value == null) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  if (raw === "false") return false;
  if (raw === "*") return true;

  const origins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return origins.length ? origins : undefined;
}

function getCorsOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const originFromEnv = parseCorsOrigin(process.env.CORS_ORIGIN);

  // Dev: default allow (reflect request origin) for convenience.
  // Prod: default deny unless explicitly configured.
  const origin = originFromEnv !== undefined ? originFromEnv : isProd ? false : true;

  return {
    origin,
    credentials: true,
  };
}

function createApp() {
  const app = express();

  if (process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(cors(getCorsOptions()));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  registerRoutes(app);

  return app;
}

module.exports = { createApp };

const express = require("express");
const { prisma } = require("../utils/prisma");

function createHealthRouter() {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  router.get("/health/db", async (req, res) => {
    try {
      await prisma().$queryRaw`SELECT 1`;
      res.status(200).json({ status: "ok" });
    } catch (e) {
      res
        .status(500)
        .json({ status: "error", message: e.message || "DB error" });
    }
  });

  return router;
}

module.exports = { createHealthRouter };

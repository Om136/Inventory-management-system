const express = require("express");

const {
  createLocation,
  listLocations,
} = require("../controllers/location.controller");

function createLocationRouter() {
  const router = express.Router();

  router.post("/locations", createLocation);
  router.get("/locations", listLocations);

  return router;
}

module.exports = { createLocationRouter };

const {
  createLocation: createLocationService,
  listLocations: listLocationsService,
} = require("../services/location.service");

async function createLocation(req, res) {
  try {
    const { name } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: { message: "name is required" } });
    }

    const location = await createLocationService({ name: name.trim() });
    return res.status(201).json(location);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}

async function listLocations(req, res) {
  try {
    const locations = await listLocationsService();
    return res.status(200).json(locations);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}

module.exports = {
  createLocation,
  listLocations,
};

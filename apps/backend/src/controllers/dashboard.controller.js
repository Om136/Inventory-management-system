const {
  getInventoryHealth: getInventoryHealthService,
} = require("../services/dashboard.service");

async function getInventoryHealth(req, res) {
  try {
    const rows = await getInventoryHealthService();
    return res.status(200).json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}

module.exports = { getInventoryHealth };

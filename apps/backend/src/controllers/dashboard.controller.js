const {
  getInventoryHealth: getInventoryHealthService,
  getAlerts: getAlertsService,
} = require("../services/dashboard.service");

function parseDeadDays(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i <= 0) return null;
  return i;
}

async function getInventoryHealth(req, res) {
  try {
    const deadDays = parseDeadDays(req.query.deadDays);
    if (req.query.deadDays != null && deadDays == null) {
      return res
        .status(400)
        .json({ error: { message: "deadDays must be a positive integer" } });
    }

    const rows = await getInventoryHealthService({
      deadDays: deadDays == null ? undefined : deadDays,
    });
    return res.status(200).json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}

async function getAlerts(req, res) {
  try {
    const deadDays = parseDeadDays(req.query.deadDays);
    if (req.query.deadDays != null && deadDays == null) {
      return res
        .status(400)
        .json({ error: { message: "deadDays must be a positive integer" } });
    }

    const alerts = await getAlertsService({
      deadDays: deadDays == null ? undefined : deadDays,
    });
    return res.status(200).json(alerts);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}

module.exports = { getInventoryHealth, getAlerts };

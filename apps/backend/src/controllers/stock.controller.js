const { listStock: listStockService } = require("../services/stock.service");

async function listStock(req, res) {
  try {
    const rows = await listStockService();
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
}

module.exports = { listStock };

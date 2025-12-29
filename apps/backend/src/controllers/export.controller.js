const ExcelJS = require("exceljs");

const { getInventoryHealth } = require("../services/dashboard.service");

function parseDeadDays(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i <= 0) return null;
  return i;
}

async function downloadInventorySnapshot(req, res) {
  try {
    const deadDays = parseDeadDays(req.query.deadDays) ?? 60;
    if (
      req.query.deadDays != null &&
      parseDeadDays(req.query.deadDays) == null
    ) {
      return res
        .status(400)
        .json({ error: { message: "deadDays must be a positive integer" } });
    }

    const rows = await getInventoryHealth({ deadDays });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory");

    sheet.addRow([
      "SKU Code",
      "Product Name",
      "Location",
      "Quantity",
      "Unit",
      "Status",
      "Days Idle",
    ]);

    for (const r of rows) {
      sheet.addRow([
        r?.product?.skuCode ?? "",
        r?.product?.name ?? "",
        r?.location?.name ?? "",
        r?.quantity ?? 0,
        r?.product?.unit ?? "",
        r?.status ?? "",
        r?.daysIdle ?? 0,
      ]);
    }

    const yyyyMmDd = new Date().toISOString().slice(0, 10);
    const filename = `inventory-snapshot-${yyyyMmDd}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${filename}\"`
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

module.exports = { downloadInventorySnapshot };

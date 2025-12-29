function safeText(value) {
  if (value == null) return "";
  return String(value);
}

function fileStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function downloadInventorySnapshotExcel(rows) {
  const header = [
    "SKU Code",
    "Product Name",
    "Location",
    "Quantity",
    "Unit",
    "Status",
    "Days Idle",
  ];

  const dataRows = (Array.isArray(rows) ? rows : []).map((r) => [
    safeText(r?.product?.skuCode),
    safeText(r?.product?.name),
    safeText(r?.location?.name),
    r?.quantity ?? "",
    safeText(r?.product?.unit),
    safeText(r?.status),
    r?.daysIdle ?? "",
  ]);

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventory");

  sheet.addRow(header);
  for (const row of dataRows) sheet.addRow(row);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-snapshot-${fileStamp()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

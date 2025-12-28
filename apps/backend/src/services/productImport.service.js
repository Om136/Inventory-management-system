const { parse } = require("csv-parse/sync");

const { prisma } = require("../utils/prisma");

const DEFAULT_UNIT = "Units";

function toNonEmptyString(value) {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function toNonNegativeInt(value) {
  if (value == null || value === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 0) return null;
  return i;
}

async function importProductsFromCsv(csvText) {
  const db = prisma();

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const invalidRows = [];
  const seenSku = new Set();
  let duplicatesInFile = 0;

  const normalized = [];

  for (let idx = 0; idx < records.length; idx += 1) {
    const row = records[idx] || {};

    const skuCode = toNonEmptyString(row.skuCode);
    const name = toNonEmptyString(row.name);
    const unit = toNonEmptyString(row.unit) || DEFAULT_UNIT;
    const reorderLevel = toNonNegativeInt(row.reorderLevel);

    if (!skuCode) {
      invalidRows.push({ row: idx + 2, field: "skuCode", message: "skuCode is required" });
      continue;
    }
    if (!name) {
      invalidRows.push({ row: idx + 2, field: "name", message: "name is required" });
      continue;
    }
    if (reorderLevel == null) {
      invalidRows.push({
        row: idx + 2,
        field: "reorderLevel",
        message: "reorderLevel must be a number >= 0",
      });
      continue;
    }

    if (seenSku.has(skuCode)) {
      duplicatesInFile += 1;
      continue;
    }
    seenSku.add(skuCode);

    normalized.push({ skuCode, name, unit, reorderLevel });
  }

  const skuCodes = normalized.map((p) => p.skuCode);

  const existing = skuCodes.length
    ? await db.product.findMany({
        where: { skuCode: { in: skuCodes } },
        select: { skuCode: true },
      })
    : [];

  const existingSet = new Set(existing.map((e) => e.skuCode));
  const newOnes = normalized.filter((p) => !existingSet.has(p.skuCode));

  const createResult = newOnes.length
    ? await db.product.createMany({ data: newOnes, skipDuplicates: true })
    : { count: 0 };

  return {
    receivedRows: records.length,
    validRows: normalized.length,
    inserted: createResult.count,
    duplicatesExisting: existingSet.size,
    duplicatesInFile,
    invalidRows,
    defaults: {
      unit: DEFAULT_UNIT,
      reorderLevel: 0,
    },
  };
}

module.exports = { importProductsFromCsv };

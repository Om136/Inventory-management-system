const {
  createProduct: createProductService,
  listProducts: listProductsService,
  getProductById: getProductByIdService,
  updateProduct: updateProductService,
} = require("../services/product.service");

const { importProductsFromCsv } = require("../services/productImport.service");

function parseId(param) {
  const value = Number(param);
  return Number.isFinite(value) ? value : null;
}

async function createProduct(req, res) {
  try {
    const { skuCode, name, unit, reorderLevel } = req.body || {};

    if (!skuCode || typeof skuCode !== "string") {
      return res
        .status(400)
        .json({ error: { message: "skuCode is required" } });
    }
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: { message: "name is required" } });
    }
    if (!unit || typeof unit !== "string") {
      return res.status(400).json({ error: { message: "unit is required" } });
    }

    const reorderLevelNumber = Number(reorderLevel);
    if (!Number.isFinite(reorderLevelNumber) || reorderLevelNumber < 0) {
      return res
        .status(400)
        .json({ error: { message: "reorderLevel must be a number >= 0" } });
    }

    const product = await createProductService({
      skuCode: skuCode.trim(),
      name: name.trim(),
      unit: unit.trim(),
      reorderLevel: Math.trunc(reorderLevelNumber),
    });

    return res.status(201).json(product);
  } catch (err) {
    if (err && err.code === "P2002") {
      return res
        .status(409)
        .json({ error: { message: "skuCode must be unique" } });
    }

    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

async function listProducts(req, res) {
  try {
    const products = await listProductsService();
    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

async function getProductById(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: "Invalid id" } });
    }

    const product = await getProductByIdService(id);
    if (!product) {
      return res.status(404).json({ error: { message: "Product not found" } });
    }

    return res.status(200).json(product);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

async function updateProduct(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: { message: "Invalid id" } });
    }

    const { name, unit, reorderLevel } = req.body || {};

    const data = {};

    if (name != null) {
      if (typeof name !== "string" || !name.trim()) {
        return res
          .status(400)
          .json({ error: { message: "name must be a non-empty string" } });
      }
      data.name = name.trim();
    }

    if (unit != null) {
      if (typeof unit !== "string" || !unit.trim()) {
        return res
          .status(400)
          .json({ error: { message: "unit must be a non-empty string" } });
      }
      data.unit = unit.trim();
    }

    if (reorderLevel != null) {
      const reorderLevelNumber = Number(reorderLevel);
      if (!Number.isFinite(reorderLevelNumber) || reorderLevelNumber < 0) {
        return res
          .status(400)
          .json({ error: { message: "reorderLevel must be a number >= 0" } });
      }
      data.reorderLevel = Math.trunc(reorderLevelNumber);
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        error: {
          message:
            "Provide at least one field to update: name, unit, reorderLevel",
        },
      });
    }

    const product = await updateProductService(id, data);
    return res.status(200).json(product);
  } catch (err) {
    // Prisma throws P2025 on update where record doesn't exist
    if (err && err.code === "P2025") {
      return res.status(404).json({ error: { message: "Product not found" } });
    }

    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  importProductsCsv,
};

async function importProductsCsv(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: { message: "CSV file is required (multipart field name: file)" },
      });
    }

    const csvText = req.file.buffer.toString("utf-8");
    const result = await importProductsFromCsv(csvText);
    return res.status(200).json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res
      .status(500)
      .json({ error: { message: "Internal server error" } });
  }
}

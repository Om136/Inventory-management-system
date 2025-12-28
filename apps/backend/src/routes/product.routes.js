const express = require("express");

const {
  createProduct,
  listProducts,
  getProductById,
  importProductsCsv,
} = require("../controllers/product.controller");

const { upload } = require("../middleware/upload");

function createProductRouter() {
  const router = express.Router();

  router.post("/products", createProduct);
  router.post("/products/import", upload.single("file"), importProductsCsv);
  router.get("/products", listProducts);
  router.get("/products/:id", getProductById);

  return router;
}

module.exports = { createProductRouter };

const express = require("express");

const {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
} = require("../controllers/product.controller");

function createProductRouter() {
  const router = express.Router();

  router.post("/products", createProduct);
  router.get("/products", listProducts);
  router.get("/products/:id", getProductById);
  router.patch("/products/:id", updateProduct);

  return router;
}

module.exports = { createProductRouter };

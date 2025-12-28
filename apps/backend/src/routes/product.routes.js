const express = require("express");

const {
  createProduct,
  listProducts,
  getProductById,
} = require("../controllers/product.controller");

function createProductRouter() {
  const router = express.Router();

  router.post("/products", createProduct);
  router.get("/products", listProducts);
  router.get("/products/:id", getProductById);

  return router;
}

module.exports = { createProductRouter };

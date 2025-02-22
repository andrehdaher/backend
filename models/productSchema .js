const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  wholesalePrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  balance: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

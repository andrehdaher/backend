const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  quantitySold: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  totalSale: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["نقدًا", "دين"], required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sale", SaleSchema);

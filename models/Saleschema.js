const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantitySold: {
    type: Number,
    required: true,
  },
  salePrice: {
    type: Number,
    required: true,
  },
  totalSale: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['نقدًا', 'دين'], // تحديد طرق الدفع المتاحة
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // تاريخ البيع
  },
});

const Sales = mongoose.model("Sales", salesSchema);
module.exports = Sales;

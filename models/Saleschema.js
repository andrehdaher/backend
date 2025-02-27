// models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  retailPrice: {
    type: Number,
    required: true,
  },
  buyerName: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['كاش', 'دين'],
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;

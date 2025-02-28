const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // إزالة المسافات الزائدة
  },
  type: {
    type: String,
    required: true,
    trim: true, // إزالة المسافات الزائدة
  },
  wholesalePrice: {
    type: Number,
    required: true,
    min: 0, // لا يسمح بأسعار سالبة
  },
  retailPrice: {
    type: Number,
    required: true,
    min: 0, // لا يسمح بأسعار سالبة
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0, // لا يسمح بكميات سالبة
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

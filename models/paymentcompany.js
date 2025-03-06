const mongoose = require('mongoose');

const paymentSchema1 = new mongoose.Schema({
  number: Number,
  speed: Number,
  paidAmount: Number,
  requiredAmount: Number,
  company: String,
  provider: String,
});

const Paymentcompany = mongoose.model('Paymentcompany', paymentSchema1);

module.exports = Paymentcompany;

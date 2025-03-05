const mongoose = require('mongoose');

const paymentSchema1 = new mongoose.Schema({
  number: String,
  speed: String,
  paidAmount: String,
  requiredAmount: String,
  company: String,
  provider: String,
});

const Paymentcompany = mongoose.model('Paymentcompany', paymentSchema1);

module.exports = Paymentcompany;

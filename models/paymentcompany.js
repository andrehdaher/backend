const mongoose = require('mongoose');

const paymentSchema1 = new mongoose.Schema({
  number: { type: String, required: true },
  speed: { type: String, required: true },
  paidAmount: { type: Number, required: true },
  requiredAmount: { type: Number, required: true },
  company: { type: String, required: true },
  provider: { type: String, required: true },
});

// إضافة فهرس مرتب (index) للحقل company
paymentSchema1.index({ company: 1 }, { collation: { locale: 'ar' } });

const Paymentcompany = mongoose.model('Paymentcompany', paymentSchema1);

module.exports = Paymentcompany;

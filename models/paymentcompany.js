const mongoose = require('mongoose');

const paymentSchema1 = new mongoose.Schema({
  number: { type: String, required: true }, // إذا كانت القيمة مطلوبة
  speed: { type: String, required: true },  // إذا كانت القيمة مطلوبة
  paidAmount: { type: Number, required: true },  // تغيير إلى Number إذا كانت المبالغ المالية
  requiredAmount: { type: Number, required: true },  // تغيير إلى Number
  company: { type: String, required: true },
  provider: { type: String, required: true },
}, { collation: { locale: 'ar' } });  // استخدام collation مع الـ schema (اختياري)

const Paymentcompany = mongoose.model('Paymentcompany', paymentSchema1);

module.exports = Paymentcompany;

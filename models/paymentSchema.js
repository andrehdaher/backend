const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ربط بالمستخدم
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }, // التاريخ التلقائي للدفعة
  userName: { type: String, required: true }, // اسم المستخدم للعرض في البيان المالي
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;

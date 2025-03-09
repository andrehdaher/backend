const mongoose = require("mongoose");

const passportSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  nationalId: { type: String, required: true, unique: true }, // إضافة الرقم الوطني بدلاً من الصور
  passportType: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  isReserved: { type: Boolean, default: false },
}, { timestamps: true });

const Passport = mongoose.model("Passport", passportSchema);

module.exports = Passport;

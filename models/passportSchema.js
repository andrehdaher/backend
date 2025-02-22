const mongoose = require("mongoose");

const passportSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idImages: { type: [String], required: true }, // قائمة لمسارات الصور
  passportType: { type: String, enum: ["عادي", "مستعجل", "فوري"], default: "عادي" },
  amountPaid: { type: Number, required: true },
  isReserved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Passport", passportSchema);

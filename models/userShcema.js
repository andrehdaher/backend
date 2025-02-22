const mongoose = require('mongoose')
const schema = mongoose.Schema

const userSchema = new schema({

  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"], // القيم المسموح بها فقط
    default: "user", // إذا لم يتم تحديد الدور، يكون "user" تلقائيًا
  },
  
})

const User = mongoose.model('loginUser' , userSchema)

module.exports=User
const mongoose = require('mongoose')
const schema = mongoose.Schema

const userSchema = new schema({
  fullName:String,
  speed:Number,
  tower:String,
  ip:Number,
  user:String,
  password:String,
  date:String,
  required:String,
  paid:String,
  lastUpdatedMonth: Date // ✅ إضافة هذا الحقل

})

const addUser = mongoose.model('add-user' , userSchema)

module.exports=addUser
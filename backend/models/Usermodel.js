const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true }, 
  password: { type: String, required: true },
  gender: { type: String, required: true },
  pincode: { type: String, required: true },
  address: { type: String, required: true },
  profilePic: { type: String, default: null },
  role: { type: String, default: "user" },
  status: { type: String, default: "Inactive" },
  token: { type: String, default: null, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);

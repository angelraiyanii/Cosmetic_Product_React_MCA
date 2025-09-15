const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  reply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'New' },
  seen: { type: Boolean, default: false },
  seenAt: { type: Date },
});

module.exports = mongoose.model("Contact", contactSchema);
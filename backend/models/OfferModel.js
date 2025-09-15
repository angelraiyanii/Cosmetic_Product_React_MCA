const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  maxdiscount: { type: String, required: true },
  description: { type: String, required: true },
  rate: { type: String, required: true }, 
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  orderTotal: { type: String, required: true },
  banner: { type: String }, 
  status: { type: String, default: "Active" }, 
  discount: String, 
  validity: String 
});

module.exports = mongoose.model("Offer", offerSchema);

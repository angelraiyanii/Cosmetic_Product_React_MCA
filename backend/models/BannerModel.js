const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }, 
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Banner", bannerSchema);
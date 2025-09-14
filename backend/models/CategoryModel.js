const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true, unique: true, trim: true },
  categoryImage: { type: String, required: true }, 
  categoryStatus: { type: String, enum: ["Active", "Inactive"], required: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Model export
module.exports = mongoose.model("Category", CategorySchema);

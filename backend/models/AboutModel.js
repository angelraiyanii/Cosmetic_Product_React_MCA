const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  bannerImage: { type: String }, 
  content: { type: String, required: true },
  section1Image: { type: String }, 
  section1Text: { type: String, required: true },
  section2Image: { type: String }, 
  section2Text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("About", aboutSchema);
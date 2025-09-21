const mongoose = require("mongoose");

const aboutSchema = new mongoose.Schema({
  banners: [{ type: String }], // Array for multiple banners
  content: { type: String, required: true },
  section1Image: { type: String }, 
  section1Text: { type: String, required: true },
  section2Image: { type: String }, 
  section2Text: { type: String, required: true },
  videoType: { type: String, enum: ['file', 'url'], default: 'url' }, // Type of video
  videoFile: { type: String }, // For uploaded video files
  videoUrl: { type: String }, // For embedded video URLs
  mission: { type: String, required: true }, // Mission statement
  values: [{ type: String }], // Array of company values
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("About", aboutSchema);
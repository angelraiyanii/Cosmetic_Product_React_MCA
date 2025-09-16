const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  image: { type: String }
});

const aboutSchema = new mongoose.Schema({
  bannerImage: { type: String }, 
  content: { type: String, required: true },
  section1Image: { type: String }, 
  section1Text: { type: String, required: true },
  section2Image: { type: String }, 
  section2Text: { type: String, required: true },
  missionStatement: { type: String, required: true },
  values: [{ type: String }],
  teamMembers: [teamMemberSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("About", aboutSchema);
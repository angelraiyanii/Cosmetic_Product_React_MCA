const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const About = require("../models/AboutModel");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "public/images/about_images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, and PNG images are allowed"));
    }
  },
});

// Middleware to upload multiple images
const uploadFields = upload.fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "section1Image", maxCount: 1 },
  { name: "section2Image", maxCount: 1 },
]);

// Get About Data (single document)
router.get("/about", async (req, res) => {
  try {
    const about = await About.findOne(); // Assumes one document
    if (!about) return res.status(404).json({ error: "About data not found" });
    res.status(200).json(about);
  } catch (error) {
    console.error("Error fetching about data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add About Data
router.post("/about", uploadFields, async (req, res) => {
  try {
    const { content, section1Text, section2Text } = req.body;
    const existingAbout = await About.findOne();
    if (existingAbout) {
      return res.status(400).json({ error: "About data already exists. Use PUT to update." });
    }

    if (!req.files || !req.files.bannerImage || !req.files.section1Image || !req.files.section2Image) {
      return res.status(400).json({ error: "All images are required" });
    }

    const newAbout = new About({
      bannerImage: req.files.bannerImage[0].filename,
      content,
      section1Image: req.files.section1Image[0].filename,
      section1Text,
      section2Image: req.files.section2Image[0].filename,
      section2Text,
    });

    await newAbout.save();
    res.status(201).json(newAbout);
  } catch (error) {
    console.error("Error adding about data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update About Data
router.put("/about/:id", uploadFields, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, section1Text, section2Text } = req.body;

    const about = await About.findById(id);
    if (!about) return res.status(404).json({ error: "About data not found" });

    const updatedFields = {};
    if (content) updatedFields.content = content;
    if (section1Text) updatedFields.section1Text = section1Text;
    if (section2Text) updatedFields.section2Text = section2Text;
    if (req.files?.bannerImage) updatedFields.bannerImage = req.files.bannerImage[0].filename;
    if (req.files?.section1Image) updatedFields.section1Image = req.files.section1Image[0].filename;
    if (req.files?.section2Image) updatedFields.section2Image = req.files.section2Image[0].filename;

    const updatedAbout = await About.findByIdAndUpdate(id, updatedFields, { new: true });
    res.status(200).json(updatedAbout);
  } catch (error) {
    console.error("Error updating about data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete About Data
router.delete("/about/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const about = await About.findById(id);
    if (!about) return res.status(404).json({ error: "About data not found" });

    // Optionally delete images from server
    [about.bannerImage, about.section1Image, about.section2Image].forEach((image) => {
      const imagePath = path.join(uploadDir, image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    });

    await About.findByIdAndDelete(id);
    res.status(200).json({ message: "About data deleted successfully" });
  } catch (error) {
    console.error("Error deleting about data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
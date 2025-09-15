const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Banner = require("../models/BannerModel");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "public/images/banner_images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for banner image uploads
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
      return cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, and PNG images are allowed"));
    }
  },
});

// Add Banner
router.post("/add-banner", upload.single("bannerImage"), async (req, res) => {
    try {
      const { name, status } = req.body;
      if (!name || !req.file) {
        return res.status(400).json({ error: "Name and image are required" });
      }
      const newBanner = new Banner({
        name,
        image: req.file.filename,
        status: status || "Active",
      });
      await newBanner.save();
      res.status(201).json({ message: "Banner added successfully", banner: newBanner });
    } catch (error) {
      console.error("Error adding banner:", error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

// Get All Banners
router.get("/banners", async (req, res) => {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      const banners = await Banner.find(query);
      res.status(200).json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

// Update Banner

router.put("/update-banner/:id", upload.single("bannerImage"), async (req, res) => {
    try {
      const bannerId = req.params.id;
      const { name, status } = req.body;
  
      console.log("Update request body:", req.body);
      console.log("Uploaded file:", req.file);
  
      const banner = await Banner.findById(bannerId);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
  
      const updatedFields = {};
      if (name) updatedFields.name = name;
      if (status) updatedFields.status = status;
      if (req.file) {
        updatedFields.image = req.file.filename;
      } else if (!banner.image) {
        updatedFields.image = "default-banner.png"; // Set a default server-side image
      }
  
      const updatedBanner = await Banner.findByIdAndUpdate(bannerId, updatedFields, {
        new: true,
      });
  
      res.status(200).json({ message: "Banner updated successfully", banner: updatedBanner });
    } catch (error) {
      console.error("Error updating banner:", error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

// Delete Banner
router.delete("/delete-banner/:id", async (req, res) => {
    try {
      const bannerId = req.params.id;
      const banner = await Banner.findByIdAndDelete(bannerId);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }
      const imagePath = path.join(uploadDir, banner.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error.stack);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });
module.exports = router;
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const About = require("../models/AboutModel");

const router = express.Router();

// Ensure upload directories exist
const imageUploadDir = "public/images/about_images";
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

// Configure Multer for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (imageTypes.test(ext) && mime.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG images are allowed"));
    }
  },
});

// Dynamic multer fields for multiple banners
const createUploadFields = () => {
  const fields = [
    { name: "section1Image", maxCount: 1 },
    { name: "section2Image", maxCount: 1 }
  ];
  
  // Add support for up to 10 banner images
  for (let i = 0; i < 10; i++) {
    fields.push({ name: `bannerImage${i}`, maxCount: 1 });
  }
  
  return upload.fields(fields);
};

// ================= CRUD ROUTES =================

// GET /about (fetch latest About data)
router.get("/about", async (req, res) => {
  try {
    const about = await About.findOne().sort({ createdAt: -1 });
    res.json(about || {});
  } catch (err) {
    console.error("GET /about error:", err);
    res.status(500).json({ message: "Failed to fetch about data", error: err.message });
  }
});

// POST /about (create new About data)
router.post("/about", createUploadFields(), async (req, res) => {
  try {
    const data = req.body;
    
    // Handle multiple banner images
    const banners = [];
    Object.keys(req.files || {}).forEach((key) => {
      if (key.startsWith("bannerImage")) {
        banners.push(req.files[key][0].filename);
      }
    });

    // Parse values array if it's a string
    let values = [];
    if (data.values) {
      if (typeof data.values === 'string') {
        try {
          values = JSON.parse(data.values);
        } catch (e) {
          values = [data.values]; // Single value
        }
      } else if (Array.isArray(data.values)) {
        values = data.values;
      }
    }

    const about = new About({
      banners: banners,
      content: data.content,
      section1Image: req.files?.section1Image?.[0]?.filename || null,
      section1Text: data.section1Text,
      section2Image: req.files?.section2Image?.[0]?.filename || null,
      section2Text: data.section2Text,
      videoUrl: data.videoUrl,
      mission: data.mission, // Changed from missionStatement to mission
      values: values,
    });

    await about.save();
    res.json(about);
  } catch (err) {
    console.error("POST /about error:", err);
    res.status(500).json({ message: "Failed to create about data", error: err.message });
  }
});

// PUT /about/:id (update About data)
router.put("/about/:id", createUploadFields(), async (req, res) => {
  try {
    const data = req.body;
    
    // Handle multiple banner images
    const newBanners = [];
    Object.keys(req.files || {}).forEach((key) => {
      if (key.startsWith("bannerImage")) {
        newBanners.push(req.files[key][0].filename);
      }
    });

    // Parse values array if it's a string
    let values = [];
    if (data.values) {
      if (typeof data.values === 'string') {
        try {
          values = JSON.parse(data.values);
        } catch (e) {
          values = [data.values];
        }
      } else if (Array.isArray(data.values)) {
        values = data.values;
      }
    }

    // Get existing data to preserve banners if no new ones uploaded
    const existingAbout = await About.findById(req.params.id);
    
    const updateData = {
      content: data.content,
      section1Text: data.section1Text,
      section2Text: data.section2Text,
      videoUrl: data.videoUrl,
      mission: data.mission, // Changed from missionStatement to mission
      values: values,
    };

    // Only update banners if new ones were uploaded
    if (newBanners.length > 0) {
      updateData.banners = newBanners;
    }

    // Only update images if new ones were uploaded
    if (req.files?.section1Image?.[0]) {
      updateData.section1Image = req.files.section1Image[0].filename;
    }
    if (req.files?.section2Image?.[0]) {
      updateData.section2Image = req.files.section2Image[0].filename;
    }

    const updated = await About.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("PUT /about/:id error:", err);
    res.status(500).json({ message: "Failed to update about data", error: err.message });
  }
});

// DELETE /about/:id (remove About data)
router.delete("/about/:id", async (req, res) => {
  try {
    const about = await About.findById(req.params.id);
    
    if (about) {
      // Clean up uploaded files
      const filesToDelete = [];
      
      if (about.banners) {
        about.banners.forEach(banner => {
          filesToDelete.push(path.join(imageUploadDir, banner));
        });
      }
      
      if (about.section1Image) {
        filesToDelete.push(path.join(imageUploadDir, about.section1Image));
      }
      
      if (about.section2Image) {
        filesToDelete.push(path.join(imageUploadDir, about.section2Image));
      }
      
      // Delete files
      filesToDelete.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await About.findByIdAndDelete(req.params.id);
    res.json({ message: "About data deleted successfully" });
  } catch (err) {
    console.error("DELETE /about/:id error:", err);
    res.status(500).json({ message: "Failed to delete about data", error: err.message });
  }
});

module.exports = router;
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const About = require("../models/AboutModel");

const router = express.Router();

// Ensure upload directories exist
const imageUploadDir = "public/images/about_images";
const videoUploadDir = "public/videos/about_videos";

if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

// Configure Multer for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Configure Multer for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadImage = multer({
  storage: imageStorage,
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

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const videoTypes = /mp4|avi|mov|wmv|webm|mkv/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (videoTypes.test(ext) && mime.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4, AVI, MOV, WMV, WEBM, MKV video files are allowed"));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Combined upload middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'videoFile') {
        cb(null, videoUploadDir);
      } else {
        cb(null, imageUploadDir);
      }
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'videoFile') {
      const videoTypes = /mp4|avi|mov|wmv|webm|mkv/;
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype.toLowerCase();
      
      if (videoTypes.test(ext) && mime.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error("Only MP4, AVI, MOV, WMV, WEBM, MKV video files are allowed"));
      }
    } else {
      const imageTypes = /jpeg|jpg|png/;
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype.toLowerCase();

      if (imageTypes.test(ext) && mime.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error("Only JPG, JPEG, PNG images are allowed"));
      }
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Dynamic multer fields for multiple banners and video
const createUploadFields = () => {
  const fields = [
    { name: "section1Image", maxCount: 1 },
    { name: "section2Image", maxCount: 1 },
    { name: "videoFile", maxCount: 1 }
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
      videoType: data.videoType || 'url',
      videoFile: req.files?.videoFile?.[0]?.filename || null,
      videoUrl: data.videoUrl || null,
      mission: data.mission,
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

    // Get existing data to preserve files if no new ones uploaded
    const existingAbout = await About.findById(req.params.id);
    
    const updateData = {
      content: data.content,
      section1Text: data.section1Text,
      section2Text: data.section2Text,
      videoType: data.videoType || 'url',
      mission: data.mission,
      values: values,
    };

    // Handle video updates based on type
    if (data.videoType === 'file') {
      if (req.files?.videoFile?.[0]) {
        updateData.videoFile = req.files.videoFile[0].filename;
        updateData.videoUrl = null; // Clear URL when uploading file
      }
    } else {
      updateData.videoUrl = data.videoUrl || null;
      updateData.videoFile = null; // Clear file when using URL
    }

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
      
      if (about.videoFile) {
        filesToDelete.push(path.join(videoUploadDir, about.videoFile));
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
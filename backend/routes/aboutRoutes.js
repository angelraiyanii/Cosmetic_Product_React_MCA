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

// Configure Multer for both images and videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, imageUploadDir);
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, videoUploadDir);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png/;
    const videoTypes = /mp4|mov|avi|wmv/;

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (
      imageTypes.test(ext) && imageTypes.test(mime) ||
      videoTypes.test(ext) && videoTypes.test(mime)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG images or MP4, MOV, AVI, WMV videos are allowed"));
    }
  },
});

// Multer field configuration
const uploadFields = upload.fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "bannerVideo", maxCount: 1 },
  { name: "section1Image", maxCount: 1 },
  { name: "section1Video", maxCount: 1 },
  { name: "section2Image", maxCount: 1 },
  { name: "section2Video", maxCount: 1 },
  { name: "teamMemberImage0", maxCount: 1 },
  { name: "teamMemberImage1", maxCount: 1 },
  { name: "teamMemberImage2", maxCount: 1 },
]);

// ================= CRUD ROUTES =================

// GET (fetch latest About data)
router.get("/", async (req, res) => {
  try {
    const about = await About.findOne().sort({ createdAt: -1 });
    res.json(about || {});
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch about data", error: err.message });
  }
});

// POST (create new About data)
router.post("/", uploadFields, async (req, res) => {
  try {
    const data = req.body;

    const teamMembers = [];
    Object.keys(req.body).forEach((key) => {
      if (key.startsWith("teamMemberName")) {
        const index = key.replace("teamMemberName", "");
        teamMembers[index] = {
          name: req.body[`teamMemberName${index}`],
          role: req.body[`teamMemberRole${index}`],
          image: req.files[`teamMemberImage${index}`]
            ? req.files[`teamMemberImage${index}`][0].filename
            : null,
        };
      }
    });

    const about = new About({
      bannerImage: req.files.bannerImage ? req.files.bannerImage[0].filename : null,
      bannerVideo: req.files.bannerVideo ? req.files.bannerVideo[0].filename : null,
      content: data.content,
      section1Image: req.files.section1Image ? req.files.section1Image[0].filename : null,
      section1Video: req.files.section1Video ? req.files.section1Video[0].filename : null,
      section1Text: data.section1Text,
      section2Image: req.files.section2Image ? req.files.section2Image[0].filename : null,
      section2Video: req.files.section2Video ? req.files.section2Video[0].filename : null,
      section2Text: data.section2Text,
      missionStatement: data.missionStatement,
      values: JSON.parse(data.values || "[]"),
      teamMembers,
      mediaType1: data.mediaType1,
      mediaType2: data.mediaType2,
    });

    await about.save();
    res.json(about);
  } catch (err) {
    res.status(500).json({ message: "Failed to create about data", error: err.message });
  }
});

// PUT (update About data)
router.put("/:id", uploadFields, async (req, res) => {
  try {
    const data = req.body;

    const teamMembers = [];
    for (let i = 0; i < 10; i++) {
      if (data[`teamMemberName${i}`]) {
        teamMembers.push({
          name: data[`teamMemberName${i}`],
          role: data[`teamMemberRole${i}`],
          image: req.files?.[`teamMemberImage${i}`]?.[0]?.filename ||
            data[`teamMemberImagePath${i}`] ||
            null,
        });
      }
    }

    const updated = await About.findByIdAndUpdate(
      req.params.id,
      {
        bannerImage: req.files?.bannerImage?.[0]?.filename || undefined,
        bannerVideo: req.files?.bannerVideo?.[0]?.filename || undefined,
        content: data.content,
        section1Image: req.files?.section1Image?.[0]?.filename || undefined,
        section1Video: req.files?.section1Video?.[0]?.filename || undefined,
        section1Text: data.section1Text,
        section2Image: req.files?.section2Image?.[0]?.filename || undefined,
        section2Video: req.files?.section2Video?.[0]?.filename || undefined,
        section2Text: data.section2Text,
        missionStatement: data.missionStatement,
        values: typeof data.values === "string" ? JSON.parse(data.values) : data.values,
        teamMembers,
        mediaType1: data.mediaType1,
        mediaType2: data.mediaType2,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("PUT /about/:id error:", err);
    res.status(500).json({ message: "Failed to update about data", error: err.message });
  }
});


// DELETE (remove About data)
router.delete("/:id", async (req, res) => {
  try {
    await About.findByIdAndDelete(req.params.id);
    res.json({ message: "About data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete about data", error: err.message });
  }
});

module.exports = router;

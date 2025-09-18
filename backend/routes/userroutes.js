const express = require("express");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");  
const User  = require("../models/Usermodel");
const router = express.Router();
const bcrypt = require("bcrypt");

require("dotenv").config();

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images/profile_pictures"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Register User
router.post("/add-Usermodel", upload.single("profilePic"), async (req, res) => {
  try {
    const { fullname, email, mobile, password, gender, pincode, address } = req.body;

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const newUser = new User ({
      fullname,
      email,
      mobile,
      password, 
      gender,
      pincode,
      address,
      profilePic: req.file ? req.file.filename : null,
      role: "user",
      status: "Active",
      verificationToken,
    });

    await newUser.save();

    const verificationLink = `http://localhost:5000/api/Usermodel/verify-email/${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="color: #333; text-align: center;">Welcome to Our Platform, ${fullname}!</h2>
        <p style="color: #555; font-size: 16px;">Thank you for signing up! Please verify your email to activate your account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 20px; background-color: #007bff; color: #fff; text-decoration: none; font-size: 16px; border-radius: 5px;">Verify Your Email</a>
        </div>
        <p style="color: #777; font-size: 14px;">If you did not sign up, you can safely ignore this email. This verification link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #666; font-size: 14px;">Regards, <br> <strong>Your Company Team</strong></p>
      </div>`,
    });

    res.status(201).json({
      message: "User added successfully. Check your email to verify your account.",
      Usermodel: newUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User by ID
router.put("/:id", upload.single("profilePic"), async (req, res) => {
  try {
    const { fullname, email, mobile, password, gender, pincode, address } = req.body;

    const updateData = {
      fullname,
      email,
      mobile,
      gender,
      pincode,
      address,
    };

    if (password) updateData.password = password; 
    if (req.file) updateData.profilePic = req.file.filename;

    const updatedUser = await User .findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      Usermodel: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email Verification Route
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User .findOne({ email: decoded.email });

    if (!user) {
      return res.redirect("http://localhost:5173/Usermodel?status=error&message=Invalid or expired token.");
    }

    user.status = "Active";
    user.verificationToken = null;
    await user.save();

    return res.redirect("http://localhost:5173/Usermodel?status=success&message=Email verified successfully! You can now log in.");
  } catch (error) {
    return res.redirect("http://localhost:5173/Usermodel?status=error&message=Verification failed or token expired.");
  }
});

// Retrieve all Users
router.get("/all-Usermodel", async (req, res) => {
  try {
    const allUsermodel = await User .find();
    res.status(200).json({ Usermodel: allUsermodel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User .findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting User", error: error.message });
  }
});

// Usermodel Route
router.post("/Usermodel", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required!" });
    }

    const user = await User .findOne({ email }); 
    if (!user) {
      return res.status(400).json({ status: "error", message: "Email is not registered!" });
    }

    if (password !== user.password) {
      return res.status(400).json({ status: "error", message: "Incorrect password!" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      message: "Usermodel successful",
      status: "success",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("🔥 Backend Error:", error.message, error.stack);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }

});
// Get user details by ID

router.get("/user-details/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID format" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch user details" });
  }
});
// Change Password Route
router.put("/change-password/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Old password and new password are required" 
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if old password matches (since you're not using bcrypt)
    if (oldPassword !== user.password) {
      return res.status(400).json({ 
        message: "Old password is incorrect" 
      });
    }

    // Check if new password is different from old password
    if (oldPassword === newPassword) {
      return res.status(400).json({ 
        message: "New password must be different from old password" 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ 
      message: "Server error while changing password",
      error: error.message 
    });
  }
});
module.exports = router;
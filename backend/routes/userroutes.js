const express = require("express");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const User = require("../models/Usermodel");
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

    const newUser = new User({
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

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

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
    const user = await User.findOne({ email: decoded.email });

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
    const allUsermodel = await User.find();
    res.status(200).json({ Usermodel: allUsermodel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting User", error: error.message });
  }
});

// Usermodel Route - FIXED VERSION
router.post("/Usermodel", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: "error", message: "Email and password are required!" });
    }

    const user = await User.findOne({ email }); 
    if (!user) {
      return res.status(400).json({ status: "error", message: "Email is not registered!" });
    }

    if (password !== user.password) {
      return res.status(400).json({ status: "error", message: "Incorrect password!" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // RETURN COMPLETE USER DATA - THIS IS THE FIX
    return res.status(200).json({
      message: "Usermodel successful",
      status: "success",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        mobile: user.mobile || "",        // ADD THIS
        address: user.address || "",      // ADD THIS
        pincode: user.pincode || "",      // ADD THIS
        gender: user.gender || "",        // ADD THIS
        profilePic: user.profilePic || "" // ADD THIS
      },
    });
  } catch (error) {
    console.error("🔥 Backend Error:", error.message, error.stack);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});
// Get user details by ID - FIXED VERSION
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

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        mobile: user.mobile || "",
        address: user.address || "",
        pincode: user.pincode || "",
        gender: user.gender || "",
        profilePic: user.profilePic || ""
      }
    });
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

// Send Order Confirmation Email Route
router.post("/send-order-confirmation", async (req, res) => {
  try {
    const {
      userId,
      orderId,
      customerName,
      customerEmail,
      orderDate,
      orderTime,
      orderTotal,
      shippingAddress,
      orderItems
    } = req.body;

    // Validate required fields
    if (!customerEmail || !orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer email and order ID are required" 
      });
    }

    // Format order items HTML
    const orderItemsHtml = orderItems.map(item => `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">₹${item.price}</td>
        <td style="padding: 12px; text-align: right;">₹${item.total}</td>
      </tr>
    `).join('');

    // Calculate subtotal
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10; // 10% tax
    const shipping = subtotal > 50 ? 0 : 5.99;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Order Confirmation - #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
            .container { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
            .success-icon { color: #4CAF50; font-size: 48px; margin-bottom: 10px; }
            h1 { color: #2E7D32; margin: 10px 0; }
            h2 { color: #333; margin: 20px 0 10px; }
            .order-id { background: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; margin: 15px 0; font-family: monospace; font-size: 18px; color: #2196F3; }
            .info-box { background: #f8f9fa; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0; border-radius: 0 5px 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #4CAF50; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-size: 20px; font-weight: bold; color: #2E7D32; border-top: 2px solid #4CAF50; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
            .contact-info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Payment Successful!</h1>
              <p>Your order has been confirmed and will be shipped soon.</p>
            </div>
            
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> <span class="order-id">#${orderId}</span></p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <p><strong>Order Time:</strong> ${orderTime}</p>
            
            <div class="info-box">
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
            </div>
            
            <h2>Shipping Address</h2>
            <div class="info-box">
              <p>${shippingAddress.address}</p>
              <p>${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.zip}</p>
              <p>${shippingAddress.country}</p>
              <p><strong>Phone:</strong> ${shippingAddress.phone}</p>
            </div>
            
            <h2>Order Items</h2>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Shipping:</span>
                <span>${shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div class="total-row">
                <span>Tax (10%):</span>
                <span>₹${tax.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>₹${orderTotal}</span>
              </div>
            </div>
            
            <div class="contact-info">
              <h3>Need Help?</h3>
              <p>If you have any questions about your order, please contact our customer support.</p>
              <p><strong>Email:</strong> support@glowcosmetic.com</p>
              <p><strong>Phone:</strong> +91 83474 87892</p>
            </div>
            
            <div class="footer">
              <p>Thank you for shopping with <strong>💎 GlowCosmetic</strong>!</p>
              <p>We've sent a confirmation to your email.</p>
              <p>© ${new Date().getFullYear()} GlowCosmetic. All rights reserved.</p>
              <p><a href="http://www.glowcosmetic.com" style="color: #2196F3; text-decoration: none;">www.glowcosmetic.com</a></p>
              <p>Please do not reply to this automated email.</p>
              <p>-- Angel Raiyani,MCA Student, RK University</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    res.status(200).json({
      success: true,
      message: "Order confirmation email sent successfully"
    });

  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send order confirmation email",
      error: error.message
    });
  }
});
module.exports = router;
const express = require('express');
const router = express.Router();
const User  = require("../models/Usermodel");
const OtpModel = require('../models/OtpModel');
const nodemailer = require('nodemailer');

// Test route to check email configuration
router.get('/test-email-config', async (req, res) => {
  try {
    console.log('🔧 Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'NOT SET');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        error: 'Email credentials missing in environment variables',
        hasUser: !!process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS
      });
    }

    // Test email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.verify();
    console.log('✅ Email configuration is correct!');
    
    res.json({ 
      message: 'Email configuration is working!',
      emailUser: process.env.EMAIL_USER
    });
    
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    res.status(500).json({ 
      error: 'Email configuration failed',
      details: error.message,
      code: error.code
    });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📧 OTP Request for:', email);
    
    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email is not registered' });
    }

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Missing email credentials in environment');
      return res.status(500).json({ 
        error: 'Email service not configured properly' 
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Generated OTP:', otp);
    
    // Save OTP to database
    await OtpModel.findOneAndDelete({ email });
    const newOtp = new OtpModel({ email, otp });
    await newOtp.save();

    console.log('Creating email transporter...');
    
    // Email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('Sending email...');
    
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset OTP - GlowCosmetics',
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Password Reset OTP</h2>
          <p>You requested a password reset for your GlowCosmetics account.</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
            <strong>${otp}</strong>
          </div>
          <p style="text-align: center;">This OTP will expire in 5 minutes.</p>
          <p style="text-align: center; color: #999;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', email);
    
    res.status(200).json({ 
      message: 'OTP sent to your email successfully',
      email: email
    });
    
  } catch (error) {
    console.error('❌ OTP Sending Error:', error);
    console.log('Error details:', error.message);
    console.log('Error code:', error.code);
    
    let userMessage = 'Failed to send OTP. Please try again later.';
    
    if (error.code === 'EAUTH') {
      userMessage = 'Email authentication failed. Please check your email configuration.';
    } else if (error.code === 'ECONNECTION') {
      userMessage = 'Cannot connect to email service. Please check your internet connection.';
    }
    
    res.status(500).json({ error: userMessage });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const otpRecord = await OtpModel.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid OTP or OTP expired' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();
    
    await OtpModel.findOneAndDelete({ email });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});
// Test route without email (for development)
router.post('/send-otp-test', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Test OTP Request for:', email);
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email not registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Test OTP:', otp);
    
    // Save to database
    await OtpModel.findOneAndDelete({ email });
    await OtpModel.create({ email, otp });

    res.status(200).json({ 
      message: 'OTP generated successfully (check server console)',
      otp: otp, // This is for testing only - remove in production
      email: email
    });
    
  } catch (error) {
    console.error('Test OTP Error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});
module.exports = router;
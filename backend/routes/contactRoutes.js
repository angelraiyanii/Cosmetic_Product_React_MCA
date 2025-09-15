const express = require('express');
const router = express.Router();
const Contact = require('../models/ContactModel');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD 
  },
  tls: {
    rejectUnauthorized: false   }
});


transporter.verify(function(error, success) {
  if (error) {
    console.log('Email server connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;


    const newContact = new Contact({
      name,
      email,
      phone,
      message
    });

    const savedContact = await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: savedContact
    });
  } catch (err) {
    console.error('Contact form submission error:', err);

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error, unable to process your request'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to fetch contact entries'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, reply } = req.body;
    
    const updateData = {};
    
    if (status) {
      if (!['New', 'In Progress', ' Resolved'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      updateData.status = status;
    }
    
    if (reply) {
      updateData.reply = reply;
      // Set status to "Resolved" when a reply is sent
      // This automatically updates the status without needing "In Progress"
      updateData.status = 'Resolved';
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact entry not found'
      });
    }
    
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (reply) {
      // Prepare email data
      const mailOptions = {
        from: process.env.EMAIL_USER ,
        to: contact.email,
        subject: 'Response to Your Inquiry',
        html: `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
  <h2 style="color: #333;">Hello ${contact.name},</h2>
  <p>Thank you for reaching out to us. We have received your inquiry and here is our response:</p>
  <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
    <p>${reply}</p>
  </div>
  <p>Your original message:</p>
  <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
    <p>${contact.message}</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="http://localhost:5000/api/contact/confirm-seen/${contact._id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirm You've Seen This Message</a>
  </div>
  <p style="margin-top: 30px; font-size: 0.9em; color: #777;">If you have any further questions, please don't hesitate to contact us.</p>
</div>
`
      };
      
      try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        
        // Return success response with email info
        return res.json({
          success: true,
          message: `Reply sent to ${contact.email} successfully!`,
          data: updatedContact,
          emailInfo: {
            messageId: info.messageId,
            emailSent: true
          }
        });
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
        
        // Return success for the database update but include email error info
        return res.json({
          success: true,
          message: `Contact updated but email could not be sent to ${contact.email}`,
          data: updatedContact,
          emailError: emailErr.message
        });
      }
    }
     res.json({
      success: true,
      data: updatedContact
    });
    
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to update contact entry',
      error: err.message
    });
  }
});

router.get('/confirm-seen/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.redirect("http://localhost:5173/login?status=error&message=Contact not found");
    }
  
    await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        seen: true,
        seenAt: new Date(),
        status: 'Resolved'
      }
    );
    
    return res.redirect("http://localhost:5173/login?status=success&message=Message marked as seen successfully!");
  } catch (error) {
    console.error('Error updating seen status:', error);
    return res.redirect("http://localhost:5173/login?status=error&message=Verification failed. Please try again.");
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact entry not found'
      });
    }
    
    await Contact.deleteOne({ _id: req.params.id });
    
    res.json({
      success: true,
      message: 'Contact entry deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to delete contact entry'
    });
  }
});

module.exports = router;
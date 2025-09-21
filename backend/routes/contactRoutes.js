const express = require('express');
const router = express.Router();
const Contact = require('../models/ContactModel');
const nodemailer = require('nodemailer');

// Email transporter configuration
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
    rejectUnauthorized: false
  }
});

// Verify email server connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email server connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Submit new contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
    }

    const newContact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      message: message.trim()
    });

    const savedContact = await newContact.save();

    // Send confirmation email to customer
    try {
      const confirmationMailOptions = {
        from: process.env.EMAIL_USER,
        to: savedContact.email,
        subject: 'Thank you for contacting us - We received your message',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #007bff; text-align: center;">Thank you for contacting us!</h2>
            <p>Dear ${savedContact.name},</p>
            <p>We have received your inquiry and will get back to you as soon as possible.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Your message:</h4>
              <p style="color: #666; margin: 0;">${savedContact.message}</p>
            </div>
            
            <p><strong>Reference ID:</strong> ${savedContact._id}</p>
            <p>Our team typically responds within 24-48 hours.</p>
            
            <div style="text-align: center; margin: 20px 0; padding: 15px; background: #e7f3ff; border-radius: 5px;">
              <p style="margin: 0; color: #0066cc;">Need to reach us urgently? Reply to this email or call our support line.</p>
            </div>
            
            <p>Best regards,<br><strong>Customer Support Team</strong></p>
          </div>
        `
      };

      await transporter.sendMail(confirmationMailOptions);
      console.log(`Confirmation email sent to ${savedContact.email}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the entire request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email,
        status: savedContact.status,
        createdAt: savedContact.createdAt
      }
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

// Get all contacts with pagination, search, and filter
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 5, 
      search = '', 
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build search query
    let searchQuery = {};
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      searchQuery.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count for pagination
    const totalContacts = await Contact.countDocuments(searchQuery);
    
    // Get contacts with pagination
    const contacts = await Contact.find(searchQuery)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate status counts
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      total: totalContacts,
      new: 0,
      'in progress': 0,
      resolved: 0
    };

    statusCounts.forEach(item => {
      const status = item._id.toLowerCase();
      if (status === 'new') statusStats.new = item.count;
      else if (status === 'in progress') statusStats['in progress'] = item.count;
      else if (status === 'resolved') statusStats.resolved = item.count;
    });

    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalContacts / limitNum),
        totalItems: totalContacts,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalContacts / limitNum),
        hasPrevPage: pageNum > 1
      },
      stats: statusStats
    });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to fetch contact entries'
    });
  }
});

// Get single contact by ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact entry not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (err) {
    console.error('Error fetching contact:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error, unable to fetch contact entry'
    });
  }
});

// Update contact status and send reply
router.put('/:id', async (req, res) => {
  try {
    const { status, reply } = req.body;
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact entry not found'
      });
    }
    
    const updateData = {};
    
    if (status) {
      if (!['New', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be: New, In Progress, or Resolved'
        });
      }
      updateData.status = status;
    }
    
    if (reply && reply.trim()) {
      updateData.reply = reply.trim();
      // Set status to "Resolved" when a reply is sent
      updateData.status = 'Resolved';
      
      // Prepare email data
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contact.email,
        subject: `Re: Your inquiry - ${contact.message.substring(0, 50)}...`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px;">Thank You for Contacting Us!</h1>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${contact.name},</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">Thank you for reaching out to us. We have received your inquiry and here is our response:</p>
              
              <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 25px 0;">
                <h3 style="color: #1565C0; margin-top: 0; margin-bottom: 15px;">Our Response:</h3>
                <p style="color: #0d47a1; margin: 0; font-size: 16px; line-height: 1.6;">${reply}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #6c757d; margin: 25px 0;">
                <h4 style="color: #495057; margin-top: 0; margin-bottom: 15px;">Your Original Message:</h4>
                <p style="color: #6c757d; margin: 0; font-style: italic;">"${contact.message}"</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact/confirm/${contact._id}" 
                 style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                        transition: all 0.3s ease;">
                ✓ Confirm You've Seen This Message
              </a>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>Need more help?</strong> Feel free to contact us anytime at 
                <a href="mailto:${process.env.EMAIL_USER}" style="color: #007bff; text-decoration: none;">${process.env.EMAIL_USER}</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #adb5bd; font-size: 12px;">
                This email was sent in response to your inquiry on ${new Date(contact.createdAt).toLocaleDateString()}
                <br>Reference ID: ${contact._id}
              </p>
            </div>
          </div>
        `
      };
      
      try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        
        // Update the contact in database
        const updatedContact = await Contact.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        );
        
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log(`Reply sent to: ${contact.email}`);
        
        // Return success response with email info
        return res.json({
          success: true,
          message: `Reply sent to ${contact.email} successfully!`,
          data: updatedContact,
          emailInfo: {
            messageId: info.messageId,
            emailSent: true,
            sentTo: contact.email
          }
        });
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
        
        // Still update the contact even if email fails
        const updatedContact = await Contact.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        );
        
        // Return success for the database update but include email error info
        return res.status(207).json({ // 207 Multi-Status
          success: true,
          message: `Contact updated but email could not be sent to ${contact.email}`,
          data: updatedContact,
          emailError: {
            error: emailErr.message,
            emailSent: false
          }
        });
      }
    } else {
      // Just update status without sending email
      const updatedContact = await Contact.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        message: 'Contact updated successfully',
        data: updatedContact
      });
    }
    
  } catch (err) {
    console.error('Error updating contact:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error, unable to update contact entry',
      error: err.message
    });
  }
});

// Confirm message seen (from email link)
router.get('/confirm-seen/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?status=error&message=Contact not found`);
    }
  
    await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        seen: true,
        seenAt: new Date(),
        status: 'Resolved'
      }
    );
    
    console.log(`Contact ${req.params.id} marked as seen`);
    
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?status=success&message=Thank you for confirming! Your message has been marked as seen.`);
  } catch (error) {
    console.error('Error updating seen status:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?status=error&message=Verification failed. Please try again.`);
  }
});

// Delete contact
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
    
    console.log(`Contact ${req.params.id} deleted by admin`);
    
    res.json({
      success: true,
      message: 'Contact entry deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting contact:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error, unable to delete contact entry'
    });
  }
});

// Get contact statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalContacts = await Contact.countDocuments();
    
    const statusStats = {
      total: totalContacts,
      new: 0,
      'in progress': 0,
      resolved: 0
    };

    stats.forEach(item => {
      const status = item._id.toLowerCase();
      if (status === 'new') statusStats.new = item.count;
      else if (status === 'in progress') statusStats['in progress'] = item.count;
      else if (status === 'resolved') statusStats.resolved = item.count;
    });

    // Get additional stats
    const seenCount = await Contact.countDocuments({ seen: true });
    const unseenCount = await Contact.countDocuments({ seen: false });
    const withReplies = await Contact.countDocuments({ reply: { $ne: '' } });

    res.json({
      success: true,
      data: {
        ...statusStats,
        seen: seenCount,
        unseen: unseenCount,
        withReplies: withReplies
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to fetch statistics'
    });
  }
});

// Bulk operations - mark multiple as seen
router.patch('/bulk/mark-seen', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of contact IDs'
      });
    }

    const result = await Contact.updateMany(
      { _id: { $in: ids } },
      { 
        seen: true,
        seenAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} contacts marked as seen`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error in bulk mark as seen:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to update contacts'
    });
  }
});

// Bulk operations - delete multiple contacts
router.delete('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of contact IDs'
      });
    }

    const result = await Contact.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} contacts deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error in bulk delete:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to delete contacts'
    });
  }
});

// Export contacts data (for backup/reporting)
router.get('/export/csv', async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    
    let csvData = 'Name,Email,Phone,Message,Status,Reply,Created At,Seen,Seen At\n';
    
    contacts.forEach(contact => {
      const row = [
        `"${contact.name}"`,
        `"${contact.email}"`,
        `"${contact.phone || ''}"`,
        `"${contact.message.replace(/"/g, '""')}"`,
        `"${contact.status}"`,
        `"${(contact.reply || '').replace(/"/g, '""')}"`,
        `"${contact.createdAt.toISOString()}"`,
        `"${contact.seen ? 'Yes' : 'No'}"`,
        `"${contact.seenAt ? contact.seenAt.toISOString() : ''}"`
      ].join(',');
      csvData += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=contacts_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvData);
  } catch (err) {
    console.error('Error exporting contacts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error, unable to export contacts'
    });
  }
});

module.exports = router;
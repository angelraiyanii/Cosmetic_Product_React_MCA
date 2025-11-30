const express = require('express');
const router = express.Router();
const Offer = require('../models/OfferModel');
const multer = require('multer');
const path = require('path');

// Multer configuration for banner images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/offer_images/');
  },
  filename: function (req, file, cb) {
    cb(null, `offer-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all offers
router.get('/offers', async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('category', 'name')
      .populate('product', 'name price images')
      .sort({ createdAt: -1 });
    
    res.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// Get single offer
router.get('/offers/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('category', 'name')
      .populate('product', 'name price images');
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    res.json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

// Create new offer
router.post('/add-offer', upload.single('bannerImage'), async (req, res) => {
  try {
    const {
      name,
      description,
      offerType,
      category,
      product,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      startDate,
      endDate,
      usageLimit,
      targetAudience,
      promoCode
    } = req.body;

    // Validate required fields based on offer type
    if (offerType === 'banner' && !req.file) {
      return res.status(400).json({ error: 'Banner image is required for banner offers' });
    }

    if (offerType === 'promo_code' && !promoCode) {
      return res.status(400).json({ error: 'Promo code is required for promo code offers' });
    }

    // Check if promo code already exists
    if (offerType === 'promo_code') {
      const existingOffer = await Offer.findOne({ promoCode });
      if (existingOffer) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }
    }

    const offerData = {
      name,
      description,
      offerType,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      targetAudience: targetAudience || 'all'
    };

    // Add type-specific fields
    if (offerType === 'category' && category) {
      offerData.category = category;
    } else if (offerType === 'product' && product) {
      offerData.product = product;
    } else if (offerType === 'banner' && req.file) {
      offerData.bannerImage = req.file.filename;
    } else if (offerType === 'promo_code' && promoCode) {
      offerData.promoCode = promoCode.toUpperCase();
    }

    // Add max discount for percentage offers
    if (discountType === 'percentage' && maxDiscount) {
      offerData.maxDiscount = Number(maxDiscount);
    }

    const offer = new Offer(offerData);
    await offer.save();

    // Populate the saved offer
    const populatedOffer = await Offer.findById(offer._id)
      .populate('category', 'name')
      .populate('product', 'name price images');

    res.status(201).json({
      message: 'Offer created successfully',
      offer: populatedOffer
    });

  } catch (error) {
    console.error('Error creating offer:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// Update offer
router.put('/update-offer/:id', upload.single('bannerImage'), async (req, res) => {
  try {
    const {
      name,
      description,
      offerType,
      category,
      product,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      startDate,
      endDate,
      usageLimit,
      targetAudience,
      promoCode
    } = req.body;

    const updateData = {
      name,
      description,
      offerType,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      targetAudience: targetAudience || 'all'
    };

    // Handle type-specific fields
    if (offerType === 'category') {
      updateData.category = category || null;
      updateData.product = null;
      updateData.bannerImage = null;
      updateData.promoCode = null;
    } else if (offerType === 'product') {
      updateData.product = product || null;
      updateData.category = null;
      updateData.bannerImage = null;
      updateData.promoCode = null;
    } else if (offerType === 'banner') {
      if (req.file) {
        updateData.bannerImage = req.file.filename;
      }
      updateData.category = null;
      updateData.product = null;
      updateData.promoCode = null;
    } else if (offerType === 'promo_code') {
      updateData.promoCode = promoCode ? promoCode.toUpperCase() : null;
      updateData.category = null;
      updateData.product = null;
      updateData.bannerImage = null;
    }

    // Handle max discount
    if (discountType === 'percentage' && maxDiscount) {
      updateData.maxDiscount = Number(maxDiscount);
    } else {
      updateData.maxDiscount = null;
    }

    // Check promo code uniqueness
    if (offerType === 'promo_code' && promoCode) {
      const existingOffer = await Offer.findOne({ 
        promoCode: promoCode.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      if (existingOffer) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name')
     .populate('product', 'name price images');

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({
      message: 'Offer updated successfully',
      offer
    });

  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// Delete offer
router.delete('/delete-offer/:id', async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

// Validate promo code
router.post('/validate-promo', async (req, res) => {
  try {
    const { promoCode, userId, orderValue } = req.body;
    
    const offer = await Offer.findOne({
      promoCode: promoCode.toUpperCase(),
      status: 'Active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }

    // Check usage limit
    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }

    // Check minimum order value
    if (orderValue < offer.minOrderValue) {
      return res.status(400).json({ 
        error: `Minimum order value of ${offer.minOrderValue} required` 
      });
    }

    // Calculate discount
    let discount = 0;
    if (offer.discountType === 'percentage') {
      discount = (orderValue * offer.discountValue) / 100;
      if (offer.maxDiscount && discount > offer.maxDiscount) {
        discount = offer.maxDiscount;
      }
    } else {
      discount = offer.discountValue;
    }

    res.json({
      valid: true,
      discount,
      finalAmount: orderValue - discount,
      offer: {
        name: offer.name,
        discountType: offer.discountType,
        discountValue: offer.discountValue
      }
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

module.exports = router;
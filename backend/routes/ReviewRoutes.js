const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Review = require('../models/ReviewModel');
const Order = require('../models/OrderModel');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/images/ratingreview_images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per image
  }
});

// Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({
      productId,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullname email');

    // Calculate average rating
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    res.json({
      reviews,
      statistics: {
        totalReviews,
        averageRating: averageRating.toFixed(1),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Check if user has purchased the product
router.get('/check-purchase/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;

    console.log('🔍 Checking purchase for userId:', userId, 'productId:', productId);

    const hasPurchased = await Order.findOne({
      userId,
      'products.productId': productId,
      paymentStatus: 'paid'
    });

    console.log('✅ Purchase check result:', !!hasPurchased);

    res.json({ hasPurchased: !!hasPurchased });
  } catch (error) {
    console.error('❌ Error checking purchase:', error);
    res.status(500).json({ error: 'Failed to check purchase status' });
  }
});

// Check if user has already reviewed the product
router.get('/check-review/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const existingReview = await Review.findOne({ userId, productId });

    res.json({
      hasReviewed: !!existingReview,
      review: existingReview
    });
  } catch (error) {
    console.error('Error checking review:', error);
    res.status(500).json({ error: 'Failed to check review status' });
  }
});

// Add a new review with optional images (max 5 images)
router.post('/add', upload.array('images', 5), async (req, res) => {
  try {
    const { userId, productId, rating, title, comment, userName, userEmail } = req.body;

    console.log('📝 Adding review:', { userId, productId, rating, title });
    console.log('📸 Images uploaded:', req.files?.length || 0);

    // Validate required fields
    if (!userId || !productId || !rating || !title || !comment) {
      // Delete uploaded files if validation fails
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      // Delete uploaded files
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      userId,
      'products.productId': productId,
      paymentStatus: 'paid'
    });

    console.log('💳 Purchase verification:', !!hasPurchased);

    // Get image URLs
    const imageUrls = req.files
      ? req.files.map(file => `/images/ratingreview_images/${file.filename}`)
      : [];
    const review = new Review({
      userId,
      productId,
      rating,
      title,
      comment,
      userName,
      userEmail,
      images: imageUrls,
      isVerifiedPurchase: !!hasPurchased
    });

    await review.save();

    console.log('✅ Review saved successfully with', imageUrls.length, 'images');

    res.status(201).json({
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('❌ Error adding review:', error);

    // Delete uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }

    if (error.code === 11000) {
      res.status(400).json({ error: 'You have already reviewed this product' });
    } else {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }
});

// Update a review with optional images
router.put('/update/:reviewId', upload.array('images', 5), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, title, comment, imagesToKeep } = req.body; // imagesToKeep will be JSON string

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      if (req.files) req.files.forEach(f => fs.unlinkSync(f.path));
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    let imageUrls = [];

    // Parse images to keep (sent from frontend as JSON string)
    let imagesToKeepArray = [];
    if (imagesToKeep) {
      try {
        imagesToKeepArray = JSON.parse(imagesToKeep);
      } catch (e) {
        console.error('Failed to parse imagesToKeep');
      }
    }

    // If user sends imagesToKeep → use only those from existing
    if (Array.isArray(imagesToKeepArray) && imagesToKeepArray.length > 0) {
      imageUrls = review.images.filter(img => imagesToKeepArray.includes(img));
    } else if (!req.files || req.files.length === 0) {
      // No new files & no imagesToKeep → keep all old images
      imageUrls = [...review.images];
    }
    // Delete images that are no longer used
    const finalImageSet = new Set(imageUrls);
    review.images.forEach(oldImg => {
      if (!finalImageSet.has(oldImg)) {
        const imagePath = path.join(__dirname, '..', 'public', oldImg);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/images/ratingreview_images/${file.filename}`);
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = imageUrls;

    await review.save();

    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Error updating review:', error);
    if (req.files) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (err) { }
      });
    }
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/delete/:reviewId/:userId', async (req, res) => {
  try {
    const { reviewId, userId } = req.params;

    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    // Delete associated images
    if (review.images && review.images.length > 0) {
      review.images.forEach(imageUrl => {
        const imagePath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log('🗑️ Deleted image:', imagePath);
          } catch (err) {
            console.error('Error deleting image:', err);
          }
        }
      });
    }

    await Review.findOneAndDelete({ _id: reviewId, userId });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Mark review as helpful
router.post('/helpful/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({
      message: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ error: 'Failed to mark review as helpful' });
  }
});

// Get user's reviews
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .populate('productId', 'name image');

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});
// Get all reviews
router.get('/all-reviews', async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
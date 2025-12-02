const express = require('express');
const router = express.Router();
const Review = require('../models/ReviewModel');
const Order = require('../models/OrderModel');

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

// Check if user has purchased the product - FIXED FOR YOUR ORDER SCHEMA
router.get('/check-purchase/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    console.log('🔍 Checking purchase for userId:', userId, 'productId:', productId);
    
    // YOUR ORDER SCHEMA USES 'products' NOT 'items'
    // Check if user has any completed order with this product
    const hasPurchased = await Order.findOne({
      userId,
      'products.productId': productId,
      paymentStatus: 'paid' // Your schema uses 'paid' status
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

// Add a new review - FIXED FOR YOUR ORDER SCHEMA
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, rating, title, comment, userName, userEmail } = req.body;

    console.log('📝 Adding review:', { userId, productId, rating, title });

    // Validate required fields
    if (!userId || !productId || !rating || !title || !comment) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if user has purchased the product - FIXED FOR YOUR SCHEMA
    const hasPurchased = await Order.findOne({
      userId,
      'products.productId': productId, // YOUR SCHEMA USES 'products'
      paymentStatus: 'paid' // YOUR SCHEMA USES 'paid'
    });

    console.log('💳 Purchase verification:', !!hasPurchased);

    const review = new Review({
      userId,
      productId,
      rating,
      title,
      comment,
      userName,
      userEmail,
      isVerifiedPurchase: !!hasPurchased
    });

    await review.save();

    console.log('✅ Review saved successfully');

    res.status(201).json({ 
      message: 'Review added successfully', 
      review 
    });
  } catch (error) {
    console.error('❌ Error adding review:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'You have already reviewed this product' });
    } else {
      res.status(500).json({ error: 'Failed to add review' });
    }
  }
});

// Update a review
router.put('/update/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, title, comment } = req.body;

    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    review.rating = rating;
    review.title = title;
    review.comment = comment;

    await review.save();

    res.json({ 
      message: 'Review updated successfully', 
      review 
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/delete/:reviewId/:userId', async (req, res) => {
  try {
    const { reviewId, userId } = req.params;

    const review = await Review.findOneAndDelete({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

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

module.exports = router;
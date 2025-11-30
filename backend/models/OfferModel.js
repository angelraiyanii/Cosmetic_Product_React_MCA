const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  offerType: {
    type: String,
    enum: ['category', 'product', 'banner', 'promo_code'],
    required: true
  },
  // For category offers
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() { return this.offerType === 'category'; }
  },
  // For product offers
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function() { return this.offerType === 'product'; }
  },
  // For banner offers
  bannerImage: {
    type: String,
    required: function() { return this.offerType === 'banner'; }
  },
  // For promo code offers
  promoCode: {
    type: String,
    required: function() { return this.offerType === 'promo_code'; }
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  // For percentage discount
  maxDiscount: {
    type: Number,
    required: function() { return this.discountType === 'percentage'; }
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired'],
    default: 'Active'
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'existing_users', 'vip'],
    default: 'all'
  }
}, {
  timestamps: true
});

// Index for efficient queries
offerSchema.index({ offerType: 1, status: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ promoCode: 1 }, { sparse: true });

// Middleware to update status based on dates
offerSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'Expired';
  } else if (this.startDate > now) {
    this.status = 'Inactive';
  } else {
    this.status = 'Active';
  }
  next();
});

module.exports = mongoose.model('Offer', offerSchema);
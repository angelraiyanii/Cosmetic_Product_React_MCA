const express = require('express');
const router = express.Router();

// Add your routes here
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});
router.use('/public', express.static('public'));

// User 
const Userroutes = require("./userroutes");
router.use("/UserModel", Userroutes);
//category
const categoryRoutes = require("./categoryRoutes");
router.use("/CategoryModel", categoryRoutes);
//product
const productRoutes = require("./productRoutes");
router.use("/ProductModel", productRoutes);
//banner
const bannerRoutes = require("./bannerRoutes");
router.use("/BannerModel", bannerRoutes);
// Cart 
const cartRoutes = require("./cartRoutes"); 
router.use("/CartModel", cartRoutes);

// Wishlist 
const wishlistRoutes = require("./wishlistRoutes"); 
router.use("/WishlistModel", wishlistRoutes);

//About Us
const aboutRoutes = require("./aboutRoutes");
router.use("/AboutModel", aboutRoutes);

//Contact Us
const contactRoutes = require("./contactRoutes");
router.use("/ContactModel", contactRoutes);

//Otp
const otpRoutes = require("./otpRoutes");
router.use("/OtpModel", otpRoutes);

// Offer
const offerRoutes = require('./offerRoutes');
router.use("/OfferModel", offerRoutes);

//order
const orderRoutes = require('./orderRoutes');
router.use('/orderModel', orderRoutes);

//razorpay
const razorpayRoutes = require('./razorpayRoutes');
router.use('/payment', razorpayRoutes);

//review
const reviewRoutes = require('./reviewRoutes');
router.use('/ReviewModel', reviewRoutes);
// Test route
router.get("/", (req, res) => {
  res.json({ message: 'API is working!' });
});
module.exports = router;
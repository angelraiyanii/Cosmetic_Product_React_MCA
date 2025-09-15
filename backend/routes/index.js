const express = require('express');
const router = express.Router();

// Add your routes here
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});
// const express = require("express");
// const router = express.Router();

// Importing route files


// User 
const Userroutes = require("./Userroutes");
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
// Test route
router.get("/", (req, res) => {
  res.json({ message: 'API is working!' });
});
module.exports = router;
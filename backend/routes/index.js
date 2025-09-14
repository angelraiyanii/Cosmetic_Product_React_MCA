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


module.exports = router;
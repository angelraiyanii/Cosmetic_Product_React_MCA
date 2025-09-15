const express = require("express");
const router = express.Router();
const Offer = require("../models/OfferModel");

// Add Offer
router.post("/add", async (req, res) => {
  try {
    const newOffer = new Offer({
      ...req.body,
      discount: req.body.rate,
      validity: req.body.endDate
    });
    await newOffer.save();
    res.status(201).json({ success: true, message: "Offer added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get All Offers
router.get("/", async (req, res) => {
  try {
    const offers = await Offer.find();
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Offer
router.put("/update/:id", async (req, res) => {
  try {
    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        discount: req.body.rate,
        validity: req.body.endDate
      },
      { new: true }
    );
    res.json({ success: true, offer: updatedOffer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete Offer
router.delete("/delete/:id", async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;

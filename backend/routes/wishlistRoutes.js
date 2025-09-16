const express = require("express");
const router = express.Router();
const Wishlist = require("../models/WishlistModel");

// Add product to wishlist
router.post("/add", async (req, res) => {
  const { userId, productId } = req.body;

  try {
    let wishlistItem = await Wishlist.findOne({ userId, productId });
    if (wishlistItem) {
      return res.status(400).json({ success: false, message: "Item already in wishlist" });
    }

    wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();

    res.status(200).json({ success: true, message: "Added to wishlist", data: wishlistItem });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add to wishlist" });
  }
});

// Get wishlist by userId
router.get("/:userId", async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.params.userId })
      .populate("productId");

    res.status(200).json({ success: true, data: wishlistItems });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, error: "Failed to fetch wishlist" });
  }
});

// Delete wishlist item by ID
router.delete("/:wishlistItemId", async (req, res) => {
  try {
    const wishlistItemId = req.params.wishlistItemId;

    const deletedItem = await Wishlist.findByIdAndDelete(wishlistItemId);

    if (!deletedItem) {
      return res.status(404).json({ success: false, error: "Wishlist item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from wishlist successfully",
      data: deletedItem,
    });
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    res.status(500).json({ success: false, error: "Failed to remove item from wishlist" });
  }
});

// (Optional) Clear entire wishlist for a user
router.delete("/clear/:userId", async (req, res) => {
  try {
    const result = await Wishlist.deleteMany({ userId: req.params.userId });
    res.status(200).json({
      success: true,
      message: "Wishlist cleared",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to clear wishlist" });
  }
});

module.exports = router;

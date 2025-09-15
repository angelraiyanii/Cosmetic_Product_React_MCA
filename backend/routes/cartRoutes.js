const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Add this import
const Cart = require("../models/CartModel");

// Add product to cart
router.post("/add", async (req, res) => {
  const { userId, productId } = req.body;

  try {
    console.log("Cart add request:", { userId, productId });
    
    if (!userId || !productId) {
      return res.status(400).json({ error: "Missing userId or productId" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid userId or productId format" });
    }
    
    let cartItem = await Cart.findOne({ userId, productId });
    if (cartItem) {
      cartItem.quantity += 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({ userId, productId, quantity: 1 }); // Explicitly set quantity
      await cartItem.save();
    }
    
    res.status(200).json({ message: "Added to cart", cartItem });
  } catch (error) {
    console.error("Cart add error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's cart
router.get("/:userId", async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.params.userId }).populate("productId");
    res.status(200).json(cartItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Remove item from cart
router.delete("/remove/:cartItemId", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.cartItemId);
    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

// Update cart item quantity
router.put("/update/:cartItemId", async (req, res) => {
  const { quantity } = req.body;
  
  try {
    const cartItem = await Cart.findById(req.params.cartItemId);
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    
    cartItem.quantity = quantity;
    await cartItem.save();
    
    res.status(200).json({ message: "Cart updated", cartItem });
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart" });
  }
});
// Clear user's cart
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.params.userId });
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
});
module.exports = router;
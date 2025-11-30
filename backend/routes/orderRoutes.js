const express = require('express');
const router = express.Router();
const Order = require('../models/OrderModel');

// Create Order
router.post("/create", async (req, res) => {
  try {
    const generateOrderId = () => {
      const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
      const random = Math.floor(100000 + Math.random() * 900000);
      return `GLOW-${date}-${random}`;
    };

    const orderId = generateOrderId();

    const order = new Order({
      orderId, // Save readable orderId
      ...req.body,
      status: 'pending', // Default status
      paymentStatus: 'pending'
    });

    await order.save();

    res.status(200).json({
      success: true,
      order,
      razorpayOrder: {
        id: order.razorpayOrderId,
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Dummy Payment Success Verification (No signature verification needed)
router.post('/payment-success', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    console.log('Dummy payment success:', { orderId, paymentId });

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // For dummy payments, always accept the payment
    // No signature verification needed
    order.paymentStatus = "paid";
    order.razorpayPaymentId = paymentId || `pay_dummy_${Date.now()}`;
    await order.save();

    console.log('Dummy payment completed for order:', orderId);

    res.json({ 
      success: true, 
      message: "Dummy payment verified successfully",
      orderId: order._id
    });
  } catch (error) {
    console.error('Dummy payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Dummy payment verification failed", 
      error: error.message 
    });
  }
});

// Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// Get orders by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 }); // Sort by latest first

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
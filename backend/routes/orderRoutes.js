const express = require('express');
const router = express.Router();
const Order = require('../models/OrderModel');

// Create Order (No Razorpay needed for dummy payments)
router.post("/create", async (req, res) => {
  try {
    const generateOrderId = () => {
      const date = new Date().toISOString().slice(0,10).replace(/-/g,"");
      const random = Math.floor(100000 + Math.random() * 900000);
      return `GLOW-${date}-${random}`;
    };

    const orderId = generateOrderId();

    const order = new Order({
      orderId, // 👈 save readable orderId
      ...req.body,
      razorpayOrderId: `dummy_${Date.now()}`
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
    res.status(500).json({ message: err.message });
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

module.exports = router;
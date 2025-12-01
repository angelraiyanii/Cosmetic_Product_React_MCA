const express = require('express');
const router = express.Router();
const Order = require('../models/OrderModel');

// Get all orders (for admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullname email');

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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
    const order = await Order.findById(req.params.id)
      .populate('userId', 'fullname email');
    
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

// Update order status (for admin)
router.put("/:id", async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug endpoint - check order structure
router.get("/debug/check-orders", async (req, res) => {
  try {
    const orders = await Order.find().limit(5);
    const ordersWithPopulate = await Order.find().populate('userId', 'name email').limit(5);
    
    console.log("=== ORDERS WITHOUT POPULATE ===");
    console.log(JSON.stringify(orders, null, 2));
    
    console.log("\n=== ORDERS WITH POPULATE ===");
    console.log(JSON.stringify(ordersWithPopulate, null, 2));
    
    res.json({
      success: true,
      ordersWithoutPopulate: orders,
      ordersWithPopulate: ordersWithPopulate,
      totalOrders: await Order.countDocuments()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
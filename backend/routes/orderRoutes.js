const express = require("express");
const router = express.Router();
const Order = require("../models/OrderModel");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "YOUR_RAZORPAY_KEY",
  key_secret: "YOUR_RAZORPAY_SECRET",
});

// Create Order in DB + Razorpay Order
router.post("/create", async (req, res) => {
  try {
    const {
      userId,
      products,
      shippingAddress,
      subtotal,
      tax,
      shipping,
      discount,
      totalAmount
    } = req.body;

    const orderId = "ORDER_" + Date.now();

    // Save order in DB
    const order = new Order({
      userId,
      orderId,
      products,
      shippingAddress,
      subtotal,
      tax,
      shipping,
      discount,
      totalAmount
    });

    await order.save();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Rs to paise
      currency: "INR",
      receipt: orderId
    });

    res.status(200).json({ success: true, order, razorpayOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Update payment status
router.post("/payment-success", async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.paymentStatus = "paid";
    await order.save();

    res.status(200).json({ success: true, message: "Payment successful" });
  } catch (error) {
    console.error("Payment success error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;

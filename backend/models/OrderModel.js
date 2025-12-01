const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true }, // 👈 Custom readable ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: Array,
  shippingAddress: Object,
  subtotal: Number,
  tax: Number,
  shipping: Number,
  discount: Number,
  totalAmount: Number,
  status: { type: String, default: "pending" },
  paymentStatus: { type: String, default: "pending" },
  razorpayOrderId: String,
  razorpayPaymentId: String,
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);

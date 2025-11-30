const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/OrderModel');

const instance = new Razorpay({
    key_id: 'rzp_test_yCgrsfXSuM7SxL',
    key_secret: 'eaxt0pkgow03xe2s2ufGFmBK',
});

// Create Razorpay order

// Create Razorpay order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt } = req.body;

        const options = {
            amount: Math.round(amount), // Amount should be in paise
            currency: currency || 'INR',
            receipt: receipt,
            payment_capture: 1,
        };

        console.log('Creating Razorpay order with options:', options);

        const order = await instance.orders.create(options);

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Razorpay order',
            error: error.message
        });
    }
});

// Verify payment signature
router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt } = req.body;

        console.log('Payment verification request:', {
            razorpay_order_id,
            razorpay_payment_id,
            receipt
        });

        // Verify signature
        const generated_signature = crypto
            .createHmac('sha256', 'eaxt0pkgow03xe2s2ufGFmBK')
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        console.log('Signature verification:', {
            generated: generated_signature,
            received: razorpay_signature,
            match: generated_signature === razorpay_signature
        });

        if (generated_signature === razorpay_signature) {
            // Payment is legitimate, update order status
            const updatedOrder = await Order.findByIdAndUpdate(
                receipt,
                {
                    status: 'delivered',
                    paymentStatus: 'paid',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpayOrderId: razorpay_order_id
                },
                { new: true }
            );

            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            console.log('Payment verified successfully for order:', receipt);

            return res.status(200).json({
                success: true,
                message: 'Payment verified and order status updated',
                order: updatedOrder
            });
        } else {
            // Invalid signature
            console.error('Invalid payment signature');
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
});

// Add this endpoint to handle payment success (the one that's returning 404)
router.post('/payment-success', async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        console.log('Payment success callback:', { orderId, paymentId });

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Update order status
        order.paymentStatus = "paid";
        order.razorpayPaymentId = paymentId;
        await order.save();

        console.log('Payment completed for order:', orderId);

        res.json({
            success: true,
            message: "Payment completed successfully",
            orderId: order._id
        });
    } catch (error) {
        console.error('Payment success callback error:', error);
        res.status(500).json({
            success: false,
            message: "Payment completion failed",
            error: error.message
        });
    }
});

module.exports = router;
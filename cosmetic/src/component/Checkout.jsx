
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaCheckCircle, 
  FaSpinner, 
  FaShieldAlt, 
  FaTruck, 
  FaArrowLeft, 
  FaCreditCard 
} from "react-icons/fa";

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // Load data from localStorage
    const checkoutData = localStorage.getItem('checkoutData');
    if (checkoutData) {
      const data = JSON.parse(checkoutData);
      setOrderData(data.orderData);
      setCartItems(data.cartItems);
    } else {
      // Redirect to cart if no data
      window.location.href = "/cart";
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const RAZORPAY_KEY = import.meta?.env?.VITE_RAZORPAY_KEY || "YOUR_RAZORPAY_KEY";

  const formatCurrency = (value) => {
    const num = typeof value === 'number' ? value : parseFloat(value || 0);
    if (Number.isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const displayOrderId = orderId || null;

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // 1. Create Order in Database + Razorpay Order
      const orderPayload = {
        userId: orderData.userId,
        products: cartItems.map(item => ({
          productId: item.productId._id || item.productId,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: orderData.addressName || "Customer",
          email: orderData.email,
          phone: orderData.phone,
          address: orderData.address,
          city: orderData.city,
          state: orderData.state,
          zip: orderData.zip,
          country: orderData.country || "India"
        },
        subtotal: parseFloat(orderData.subtotal),
        tax: parseFloat(orderData.tax),
        shipping: parseFloat(orderData.shipping),
        discount: parseFloat(orderData.discount || 0),
        totalAmount: parseFloat(orderData.total)
      };

      const res = await axios.post(
        "http://localhost:5000/api/orders/create", 
        orderPayload
      );

      const { order, razorpayOrder } = res.data;
      setOrderId(order.orderId);
      setRazorpayOrderId(razorpayOrder.id);

      // 2. Open Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY, // public Razorpay key from env (Vite: VITE_RAZORPAY_KEY)
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "GlowCosmetics",
        description: `Order ${order.orderId}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // 3. Update payment status
            const paymentRes = await axios.post(
              "http://localhost:5000/api/orders/payment-success",
              {
                orderId: order.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              }
            );

            if (paymentRes.data.success) {
              setPaymentSuccess(true);
              setIsProcessing(false);
              
              // Clear cart
              await axios.delete(
                `http://localhost:5000/api/CartModel/clear/${orderData.userId}`
              );
              
              // Clear checkout data
              localStorage.removeItem('checkoutData');
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: orderData.addressName || "Customer",
          email: orderData.email,
          contact: orderData.phone,
        },
        theme: {
          color: "#007bff",
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            alert("Payment cancelled");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert("Payment failed: " + response.error.description);
        setIsProcessing(false);
      });
      
      rzp.open();
      setIsProcessing(false);
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed: " + (error.response?.data?.message || error.message));
      setIsProcessing(false);
    }
  };

  if (!orderData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FaSpinner className="spin" style={{ fontSize: '3rem' }} />
        <p>Loading...</p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="payment-success-page">
        <div className="success-animation">
          <FaCheckCircle className="success-icon" />
          <h1>Payment Successful!</h1>
          <p>Order ID: <strong>{orderId}</strong></p>
          <p>Razorpay Order ID: <strong>{razorpayOrderId}</strong></p>
          <p>Your order has been placed successfully.</p>
          
          <div className="success-actions">
            <button 
              className="btn-primary" 
              onClick={() => window.location.href = "/"}
            >
              Continue Shopping
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => window.location.href = "/orders"}
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button 
          onClick={() => window.location.href = "/cart"} 
          className="back-button"
        >
          <FaArrowLeft /> Back to Cart
        </button>
        <h2>Review Your Order</h2>
      </div>

      <div className="checkout-container">
        <div className="checkout-main">
          {/* Order ID */}
          <div className="section">
            <h3>Order Details</h3>
            <div className="info-box">
              <strong>Order ID:</strong> {displayOrderId ? `#${displayOrderId}` : `#${Math.floor(Math.random() * 1000000)}`}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="section">
            <h3>Shipping Address</h3>
            <div className="info-box">
              <p><strong>Name:</strong> {orderData.addressName}</p>
              <p><strong>Email:</strong> {orderData.email}</p>
              <p><strong>Phone:</strong> {orderData.phone}</p>
              <p><strong>Address:</strong> {orderData.address}</p>
              <p><strong>City:</strong> {orderData.city}, {orderData.state} - {orderData.zip}</p>
            </div>
          </div>

          {/* Products */}
          <div className="section">
            <h3>Products ({cartItems.length} items)</h3>
            {cartItems.map((item, index) => {
              const product = item.productId;
              return (
                <div className="product-item" key={index}>
                  <img 
                    src={product.image 
                      ? `http://localhost:5000/public/images/product_images/${product.image}` 
                      : "placeholder.jpg"
                    }
                    alt={product.name}
                  />
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>₹{product.price} x {item.quantity}</p>
                  </div>
                  <div className="product-total">
                    ₹{(product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="checkout-sidebar">
          <div className="summary-card">
            <h3>Order Summary</h3>
            
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{formatCurrency(orderData.subtotal)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping:</span>
              <span>{parseFloat(orderData.shipping || 0) === 0 ? "FREE" : `₹${formatCurrency(orderData.shipping)}`}</span>
            </div>
            
            <div className="summary-row">
              <span>Tax:</span>
              <span>₹{formatCurrency(orderData.tax)}</span>
            </div>
            
            {parseFloat(orderData.discount || 0) > 0 && (
              <div className="summary-row discount">
                <span>Discount:</span>
                <span>-₹{formatCurrency(orderData.discount)}</span>
              </div>
            )}
            
            <hr />
            
            <div className="summary-total">
              <span>Total:</span>
              <span>₹{formatCurrency(orderData.total)}</span>
            </div>

            <button 
              className="payment-btn" 
              onClick={handlePayment} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><FaSpinner className="spin" /> Processing...</>
              ) : (
                <><FaCreditCard /> Proceed to Payment</>
              )}
            </button>

            <div className="security-badges">
              <div className="badge">
                <FaShieldAlt /> Secure Payment
              </div>
              <div className="badge">
                <FaTruck /> Fast Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

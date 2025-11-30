import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaSpinner,
  FaShieldAlt,
  FaTruck,
  FaArrowLeft,
  FaCreditCard,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaBox,
  FaTag,
  FaShoppingBag
} from "react-icons/fa";

const Checkout = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [errors, setErrors] = useState({});

  // Razorpay configuration
  const RAZORPAY_KEY = "rzp_test_yCgrsfXSuM7SxL"; // Your Razorpay test key

  useEffect(() => {
    const checkoutData = localStorage.getItem("checkoutData");

    if (checkoutData) {
      const data = JSON.parse(checkoutData);
      setOrderData(data.orderData);
      setCartItems(data.cartItems);

      // Generate temporary order ID
      const tempOrderId = generateTempOrderId();
      setOrderId(tempOrderId);
    } else {
      window.location.href = "/cart";
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const generateTempOrderId = () => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value || 0);
    if (Number.isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  const handlePayment = async () => {
    if (!orderData || cartItems.length === 0) {
      setErrors({ payment: "Order data is missing" });
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      // Step 1: Create order in your backend
      const orderPayload = {
        userId: orderData.userId,
        products: cartItems.map((item) => ({
          productId: item.productId._id || item.productId,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
        })),
        shippingAddress: {
          name: orderData.addressName || "Customer",
          email: orderData.email,
          phone: orderData.phone,
          address: orderData.address,
          city: orderData.city,
          state: orderData.state,
          zip: orderData.zip,
          country: orderData.country || "India",
        },
        subtotal: parseFloat(orderData.subtotal),
        tax: parseFloat(orderData.tax),
        shipping: parseFloat(orderData.shipping),
        discount: parseFloat(orderData.discount || 0),
        totalAmount: parseFloat(orderData.total),
      };

      // Create order in your database
      const orderResponse = await axios.post(
        "http://localhost:5000/api/orderModel/create",
        orderPayload
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      const actualOrderId = orderResponse.data.order._id;
      setOrderId(actualOrderId);

      // Step 2: Create Razorpay order
      const razorpayOrderResponse = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        {
          amount: Math.round(parseFloat(orderData.total) * 100), // Convert to paise
          currency: "INR",
          receipt: actualOrderId,
        }
      );

      if (!razorpayOrderResponse.data.success) {
        throw new Error("Failed to create payment order");
      }

      const razorpayOrder = razorpayOrderResponse.data.order;

      // Step 3: Initialize Razorpay checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "💎 GlowCosmetic",
        description: `Order Payment - ${actualOrderId}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            console.log('Razorpay payment response:', response);

            // Verify payment on your server
            const verificationResponse = await axios.post(
              "http://localhost:5000/api/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                receipt: actualOrderId,
              }
            );

            if (verificationResponse.data.success) {
              setPaymentSuccess(true);

              // Clear checkout and cart data
              localStorage.removeItem("checkoutData");
              await axios.delete(
                `http://localhost:5000/api/CartModel/clear/${orderData.userId}`
              );
            } else {
              throw new Error(verificationResponse.data.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            setErrors({
              payment: error.message || "Payment verification failed. Please contact support."
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: orderData.addressName || "Customer",
          email: orderData.email,
          contact: orderData.phone,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            console.log("Payment modal dismissed");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure
      rzp.on('payment.failed', function (response) {
        console.error("Payment failed:", response.error);
        setErrors({
          payment: `Payment failed: ${response.error.description}`
        });
        setIsProcessing(false);
      });

      rzp.open();

    } catch (error) {
      console.error("Payment Error:", error);
      let errorMessage = "Something went wrong. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      setErrors({ payment: errorMessage });
      setIsProcessing(false);
    }
  };

  if (!orderData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <FaSpinner
            style={{ fontSize: "50px", color: "#667eea", animation: "spin 1s linear infinite" }}
          />
          <p
            style={{
              marginTop: "20px",
              fontSize: "18px",
              color: "#666",
              fontWeight: "600",
            }}
          >
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "60px 40px",
            textAlign: "center",
            maxWidth: "500px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "slideUp 0.5s ease-out",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 30px",
              animation: "scaleIn 0.5s ease-out",
            }}
          >
            <FaCheckCircle style={{ fontSize: "50px", color: "white" }} />
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "15px",
            }}
          >
            Payment Successful!
          </h1>

          <div
            style={{
              background: "#f8f9fa",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "25px",
            }}
          >
            <p style={{ color: "#666", marginBottom: "10px" }}>Order ID</p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#667eea",
                fontFamily: "monospace",
              }}
            >
              #{orderId}
            </p>
          </div>

          <p style={{ color: "#666", marginBottom: "30px", lineHeight: "1.6" }}>
            Thank you for your purchase! Your order has been confirmed and will be
            shipped soon.
          </p>

          <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
            <button
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                padding: "15px 30px",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => (window.location.href = "/")}
            >
              Continue Shopping
            </button>
            <button
              style={{
                background: "white",
                color: "#667eea",
                border: "2px solid #667eea",
                padding: "15px 30px",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
              }}
              onClick={() => (window.location.href = "/OrderHistory")}
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Gradient Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        marginBottom: '40px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            style={{
              width: '60px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '18px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <FaArrowLeft />
          </button>

          {/* Shopping Bag Icon */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '15px',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <FaShoppingBag style={{
              fontSize: '28px',
              color: '#667eea'
            }} />
          </div>

          {/* Title and Subtitle */}
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 5px 0',
              letterSpacing: '-0.5px'
            }}>
              Checkout
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontWeight: '400'
            }}>
              Complete your order
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '30px'
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {/* Order ID Card */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaBox size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Order ID</p>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  }}>
                    #{orderId}
                  </h3>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FaMapMarkerAlt style={{ color: '#667eea' }} />
                Shipping Address
              </h3>

              <div style={{
                background: '#f8f9fa',
                borderRadius: '15px',
                padding: '20px'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '5px'
                  }}>{orderData.addressName}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaEnvelope style={{ color: '#667eea', fontSize: '16px' }} />
                    <span style={{ color: '#666' }}>{orderData.email}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaPhone style={{ color: '#667eea', fontSize: '16px' }} />
                    <span style={{ color: '#666' }}>{orderData.phone}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <FaMapMarkerAlt style={{ color: '#667eea', fontSize: '16px', marginTop: '3px' }} />
                    <div style={{ color: '#666' }}>
                      <p>{orderData.address}</p>
                      <p>{orderData.city}, {orderData.state} - {orderData.zip}</p>
                      <p>{orderData.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '20px'
              }}>
                Order Items ({cartItems.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {cartItems.map((item, index) => {
                  const product = item.productId;
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      gap: '15px',
                      padding: '15px',
                      background: '#f8f9fa',
                      borderRadius: '15px',
                      alignItems: 'center',
                      transition: 'transform 0.2s'
                    }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                      {/* Product Image */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        flexShrink: 0,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}>
                        {product.image ? (
                          <img
                            src={`http://localhost:5000/public/images/product_images/${product.image}`}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:30px;font-weight:bold">${product.name.charAt(0)}</div>`;
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '30px',
                            fontWeight: 'bold'
                          }}>
                            {product.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#333',
                          marginBottom: '5px'
                        }}>{product.name}</h4>
                        <p style={{ color: '#999', fontSize: '14px' }}>
                          ₹{formatCurrency(product.price)} × {item.quantity}
                        </p>
                      </div>

                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#667eea'
                      }}>
                        ₹{formatCurrency(product.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '25px',
                textAlign: 'center'
              }}>Order Summary</h3>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#666' }}>Subtotal</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>
                    ₹{formatCurrency(orderData.subtotal)}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaTruck style={{ color: '#667eea' }} />
                    Shipping
                  </span>
                  <span style={{
                    fontWeight: '600',
                    color: parseFloat(orderData.shipping) === 0 ? '#10b981' : '#333'
                  }}>
                    {parseFloat(orderData.shipping) === 0 ? "FREE" : `₹${formatCurrency(orderData.shipping)}`}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#666' }}>Tax (GST)</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>
                    ₹{formatCurrency(orderData.tax)}
                  </span>
                </div>

                {parseFloat(orderData.discount) > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                      <FaTag />
                      Discount
                    </span>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>
                      -₹{formatCurrency(orderData.discount)}
                    </span>
                  </div>
                )}
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: 'white'
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Total Amount</span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    ₹{formatCurrency(orderData.total)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {errors.payment && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  {errors.payment}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  background: isProcessing
                    ? '#ccc'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  marginBottom: '20px'
                }}
                onMouseOver={(e) => {
                  if (!isProcessing) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCreditCard />
                    Pay with Razorpay
                  </>
                )}
              </button>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#10b981',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  <FaShieldAlt />
                  Secure Payment
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#667eea',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  <FaTruck />
                  Fast Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideUp {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
          
          @media (max-width: 968px) {
            div[style*="gridTemplateColumns: 1fr 400px"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Checkout;
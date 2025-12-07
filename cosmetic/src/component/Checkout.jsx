import React, { Component } from "react";
import axios from "axios";
import {
  FaSpinner,
  FaCheck,
  FaTimes,
  FaPlusCircle,
  FaMapMarkerAlt,
  FaEdit,
  FaArrowLeft,
  FaCreditCard,
  FaShieldAlt,
  FaTruck,
  FaPercentage,
  FaBox,
  FaTag,
  FaShoppingBag,
  FaEnvelope,
  FaPhone
} from "react-icons/fa";

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
 const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000" 
    : "https://gowcosmetic-backed.onrender.com";
class CheckoutForm extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      // Cart data
      cartItems: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,

      // Address management
      addresses: [],
      selectedAddressId: null,
      userEmail: "",
      userData: {},
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      addressName: "",
      errors: {},
      isLoadingUser: true,
      showAddressForm: false,
      isEditing: false,
      editingAddressId: null,

      // Payment processing
      isProcessing: false,
      paymentSuccess: false,
      orderId: "",
      paymentErrors: {}
      , razorpayLoaded: false
    };
  }


  componentDidMount() {
    this.loadCartData();
    this.fetchUserData();
    this.loadAddressesFromLocalStorage();
    // Load Razorpay SDK once when component mounts
    this.loadRazorpayScript().catch(err => console.warn('Razorpay SDK failed to load:', err));

    // Suppress Razorpay feature warnings
    const originalWarn = console.warn;
    console.warn = function (...args) {
      if (args[0] && args[0].includes('otp-credentials')) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };
  }

  loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        this.setState({ razorpayLoaded: true });
        return resolve(true);
      }

      const existing = document.getElementById('razorpay-sdk');
      if (existing) {
        existing.addEventListener('load', () => {
          this.setState({ razorpayLoaded: true });
          resolve(true);
        });
        existing.addEventListener('error', () => reject(false));
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        this.setState({ razorpayLoaded: true });
        resolve(true);
      };
      script.onerror = () => reject(false);
      document.body.appendChild(script);
    });
  };
  loadCartData = () => {
    try {
      const checkoutData = localStorage.getItem('checkoutData');

      if (!checkoutData) {
        // Try to get from cart
        const cartData = localStorage.getItem('cart');
        if (!cartData || JSON.parse(cartData).items.length === 0) {
          window.location.href = "/cart";
          return;
        }

        // Use cart data
        const cart = JSON.parse(cartData);
        this.prepareCheckoutFromCart(cart.items);
        return;
      }

      const data = JSON.parse(checkoutData);

      // Check if it's a "Buy Now" or full cart checkout
      if (data.type === 'buy_now') {
        // Single product buy now
        this.prepareBuyNowCheckout(data);
      } else if (data.cartItems) {
        // Full cart checkout
        this.prepareCheckoutFromCart(data.cartItems);
      } else if (data.productId) {
        // Legacy buy now format
        this.prepareBuyNowCheckout(data);
      } else {
        window.location.href = "/cart";
      }

    } catch (error) {
      console.error("Error loading cart data:", error);
      window.location.href = "/cart";
    }
  };

  prepareBuyNowCheckout = (data) => {
    // Create cart item structure similar to cart items
    const cartItem = {
      productId: {
        _id: data.productId,
        name: data.name || "Product",
        price: data.price || 0,
        productImage: data.productImage,
        image: data.productImage
      },
      quantity: data.quantity || 1
    };

    const subtotal = (data.price || 0) * (data.quantity || 1);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.10;
    const total = subtotal + shipping + tax;

    this.setState({
      cartItems: [cartItem], // Single item array
      subtotal,
      tax,
      shipping,
      total
    });
  };

  prepareCheckoutFromCart = (cartItems) => {
    // Calculate totals from cart items
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.productId?.price || item.price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);

    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.10;
    const total = subtotal + shipping + tax;

    this.setState({
      cartItems: cartItems.map(item => ({
        ...item,
        productId: {
          ...item.productId,
          // Ensure productId has proper structure
          _id: item.productId?._id || item.productId,
          name: item.productId?.name || "Product",
          price: item.productId?.price || item.price || 0,
          productImage: item.productId?.productImage || item.productId?.image,
          image: item.productId?.productImage || item.productId?.image
        }
      })),
      subtotal,
      tax,
      shipping,
      total
    });
  };

  getProductImageUrl = (product) => {
    if (!product) return placeholderImage;

    // Try different possible image field names
    const imageField = product.productImage || product.image || product.productImageName;

    if (!imageField) return placeholderImage;

    // Check if it's already a full URL
    if (imageField.startsWith('http')) {
      return imageField;
    }

    // Build full URL for local images
    return `${url}/public/images/product_images/${imageField}`;
  };

  loadAddressesFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) return;

      const user = JSON.parse(userData);
      const userId = user.id;
      const storedAddresses = localStorage.getItem(`user_addresses_${userId}`);

      if (storedAddresses) {
        const addresses = JSON.parse(storedAddresses);
        this.setState({
          addresses,
          selectedAddressId: addresses.length > 0 ? addresses[0]._id : null
        });
      }
    } catch (error) {
      console.error("Error loading addresses from localStorage:", error);
    }
  };

  saveAddressesToLocalStorage = (addresses) => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) return;

      const user = JSON.parse(userData);
      const userId = user.id;
      localStorage.setItem(`user_addresses_${userId}`, JSON.stringify(addresses));
    } catch (error) {
      console.error("Error saving addresses to localStorage:", error);
    }
  };

  fetchUserData = async () => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        this.setState({ isLoadingUser: false });
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);

      // Try to fetch complete user data from backend
      try {
        const response = await axios.get(`${url}/api/Usermodel/user-details/${user.id}`);
        if (response.data.success) {
          const completeUser = response.data.user;

          // Create main address with complete data
          const mainAddress = {
            _id: "main",
            name: "Primary Address",
            email: completeUser.email || user.email || "",
            phone: completeUser.mobile || completeUser.phone || "",
            address: completeUser.address || "",
            city: this.extractCityFromAddress(completeUser.address),
            state: this.extractStateFromAddress(completeUser.address),
            zip: completeUser.pincode || completeUser.zip || "",
            country: "India",
            isDefault: true
          };

          // Combine main address with saved addresses
          const savedAddresses = this.state.addresses.filter(addr => addr._id !== "main");
          const allAddresses = [mainAddress, ...savedAddresses];

          this.setState({
            userData: completeUser,
            userEmail: completeUser.email || user.email || "",
            addresses: allAddresses,
            selectedAddressId: allAddresses.length > 0 ? allAddresses[0]._id : null,
            phone: completeUser.mobile || completeUser.phone || "",
            isLoadingUser: false
          });
          return;
        }
      } catch (apiError) {
        console.warn("Could not fetch user details from API, using localStorage data:", apiError);
      }

      // Fallback: Use localStorage data only
      const mainAddress = {
        _id: "main",
        name: "Primary Address",
        email: user.email || "",
        phone: user.mobile || user.phone || "",
        address: user.address || "",
        city: this.extractCityFromAddress(user.address),
        state: this.extractStateFromAddress(user.address),
        zip: user.pincode || user.zip || "",
        country: "India",
        isDefault: true
      };

      // Combine main address with saved addresses
      const savedAddresses = this.state.addresses.filter(addr => addr._id !== "main");
      const allAddresses = [mainAddress, ...savedAddresses];

      this.setState({
        userData: user,
        userEmail: user.email || "",
        addresses: allAddresses,
        selectedAddressId: allAddresses.length > 0 ? allAddresses[0]._id : null,
        phone: user.mobile || user.phone || "",
        isLoadingUser: false
      });

    } catch (err) {
      console.error("Error processing user data:", err);
      this.setState({ isLoadingUser: false });
    }
  };

  extractCityFromAddress = (address) => {
    if (!address) return "";
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : "";
  };

  extractStateFromAddress = (address) => {
    if (!address) return "";
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : "";
  };

  handleAddressSelect = (addressId) => {
    this.setState({ selectedAddressId: addressId });
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      errors: { ...this.state.errors, [e.target.name]: "" }
    });
  };

  toggleAddressForm = () => {
    this.setState({
      showAddressForm: !this.state.showAddressForm,
      isEditing: false,
      editingAddressId: null,
      addressName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: this.state.userData.mobile || ""
    });
  };

  handleEditAddress = (address) => {
    this.setState({
      showAddressForm: true,
      isEditing: true,
      editingAddressId: address._id,
      addressName: address.name,
      address: address.address,
      city: address.city,
      state: address.state,
      zip: address.zip,
      phone: address.phone
    });
  };

  handleRemoveAddress = (addressId) => {
    if (addressId === "main") {
      alert("Primary address cannot be removed");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this address?")) {
      return;
    }

    const updatedAddresses = this.state.addresses.filter(addr => addr._id !== addressId);
    this.setState({
      addresses: updatedAddresses,
      selectedAddressId: updatedAddresses.length > 0 ? updatedAddresses[0]._id : null
    });

    this.saveAddressesToLocalStorage(updatedAddresses);
  };

  validateAddressForm = () => {
    let newErrors = {};
    if (!this.state.addressName) newErrors.addressName = "Address name is required";
    if (!this.state.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(this.state.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!this.state.address) newErrors.address = "Address is required";
    if (!this.state.city) newErrors.city = "City is required";
    if (!this.state.state) newErrors.state = "State is required";
    if (!this.state.zip) {
      newErrors.zip = "ZIP code is required";
    } else if (!/^\d{6}$/.test(this.state.zip)) {
      newErrors.zip = "ZIP code must be 6 digits";
    }

    this.setState({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  handleSaveAddress = () => {
    if (!this.validateAddressForm()) {
      return;
    }

    const newAddress = {
      _id: this.state.isEditing ? this.state.editingAddressId : `addr_${Date.now()}`,
      name: this.state.addressName,
      email: this.state.userEmail,
      phone: this.state.phone,
      address: this.state.address,
      city: this.state.city,
      state: this.state.state,
      zip: this.state.zip,
      country: "India",
      isDefault: false
    };

    let updatedAddresses;
    if (this.state.isEditing) {
      updatedAddresses = this.state.addresses.map(addr =>
        addr._id === this.state.editingAddressId ? newAddress : addr
      );
    } else {
      updatedAddresses = [...this.state.addresses, newAddress];
    }

    this.setState({
      addresses: updatedAddresses,
      selectedAddressId: this.state.isEditing ? this.state.selectedAddressId : newAddress._id,
      showAddressForm: false,
      addressName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: this.state.userData.mobile || ""
    });

    this.saveAddressesToLocalStorage(updatedAddresses);
    alert(`Address ${this.state.isEditing ? 'updated' : 'added'} successfully!`);
  };

  validateCheckout = () => {
    if (!this.state.selectedAddressId) {
      alert("Please select a shipping address");
      return false;
    }
    return true;
  };

  generateTempOrderId = () => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  handlePayment = async () => {
    if (!this.validateCheckout()) {
      return;
    }

    const selectedAddress = this.state.addresses.find(
      addr => addr._id === this.state.selectedAddressId
    );

    if (!selectedAddress) {
      alert("Please select a valid shipping address");
      return;
    }

    this.setState({ isProcessing: true, paymentErrors: {} });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      // Prepare order data
      const orderData = {
        userId,
        email: selectedAddress.email,
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zip: selectedAddress.zip,
        country: selectedAddress.country,
        addressName: selectedAddress.name,
        subtotal: this.state.subtotal,
        tax: this.state.tax,
        shipping: this.state.shipping,
        total: this.state.total,
      };

      // Step 1: Create order in backend
      const orderPayload = {
        userId: orderData.userId,
        products: this.state.cartItems.map((item) => ({
          productId: item.productId._id || item.productId,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
          image: item.productId.productImage || item.productId.image || null,
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
        totalAmount: parseFloat(orderData.total),
      };

      const orderResponse = await axios.post(
        `${url}/api/orderModel/create`,
        orderPayload
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      const actualOrderId = orderResponse.data.order._id;
      this.setState({ orderId: actualOrderId });

      // Step 2: Create Razorpay order
      const razorpayOrderResponse = await axios.post(
        `${url}/api/payment/create-order`,
        {
          amount: Math.round(parseFloat(this.state.total) * 100),
          currency: "INR",
          receipt: actualOrderId,
        }
      );

      if (!razorpayOrderResponse.data.success) {
        throw new Error("Failed to create payment order");
      }

      const razorpayOrder = razorpayOrderResponse.data.order;

      // Step 3: Ensure Razorpay SDK is loaded and initialize
      try {
        await this.loadRazorpayScript();
      } catch (err) {
        console.error('Razorpay SDK not available:', err);
        alert('Payment gateway failed to load. Please refresh and try again.');
        this.setState({ isProcessing: false });
        return;
      }

      if (!window.Razorpay) {
        console.error('window.Razorpay is not available after loading SDK');
        alert('Payment gateway unavailable. Please try again later.');
        this.setState({ isProcessing: false });
        return;
      }

      // Step 3: Initialize Razorpay
      const options = {
        key: "rzp_test_yCgrsfXSuM7SxL",
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "💎 GlowCosmetic",
        description: `Order Payment - ${actualOrderId}`,
        order_id: razorpayOrder.id,

        handler: async (response) => {
          try {
            // Verify payment
            const verificationResponse = await axios.post(
              `${url}/api/payment/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                receipt: actualOrderId,
              }
            );

            if (verificationResponse.data.success) {
              // Send order confirmation email
              await this.sendOrderConfirmationEmail(actualOrderId, orderData, selectedAddress);

              this.setState({ paymentSuccess: true });

              // Clear cart and local storage
              localStorage.removeItem("checkoutData");
              await axios.delete(
                `${url}/api/CartModel/clear/${userId}`
              );
            } else {
              throw new Error(verificationResponse.data.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            this.setState({
              paymentErrors: {
                payment: error.message || "Payment verification failed. Please contact support."
              }
            });
          } finally {
            this.setState({ isProcessing: false });
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
          ondismiss: () => {
            this.setState({ isProcessing: false });
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        console.error("Payment failed:", response.error);
        this.setState({
          paymentErrors: {
            payment: `Payment failed: ${response.error.description}`
          },
          isProcessing: false
        });
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

      this.setState({
        paymentErrors: { payment: errorMessage },
        isProcessing: false
      });
    }
  };
sendOrderConfirmationEmail = async (orderId, orderData, shippingAddress) => {
  try {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (!userData) return;

    const user = JSON.parse(userData);
    const userId = user.id;

    // Prepare email data
    const emailData = {
      userId: userId,
      orderId: orderId,
      customerName: shippingAddress.name || "Customer",
      customerEmail: shippingAddress.email,
      orderDate: new Date().toLocaleDateString(),
      orderTime: new Date().toLocaleTimeString(),
      orderTotal: this.state.total.toFixed(2),
      shippingAddress: shippingAddress,
      orderItems: this.state.cartItems.map(item => ({
        name: item.productId.name,
        quantity: item.quantity,
        price: item.productId.price,
        total: (item.productId.price * item.quantity).toFixed(2)
      }))
    };

    // Send email request to backend
    const response = await axios.post(
      `${url}/api/Usermodel/send-order-confirmation`,
      emailData
    );

    if (response.data.success) {
      console.log("Order confirmation email sent successfully");
    } else {
      console.warn("Failed to send order confirmation email:", response.data.message);
    }

  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    // Don't show error to user - email failure shouldn't affect payment success
  }
};
  formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value || 0);
    if (Number.isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  renderPaymentSuccess = () => {
    const { orderId } = this.state;

    return (
      <div className="checkout-success-container">
        <div className="success-bg-overlay"></div>
        <div className="checkout-success-wrapper">
          <div className="success-content">
            {/* Success Icon with Animation */}
            <div className="success-icon-wrapper">
              <div className="success-icon-circle">
                <FaCheck className="success-icon" />
              </div>
              <div className="success-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>
            </div>

            {/* Success Header */}
            <div className="success-header">
              <h1 className="success-title">🎉 Payment Successful!</h1>
              <p className="success-subtitle">Your order is confirmed</p>
            </div>

            {/* Order Details Card */}
            <div className="order-details-card">
              <div className="order-header">
                <div className="order-icon">📦</div>
                <div className="order-info">
                  <h3>Order Confirmation</h3>
                  <p className="order-time">Confirmed at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                </div>
              </div>

              {/* Order ID Section */}
              <div className="order-id-section">
                <div className="order-id-label">
                  <FaTag className="label-icon" />
                  <span>Order ID</span>
                </div>
                <div className="order-id-value">
                  <code>#{orderId || '6933f37c9b391fc082a1cc0e'}</code>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(orderId || '6933f37c9b391fc082a1cc0e');
                      const btn = document.querySelector('.copy-btn');
                      if (btn) {
                        btn.innerHTML = '✅ Copied!';
                        setTimeout(() => {
                          btn.innerHTML = '📋 Copy';
                        }, 2000);
                      }
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="order-id-note">Save this for tracking and reference</p>
              </div>

              {/* Confirmation Message */}
              <div className="confirmation-message">
                <div className="message-icon">✅</div>
                <div className="message-content">
                  <h4>Thank you for your purchase!</h4>
                  <p>Your order has been confirmed and will be shipped soon.</p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="delivery-info">
                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <FaEnvelope className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Confirmation Email</span>
                    <span className="info-value">Will be sent within 5 minutes</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <FaTruck className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Delivery Time</span>
                    <span className="info-value">3-5 business days</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon-wrapper">
                    <FaPhone className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Need Help?</span>
                    <span className="info-value">
                      Contact our <a href="/support" className="support-link">customer support</a>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="success-actions">
              <button
                className="btn-continue"
                onClick={() => window.location.href = "/"}
              >
                <FaShoppingBag className="btn-icon" />
                Continue Shopping
              </button>
              <button
                className="btn-orders"
                onClick={() => window.location.href = "/OrderHistory"}
              >
                <FaBox className="btn-icon" />
                View My Orders
              </button>
              <button
                className="btn-print"
                onClick={() => window.print()}
              >
                <FaCheck className="btn-icon" />
                Print Receipt
              </button>
            </div>

            {/* Order Timeline */}
            <div className="order-timeline">
              <div className="timeline-title">
                <h4>Order Status</h4>
              </div>
              <div className="timeline-steps">
                <div className="timeline-step active completed">
                  <div className="step-circle">1</div>
                  <div className="step-info">
                    <span className="step-label">Order Placed</span>
                    <span className="step-time">Just now</span>
                  </div>
                  <div className="step-line active"></div>
                </div>

                <div className="timeline-step active">
                  <div className="step-circle pulse">2</div>
                  <div className="step-info">
                    <span className="step-label">Processing</span>
                    <span className="step-time">Next step</span>
                  </div>
                  <div className="step-line"></div>
                </div>

                <div className="timeline-step">
                  <div className="step-circle">3</div>
                  <div className="step-info">
                    <span className="step-label">Shipped</span>
                    <span className="step-time">Estimated: 24 hours</span>
                  </div>
                  <div className="step-line"></div>
                </div>

                <div className="timeline-step">
                  <div className="step-circle">4</div>
                  <div className="step-info">
                    <span className="step-label">Delivered</span>
                    <span className="step-time">3-5 days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thank You Note */}
            <div className="thank-you-note">
              <p>✨ Thank you for shopping with us! We've sent a confirmation to your email.</p>
            </div>
          </div>

          {/* Confetti Animation */}
          <div className="confetti-container">
            {[...Array(100)].map((_, i) => (
              <div key={i} className="confetti" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'][Math.floor(Math.random() * 5)],
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`
              }} />
            ))}
          </div>
        </div>

        <style>
          {`
        /* Success Screen Specific Styles - Compact Version */
        .checkout-success-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 15px;
          position: relative;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .success-bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .checkout-success-wrapper {
          position: relative;
          max-width: 700px;
          width: 100%;
          z-index: 10;
        }
        
        .success-content {
          background: white;
          border-radius: 18px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }
        
        /* Success Icon - Smaller */
        .success-icon-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          margin: 0 auto 20px;
        }
        
        .success-icon-circle {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          animation: scaleIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }
        
        .success-icon {
          color: white;
          font-size: 36px;
          animation: checkmark 0.5s ease 0.3s both;
        }
        
        .success-rings {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .ring {
          position: absolute;
          border: 2px solid rgba(76, 175, 80, 0.3);
          border-radius: 50%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          animation: ripple 2s infinite;
        }
        
        .ring-1 { animation-delay: 0s; }
        .ring-2 { animation-delay: 0.7s; }
        .ring-3 { animation-delay: 1.4s; }
        
        /* Success Header - Smaller Fonts */
        .success-header {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .success-title {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }
        
        .success-subtitle {
          font-size: 1rem;
          color: #666;
          margin: 0;
          font-weight: 500;
        }
        
        /* Order Details Card - More Compact */
        .order-details-card {
          background: #f8fafc;
          border-radius: 14px;
          padding: 22px;
          margin-bottom: 25px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .order-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .order-icon {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .order-info h3 {
          margin: 0 0 5px 0;
          font-size: 1.2rem;
          color: #1a202c;
          font-weight: 600;
        }
        
        .order-time {
          color: #718096;
          margin: 0;
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        /* Order ID Section - More Compact */
        .order-id-section {
          background: white;
          border-radius: 10px;
          padding: 18px;
          margin: 18px 0;
          border: 1px solid #e3f2fd;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .order-id-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4a5568;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 12px;
        }
        
        .label-icon {
          color: #4CAF50;
          font-size: 0.95rem;
        }
        
        .order-id-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin: 15px 0;
        }
        
        .order-id-value code {
          font-size: 1.1rem;
          font-weight: 600;
          color: #3182ce;
          font-family: 'Courier New', 'SF Mono', Monaco, monospace;
          background: #edf2f7;
          padding: 10px 15px;
          border-radius: 8px;
          letter-spacing: 0.5px;
          flex: 1;
          text-align: center;
          border: 1px solid #e2e8f0;
          word-break: break-all;
        }
        
        .copy-btn {
          background: linear-gradient(135deg, #3182ce, #2c5282);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(49, 130, 206, 0.2);
        }
        
        .copy-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(49, 130, 206, 0.3);
          background: linear-gradient(135deg, #2c5282, #2a4365);
        }
        
        .order-id-note {
          color: #718096;
          font-size: 0.8rem;
          margin: 12px 0 0 0;
          text-align: center;
          font-style: italic;
        }
        
        /* Confirmation Message - Compact */
        .confirmation-message {
          display: flex;
          align-items: center;
          gap: 15px;
          background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
          padding: 18px;
          border-radius: 10px;
          margin: 20px 0;
          border-left: 4px solid #4CAF50;
          box-shadow: 0 1px 4px rgba(76, 175, 80, 0.1);
        }
        
        .message-icon {
          font-size: 1.8rem;
          color: #4CAF50;
          flex-shrink: 0;
        }
        
        .message-content h4 {
          margin: 0 0 6px 0;
          color: #2d3748;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .message-content p {
          margin: 0;
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        /* Delivery Info - Compact */
        .delivery-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: white;
          border-radius: 10px;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }
        
        .info-item:hover {
          transform: translateX(3px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
          border-color: #cbd5e0;
        }
        
        .info-icon-wrapper {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .info-icon {
          color: white;
          font-size: 1.1rem;
        }
        
        .info-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .info-label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
          margin-bottom: 3px;
        }
        
        .info-value {
          color: #718096;
          font-size: 0.85rem;
        }
        
        .support-link {
          color: #3182ce;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
          font-size: 0.85rem;
        }
        
        .support-link:hover {
          color: #2c5282;
          text-decoration: underline;
        }
        
        /* Action Buttons - Smaller */
        .success-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin: 30px 0;
        }
        
        .btn-continue,
        .btn-orders,
        .btn-print {
          padding: 14px 18px;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          min-height: 50px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        
        .btn-continue {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
        }
        
        .btn-continue:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(76, 175, 80, 0.25);
          background: linear-gradient(135deg, #43a047, #1b5e20);
        }
        
        .btn-orders {
          background: linear-gradient(135deg, #3182ce, #2c5282);
          color: white;
        }
        
        .btn-orders:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(49, 130, 206, 0.25);
          background: linear-gradient(135deg, #2c5282, #2a4365);
        }
        
        .btn-print {
          background: linear-gradient(135deg, #9C27B0, #7B1FA2);
          color: white;
        }
        
        .btn-print:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px rgba(156, 39, 176, 0.25);
          background: linear-gradient(135deg, #8e24aa, #6a1b9a);
        }
        
        .btn-icon {
          font-size: 1rem;
        }
        
        /* Order Timeline - Compact */
        .order-timeline {
          background: #f8fafc;
          border-radius: 14px;
          padding: 22px;
          margin: 25px 0;
          border: 1px solid #e2e8f0;
        }
        
        .timeline-title h4 {
          margin: 0 0 20px 0;
          font-size: 1.2rem;
          color: #1a202c;
          text-align: center;
          font-weight: 600;
        }
        
        .timeline-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          padding: 0 15px;
        }
        
        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          z-index: 1;
        }
        
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #718096;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 10px;
          position: relative;
          z-index: 2;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        
        .timeline-step.active .step-circle {
          background: #4CAF50;
          color: white;
        }
        
        .timeline-step.completed .step-circle {
          background: #2E7D32;
          color: white;
        }
        
        .step-circle.pulse {
          animation: pulse 2s infinite;
        }
        
        .step-info {
          text-align: center;
        }
        
        .step-label {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
          font-size: 0.85rem;
          white-space: nowrap;
        }
        
        .step-time {
          display: block;
          color: #718096;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .step-line {
          position: absolute;
          top: 20px;
          left: 50px;
          right: 0;
          height: 3px;
          background: #e2e8f0;
          z-index: 0;
          border-radius: 2px;
        }
        
        .step-line.active {
          background: linear-gradient(90deg, #4CAF50, #2E7D32);
          animation: lineProgress 1.5s ease;
        }
        
        /* Thank You Note - Smaller */
        .thank-you-note {
          text-align: center;
          padding: 18px;
          background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
          border-radius: 10px;
          margin-top: 20px;
          border: 2px dashed #4CAF50;
        }
        
        .thank-you-note p {
          color: #2E7D32;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.4;
        }
        
        /* Confetti Animation */
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          opacity: 0;
          animation: confettiFall 3s linear forwards;
          border-radius: 2px;
        }
        
        /* Animations */
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes checkmark {
          from {
            transform: scale(0) rotate(-45deg);
          }
          to {
            transform: scale(1) rotate(0);
          }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.6);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
          }
        }
        
        @keyframes lineProgress {
          from {
            width: 0;
          }
          to {
            width: calc(100% - 50px);
          }
        }
        
        @keyframes confettiFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(800px) rotate(720deg);
            opacity: 0;
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .checkout-success-container {
            padding: 12px;
          }
          
          .success-content {
            padding: 22px 16px;
            border-radius: 16px;
          }
          
          .success-title {
            font-size: 1.5rem;
          }
          
          .success-subtitle {
            font-size: 0.9rem;
          }
          
          .order-id-value {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .order-id-value code {
            font-size: 1rem;
            padding: 8px 12px;
          }
          
          .copy-btn {
            width: 100%;
            justify-content: center;
            padding: 9px 16px;
          }
          
          .success-actions {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          
          .btn-continue,
          .btn-orders,
          .btn-print {
            min-height: 46px;
            font-size: 0.85rem;
            padding: 12px 16px;
          }
          
          .timeline-steps {
            flex-direction: column;
            gap: 20px;
            padding: 0;
          }
          
          .timeline-step {
            flex-direction: row;
            align-items: flex-start;
            width: 100%;
            gap: 15px;
          }
          
          .step-circle {
            margin-bottom: 0;
            margin-right: 12px;
            width: 36px;
            height: 36px;
            font-size: 0.9rem;
          }
          
          .step-info {
            text-align: left;
            flex: 1;
          }
          
          .step-label {
            font-size: 0.85rem;
          }
          
          .step-time {
            font-size: 0.75rem;
          }
          
          .step-line {
            display: none;
          }
          
          .delivery-info {
            gap: 10px;
          }
          
          .info-item {
            padding: 12px;
            gap: 12px;
          }
          
          .info-icon-wrapper {
            width: 36px;
            height: 36px;
          }
          
          .info-icon {
            font-size: 1rem;
          }
          
          .info-label {
            font-size: 0.85rem;
          }
          
          .info-value {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .success-content {
            padding: 20px 14px;
          }
          
          .success-title {
            font-size: 1.4rem;
          }
          
          .order-id-value code {
            font-size: 0.95rem;
            padding: 7px 10px;
          }
          
          .confirmation-message {
            flex-direction: column;
            text-align: center;
            gap: 12px;
            padding: 16px;
          }
          
          .message-icon {
            font-size: 1.6rem;
          }
          
          .message-content h4 {
            font-size: 1rem;
          }
          
          .message-content p {
            font-size: 0.85rem;
          }
          
          .order-header {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          
          .order-icon {
            font-size: 1.6rem;
          }
          
          .order-info h3 {
            font-size: 1.1rem;
          }
          
          .thank-you-note p {
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 360px) {
          .success-title {
            font-size: 1.3rem;
          }
          
          .btn-icon {
            font-size: 0.9rem;
          }
          
          .btn-continue,
          .btn-orders,
          .btn-print {
            font-size: 0.8rem;
            padding: 10px 14px;
          }
        }
        `}
        </style>
      </div>
    );
  };

  render() {
    const {
      cartItems,
      subtotal,
      tax,
      shipping,
      total,
      addresses,
      selectedAddressId,
      showAddressForm,
      addressName,
      isEditing,
      userEmail,
      errors,
      isLoadingUser,
      isProcessing,
      paymentSuccess,
      paymentErrors
    } = this.state;

    if (paymentSuccess) {
      return this.renderPaymentSuccess();
    }

    if (isLoadingUser) {
      return (
        <div className="cart-loading">
          <div className="loading-content">
            <FaSpinner className="loading-spinner" />
            <h3>Loading checkout...</h3>
          </div>
        </div>
      );
    }

    const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);

    return (
      <div className="checkout-container">
        {/* Header */}
        <div className="cart-header">
          <div className="container">
            <div className="header-content">
              <button onClick={() => window.history.back()} className="back-button">
                <FaArrowLeft />
              </button>
              <div className="header-info">
                <h1>
                  <FaCreditCard className="cart-icon" />
                  Checkout
                </h1>
                <p>Complete your order</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container cart-content">
          <div className="row">
            {/* Left Column - Address & Items */}
            <div className="col-lg-8">
              {/* Shipping Address Section */}
              <div className="checkout-form-section">
                <div className="section-header">
                  <h3>Shipping Address</h3>
                  <p>Select or add a delivery address</p>
                </div>

                {/* Address Selection */}
                <div className="address-selection">
                  {addresses.map(address => (
                    <div
                      key={address._id}
                      className={`address-card ${selectedAddressId === address._id ? 'selected' : ''}`}
                      onClick={() => this.handleAddressSelect(address._id)}
                    >
                      <div className="address-header">
                        <div className="address-name">
                          <FaMapMarkerAlt className="me-2" />
                          <strong>{address.name}</strong>
                          {address._id === "main" && (
                            <span className="badge-primary">Primary</span>
                          )}
                        </div>
                        <div className="address-actions">
                          <button
                            className="btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              this.handleEditAddress(address);
                            }}
                          >
                            <FaEdit />
                          </button>
                          {address._id !== "main" && (
                            <button
                              className="btn-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                this.handleRemoveAddress(address._id);
                              }}
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="address-details">
                        <p><strong>Email:</strong> {address.email}</p>
                        <p><strong>Phone:</strong> {address.phone}</p>
                        <p><strong>Address:</strong> {address.address}</p>
                        <p><strong>City:</strong> {address.city}, <strong>State:</strong> {address.state} - {address.zip}</p>
                      </div>
                      {selectedAddressId === address._id && (
                        <div className="selected-indicator">
                          <FaCheck className="me-2" />
                          Selected
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Address Button */}
                  <div className="add-address-card" onClick={this.toggleAddressForm}>
                    <FaPlusCircle className="add-icon" />
                    <span>Add New Address</span>
                  </div>
                </div>

                {/* Add/Edit Address Form */}
                {showAddressForm && (
                  <div className="address-form-section">
                    <div className="section-header">
                      <h4>{isEditing ? 'Edit Address' : 'Add New Address'}</h4>
                    </div>

                    <div className="address-form">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Address Name *</label>
                          <input
                            type="text"
                            className={`form-control ${errors.addressName ? "is-invalid" : ""}`}
                            name="addressName"
                            value={addressName}
                            onChange={this.handleChange}
                            placeholder="e.g., Home, Work, Office"
                          />
                          {errors.addressName && (
                            <div className="invalid-feedback">{errors.addressName}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label">Email Address</label>
                          <input
                            type="email"
                            className="form-control"
                            value={userEmail}
                            readOnly
                            disabled
                          />
                          <small className="text-muted">Email is taken from your profile</small>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Phone Number *</label>
                          <input
                            type="text"
                            className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                            name="phone"
                            value={this.state.phone}
                            onChange={this.handleChange}
                            placeholder="10-digit phone number"
                            maxLength="10"
                          />
                          {errors.phone && (
                            <div className="invalid-feedback">{errors.phone}</div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Street Address *</label>
                        <textarea
                          className={`form-control ${errors.address ? "is-invalid" : ""}`}
                          name="address"
                          value={this.state.address}
                          onChange={this.handleChange}
                          placeholder="House number, street name, area"
                          rows="3"
                        />
                        {errors.address && (
                          <div className="invalid-feedback">{errors.address}</div>
                        )}
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">City *</label>
                          <input
                            type="text"
                            className={`form-control ${errors.city ? "is-invalid" : ""}`}
                            name="city"
                            value={this.state.city}
                            onChange={this.handleChange}
                            placeholder="Enter city"
                          />
                          {errors.city && (
                            <div className="invalid-feedback">{errors.city}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label">State *</label>
                          <input
                            type="text"
                            className={`form-control ${errors.state ? "is-invalid" : ""}`}
                            name="state"
                            value={this.state.state}
                            onChange={this.handleChange}
                            placeholder="Enter state"
                          />
                          {errors.state && (
                            <div className="invalid-feedback">{errors.state}</div>
                          )}
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">ZIP Code *</label>
                          <input
                            type="text"
                            className={`form-control ${errors.zip ? "is-invalid" : ""}`}
                            name="zip"
                            value={this.state.zip}
                            onChange={this.handleChange}
                            placeholder="6-digit ZIP code"
                            maxLength="6"
                          />
                          {errors.zip && (
                            <div className="invalid-feedback">{errors.zip}</div>
                          )}
                        </div>

                        <div className="col-md-6 mb-3">
                          <label className="form-label">Country</label>
                          <input
                            type="text"
                            className="form-control"
                            value="India"
                            readOnly
                            disabled
                          />
                        </div>
                      </div>

                      <div className="address-form-actions">
                        <button
                          className="btn-primary-custom"
                          onClick={this.handleSaveAddress}
                        >
                          <FaCheck className="me-2" />
                          {isEditing ? 'Update Address' : 'Save Address'}
                        </button>
                        <button
                          className="btn-secondary-custom"
                          onClick={this.toggleAddressForm}
                        >
                          <FaTimes className="me-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items Section */}
                <div className="order-items-section">
                  <div className="section-header">
                    <h3>Order Items ({cartItems.length})</h3>
                  </div>
                  <div className="order-items">
                    {cartItems.map((item, index) => {
                      const product = item.productId && typeof item.productId === 'object'
                        ? item.productId
                        : { name: "Unknown Product", price: 0 };

                      return (
                        <div className="order-item" key={index}>
                          <div className="order-item-image">
                            {this.getProductImageUrl(product) && (
                              <img
                                src={this.getProductImageUrl(product)}
                                alt={product.name}
                                onError={(e) => (e.target.src = placeholderImage)}
                              />
                            )}
                          </div>
                          <div className="order-item-details">
                            <h5>{product.name}</h5>
                            <p className="item-price">${product.price} × {item.quantity}</p>
                          </div>
                          <div className="order-item-total">
                            ${(product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="col-lg-4">
              <div className="order-summary-sticky">
                <div className="order-summary">
                  <h4>Order Summary</h4>

                  <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>${subtotal}</span>
                  </div>

                  <div className="summary-line">
                    <span>Shipping:</span>
                    <span className={shipping === 0 ? "free-text" : ""}>
                      {shipping === 0 ? "FREE" : `$${shipping}`}
                    </span>
                  </div>

                  <div className="summary-line">
                    <span>Tax (estimated):</span>
                    <span>${tax}</span>
                  </div>

                  <div className="summary-divider"></div>

                  <div className="summary-total">
                    <span>Total:</span>
                    <span>${total}</span>
                  </div>

                  {/* Selected Address Preview */}
                  {selectedAddress && (
                    <div className="selected-address-preview">
                      <h5>Shipping to:</h5>
                      <p><strong>{selectedAddress.name}</strong></p>
                      <p>{selectedAddress.address}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                      <p>{selectedAddress.country}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {paymentErrors.payment && (
                    <div className="alert alert-danger">
                      {paymentErrors.payment}
                    </div>
                  )}

                  <button
                    className="checkout-btn"
                    onClick={this.handlePayment}
                    disabled={isProcessing || !selectedAddressId}
                  >
                    {isProcessing ? (
                      <>
                        <FaSpinner className="spinning me-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="me-2" />
                        Complete Payment
                      </>
                    )}
                    <span className="btn-amount">${total}</span>
                  </button>

                  <div className="security-badges">
                    <div className="security-badge">
                      <FaShieldAlt />
                      <span>Secure Payment</span>
                    </div>
                    <div className="security-badge">
                      <FaTruck />
                      <span>Fast Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Razorpay script */}
        {!window.Razorpay && (
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        )}
        <style>
          {`
        /* Order Items Section */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Fix for image size - make it smaller */
.order-item-image {
  width: 80px;  /* Fixed width */
  height: 80px; /* Fixed height */
  flex-shrink: 0; /* Prevent shrinking */
  overflow: hidden;
  
  
}

.order-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.order-item-details {
  flex: 1;
  min-width: 0; /* Allows text to wrap properly */
}

.order-item-details h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.order-item-details .item-price {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
}

.order-item-total {
  font-size: 1.125rem;
  font-weight: 700;
  color: #333;
  text-align: right;
  min-width: 80px;
}

/* Responsive adjustments */
@media (max-width: 576px) {
  .order-item-image {
    width: 60px;
    height: 60px;
  }
  
  .order-item-details h5 {
    font-size: 0.875rem;
  }
  
  .order-item-total {
    font-size: 1rem;
    min-width: 60px;
  }
}
  /* CheckoutSuccess.css */

.checkout-success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.checkout-success-wrapper {
  position: relative;
  max-width: 800px;
  width: 100%;
  overflow: hidden;
}

.success-content {
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Success Icon */
.success-icon-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
}

.success-icon-circle {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: scaleIn 0.5s ease 0.3s both;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-icon {
  color: white;
  font-size: 50px;
  animation: checkmark 0.3s ease 0.6s both;
}

@keyframes checkmark {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-icon-shadow {
  position: absolute;
  top: 15%;
  left: 15%;
  right: 15%;
  bottom: 15%;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  z-index: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.2;
  }
}

/* Heading */
.success-heading {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.heading-text {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.heading-decoration {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #4CAF50, #2E7D32);
  border-radius: 2px;
}

/* Order ID */
.order-id-container {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 20px;
  margin: 30px 0;
  text-align: center;
  border: 2px dashed #4CAF50;
}

.order-id-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.order-id-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2E7D32;
  margin: 10px 0;
  font-family: 'Courier New', monospace;
}

.order-id-hint {
  font-size: 0.85rem;
  color: #888;
  margin-top: 5px;
}

/* Success Message Card */
.success-message-card {
  background: #f0f9ff;
  border-left: 4px solid #4CAF50;
  padding: 20px;
  border-radius: 12px;
  margin: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.message-icon {
  font-size: 2rem;
  margin-bottom: 15px;
}



.shipping-info {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

/* Contact Info */
.contact-info {
  text-align: center;
  margin: 20px 0;
}

.contact-text {
  color: #666;
  font-size: 0.95rem;
}

.support-link {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.support-link:hover {
  color: #2E7D32;
  text-decoration: underline;
}

/* Action Buttons */
.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 40px 0;
  flex-wrap: wrap;
}

.btn-primary-custom,
.btn-secondary-custom,
.btn-tertiary-custom {
  padding: 15px 30px;
  border-radius: 50px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  min-width: 180px;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.btn-primary-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-secondary-custom {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.btn-secondary-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.btn-tertiary-custom {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
  color: white;
  box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
}

.btn-tertiary-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Order Progress */
.order-progress {
  margin-top: 40px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e0e0;
  color: #666;
  font-weight: 600;
}

.step.completed .step-number {
  background: #4CAF50;
  color: white;
}

.step.active .step-number {
  background: #2196F3;
  color: white;
  animation: pulse 2s infinite;
}

.step-label {
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.step-line {
  width: 60px;
  height: 3px;
  background: #e0e0e0;
}

.step-line.active {
  background: #4CAF50;
}

/* Confetti */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  opacity: 0;
  animation: confettiFall 3s linear forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(1000px) rotate(720deg);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .success-content {
    padding: 30px 20px;
  }
  
  .heading-text {
    font-size: 2rem;
  }
  
  .success-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-primary-custom,
  .btn-secondary-custom,
  .btn-tertiary-custom {
    width: 100%;
    max-width: 300px;
  }
  
  .progress-steps {
    flex-wrap: wrap;
  }
  
  .step-line {
    display: none;
  }
}
  /* Add to your existing CSS */
.order-item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
}

.order-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
  // ---------------------------------success css start---------------------------------
       
        /* Enhanced Success Styles */
        .checkout-success-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .checkout-success-wrapper {
          position: relative;
          max-width: 800px;
          width: 100%;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.6s ease;
        }

        .success-content {
          padding: 40px;
          position: relative;
          z-index: 2;
          background: white;
        }

        /* Success Icon */
        .success-icon-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 30px;
        }

        .success-icon-circle {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          animation: scaleIn 0.5s ease 0.3s both;
        }

        .success-icon {
          color: white;
          font-size: 50px;
          animation: checkmark 0.3s ease 0.6s both;
        }

        .success-rings .ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(76, 175, 80, 0.3);
          border-radius: 50%;
          animation: ripple 2s infinite;
        }

        .ring-1 { width: 140px; height: 140px; animation-delay: 0s; }
        .ring-2 { width: 160px; height: 160px; animation-delay: 0.5s; }
        .ring-3 { width: 180px; height: 180px; animation-delay: 1s; }

        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        }

        /* Header */
        .success-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .success-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #4CAF50, #2196F3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }

        .success-subtitle {
          color: #666;
          font-size: 1.1rem;
        }

        /* Order Details Card */
        .order-details-card {
          background: #f8fafc;
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
        }

        .order-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }

        .order-icon {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .order-info h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #1a202c;
        }

        .order-time {
          margin: 5px 0 0 0;
          color: #718096;
          font-size: 0.9rem;
        }

        /* Order ID Section */
        .order-id-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
          border: 1px solid #e2e8f0;
        }

        .order-id-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }

        .order-id-value {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .order-id-value code {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
          font-family: 'Courier New', monospace;
          background: #f7fafc;
          padding: 8px 16px;
          border-radius: 8px;
          flex: 1;
          margin-right: 15px;
        }

        .copy-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.3s;
        }

        .copy-btn:hover {
          background: #2E7D32;
        }

        .order-id-note {
          color: #718096;
          font-size: 0.85rem;
          text-align: center;
          margin: 0;
        }

        /* Confirmation Message */
        .confirmation-message {
          display: flex;
          align-items: center;
          gap: 15px;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(33, 150, 243, 0.1));
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 25px;
        }

        .message-icon {
          font-size: 2rem;
        }

        .message-content h4 {
          margin: 0 0 5px 0;
          color: #2d3748;
        }

        .message-content p {
          margin: 0;
          color: #4a5568;
        }

        /* Delivery Info */
        .delivery-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .info-icon {
          color: #4CAF50;
          font-size: 1.2rem;
        }

        .info-content {
          display: flex;
          flex-direction: column;
        }

        .info-label {
          font-size: 0.9rem;
          color: #718096;
        }

        .info-value {
          font-size: 1rem;
          color: #2d3748;
          font-weight: 500;
        }

        .support-link {
          color: #2196F3;
          text-decoration: none;
          font-weight: 600;
        }

        .support-link:hover {
          text-decoration: underline;
        }

        /* Action Buttons */
        .success-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 40px;
        }

        .success-actions button {
          padding: 16px 24px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .btn-continue {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: white;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .btn-orders {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .btn-print {
          background: linear-gradient(135deg, #9C27B0, #7B1FA2);
          color: white;
          box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
        }

        .success-actions button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        /* Order Timeline */
        .order-timeline {
          background: #f8fafc;
          padding: 25px;
          border-radius: 16px;
          margin-bottom: 25px;
        }

        .timeline-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 20px;
        }

        .timeline-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          position: relative;
        }

        .timeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #718096;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 10px;
          position: relative;
          z-index: 2;
        }

        .timeline-step.active .step-circle {
          background: linear-gradient(135deg, #4CAF50, #2196F3);
          color: white;
        }

        .timeline-step.completed .step-circle {
          background: #4CAF50;
        }

        .step-circle.pulse {
          animation: pulse 2s infinite;
        }

        .step-info {
          text-align: center;
        }

        .step-label {
          display: block;
          font-size: 0.9rem;
          color: #4a5568;
          font-weight: 500;
        }

        .step-time {
          display: block;
          font-size: 0.8rem;
          color: #718096;
        }

        .step-line {
          position: absolute;
          top: 20px;
          right: -50%;
          width: 100%;
          height: 3px;
          background: #e2e8f0;
          z-index: 1;
        }

        .step-line.active {
          background: #4CAF50;
        }

        /* Thank You Note */
        .thank-you-note {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(33, 150, 243, 0.1));
          border-radius: 12px;
          color: #2d3748;
        }

        .thank-you-note p {
          margin: 0;
          font-size: 1rem;
        }

        /* Confetti */
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          opacity: 0;
          animation: confettiFall 3s linear forwards;
          border-radius: 2px;
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(800px) rotate(720deg);
            opacity: 0;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .checkout-success-wrapper {
            margin: 20px;
          }

          .success-content {
            padding: 25px;
          }

          .success-title {
            font-size: 2rem;
          }

          .success-actions {
            grid-template-columns: 1fr;
          }

          .timeline-steps {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .step-line {
            display: none;
          }

          .order-id-value {
            flex-direction: column;
            gap: 10px;
          }

          .order-id-value code {
            margin-right: 0;
            text-align: center;
            font-size: 1.2rem;
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        @keyframes checkmark {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
  // ---------------------------------success css end---------------------------------
  `}
        </style>
      </div>
    );
  }
}

export default CheckoutForm;
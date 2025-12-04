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
    return `http://localhost:5000/public/images/product_images/${imageField}`;
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
        const response = await axios.get(`http://localhost:5000/api/Usermodel/user-details/${user.id}`);
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
        "http://localhost:5000/api/orderModel/create",
        orderPayload
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      const actualOrderId = orderResponse.data.order._id;
      this.setState({ orderId: actualOrderId });

      // Step 2: Create Razorpay order
      const razorpayOrderResponse = await axios.post(
        "http://localhost:5000/api/payment/create-order",
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
              "http://localhost:5000/api/payment/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                receipt: actualOrderId,
              }
            );

            if (verificationResponse.data.success) {
              this.setState({ paymentSuccess: true });

              // Clear cart and local storage
              localStorage.removeItem("checkoutData");
              await axios.delete(
                `http://localhost:5000/api/CartModel/clear/${userId}`
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

  formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value || 0);
    if (Number.isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  renderPaymentSuccess = () => {
    const { orderId } = this.state;

    return (
      <div className="checkout-success-container">
        <div className="checkout-success-wrapper">
          <div className="success-content">

            {/* Success Icon */}
            <div className="success-icon-wrapper">
              <div className="success-icon-circle">
                <FaCheck className="success-icon" />
              </div>
              <div className="success-icon-shadow"></div>
            </div>

            {/* Success Heading */}
            <h2 className="success-heading">
              <span className="heading-text">Payment Successful!</span>
              <span className="heading-decoration"></span>
            </h2>

            {/* Order ID */}
            <div className="order-id-container">
              <div className="order-id-label">Order ID</div>
              <div className="order-id-value">#{orderId || 'Processing...'}</div>
              <div className="order-id-hint">Save this for reference</div>
            </div>

            {/* Success Message */}
            <div className="success-message-card">
              <div className="message-icon">📦</div>
              <p className="success-message">
                Thank you for your purchase! Your order has been confirmed and will be shipped soon.
              </p>
              <p className="shipping-info">
                You'll receive a confirmation email with tracking details shortly.
              </p>
            </div>

            {/* Contact Information */}
            <div className="contact-info">
              <p className="contact-text">
                Need help? Contact our <a href="/support" className="support-link">customer support</a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="success-actions">
              <button
                className="btn-primary-custom"
                onClick={() => window.location.href = "/"}
              >
                <FaShoppingBag className="btn-icon" />
                Continue Shopping
              </button>

              <button
                className="btn-secondary-custom"
                onClick={() => window.location.href = "/OrderHistory"}
              >
                <FaBox className="btn-icon" />
                View Orders
              </button>

              <button
                className="btn-tertiary-custom"
                onClick={() => window.print()}
              >
                <FaCheck className="btn-icon" />
                Print Receipt
              </button>
            </div>


            {/* Progress Indicator */}
            <div className="order-progress">
              <div className="progress-steps">
                <div className="step completed">
                  <div className="step-number">1</div>
                  <div className="step-label">Order Placed</div>
                </div>
                <div className="step-line active"></div>
                <div className="step active">
                  <div className="step-number">2</div>
                  <div className="step-label">Processing</div>
                </div>
                <div className="step-line"></div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-label">Shipped</div>
                </div>
              </div>
            </div>

          </div>

          {/* Confetti Effect */}
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="confetti" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63'][Math.floor(Math.random() * 4)]
              }} />
            ))}
          </div>
        </div>
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
  //success------------------------------------
  /* Main Container */
.checkout-success-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: 'Segoe UI', 'Inter', -apple-system, system-ui, sans-serif;
}
.checkout-success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; 
  padding: 20px;       
  }

.checkout-success-wrapper {
  position: relative;
  width: 100%;
  max-width: 550px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(76, 95, 255, 0.15);
  padding: 40px 30px;
  overflow: hidden;
  border: 1px solid rgba(76, 175, 80, 0.1);
  animation: fadeIn 0.8s ease-out;
}

/* Success Icon */
.success-icon-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.success-icon-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4CAF50 0%, #43a047 100%);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  position: relative;
  animation: scaleIn 0.6s ease-out 0.3s both;
  box-shadow: 0 10px 30px rgba(76, 175, 80, 0.4);
}

.success-icon {
  color: white;
  font-size: 36px;
  animation: checkmark 0.5s ease-out 0.8s both;
}

.success-icon-shadow {
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  filter: blur(10px);
  animation: pulse 2s infinite ease-in-out;
}

/* Success Heading */
.success-heading {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.heading-text {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #4CAF50 0%, #2196F3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  margin-bottom: 10px;
}

.heading-decoration {
  display: block;
  width: 60px;
  height: 4px;
  background: linear-gradient(to right, #4CAF50, #2196F3);
  margin: 10px auto;
  border-radius: 2px;
  animation: widthGrow 1s ease-out 0.5s both;
}

/* Order ID Container */
.order-id-container {
  background: linear-gradient(135deg, #f8fff8 0%, #f0f8ff 100%);
  border: 2px dashed #4CAF50;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
  animation: slideUp 0.6s ease-out 0.4s both;
}

.order-id-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.1), transparent);
  animation: shimmer 3s infinite;
}

.order-id-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 1px;
}

.order-id-value {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
  margin-bottom: 8px;
  letter-spacing: 1px;
  word-break: break-all;
}

.order-id-hint {
  font-size: 13px;
  color: #7f8c8d;
  font-style: italic;
}

/* Success Message Card */
.success-message-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(76, 175, 80, 0.15);
  animation: slideUp 0.6s ease-out 0.6s both;
  position: relative;
  overflow: hidden;
}

.success-message-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: linear-gradient(to bottom, #4CAF50, #2196F3);
}

.message-icon {
  font-size: 24px;
  margin-bottom: 15px;
  display: inline-block;
  animation: bounce 2s infinite;
}

.success-message {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 12px;
  line-height: 1.6;
  font-weight: 500;
}

.shipping-info {
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.5;
  font-style: italic;
}

/* Contact Information */
.contact-info {
  text-align: center;
  margin-bottom: 30px;
  animation: fadeIn 0.8s ease-out 0.8s both;
}

.contact-text {
  font-size: 15px;
  color: #666;
}

.support-link {
  color: #2196F3;
  text-decoration: none;
  font-weight: 600;
  position: relative;
  transition: color 0.3s;
}

.support-link:hover {
  color: #1976D2;
}

.support-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #2196F3;
  transform: scaleX(0);
  transition: transform 0.3s;
}

.support-link:hover::after {
  transform: scaleX(1);
}

/* Action Buttons */
.success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 40px;
  animation: slideUp 0.6s ease-out 1s both;
}

.btn-primary-custom,
.btn-secondary-custom,
.btn-tertiary-custom {
  padding: 15px 25px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  min-width: 160px;
  position: relative;
  overflow: hidden;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
}

.btn-secondary-custom {
  background: white;
  color: #2196F3;
  border: 2px solid #2196F3;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.1);
}

.btn-tertiary-custom {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
}

.btn-icon {
  font-size: 18px;
}

.btn-primary-custom:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(76, 175, 80, 0.4);
}

.btn-secondary-custom:hover {
  transform: translateY(-3px);
  background: #2196F3;
  color: white;
  box-shadow: 0 12px 30px rgba(33, 150, 243, 0.2);
}

.btn-tertiary-custom:hover {
  transform: translateY(-3px);
  border-color: #666;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.btn-primary-custom:active,
.btn-secondary-custom:active,
.btn-tertiary-custom:active {
  transform: translateY(-1px);
}

/* Progress Indicator */
.order-progress {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #eee;
  animation: fadeIn 1s ease-out 1.2s both;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 400px;
  margin: 0 auto;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step.completed .step-number {
  background: linear-gradient(135deg, #4CAF50 0%, #43a047 100%);
  color: white;
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.3);
}

.step.active .step-number {
  background: #2196F3;
  color: white;
  box-shadow: 0 6px 15px rgba(33, 150, 243, 0.3);
}

.step:not(.completed):not(.active) .step-number {
  background: #f0f0f0;
  color: #999;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.4s ease;
  margin-bottom: 10px;
}

.step-label {
  font-size: 13px;
  color: #666;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.step-line {
  flex: 1;
  height: 3px;
  background: #e0e0e0;
  position: relative;
  margin: 0 10px;
}

.step-line.active {
  background: linear-gradient(to right, #4CAF50, #2196F3);
  animation: lineProgress 1.5s ease-out 1.4s both;
}

/* Confetti */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.confetti {
  position: absolute;
  width: 12px;
  height: 12px;
  opacity: 0;
  border-radius: 2px;
  animation: confettiFall 5s linear infinite;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

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
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
}

@keyframes widthGrow {
  from {
    width: 0;
  }
  to {
    width: 60px;
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

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes lineProgress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
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
  .checkout-success-wrapper {
    padding: 30px 20px;
    margin: 20px;
    border-radius: 20px;
  }
  
  .heading-text {
    font-size: 26px;
  }
  
  .success-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-primary-custom,
  .btn-secondary-custom,
  .btn-tertiary-custom {
    width: 100%;
    min-width: auto;
  }
  
  .progress-steps {
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
  }
  
  .step-line {
    display: none;
  }
}

@media (max-width: 480px) {
  .checkout-success-wrapper {
    padding: 25px 15px;
  }
  
  .heading-text {
    font-size: 22px;
  }
  
  .order-id-value {
    font-size: 18px;
  }
  
  .success-message,
  .shipping-info {
    font-size: 14px;
  }
}
  `}
        </style>
      </div>
    );
  }
}

export default CheckoutForm;
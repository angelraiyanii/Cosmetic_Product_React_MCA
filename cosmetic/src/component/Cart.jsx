import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaGift,
  FaShieldAlt,
  FaTruck,
  FaStar,
  FaArrowLeft,
  FaGem,
  FaCreditCard,
  FaPercentage,
  FaCheck,
  FaTimes,
  FaShoppingBag,
  FaSpinner,
  FaEye,
  FaMapMarkerAlt,
  FaEdit,
  FaPlusCircle
} from "react-icons/fa";
import "../App.css";

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

class CheckoutForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
      editingAddressId: null
    };
  }

  // Load addresses from localStorage
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

  // Save addresses to localStorage
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

  componentDidMount() {
    this.fetchUserData();
    this.loadAddressesFromLocalStorage();
  }

  fetchUserData = async () => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        this.setState({ isLoadingUser: false });
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const res = await axios.get(`http://localhost:5000/api/Login/user-details/${userId}`);

      // Create main address from user profile
      const mainAddress = {
        _id: "main",
        name: "Primary Address",
        email: res.data.email,
        phone: res.data.mobile || "",
        address: res.data.address || "",
        city: this.extractCityFromAddress(res.data.address),
        state: this.extractStateFromAddress(res.data.address),
        zip: res.data.zip || "",
        country: "India",
        isDefault: true
      };

      // Combine main address with saved addresses
      const savedAddresses = this.state.addresses.filter(addr => addr._id !== "main");
      const allAddresses = [mainAddress, ...savedAddresses];

      this.setState({
        userData: res.data,
        userEmail: res.data.email,
        addresses: allAddresses,
        selectedAddressId: allAddresses.length > 0 ? allAddresses[0]._id : null,
        phone: res.data.mobile || "",
        isLoadingUser: false
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      this.setState({ isLoadingUser: false });
    }
  };

  // Helper functions to extract city and state from address
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
    // Don't allow editing the primary address from user profile
    if (address._id === "main") {
      alert("Primary address can be updated in your profile settings");
      return;
    }

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

  handleRemoveAddress = async (addressId) => {
    if (addressId === "main") {
      alert("Primary address cannot be removed");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this address?")) {
      return;
    }

    // Remove from local state and localStorage
    const updatedAddresses = this.state.addresses.filter(addr => addr._id !== addressId);

    this.setState({
      addresses: updatedAddresses,
      selectedAddressId: updatedAddresses.length > 0 ? updatedAddresses[0]._id : null
    });

    // Save to localStorage
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

  handleSaveAddress = async () => {
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
      // Update existing address
      updatedAddresses = this.state.addresses.map(addr =>
        addr._id === this.state.editingAddressId ? newAddress : addr
      );
    } else {
      // Add new address
      updatedAddresses = [...this.state.addresses, newAddress];
    }

    // Update state
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

    // Save to localStorage
    this.saveAddressesToLocalStorage(updatedAddresses);

    alert(`Address ${this.state.isEditing ? 'updated' : 'added'} successfully!`);
  };

  validateForm = () => {
    if (!this.state.selectedAddressId) {
      alert("Please select a shipping address");
      return false;
    }
    return true;
  };

  handleCheckout = async () => {
    if (!this.validateForm()) {
      return;
    }

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        alert("Please login to Continue");
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const selectedAddress = this.state.addresses.find(
        addr => addr._id === this.state.selectedAddressId
      );

      // Prepare order data to pass to Checkout page
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
        subtotal: this.props.subtotal,
        tax: this.props.tax,
        shipping: this.props.shipping,
        discount: this.props.discount || 0,
        total: this.props.total,
      };

      // Store order data in localStorage to pass to checkout page
      localStorage.setItem('checkoutData', JSON.stringify({
        orderData,
        cartItems: this.props.cartItems
      }));

      // Navigate to checkout page
      window.location.href = "/checkout";

    } catch (error) {
      console.error("Error preparing checkout:", error);
      alert("Failed to proceed: " + (error.message || "Unknown error"));
    }
  };
  render() {
    const { subtotal, discount, tax, shipping, total, onBack } = this.props;
    const {
      errors,
      isLoadingUser,
      addresses,
      selectedAddressId,
      showAddressForm,
      addressName,
      isEditing,
      userEmail
    } = this.state;

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

    return (
      <div className="checkout-container">
        <div className="cart-header">
          <div className="container">
            <div className="header-content">
              <button onClick={onBack} className="back-button">
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
            <div className="col-lg-8">
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
                          {address._id !== "main" && (
                            <>
                              <button
                                className="btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.handleEditAddress(address);
                                }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn-remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.handleRemoveAddress(address._id);
                                }}
                              >
                                <FaTimes />
                              </button>
                            </>
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
                  <div
                    className="add-address-card"
                    onClick={this.toggleAddressForm}
                  >
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
                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
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
                            name="country"
                            value="India"
                            readOnly
                            disabled
                            style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
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
              </div>
            </div>

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

                  {discount > 0 && (
                    <div className="summary-line discount-line">
                      <span>Discount:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="summary-divider"></div>

                  <div className="summary-total">
                    <span>Total:</span>
                    <span>${total}</span>
                  </div>

                  <button className="checkout-btn" onClick={this.handleCheckout}>
                    <FaCheck className="me-2" />
                    Continue to Payment
                    <span className="btn-amount">${total}</span>
                  </button>

                  <button className="btn-secondary-full" onClick={onBack}>
                    <FaArrowLeft className="me-2" />
                    Back to Cart
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

        {/* Add CSS styles */}
        <style jsx>{`
          .badge-primary {
            background: #007bff;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            margin-left: 0.5rem;
          }
        `}</style>
      </div>
    );
  }
}

// The Cart component
export class Cart extends Component {
  constructor() {
    super();
    this.state = {
      cartItems: [],
      isLoading: true,
      error: null,
      processingItem: null,
      showCheckout: false,
    };
  }

  componentDidMount() {
    this.fetchCartItems();
  }

  fetchCartItems = async () => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        this.setState({
          error: "Please login to view your cart",
          isLoading: false,
        });
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.get(
        `http://localhost:5000/api/CartModel/${userId}`
      );

      const cartItems = response.data.map(item => {
        if (item.productId && typeof item.productId === 'object') {
          return item;
        } else {
          console.warn("Product data not fully populated for item:", item);
          return item;
        }
      });

      this.setState({
        cartItems: cartItems,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching cart items:", error);
      this.setState({
        error: "Failed to load cart items: " + (error.response?.data?.error || error.message),
        isLoading: false,
      });
    }
  };

  removeFromCart = async (cartItemId) => {
    this.setState({ processingItem: cartItemId });
    try {
      await axios.delete(`http://localhost:5000/api/CartModel/remove/${cartItemId}`);
      this.fetchCartItems();
    } catch (error) {
      console.error("Error removing item from cart:", error);
      alert("Failed to remove item from cart: " + (error.response?.data?.error || error.message));
    } finally {
      this.setState({ processingItem: null });
    }
  };

  updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    this.setState({ processingItem: cartItemId });

    try {
      await axios.put(
        `http://localhost:5000/api/CartModel/update/${cartItemId}`,
        { quantity: newQuantity }
      );
      this.fetchCartItems();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      alert("Failed to update quantity: " + (error.response?.data?.error || error.message));
    } finally {
      this.setState({ processingItem: null });
    }
  };

  moveToWishlist = async (productId, cartItemId) => {
    this.setState({ processingItem: cartItemId });
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      await axios.post("http://localhost:5000/api/WishlistModel/add", {
        userId,
        productId,
      });

      await axios.delete(`http://localhost:5000/api/CartModel/remove/${cartItemId}`);

      this.fetchCartItems();
      alert("Item moved to wishlist!");
    } catch (error) {
      console.error("Error moving to wishlist:", error);
      alert("Failed to move item to wishlist");
    } finally {
      this.setState({ processingItem: null });
    }
  };

  calculateSubtotal = () => {
    return this.state.cartItems
      .reduce((total, item) => {
        let price = 0;
        if (item.productId && typeof item.productId === 'object') {
          price = item.productId.price || 0;
        }
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  calculateTax = () => {
    const subtotal = parseFloat(this.calculateSubtotal());
    return (subtotal * 0.08).toFixed(2);
  };

  calculateShipping = () => {
    const subtotal = parseFloat(this.calculateSubtotal());
    return subtotal >= 50 ? 0 : 5.99;
  };

  calculateTotal = () => {
    const subtotal = parseFloat(this.calculateSubtotal());
    const tax = parseFloat(this.calculateTax());
    const shipping = this.calculateShipping();

    return (subtotal + tax + shipping).toFixed(2);
  };

  clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) {
      return;
    }

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      const user = JSON.parse(userData);
      const userId = user.id;

      await axios.delete(`http://localhost:5000/api/CartModel/clear/${userId}`);
      this.fetchCartItems();
    } catch (error) {
      console.error("Error clearing cart:", error);
      alert("Failed to clear cart");
    }
  };

 proceedToCheckout = () => {
  localStorage.setItem('cartItemsForCheckout', JSON.stringify(this.state.cartItems));
  this.setState({ showCheckout: true });
};

  handleBackToCart = () => {
    this.setState({ showCheckout: false });
  };

  render() {
    const {
      cartItems,
      isLoading,
      error,
      processingItem,
      showCheckout
    } = this.state;

    if (isLoading) {
      return (
        <div className="cart-loading">
          <div className="loading-content">
            <FaSpinner className="loading-spinner" />
            <h3>Loading your beauty cart...</h3>
            <p>Getting your favorite products ready</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="cart-error">
          <div className="error-content">
            <FaShoppingCart className="error-icon" />
            <h3>Oops! Something went wrong</h3>
            <p className="error-message">{error}</p>
            <Link to="/login" className="btn-primary-custom">
              Go to Login
            </Link>
          </div>
        </div>
      );
    }

    if (cartItems.length === 0) {
      return (
        <div className="empty-cart">
          <div className="empty-content">
            <div className="empty-animation">
              <FaShoppingCart className="empty-icon" />
              <div className="empty-sparkles">
                <FaGem className="sparkle sparkle-1" />
                <FaGem className="sparkle sparkle-2" />
                <FaGem className="sparkle sparkle-3" />
              </div>
            </div>
            <h2>Your Beauty Cart is Empty</h2>
            <p>Discover amazing cosmetics and skincare products to fill your cart</p>
            <div className="empty-actions">
              <Link to="/Product" className="btn-primary-custom">
                <FaShoppingBag className="me-2" />
                Start Shopping
              </Link>
              <Link to="/Wishlist" className="btn-secondary-custom">
                <FaHeart className="me-2" />
                View Wishlist
              </Link>
            </div>
          </div>
        </div>
      );
    }
    // Show checkout form
  if (showCheckout) {
  return (
    <CheckoutForm
      subtotal={this.calculateSubtotal()}
      tax={this.calculateTax()}
      shipping={this.calculateShipping()}
      total={this.calculateTotal()}
      discount={0}
      cartItems={this.state.cartItems}
      onBack={this.handleBackToCart}
    />
  );
}

    const subtotal = parseFloat(this.calculateSubtotal());

    return (
      <div className="cart-container">
        <div className="cart-header">
          <div className="container">
            <div className="header-content">
              <Link to="/Product" className="back-button">
                <FaArrowLeft />
              </Link>
              <div className="header-info">
                <h1>
                  <FaShoppingCart className="cart-icon" />
                  Your Beauty Cart
                </h1>
                <p>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • ${subtotal} total</p>
              </div>
              <button className="clear-cart-btn" onClick={this.clearCart}>
                <FaTrash className="me-2" />
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        <div className="container cart-content">
          <div className="row">
            <div className="col-lg-8">
              <div className="cart-items-section">
                <div className="section-header">
                  <h3>Shopping Bag</h3>
                  <div className="shipping-info">
                    <FaTruck className="shipping-icon" />
                    <span>
                      {subtotal >= 50 ?
                        "🎉 You've qualified for FREE shipping!" :
                        `Add $${(50 - subtotal).toFixed(2)} more for FREE shipping`
                      }
                    </span>
                  </div>
                </div>

                <div className="cart-items">
                  {cartItems.map((item, index) => {
                    const product = item.productId && typeof item.productId === 'object'
                      ? item.productId
                      : { name: "Unknown Product", price: 0, category: "Beauty & Cosmetics" };

                    return (
                      <div className="cart-item" key={item._id} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="item-image">
                          <img
                            src={
                              product.image
                                ? `http://localhost:5000/public/images/product_images/${product.image}`
                                : placeholderImage
                            }
                            alt={product.name}
                            className="product-image"
                            onError={(e) => (e.target.src = placeholderImage)}
                          />
                          {product.discount && (
                            <span className="discount-badge">-{product.discount}%</span>
                          )}
                        </div>
                        <div className="item-details">
                          <div className="item-header">
                            <h4 className="item-name">
                              {product.name}
                            </h4>
                          </div>

                          <p className="item-category">
                            {product.category}
                          </p>

                          <div className="item-features">
                            <span className="feature-tag cruelty-free">
                              <FaShieldAlt />
                              Cruelty Free
                            </span>
                            <span className="feature-tag vegan">
                              <FaHeart />
                              Vegan
                            </span>
                          </div>
                          <div className="item-rating">
                            <div className="stars">
                              {[1, 2, 3, 4, 5].map(star => (
                                <FaStar key={star} className={star <= 4 ? "star-filled" : "star-empty"} />
                              ))}
                            </div>
                            <span className="rating-text">(4.0)</span>
                          </div>
                          <div className="item-actions-mobile">
                            <div className="price-section">
                              <span className="current-price">
                                ${product.price}
                              </span>
                              <span className="total-price">
                                Total: ${(product.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="item-actions">
                          <div className="price-section">
                            <div className="unit-price">
                              ${product.price} each
                            </div>
                            <div className="total-price">
                              ${(product.price * item.quantity).toFixed(2)}
                            </div>
                          </div>

                          <div className="quantity-section">
                            <label>Quantity:</label>
                            <div className="quantity-controls">
                              <button
                                className="qty-btn minus"
                                onClick={() => this.updateQuantity(item._id, item.quantity - 1)}
                                disabled={processingItem === item._id || item.quantity <= 1}
                              >
                                <FaMinus />
                              </button>

                              <span className="quantity">
                                {processingItem === item._id ? <FaSpinner className="processing-spinner" /> : item.quantity}
                              </span>

                              <button
                                className="qty-btn plus"
                                onClick={() => this.updateQuantity(item._id, item.quantity + 1)}
                                disabled={processingItem === item._id}
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>

                          <div className="action-buttons">
                            <button
                              className="btn-wishlist"
                              onClick={() => this.moveToWishlist(product._id || item.productId, item._id)}
                              disabled={processingItem === item._id}
                              title="Move to Wishlist"
                            >
                              {processingItem === item._id ? <FaSpinner /> : <FaHeart />}
                            </button>
                            <Link
                              to={`/SinglePro/${product._id || item.productId}`}
                              className="btn-view"
                              title="View Product"
                            >
                              <FaEye />
                            </Link>
                            <button
                              className="btn-remove"
                              onClick={() => this.removeFromCart(item._id)}
                              disabled={processingItem === item._id}
                              title="Remove from Cart"
                            >
                              {processingItem === item._id ? <FaSpinner /> : <FaTrash />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="order-summary-sticky">
                <div className="order-summary">
                  <h4>Order Summary</h4>
                  <div className="summary-line">
                    <span>Subtotal ({cartItems.length} items):</span>
                    <span>${this.calculateSubtotal()}</span>
                  </div>
                  <div className="summary-line">
                    <span>Shipping:</span>
                    <span className={this.calculateShipping() === 0 ? "free-text" : ""}>
                      {this.calculateShipping() === 0 ? "FREE" : `$${this.calculateShipping()}`}
                    </span>
                  </div>
                  <div className="summary-line">
                    <span>Tax (estimated):</span>
                    <span>${this.calculateTax()}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-total">
                    <span>Total:</span>
                    <span>${this.calculateTotal()}</span>
                  </div>

                  <button className="checkout-btn" onClick={this.proceedToCheckout}>
                    <div className="btn-content">
                      <FaCreditCard className="me-3" />
                      <span>Place to Address</span>
                    </div>
                    <span className="btn-amount">${this.calculateTotal()}</span>
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
                    <div className="security-badge">
                      <FaHeart />
                      <span>Easy Returns</span>
                    </div>
                  </div>

                  <Link to="/Product" className="continue-shopping">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Cart;
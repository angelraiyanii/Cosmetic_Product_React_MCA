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
  FaEye
} from "react-icons/fa";

const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

class CheckoutForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      errors: {},
      isLoadingUser: true,
    };
  }

  componentDidMount() {
    this.fetchUserData();
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

      const response = await axios.get(
        `http://localhost:5000/api/Login/user-details/${userId}`
      );

      const fetchedData = response.data;

      this.setState({
        email: fetchedData.email || "",
        phone: fetchedData.phone || "",
        address: fetchedData.address || "",
        city: fetchedData.city || "",
        state: fetchedData.state || "",
        zip: fetchedData.zip || "",
        country: fetchedData.country || "India",
        isLoadingUser: false,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      this.setState({ isLoadingUser: false });
    }
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
      errors: { ...this.state.errors, [e.target.name]: "" }
    });
  };

  validateForm = () => {
    let newErrors = {};

    if (!this.state.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.state.email)) {
      newErrors.email = "Invalid email format";
    }

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

  handleCheckout = async () => {
    if (!this.validateForm()) {
      return;
    }

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        alert("Please login to place order");
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const orderData = {
        userId,
        email: this.state.email,
        phone: this.state.phone,
        address: this.state.address,
        city: this.state.city,
        state: this.state.state,
        zip: this.state.zip,
        country: this.state.country,
        totalAmount: this.props.total,
        discount: this.props.discount || 0,
        subtotal: this.props.subtotal,
        tax: this.props.tax,
        shipping: this.props.shipping,
      };

      const response = await axios.post(
        "http://localhost:5000/api/orders/create",
        orderData
      );

      alert("Order placed successfully!");

      // Clear cart
      await axios.delete(`http://localhost:5000/api/CartModel/clear/${userId}`);

      // Redirect to home or orders page
      window.location.href = "/";

    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order: " + (error.response?.data?.error || error.message));
    }
  };

  render() {
    const { subtotal, discount, tax, shipping, total, onBack } = this.props;
    const { errors, isLoadingUser } = this.state;

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
                  <h3>Shipping Information</h3>
                  <p>Please provide your delivery details</p>
                </div>

                <div className="checkout-form">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        name="email"
                        value={this.state.email}
                        onChange={this.handleChange}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>

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
                        value={this.state.country}
                        onChange={this.handleChange}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
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
                    Place Order
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
      </div>
    );
  }
}

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
                      <span>Proceed to Checkout</span>
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
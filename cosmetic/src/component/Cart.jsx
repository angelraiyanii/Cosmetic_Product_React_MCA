import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";
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
import placeholderImage from "../component/Images/pro1.jpeg"; // Add this import
import "../App.css";

export class Cart extends Component {
  constructor() {
    super();
    this.state = {
      cartItems: [],
      isLoading: true,
      error: null,
      processingItem: null
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

      // Make sure we're getting the product data properly
      const cartItems = response.data.map(item => {
        // Check if productId is populated or if we need to handle it differently
        if (item.productId && typeof item.productId === 'object') {
          return item;
        } else {
          // If productId is just an ID string, we might need to fetch product details separately
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

      // Add to wishlist
      await axios.post("http://localhost:5000/api/WishlistModel/add", {
        userId,
        productId,
      });

      // Remove from cart
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
        // Handle different possible structures of product data
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
    return (subtotal * 0.08).toFixed(2); // 8% tax
  };

  calculateShipping = () => {
    const subtotal = parseFloat(this.calculateSubtotal());
    return subtotal >= 50 ? 0 : 5.99; // Free shipping over $50
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

  render() {
    const {
      cartItems,
      isLoading,
      error,
      processingItem
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

    const subtotal = parseFloat(this.calculateSubtotal());

    return (
      <div className="cart-container">
        {/* Header */}
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
            {/* Cart Items */}
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
                    // Handle different product data structures
                    const product = item.productId && typeof item.productId === 'object'
                      ? item.productId
                      : { productName: "Unknown Product", price: 0, category: "Beauty & Cosmetics" };

                    return (
                      <div className="cart-item" key={item._id} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="item-image">
                          <img
                            src={
                              product.image
                                ? `http://localhost:5000/public/images/product_images/${product.image}`
                                : placeholder
                            }
                            alt={product.name}
                            className="product-image"
                            onError={(e) => (e.target.src = placeholder)}
                          />
                          {product.discount && (
                            <span className="discount-badge">-{product.discount}%</span>
                          )}
                        </div>
                        <div className="item-details">
                          <div className="item-header">
                            <h4 className="item-name">
                              {product.productName}
                            </h4>
                            <div className="item-rating">
                              <div className="stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <FaStar key={star} className={star <= 4 ? "star-filled" : "star-empty"} />
                                ))}
                              </div>
                              <span className="rating-text">(4.0)</span>
                            </div>
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
                                <FaMinus size={16}color="#ff6b9d" />
                              </button>
                              <span className="quantity">
                                {processingItem === item._id ? <FaSpinner className="processing-spinner" /> : item.quantity}
                              </span>

                              <button
                                className="qty-btn plus"
                                onClick={() => this.updateQuantity(item._id, item.quantity + 1)}
                                disabled={processingItem === item._id}
                              >
                               <FaPlus size={16}color="#ff6b9d" />
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
                              <FaEye/>
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

            {/* Order Summary */}
            <div className="col-lg-4">
              <div className="order-summary-sticky">
                {/* Order Summary */}
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

                  <button className="checkout-btn">
                    <FaCreditCard className="me-2" />
                    Secure Checkout
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
import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaTrashAlt,
  FaEye,
  FaShoppingCart,
  FaHeartBroken,
} from "react-icons/fa";
import "../App.css";

export class Wishlist extends Component {
  constructor() {
    super();
    this.state = {
      wishlistItems: [],
      isLoading: true,
      error: null,
      userData: null,
    };
  }

  componentDidMount() {
    this.fetchUserData();
    this.fetchWishlistItems();
  }

  fetchUserData = async () => {
    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.get(
        `http://localhost:5000/api/Login/user-details/${userId}`
      );

      console.log("User data fetched:", response.data);

      this.setState({
        userData: response.data,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  fetchWishlistItems = async () => {
    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        this.setState({
          error: "Please login to view your wishlist",
          isLoading: false,
        });
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      console.log("Fetching wishlist for user ID:", userId);

      const response = await axios.get(
        `http://localhost:5000/api/wishlistModel/${userId}`
      );
      console.log("Wishlist response:", response.data);

      this.setState({
        wishlistItems: response.data.data || response.data, // Handle both success.data and direct array
        isLoading: false,
      });
    } catch (error) {
      console.error(
        "Error fetching wishlist items:",
        error.response?.data || error.message
      );
      this.setState({
        error:
          "Failed to load wishlist items: " +
          (error.response?.data?.error || error.message),
        isLoading: false,
      });
    }
  };

  removeFromWishlist = async (wishlistItemId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/wishlistModel/${wishlistItemId}`
      );

      // Show success message
      const successMessage = document.getElementById("success-alert");
      successMessage.style.display = "block";
      successMessage.innerHTML = "Item removed from wishlist!";

      // Hide after 3 seconds
      setTimeout(() => {
        successMessage.style.display = "none";
      }, 3000);

      this.fetchWishlistItems();
    } catch (error) {
      console.error("Error removing item from wishlist:", error);

      // Show error message
      const errorMessage = document.getElementById("error-alert");
      errorMessage.style.display = "block";
      errorMessage.innerHTML = "Failed to remove item from wishlist.";

      // Hide after 3 seconds
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 3000);
    }
  };

  addToCart = async (productId) => {
    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        alert("Please login to add items to cart");
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      await axios.post("http://localhost:5000/api/CartModel/add", {
        userId: userId,
        productId: productId,
        quantity: 1,
      });

      // Show success message
      const successMessage = document.getElementById("success-alert");
      successMessage.style.display = "block";
      successMessage.innerHTML = "Item added to cart successfully!";

      // Hide after 3 seconds
      setTimeout(() => {
        successMessage.style.display = "none";
      }, 3000);
    } catch (error) {
      console.error("Error adding item to cart:", error);

      // Show error message
      const errorMessage = document.getElementById("error-alert");
      errorMessage.style.display = "block";
      errorMessage.innerHTML = "Failed to add item to cart.";

      // Hide after 3 seconds
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 3000);
    }
  };

  addAllToCart = async () => {
    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        alert("Please login to add items to cart");
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const promises = this.state.wishlistItems.map((item) =>
        axios.post("http://localhost:5000/api/CartModel/add", {
          userId: userId,
          productId: item.productId._id,
          quantity: 1,
        })
      );

      await Promise.all(promises);

      // Show success message
      const successMessage = document.getElementById("success-alert");
      successMessage.style.display = "block";
      successMessage.innerHTML = "All items added to cart successfully!";

      // Hide after 3 seconds
      setTimeout(() => {
        successMessage.style.display = "none";
      }, 3000);
    } catch (error) {
      console.error("Error adding all items to cart:", error);

      // Show error message
      const errorMessage = document.getElementById("error-alert");
      errorMessage.style.display = "block";
      errorMessage.innerHTML = "Failed to add all items to cart.";

      // Hide after 3 seconds
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 3000);
    }
  };

  calculateTotal = () => {
    return this.state.wishlistItems
      .reduce((total, item) => {
        const price = item.productId ? item.productId.price : 0;
        return total + price;
      }, 0)
      .toFixed(2);
  };

  render() {
    const { wishlistItems, isLoading, error, userData } = this.state;

    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading your wishlist...</p>
        </div>
      );
    }

    return (
      <div className="wishlist-page">
        {/* Alert messages */}
        <div
          id="success-alert"
          className="alert alert-success alert-dismissible fade show"
          role="alert"
          style={{
            display: "none",
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
          }}
        >
          Success message here
        </div>
        <div
          id="error-alert"
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
          style={{
            display: "none",
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 1000,
          }}
        >
          Error message here
        </div>

        <div className="container mt-5">
          <div className="wishlist-header">
            <div className="wishlist-title">
              <FaHeart className="wishlist-icon" />
              <h1>My Wishlist</h1>
            </div>
            {userData && (
              <div className="user-welcome">
                Welcome, {userData.fullname || "User"}
              </div>
            )}
          </div>

          {error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>
          ) : (
            <div className="wishlist-container">
              {wishlistItems.length === 0 ? (
                <div className="empty-wishlist">
                  <FaHeartBroken className="empty-icon" />
                  <h3>Your wishlist is empty</h3>
                  <p>Add items to your wishlist to save them for later!</p>
                  <Link
                    to="/Ct_product"
                    className="btn btn-primary continue-shopping"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  <div className="row wishlist-items">
                    {wishlistItems.map((item) => (
                      <div key={item._id} className="col-md-6 col-lg-4 mb-4">
                        <div className="wishlist-card">
                          <div className="wishlist-card-image">
                            <img
                              src={
                                item.productId && item.productId.productImage
                                  ? `http://localhost:5000/public/images/product_images/${item.productId.productImage}`
                                  : require("./images/pro1.png")
                              }
                              alt={
                                item.productId
                                  ? item.productId.productName
                                  : "Product"
                              }
                              className="img-fluid rounded-start"
                              style={{
                                maxHeight: "150px",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = require("./images/pro1.png");
                              }}
                            />

                            <button
                              className="btn btn-sm btn-danger remove-btn"
                              onClick={() => this.removeFromWishlist(item._id)}
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                          <div className="wishlist-card-body">
                            <h5 className="product-name">
                              {item.productId?.productName || "N/A"}
                            </h5>
                            <div className="price-action">
                              <div className="product-price">
                                ₹{item.productId?.price?.toFixed(2) || "0.00"}
                              </div>
                              <div className="action-buttons">
                                <Link
                                  to={`/SinglePro/${item.productId?._id}`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <FaEye /> View
                                </Link>
                                <button
                                  className="btn btn-sm btn-outline-success ms-2"
                                  onClick={() =>
                                    this.addToCart(item.productId?._id)
                                  }
                                >
                                  <FaShoppingCart /> Add to Cart
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="wishlist-summary">
                    <div className="total-section">
                      <span className="total-label">Total:</span>
                      <span className="total-amount">
                        ₹{this.calculateTotal()}
                      </span>
                    </div>
                    <div className="actions-section">
                      <Link
                        to="/Ct_product"
                        className="btn btn-outline-primary continue-btn"
                      >
                        Continue Shopping
                      </Link>
                      <button
                        className="btn btn-success add-all-btn"
                        onClick={this.addAllToCart}
                      >
                        <FaShoppingCart /> Add All to Cart
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Wishlist;

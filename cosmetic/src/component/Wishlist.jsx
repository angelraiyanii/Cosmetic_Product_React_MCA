import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaHeartBroken,
  FaShoppingCart,
  FaEye,
  FaStar,
  FaHeart,
  FaShoppingBag,
  FaArrowRight,
  FaTrash,
  FaGem
} from "react-icons/fa";
import "../App.css";
import placeholder from "./images/c1.jpeg";

export class Wishlist extends Component {
  constructor() {
    super();
    this.state = {
      wishlistItems: [],
      isLoading: true,
      error: null,
      selectedItems: [],
      isProcessing: false,
    };
  }

  componentDidMount() {
    this.fetchWishlist();
  }

  fetchWishlist = async () => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.get(
        `http://localhost:5000/api/WishlistModel/${userId}`
      );

      this.setState({
        wishlistItems: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      this.setState({
        error: "Failed to load wishlist",
        isLoading: false,
      });
    }
  };

  removeFromWishlist = async (wishlistItemId) => {
    try {
      await axios.delete(`http://localhost:5000/api/WishlistModel/${wishlistItemId}`);
      this.setState((prevState) => ({
        wishlistItems: prevState.wishlistItems.filter(
          (item) => item._id !== wishlistItemId
        ),
        selectedItems: prevState.selectedItems.filter(id => id !== wishlistItemId)
      }));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  addToCart = async (productId) => {
    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      await axios.post("http://localhost:5000/api/CartModel/add", {
        userId,
        productId,
      });

      alert("Product added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add product to cart");
    }
  };

  moveAllToCart = async () => {
    this.setState({ isProcessing: true });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      // Add all items to cart
      const addPromises = this.state.wishlistItems.map(item =>
        axios.post("http://localhost:5000/api/CartModel/add", {
          userId,
          productId: item.productId._id,
        })
      );

      await Promise.all(addPromises);

      // Remove all items from wishlist
      const removePromises = this.state.wishlistItems.map(item =>
        axios.delete(`http://localhost:5000/api/WishlistModel/${item._id}`)
      );

      await Promise.all(removePromises);

      this.setState({
        wishlistItems: [],
        selectedItems: [],
        isProcessing: false,
      });

      alert(`${this.state.wishlistItems.length} items moved to cart!`);
    } catch (error) {
      console.error("Error moving items to cart:", error);
      this.setState({ isProcessing: false });
      alert("Failed to move items to cart");
    }
  };

  moveSelectedToCart = async () => {
    if (this.state.selectedItems.length === 0) {
      alert("Please select items to move to cart");
      return;
    }

    this.setState({ isProcessing: true });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      const selectedWishlistItems = this.state.wishlistItems.filter(
        item => this.state.selectedItems.includes(item._id)
      );

      // Add selected items to cart
      const addPromises = selectedWishlistItems.map(item =>
        axios.post("http://localhost:5000/api/CartModel/add", {
          userId,
          productId: item.productId._id,
        })
      );

      await Promise.all(addPromises);

      // Remove selected items from wishlist
      const removePromises = selectedWishlistItems.map(item =>
        axios.delete(`http://localhost:5000/api/WishlistModel/${item._id}`)
      );

      await Promise.all(removePromises);

      this.setState(prevState => ({
        wishlistItems: prevState.wishlistItems.filter(
          item => !prevState.selectedItems.includes(item._id)
        ),
        selectedItems: [],
        isProcessing: false,
      }));

      alert(`${selectedWishlistItems.length} items moved to cart!`);
    } catch (error) {
      console.error("Error moving selected items to cart:", error);
      this.setState({ isProcessing: false });
      alert("Failed to move selected items to cart");
    }
  };

  handleItemSelection = (itemId) => {
    this.setState(prevState => ({
      selectedItems: prevState.selectedItems.includes(itemId)
        ? prevState.selectedItems.filter(id => id !== itemId)
        : [...prevState.selectedItems, itemId]
    }));
  };

  selectAll = () => {
    this.setState(prevState => ({
      selectedItems: prevState.selectedItems.length === prevState.wishlistItems.length
        ? []
        : prevState.wishlistItems.map(item => item._id)
    }));
  };

  calculateTotal = () => {
    return this.state.wishlistItems
      .filter(item => this.state.selectedItems.includes(item._id))
      .reduce((total, item) => {
        const product = item.productId;
        const price = product.discount
          ? product.price - (product.price * product.discount) / 100
          : product.price;
        return total + price;
      }, 0)
      .toFixed(2);
  };

  render() {
    const { wishlistItems, isLoading, error, selectedItems, isProcessing } = this.state;
    const totalSelected = selectedItems.length;
    const totalItems = wishlistItems.length;

    return (
      <div className="wishlist-container">
        {/* Header Section */}
        <div className="wishlist-header">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="header-content">
                  <FaGem className="header-icon" />
                  <div>
                    <h1 className="header-title">My Beauty Wishlist</h1>
                    <p className="header-subtitle">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'} saved for later
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-md-end">
                <Link to="/Product" className="btn-continue-shopping">
                  <FaShoppingBag className="me-2" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your wishlist...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="empty-state">
              <FaHeartBroken className="empty-icon" />
              <h3>Your wishlist is empty</h3>
              <p>Discover amazing beauty products and add them to your wishlist</p>
              <Link to="/Product" className="btn-primary-custom">
                Explore Products
              </Link>
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div className="action-bar">
                <div className="selection-controls">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAll"
                      checked={totalSelected === totalItems && totalItems > 0}
                      onChange={this.selectAll}
                    />
                    <label className="form-check-label" htmlFor="selectAll">
                      Select All ({totalItems})
                    </label>
                  </div>
                  {totalSelected > 0 && (
                    <span className="selected-count">
                      {totalSelected} selected
                    </span>
                  )}
                </div>

                <div className="action-buttons">
                  {totalSelected > 0 && (
                    <>
                      <div className="total-price">
                        Total: <span className="price">${this.calculateTotal()}</span>
                      </div>
                      <button
                        className="btn-move-selected"
                        onClick={this.moveSelectedToCart}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="btn-spinner"></div>
                        ) : (
                          <>
                            <FaShoppingCart className="me-2" />
                            Move to Cart ({totalSelected})
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {totalItems > 0 && (
                    <button
                      className="btn-move-all"
                      onClick={this.moveAllToCart}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <div className="btn-spinner"></div>
                      ) : (
                        <>
                          <FaShoppingBag className="me-2" />
                          Move All to Cart
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              <div className="products-grid">
                {wishlistItems.map((item, index) => {
                  const product = item.productId;
                  const discountedPrice = product.discount
                    ? (product.price - (product.price * product.discount) / 100).toFixed(2)
                    : null;
                  const isSelected = selectedItems.includes(item._id);

                  return (
                    <div
                      className={`product-card ${isSelected ? 'selected' : ''}`}
                      key={item._id}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="card-header">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => this.handleItemSelection(item._id)}
                          />
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => this.removeFromWishlist(item._id)}
                          title="Remove from Wishlist"
                        >
                          <FaHeartBroken style={{ color: 'red', fontSize: '18px' }} />
                        </button>
                      </div>

                      <div className="product-image-container">
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
                          <div className="discount-badge">
                            -{product.discount}%
                          </div>
                        )}

                        <div className="hover-overlay">
                          <Link
                            to={`/SinglePro/${product._id}`}
                            className="btn-quick-view"
                          >
                            <FaEye className="me-2" />
                            Quick View
                          </Link>
                          <button
                            className="btn-add-to-cart"
                            onClick={() => this.addToCart(product._id)}
                          >
                            <FaShoppingCart className="me-2" />
                            Add to Cart
                          </button>
                        </div>
                      </div>

                      <div className="product-details">
                        <div className="product-rating">
                          <FaStar className="star-icon" />
                          <span>{product.rating || "4.5"}</span>
                        </div>
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-category">
                          {product.category?.categoryName || "Uncategorized"}
                        </p>
                        <div className="product-pricing">
                          {discountedPrice ? (
                            <>
                              <span className="current-price">${discountedPrice}</span>
                              <span className="original-price">${product.price}</span>
                            </>
                          ) : (
                            <span className="current-price">${product.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .wishlist-container {
            min-height: 100vh;
           
            padding-bottom: 4rem;
          }

          .wishlist-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 0;
            margin-bottom: 3rem;
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .header-icon {
            font-size: 2.5rem;
            color: #ffd700;
          }

          .header-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(45deg, #fff, #ffd700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .header-subtitle {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1rem;
          }

          .btn-continue-shopping {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
          }

          .btn-continue-shopping:hover {
           background: rgba(255, 255, 255, 0.3);
            color: white;
            transform: translateY(-2px);
          }

          .loading-state, .empty-state, .error-state {
            text-align: center;
            padding: 4rem 2rem;
          }

          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 2rem;
          }

          .empty-icon {
            font-size: 4rem;
            color: #ccc;
            margin-bottom: 2rem;
          }

          .empty-state h3 {
            color: #666;
            margin-bottom: 1rem;
          }

          .empty-state p {
            color: #999;
            margin-bottom: 2rem;
          }

          .btn-primary-custom {
            display: inline-flex;
            align-items: center;
            padding: 12px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }

          .btn-primary-custom:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
            color: white;
          }

          .action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 1.5rem 2rem;
            border-radius: 20px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            flex-wrap: wrap;
            gap: 1rem;
          }

          .selection-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .form-check-input {
            width: 20px;
            height: 20px;
            border-radius: 6px;
            border: 2px solid #667eea;
          }

          .form-check-input:checked {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
          }

          .selected-count {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
          }

          .action-buttons {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .total-price {
            font-size: 1.1rem;
            color: #333;
          }

          .total-price .price {
            font-weight: 700;
            color: #667eea;
            font-size: 1.3rem;
          }

          .btn-move-selected, .btn-move-all {
            display: inline-flex;
            align-items: center;
            padding: 10px 20px;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .btn-move-selected {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }

          .btn-move-selected:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
          }

          .btn-move-all {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
          }

          .btn-move-all:hover:not(:disabled) {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
          }

          .btn-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
          }

          .product-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
            transform: translateY(30px);
            border: 3px solid transparent;
            height :510px;
          }

          .product-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }

          .product-card.selected {
            border-color: #667eea;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: #f8f9fa;
          }

          .btn-remove {
            background: none;
            border: none;
            color: #dc3545;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
          }

         

          .product-image-container {
            position: relative;
            height: 250px;
            overflow: hidden;
          }

          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .product-card:hover .product-image {
            transform: scale(1.05);
          }

          .discount-badge {
            position: absolute;
            top: 1rem;
            left: 1rem;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
          }

          .hover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            opacity: 0;
            transition: all 0.3s ease;
          }

          .product-card:hover .hover-overlay {
            opacity: 1;
          }

          .btn-quick-view, .btn-add-to-cart {
            display: inline-flex;
            align-items: center;
            padding: 10px 20px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            transform: translateY(20px);
          }

          .product-card:hover .btn-quick-view,
          .product-card:hover .btn-add-to-cart {
            transform: translateY(0);
          }

          .btn-quick-view:hover, .btn-add-to-cart:hover {
            background: #667eea;
            color: white;
            transform: scale(1.05);
          }

          .product-details {
            padding: 1.5rem;
          }

          .product-rating {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }

          .star-icon {
            color: #ffd700;
          }

          .product-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: #333;
            margin: 0.5rem 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .product-category {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }

          .product-pricing {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .current-price {
            font-size: 1.3rem;
            font-weight: 700;
            color: #667eea;
          }

          .original-price {
            font-size: 1rem;
            color: #999;
            text-decoration: line-through;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .wishlist-header {
              padding: 2rem 0;
            }

            .header-title {
              font-size: 2rem;
            }

            .action-bar {
              padding: 1rem;
              flex-direction: column;
              align-items: stretch;
              text-align: center;
            }

            .action-buttons {
              justify-content: center;
              margin-top: 1rem;
            }

            .products-grid {
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 1.5rem;
            }
          }
        `}</style>
      </div>
    );
  }
}

export default Wishlist;
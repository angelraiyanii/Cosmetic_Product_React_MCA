import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Component } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { FaHeart, FaShoppingCart, FaStar, FaCheck, FaTruck, FaShieldAlt, FaUndo, FaShare, FaFilter, FaEye, FaBolt } from "react-icons/fa";
import placeholder from "./Images/c1.jpeg"; // Default cosmetic image
import Rating_Review from "./Rating_Review";

class SingleProClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      product: null,
      error: null,
      isLoading: false,
      isLikeLoading: false,
      cartMessage: "",
      wishlistMessage: "",
      quantity: 1,
      selectedImage: 0,
      relatedProducts: [],
      loadingRelated: false,
      isInWishlist: false,
      avgRating: 0,
      reviewCount: 0
    };
  }

  componentDidMount() {
    this.fetchProduct();
    this.checkWishlistStatus();
    this.fetchReviewStats();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.productId !== this.props.productId) {
      this.fetchProduct();
      this.checkWishlistStatus();
      this.fetchReviewStats();
    }

    // Fetch related products when product data is loaded
    if (prevState.product !== this.state.product && this.state.product) {
      this.fetchRelatedProducts();
    }
  }

  fetchReviewStats = async () => {
    try {
      const { productId } = this.props;
      if (!productId) return;
      const response = await axios.get(`${url}/api/ReviewModel/product/${productId}`);
      const stats = response.data?.statistics || {};
      const avg = parseFloat(stats.averageRating) || 0;
      const total = parseInt(stats.totalReviews) || 0;
      this.setState({ avgRating: avg, reviewCount: total });
    } catch (err) {
      console.error('Error fetching review stats:', err?.response?.data || err.message || err);
    }
  };
  fetchRelatedProducts = async () => {
    if (!this.state.product) return;

    this.setState({ loadingRelated: true });

    try {
      const categoryId = this.state.product.category?._id || this.state.product.category;
      const currentProductId = this.props.productId;

      // First, get ALL products
      const response = await axios.get(
        `${url}/api/ProductModel`
      );

      // Filter products by category and exclude current product
      const allProducts = Array.isArray(response.data) ? response.data : [];

      let related = allProducts.filter(product => {
        const productCategoryId = product.category?._id || product.category;
        return productCategoryId === categoryId && product._id !== currentProductId;
      });

      // Fetch ratings for related products
      const relatedWithRatings = await Promise.all(
        related.map(async (product) => {
          try {
            const ratingResponse = await axios.get(
              `${url}/api/ReviewModel/product/${product._id}`
            );
            const stats = ratingResponse.data?.statistics || {};
            return {
              ...product,
              avgRating: parseFloat(stats.averageRating) || 0,
              reviewCount: parseInt(stats.totalReviews) || 0
            };
          } catch (error) {
            console.error(`Error fetching rating for product ${product._id}:`, error);
            return {
              ...product,
              avgRating: 0,
              reviewCount: 0
            };
          }
        })
      );

      this.setState({
        relatedProducts: relatedWithRatings.slice(0, 8),
        loadingRelated: false
      });
    } catch (error) {
      console.error("Error fetching related products:", error);
      this.setState({
        relatedProducts: [],
        loadingRelated: false
      });
    }
  };

  fetchProduct = async () => {
    const { productId } = this.props;
    try {
      const response = await axios.get(
        `${url}/api/ProductModel/${productId}`
      );
      this.setState({ product: response.data, error: null });
    } catch (error) {
      console.error("Error fetching product:", error);
      this.setState({
        error: "Failed to load product",
        product: null
      });
    }
  };

  checkWishlistStatus = async () => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (!userData) return;

    try {
      const user = JSON.parse(userData);
      const userId = user.id;
      const { productId } = this.props;

      const response = await axios.get(
        `${url}/api/WishlistModel/${userId}`
      );

      // Handle both array and object responses
      const wishlistData = Array.isArray(response.data) ? response.data : response.data.items || [];
      const wishlistProductIds = wishlistData.map((item) =>
        typeof item === 'string' ? item : item.productId?._id || item.productId
      );

      this.setState({
        isInWishlist: wishlistProductIds.includes(productId)
      });
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      this.setState({ isInWishlist: false });
    }
  };

  addToCart = async () => {
    this.setState({ isLoading: true, cartMessage: "" });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;
      const { productId } = this.props;

      await axios.post(
        `${url}/api/CartModel/add`,
        {
          userId,
          productId,
        }
      );

      this.setState({ cartMessage: "Product added to cart successfully!" });
      setTimeout(() => this.setState({ cartMessage: "" }), 3000);
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      alert("Failed to add product to cart: " + (error.response?.data?.error || error.message));
    } finally {
      this.setState({ isLoading: false });
    }
  };
  // Add related product to cart
  addRelatedToCart = async (productId) => {
    this.setState({ isLoading: true });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      await axios.post(
        `${url}/api/CartModel/add`,
        {
          userId,
          productId,
        }
      );

      alert("Product added to cart successfully!");
      // Optional: You can trigger a cart refresh here
    } catch (error) {
      console.error("Error adding related product to cart:", error.response?.data || error.message);
      alert("Failed to add product to cart: " + (error.response?.data?.error || error.message));
    } finally {
      this.setState({ isLoading: false });
    }
  };
  handleRelatedProductBuyNow = async (product) => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");

    if (!userData) {
      window.location.href = "/login";
      return;
    }

    try {
      // Prepare checkout data for single product
      const checkoutData = {
        type: 'buy_now',
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        productImage: product.image,
      };

      // Save to localStorage
      localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

      // Redirect to checkout page
      window.location.href = "/Checkout";

    } catch (error) {
      console.error("Error in Buy Now:", error.response?.data || error.message);
      alert("Failed to process Buy Now: " + (error.response?.data?.error || error.message));
    }
  };

  // Toggle wishlist for related product
  toggleRelatedProductWishlist = async (productId) => {
    this.setState({ isLikeLoading: true });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      // First check if product is already in wishlist
      const wishlistResponse = await axios.get(
        `${url}/api/WishlistModel/${userId}`
      );

      const wishlistData = Array.isArray(wishlistResponse.data)
        ? wishlistResponse.data
        : wishlistResponse.data.items || [];

      const isInWishlist = wishlistData.some(item =>
        item.productId?._id === productId || item.productId === productId
      );

      if (!isInWishlist) {
        await axios.post(`${url}/api/WishlistModel/add`, {
          userId,
          productId,
        });
        alert("Added to wishlist!");
      } else {
        await axios.delete(`${url}/api/WishlistModel/${userId}/${productId}`);
        alert("Removed from wishlist!");
      }
    } catch (error) {
      console.error("Error updating wishlist for related product:", error.response?.data || error.message);
      alert("Failed to update wishlist: " + (error.response?.data?.error || error.message));
    } finally {
      this.setState({ isLikeLoading: false });
    }
  };

  toggleWishlist = async () => {
    this.setState({ isLikeLoading: true, wishlistMessage: "" });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;
      const { productId } = this.props;

      if (!this.state.isInWishlist) {
        await axios.post(`${url}/api/WishlistModel/add`, {
          userId,
          productId,
        });
        this.setState({
          wishlistMessage: "Added to wishlist!",
          isInWishlist: true
        });
      } else {
        await axios.delete(`${url}/api/WishlistModel/${userId}/${productId}`);
        this.setState({
          wishlistMessage: "Removed from wishlist!",
          isInWishlist: false
        });
      }

      setTimeout(() => this.setState({ wishlistMessage: "" }), 3000);
    } catch (error) {
      console.error("Error updating wishlist:", error.response?.data || error.message);
      alert("Failed to update wishlist: " + (error.response?.data?.error || error.message));
    } finally {
      this.setState({ isLikeLoading: false });
    }
  };

  handleQuantityChange = (e) => {
    const quantity = Math.max(1, Math.min(parseInt(e.target.value) || 1, this.state.product?.stock || 1));
    this.setState({ quantity });
  };

  shareViaEmail = () => {
    const { product } = this.state;
    const productLink = product
      ? `http://localhost:3000/SinglePro/${product._id}`
      : "http://localhost:3000/";

    const subject = encodeURIComponent(`Check out this product: ${product?.name || "Awesome Product"}`);
    const body = encodeURIComponent(`I found this product and thought you might like it: ${productLink}`);

    window.open(
      `http://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`,
      "_blank"
    );
  };

  // Related Product Card component as a method
  renderRelatedProductCard = (product) => {
    const discountedPrice = product.discount
      ? (product.price - (product.price * product.discount / 100)).toFixed(2)
      : null;
    const originalPrice = product.price?.toFixed(2);
    const isOutOfStock = product.stock === 0;

    const handleProductClick = () => {
      window.location.href = `/SinglePro/${product._id}`;
    };

    return (
      <div key={product._id} className="related-product-card" onClick={handleProductClick} style={{ cursor: 'pointer' }}>
        <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden transition-all">
          <div className="position-relative">
            <img
              src={
                product.image
                  ? `${url}/public/images/product_images/${product.image}`
                  : placeholder
              }
              alt={product.name}
              className="card-img-top product-image"
              style={{ height: '200px', objectFit: 'cover' }}
              onError={(e) => (e.target.src = placeholder)}
            />
            {product.discount && (
              <div className="discount-badge-small position-absolute top-0 start-0 bg-danger text-white px-2 py-1 m-2 rounded-pill">
                <small>-{product.discount}%</small>
              </div>
            )}
            {isOutOfStock && (
              <div className="out-of-stock-badge position-absolute top-0 end-0 bg-dark text-white px-2 py-1 m-2 rounded">
                <small>Out of Stock</small>
              </div>
            )}
          </div>
          <div className="card-body p-3">
            <h6 className="card-title fw-bold text-dark mb-2" style={{ fontSize: '14px', height: '40px', overflow: 'hidden' }}>
              {product.name}
            </h6>
            <div className="d-flex justify-content-between align-items-center">
              <div className="price-section">
                {discountedPrice ? (
                  <div className="d-flex align-items-center">
                    <span className="fw-bold text-success me-2">
                      ${discountedPrice}
                    </span>
                    <small className="text-muted text-decoration-line-through">
                      ${originalPrice}
                    </small>
                  </div>
                ) : (
                  <span className="fw-bold text-dark">
                    ${originalPrice}
                  </span>
                )}
              </div>
              <div className="rating">
                <FaStar className="text-warning" size={14} />
                <small className="text-muted ms-1">4.5</small>
              </div>
            </div>
            <div className="mt-2">
              <small className="text-muted">{product.ml || '50ml'}</small>
            </div>
          </div>
          <div className="card-footer bg-transparent border-0 p-3 pt-0">
            <button
              className="btn btn-sm btn-outline-dark w-100 rounded-pill"
              onClick={(e) => {
                e.stopPropagation();
                // You can add quick add to cart functionality here
              }}
            >
              <small>Quick Add</small>
            </button>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      product,
      error,
      isLoading,
      isLikeLoading,
      cartMessage,
      wishlistMessage,
      quantity,
      isInWishlist,
      relatedProducts,
      loadingRelated,
      avgRating,
      reviewCount
    } = this.state;

    if (error) {
      return (
        <div className="container mt-5">
          <div className="text-center py-5">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      );
    }

    // Default product for fallback
    const defaultProduct = {
      name: "Premium Beauty Cream",
      description: "A luxurious anti-aging cream that nourishes and revitalizes your skin with natural ingredients and advanced skincare technology.",
      price: 45.99,
      discount: 20,
      ml: "50ml",
      stock: 15,
      category: { categoryName: "Skincare" },
      image: null,
      createdAt: new Date().toISOString()
    };

    const displayProduct = product || defaultProduct;
    const discountedPrice = displayProduct.discount
      ? (displayProduct.price - (displayProduct.price * displayProduct.discount / 100)).toFixed(2)
      : null;
    const originalPrice = displayProduct.price?.toFixed(2);
    const isOutOfStock = displayProduct.stock === 0;

    return (
      <>
        <div className="cosmetic-single-product">
          <div className="container py-5">
            <div className="row">
              {/* Product Images */}
              <div className="col-lg-6 mb-4">
                <div className="product-image-section">
                  <div className="main-image-container position-relative">
                    <img
                      src={
                        displayProduct.image
                          ? `${url}/public/images/product_images/${displayProduct.image}`
                          : placeholder
                      }
                      alt={displayProduct.name}
                      className="main-product-image img-fluid rounded-3"
                      onError={(e) => (e.target.src = placeholder)}
                    />
                    {displayProduct.discount && (
                      <div className="discount-badge position-absolute top-0 start-0 bg-danger text-white px-3 py-2 m-3 rounded-pill">
                        <strong>-{displayProduct.discount}% OFF</strong>
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="out-of-stock-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75 rounded-3">
                        <span className="text-white h3 fw-bold">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="col-lg-6">
                <div className="product-details">
                  {/* Category & Brand */}
                  <div className="product-meta mb-3">
                    <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                      {displayProduct.category?.categoryName || "Beauty"}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h1 className="product-title h2 fw-bold text-dark mb-3">
                    {displayProduct.name}
                  </h1>

                  {/* Rating */}
                  <div className="product-rating mb-3 d-flex align-items-center">
                    <div className="stars me-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`${i < Math.round(avgRating) ? 'text-warning' : 'text-muted'} me-1`}
                        />
                      ))}
                    </div>
                    <span className="rating-text text-muted">({avgRating.toFixed(1)}) {reviewCount} Review{reviewCount !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Price */}
                  <div className="price-section mb-4">
                    {discountedPrice ? (
                      <div className="d-flex align-items-center">
                        <span className="current-price h2 fw-bold text-success me-3">
                          ${discountedPrice}
                        </span>
                        <span className="original-price h5 text-muted text-decoration-line-through">
                          ${originalPrice}
                        </span>
                        <span className="savings ms-3 badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                          Save ${(displayProduct.price - discountedPrice).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="current-price h2 fw-bold text-dark">
                        ${originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Product Description */}
                  <div className="product-description mb-4">
                    <p className="text-muted lh-lg">
                      {displayProduct.description || "Experience the ultimate in skincare luxury with this premium formula designed to nourish and protect your skin."}
                    </p>
                  </div>

                  {/* Product Details */}
                  <div className="product-specs mb-4">
                    <div className="row g-3">
                      {displayProduct.ml && (
                        <div className="col-6">
                          <div className="spec-item">
                            <small className="text-muted d-block">Size</small>
                            <strong>{displayProduct.ml}</strong>
                          </div>
                        </div>
                      )}
                      <div className="col-6">
                        <div className="spec-item">
                          <small className="text-muted d-block">Stock</small>
                          <strong className={isOutOfStock ? "text-danger" : "text-success"}>
                            {isOutOfStock ? "Out of Stock" : `${displayProduct.stock} available`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {!isOutOfStock && (
                    <div className="quantity-section mb-4">
                      <label className="form-label fw-bold">Quantity:</label>
                      <div className="quantity-controls d-flex align-items-center">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => this.setState({ quantity: Math.max(1, quantity - 1) })}
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="form-control mx-2 text-center"
                          style={{ width: "80px" }}
                          value={quantity}
                          onChange={this.handleQuantityChange}
                          min="1"
                          max={displayProduct.stock}
                        />
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => this.setState({ quantity: Math.min(displayProduct.stock, quantity + 1) })}
                          disabled={quantity >= displayProduct.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="action-buttons mb-4">
                    <div className="d-flex gap-3">
                      <button
                        className="btn btn-dark btn-lg flex-fill rounded-pill"
                        onClick={this.addToCart}
                        disabled={isLoading || isOutOfStock}
                      >
                        {isLoading ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <FaShoppingCart className="me-2" />
                            Add to Cart
                          </>
                        )}
                      </button>
                      <button
                        className={`btn btn-lg rounded-pill ${isInWishlist ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={this.toggleWishlist}
                        disabled={isLikeLoading}
                        style={{ minWidth: "60px" }}
                      >
                        {isLikeLoading ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <FaHeart />
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-lg rounded-pill"
                        style={{ minWidth: "60px" }}
                        onClick={this.shareViaEmail}
                      >
                        <FaShare />
                      </button>
                    </div>
                  </div>

                  {/* Success Messages */}
                  {cartMessage && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <FaCheck className="me-2" />
                      {cartMessage}
                    </div>
                  )}
                  {wishlistMessage && (
                    <div className="alert alert-info alert-dismissible fade show" role="alert">
                      <FaHeart className="me-2" />
                      {wishlistMessage}
                    </div>
                  )}

                  {/* Features */}
                  <div className="product-features">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="feature-item d-flex align-items-center">
                          <FaTruck className="text-success me-2" />
                          <small>Free shipping over $50</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="feature-item d-flex align-items-center">
                          <FaShieldAlt className="text-primary me-2" />
                          <small>Authentic products</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="feature-item d-flex align-items-center">
                          <FaUndo className="text-info me-2" />
                          <small>30-day returns</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="feature-item d-flex align-items-center">
                          <FaCheck className="text-success me-2" />
                          <small>Dermatologist tested</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Product Information */}
            <div className="row mt-5">
              <div className="col-12">
                <div className="product-info-tabs">
                  <ul className="nav nav-tabs border-0 mb-4" id="productTabs" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link active border-0 bg-light rounded-pill me-2 px-4"
                        id="description-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#description"
                        type="button"
                        role="tab"
                      >
                        Description
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link border-0 bg-light rounded-pill me-2 px-4"
                        id="ingredients-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#ingredients"
                        type="button"
                        role="tab"
                      >
                        Ingredients
                      </button>
                    </li>
                    <li className="nav-item" role="presentation">
                      <button
                        className="nav-link border-0 bg-light rounded-pill px-4"
                        id="usage-tab"
                        data-bs-toggle="tab"
                        data-bs-target="#usage"
                        type="button"
                        role="tab"
                      >
                        How to Use
                      </button>
                    </li>
                  </ul>
                  <div className="tab-content" id="productTabsContent">
                    <div className="tab-pane fade show active" id="description" role="tabpanel">
                      <div className="bg-light p-4 rounded-3">
                        <h5 className="mb-3">Product Description</h5>
                        <p className="mb-3">
                          {displayProduct.description || "This premium cosmetic product is formulated with the finest ingredients to deliver exceptional results. Our advanced formula combines natural extracts with cutting-edge skincare technology to provide optimal nourishment and protection for your skin."}
                        </p>
                        <p className="mb-0">
                          Suitable for all skin types, this product has been dermatologically tested and is free from harmful chemicals. Experience the difference with our carefully crafted formula that delivers visible results.
                        </p>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="ingredients" role="tabpanel">
                      <div className="bg-light p-4 rounded-3">
                        <h5 className="mb-3">Key Ingredients</h5>
                        <ul className="list-unstyled">
                          <li className="mb-2"><strong>Hyaluronic Acid:</strong> Deep hydration and plumping</li>
                          <li className="mb-2"><strong>Vitamin E:</strong> Antioxidant protection</li>
                          <li className="mb-2"><strong>Natural Extracts:</strong> Nourishing botanical ingredients</li>
                          <li className="mb-0"><strong>Peptides:</strong> Skin firming and anti-aging</li>
                        </ul>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="usage" role="tabpanel">
                      <div className="bg-light p-4 rounded-3">
                        <h5 className="mb-3">How to Use</h5>
                        <ol>
                          <li className="mb-2">Cleanse your skin thoroughly</li>
                          <li className="mb-2">Apply a small amount to clean, dry skin</li>
                          <li className="mb-2">Gently massage in circular motions until absorbed</li>
                          <li className="mb-0">Use twice daily for best results</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Styles */}
        <style>{`
          .cosmetic-single-product {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            min-height: 100vh;
          }
          
          .main-product-image {
            width: 100%;
            height: 500px;
            object-fit: cover;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
          }
          
          .main-product-image:hover {
            transform: scale(1.02);
          }
          
          .product-title {
            font-family: 'Georgia', serif;
            color: #2c3e50;
          }
          
          .current-price {
            font-weight: 700;
          }
          
          .btn {
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
          }
          
          .btn-dark:hover {
            background-color: #495057;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          
          .quantity-controls input {
            border: 2px solid #e9ecef;
          }
          
          .quantity-controls input:focus {
            border-color: #6c757d;
            box-shadow: none;
          }
          
          .feature-item {
            padding: 8px 0;
          }
          
          .nav-tabs .nav-link.active {
            background-color: #6c757d !important;
            color: white !important;
          }
          
          .nav-tabs .nav-link:hover {
            background-color: #e9ecef !important;
            color: #495057;
          }
          
          .discount-badge {
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
          }
          
          .out-of-stock-overlay {
            backdrop-filter: blur(2px);
          }
          
          .product-rating .stars {
            font-size: 16px;
          }
          
          .spec-item {
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #6c757d;
          }

          /* Related Products Styles */
          .related-products-section {
            background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
            padding: 60px 0;
            margin-top: 40px;
          }
          
          .section-title {
            position: relative;
            display: inline-block;
            padding-bottom: 10px;
          }
          
          .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 3px;
            background: linear-gradient(90deg, #6c757d, #343a40);
            border-radius: 2px;
          }
          
          .related-product-card:hover .card {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
          }
          
          .transition-all {
            transition: all 0.3s ease;
          }
          
          .product-image {
            transition: transform 0.3s ease;
          }
          
          .related-product-card:hover .product-image {
            transform: scale(1.05);
          }
          
          .discount-badge-small {
            font-size: 11px;
            font-weight: 600;
          }
          
          .out-of-stock-badge {
            font-size: 11px;
            font-weight: 600;
          }
          
          @media (max-width: 768px) {
            .main-product-image {
              height: 300px;
            }
            
            .action-buttons .d-flex {
              flex-direction: column;
            }
            
            .action-buttons .btn {
              margin-bottom: 10px;
            }
            
            .related-products-section {
              padding: 40px 0;
            }
          }
        `}</style>

        <Rating_Review productId={this.props.productId} />

        {/* Related Products Section */}
        {/* Related Products Section */}
        <div className="related-products-section">
          <div className="container">
            <div className="row mb-5">
              <div className="col-12">
                <h2 className="section-title fw-bold text-center mb-2">Related Products</h2>
                <p className="text-muted text-center mb-4">
                  Discover more from the {product?.category?.categoryName || "same"} category
                </p>
              </div>
            </div>

            {loadingRelated ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading related products...</p>
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                {relatedProducts.map((relatedProduct, index) => {
                  const discountedPrice = relatedProduct.discount
                    ? (relatedProduct.price - (relatedProduct.price * relatedProduct.discount / 100)).toFixed(2)
                    : null;
                  const outOfStock = (relatedProduct.stock || 0) <= 0 || relatedProduct.status === 'inactive';

                  // Get rating from related product data (already fetched)
                  const avgRating = relatedProduct.avgRating || 0;
                  const reviewCount = relatedProduct.reviewCount || 0;

                  return (
                    <div className="col" key={relatedProduct._id}>
                      <div
                        className="card cosmetic-product-card h-100 border-0 shadow-sm"
                        onClick={() => window.location.href = `/SinglePro/${relatedProduct._id}`}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Product Image with Overlay */}
                        <div className="cosmetic-image-container position-relative overflow-hidden rounded-top">
                          <img
                            src={
                              relatedProduct.image
                                ? `${url}/public/images/product_images/${relatedProduct.image}`
                                : placeholder
                            }
                            alt={relatedProduct.name}
                            className="cosmetic-product-img"
                            onError={(e) => (e.target.src = placeholder)}
                          />

                          {/* Discount Badge */}
                          {relatedProduct.discount && (
                            <div className="discount-badge position-absolute top-0 start-0 bg-danger text-white px-2 py-1 m-2 rounded-pill">
                              <span className="fw-bold">-{relatedProduct.discount}%</span>
                            </div>
                          )}

                          {/* Out of Stock Badge */}
                          {outOfStock && (
                            <div className="position-absolute top-0 start-0 m-2">
                              <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">Out of Stock</span>
                            </div>
                          )}

                          {/* Rating Badge on Image */}
                          {avgRating > 0 && (
                            <div className="position-absolute top-0 end-0 m-2">
                              <div className="rating-badge bg-white rounded-pill px-2 py-1 d-flex align-items-center shadow-sm">
                                <FaStar className="text-warning me-1" size={12} />
                                <span className="fw-bold text-dark" style={{ fontSize: '12px' }}>
                                  {avgRating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons Overlay */}
                          <div className="cosmetic-action-buttons position-absolute top-0 end-0 d-flex flex-column p-2">
                            <button
                              className={`btn btn-icon mb-2 ${this.state.isInWishlist ? "btn-danger" : "btn-light"}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                this.toggleRelatedProductWishlist(relatedProduct._id);
                              }}
                              title={this.state.isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                              <FaHeart />
                            </button>
                            <button
                              className="btn btn-icon btn-light mb-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/SinglePro/${relatedProduct._id}`;
                              }}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </div>

                          {/* Buy Now and Add to Cart on Hover */}
                          <div className="cosmetic-add-to-cart position-absolute bottom-0 w-100 p-3">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-dark w-50 rounded-pill d-flex align-items-center justify-content-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.addRelatedToCart(relatedProduct._id);
                                }}
                                disabled={outOfStock || isLoading}
                              >
                                {isLoading ? (
                                  <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                ) : (
                                  <>
                                    <FaShoppingCart className="me-2" />
                                    {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                                  </>
                                )}
                              </button>

                              <button
                                className={`btn glow-buy-now w-50 rounded-pill d-flex align-items-center justify-content-center ${outOfStock ? 'btn-secondary' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.handleRelatedProductBuyNow(relatedProduct);
                                }}
                                disabled={outOfStock}
                              >
                                <FaBolt className="me-2" />
                                {outOfStock ? 'Unavailable' : 'Buy Now'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="card-body pb-3 pt-3">
                          {/* Product Name */}
                          <h6 className="cosmetic-product-name fw-semibold mb-2 text-dark">
                            {relatedProduct.name}
                          </h6>

                          {/* Category */}
                          <small className="text-muted d-block mb-2" style={{ fontSize: '0.8rem' }}>
                            {relatedProduct.category?.categoryName || "Uncategorized"}
                          </small>

                          {/* Rating Section - Same as product page */}
                          <div className="rating-section mb-3">
                            <div className="d-flex align-items-center mb-1">
                              <div className="stars me-2">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className="text-warning"
                                    size={12}
                                    style={{
                                      opacity: i < Math.floor(avgRating) ? 1 :
                                        i < avgRating ? 0.7 : 0.3
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="fw-bold text-dark">{avgRating.toFixed(1)}</span>
                            </div>
                            <div className="rating-progress">
                              <div
                                className="progress"
                                style={{ height: '4px', backgroundColor: '#e4e5e9' }}
                              >
                                <div
                                  className="progress-bar bg-warning"
                                  style={{ width: `${(avgRating / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            {reviewCount > 0 && (
                              <div className="text-muted text-end" style={{ fontSize: '0.75rem' }}>
                                {reviewCount} ratings
                              </div>
                            )}
                          </div>

                          {/* Price Section */}
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              {discountedPrice ? (
                                <>
                                  <span className="h5 fw-bold text-dark mb-0 me-2">${discountedPrice}</span>
                                  <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.9rem' }}>
                                    ${relatedProduct.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="h5 fw-bold text-dark mb-0">${relatedProduct.price?.toFixed(2)}</span>
                              )}
                            </div>

                            {/* Stock Indicator */}
                            <div className="stock-indicator">
                              {!outOfStock && relatedProduct.stock && (
                                <small className="text-success fw-medium" style={{ fontSize: '0.8rem' }}>
                                  In Stock
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !loadingRelated && (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <FaFilter size={48} className="text-muted" />
                  </div>
                  <h4 className="text-muted">No related products found</h4>
                  <p className="text-muted">Explore other categories for more products</p>
                </div>
              )
            )}
          </div>
        </div>
        {/* After Related Products section */}
        <div className="text-center py-5">
          <div className="container">
            <h3 className="mb-4">Want to explore more?</h3>
            <p className="text-muted mb-4">Check out our complete collection of beauty products</p>
            <a
              href="/Ct_product"
              className="btn btn-dark btn-lg rounded-pill px-5 py-3"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
                border: 'none',
                fontWeight: '600'
              }}
            >
              Browse All Products
            </a>
          </div>
        </div>
        <style>
          {`
            .cosmetic-products-container {
              padding-bottom: 80px;
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
              min-height: 100vh;
            }
            
            .cosmetic-product-card {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border-radius: 16px !important;
              overflow: hidden;
              border: 1px solid rgba(0,0,0,0.05);
            }
            
            .cosmetic-product-card:hover {
              transform: translateY(-8px);
              box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            }
            
            .cosmetic-image-container {
              height: 250px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            
            .cosmetic-product-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .cosmetic-product-card:hover .cosmetic-product-img {
              transform: scale(1.08);
            }
            
            .cosmetic-action-buttons {
              opacity: 0;
              transition: all 0.3s ease;
            }
            
            .cosmetic-product-card:hover .cosmetic-action-buttons {
              opacity: 1;
            }
            
            .cosmetic-add-to-cart {
              opacity: 0;
              transform: translateY(100%);
              transition: all 0.3s ease;
              background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
            }
            
            .cosmetic-product-card:hover .cosmetic-add-to-cart {
              opacity: 1;
              transform: translateY(0);
            }
            
            .btn-icon {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              transition: all 0.3s ease;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .btn-icon:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            }
            
            .cosmetic-product-name {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              line-height: 1.4;
              min-height: 2.8em;
            }
            
            .discount-badge {
              font-size: 12px;
              font-weight: bold;
              backdrop-filter: blur(4px);
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
              box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
            }
            
            .rating-badge {
              backdrop-filter: blur(4px);
              background: rgba(255, 255, 255, 0.95);
              border: 1px solid rgba(255, 193, 7, 0.3);
            }
            
            .cosmetic-add-to-cart .btn {
              font-size: 0.8rem;
              padding: 0.6rem;
              white-space: nowrap;
              transition: all 0.3s ease;
              font-weight: 600;
              letter-spacing: 0.3px;
            }
            
            /* Custom Buy Now button */
            .glow-buy-now {
              background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%);
              border: none;
              color: white;
              font-weight: 600;
              position: relative;
              overflow: hidden;
              transition: all 0.3s ease;
            }
            
            .glow-buy-now::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              transition: left 0.5s;
            }
            
            .glow-buy-now:hover {
              background: linear-gradient(135deg, #7C3AED 0%, #C026D3 100%);
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
              color: white;
            }
            
            .glow-buy-now:hover::before {
              left: 100%;
            }
            
            .glow-buy-now:active {
              transform: translateY(0);
              background: linear-gradient(135deg, #6D28D9 0%, #A21CAF 100%);
            }
            
            /* Add to Cart button */
            .cosmetic-add-to-cart .btn-dark {
              background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
              border: none;
              position: relative;
              overflow: hidden;
              transition: all 0.3s ease;
            }
            
            .cosmetic-add-to-cart .btn-dark:hover {
              background: linear-gradient(135deg, #111827 0%, #030712 100%);
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
            }
            
            .cosmetic-add-to-cart .btn-dark:active {
              transform: translateY(0);
            }
            
            /* Optional: Purple accent for loading spinner */
            .text-primary {
              color: #8B5CF6 !important;
            }
            
            /* Card hover effect */
            .cosmetic-product-card::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              border-radius: 16px;
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(217, 70, 239, 0.05) 100%);
              opacity: 0;
              transition: opacity 0.3s ease;
              pointer-events: none;
            }
            
            .cosmetic-product-card:hover::after {
              opacity: 1;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
              .cosmetic-image-container {
                height: 200px;
              }
              
              .cosmetic-action-buttons {
                opacity: 1;
                transform: translateX(0);
                flex-direction: row;
                top: auto;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                translate: none;
              }
              
              .cosmetic-action-buttons .btn-icon {
                width: 32px;
                height: 32px;
                margin: 0 4px;
              }
            }
            
            .page-item.active .page-link {
              background-color: #8B5CF6;
              border-color: #8B5CF6;
            }
            
            .page-link {
              color: #8B5CF6;
            }
            
            .page-link:hover {
              color: #7C3AED;
            }
          `}
        </style>
      </>
    );
  }
}

const SinglePro = () => {
  const { productId } = useParams();
  return <SingleProClass productId={productId} />;
};

export default SinglePro;
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Component } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { FaHeart, FaShoppingCart, FaStar, FaCheck, FaTruck, FaShieldAlt, FaUndo, FaShare } from "react-icons/fa";
import placeholder from "./images/c1.jpeg"; // Default cosmetic image
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
      isInWishlist: false
    };
  }

  componentDidMount() {
    this.fetchProduct();
    this.checkWishlistStatus();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.productId !== this.props.productId) {
      this.fetchProduct();
      this.checkWishlistStatus();
    }
  }

  fetchProduct = async () => {
    const { productId } = this.props;
    try {
      // Fix the API endpoint to match your backend route
      const response = await axios.get(
        `http://localhost:5000/api/ProductModel/${productId}`
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
        `http://localhost:5000/api/WishlistModel/${userId}`
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
      // Don't set wishlist status if there's an error
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

      const response = await axios.post(
        "http://localhost:5000/api/CartModel/add",
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
        await axios.post("http://localhost:5000/api/WishlistModel/add", {
          userId,
          productId,
        });
        this.setState({
          wishlistMessage: "Added to wishlist!",
          isInWishlist: true
        });
      } else {
        await axios.delete(`http://localhost:5000/api/WishlistModel/${userId}/${productId}`);
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
    // Use actual product link or fallback
    const productLink = product
      ? `http://localhost:3000/product/${product._id}`
      : "http://localhost:3000/";

    const subject = encodeURIComponent(`Check out this product: ${product?.name || "Awesome Product"}`);
    const body = encodeURIComponent(`I found this product and thought you might like it: ${productLink}`);

    // Opens default email client
     window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`,
    "_blank"
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
      isInWishlist
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
                          ? `http://localhost:5000/public/images/product_images/${displayProduct.image}`
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
                        <FaStar key={i} className="text-warning me-1" />
                      ))}
                    </div>
                    <span className="rating-text text-muted">(4.5) 234 Reviews</span>
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
          }
        `}</style>

        <Rating_Review />
      </>
    );
  }
}

const SinglePro = () => {
  const { productId } = useParams();
  return <SingleProClass productId={productId} />;
};

export default SinglePro;
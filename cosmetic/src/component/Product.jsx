import React, { Component } from "react";
import axios from "axios";
import { FaHeart, FaShoppingCart, FaEye, FaStar, FaFilter, FaBolt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

// Placeholder image for cosmetics
import placeholder from "./images/c1.jpeg";

// Create a wrapper component to use navigate hook
class ProductComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      categories: [],
      liked: [],
      productRatings: {}, // Store ratings for each product
      isLoading: true,
      isLikeLoading: false,
      sortOption: "featured",
      filterCategory: "all",
      searchQuery: "",
      currentPage: 1,
      productsPerPage: 12
    };
  }

  componentDidMount() {
    this.fetchCategoriesAndProducts();
  }

  // Function to fetch ratings for products
  fetchProductRatings = async (productIds) => {
    try {
      const ratingsPromises = productIds.map(async (productId) => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/ReviewModel/product/${productId}`
          );
          const stats = response.data?.statistics || {};
          const avgRating = parseFloat(stats.averageRating) || 0;
          const reviewCount = parseInt(stats.totalReviews) || 0;
          return { productId, avgRating, reviewCount };
        } catch (error) {
          console.error(`Error fetching rating for product ${productId}:`, error);
          return { productId, avgRating: 0, reviewCount: 0 };
        }
      });

      const ratingsResults = await Promise.all(ratingsPromises);

      // Convert array to object for easier lookup
      const ratingsMap = {};
      ratingsResults.forEach(({ productId, avgRating, reviewCount }) => {
        ratingsMap[productId] = { avgRating, reviewCount };
      });

      this.setState({ productRatings: ratingsMap });
    } catch (error) {
      console.error("Error fetching product ratings:", error);
    }
  };

  fetchCategoriesAndProducts = async () => {
    try {
      this.setState({ isLoading: true });

      // Fetch categories
      const categoriesResponse = await axios.get(
        "http://localhost:5000/api/CategoryModel/categories"
      );
      const categories = categoriesResponse.data;

      // Fetch products
      const productsResponse = await axios.get(
        "http://localhost:5000/api/ProductModel/"
      );
      const allProducts = productsResponse.data;

      // Filter only active products
      const activeProducts = allProducts.filter(product => product.status === "active");

      // Fetch ratings for all active products
      const productIds = activeProducts.map(product => product._id);
      await this.fetchProductRatings(productIds);

      // Initialize liked array
      const liked = Array(activeProducts.length).fill(false);

      // Check if user has liked products
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const userId = user.id;

          const wishlistResponse = await axios.get(
            `http://localhost:5000/api/WishlistModel/${userId}`
          );
          let wishlistItems = wishlistResponse.data;

          if (!Array.isArray(wishlistItems)) {
            wishlistItems = wishlistResponse.data.wishlist || wishlistResponse.data.data || [];
          }

          const wishlistProductIds = wishlistItems.map(item => item.productId?._id);

          activeProducts.forEach((product, index) => {
            if (wishlistProductIds.includes(product._id)) {
              liked[index] = true;
            }
          });
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      }

      this.setState({
        products: activeProducts,
        categories,
        liked,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // Create fallback products
      const fallbackProducts = [
        {
          _id: "1",
          name: "Luxury Face Cream",
          price: 42.99,
          image: "cosmetic1.png",
          category: { categoryName: "Skincare" },
          rating: 4.5,
          discount: 15,
          status: "active"
        },
        {
          _id: "2",
          name: "Matte Lipstick",
          price: 24.99,
          image: "cosmetic2.png",
          category: { categoryName: "Makeup" },
          rating: 4.8,
          status: "active"
        },
        {
          _id: "3",
          name: "Hydrating Serum",
          price: 35.50,
          image: "cosmetic3.png",
          category: { categoryName: "Skincare" },
          rating: 4.3,
          discount: 10,
          status: "active"
        },
        {
          _id: "4",
          name: "Volume Mascara",
          price: 19.99,
          image: "cosmetic4.png",
          category: { categoryName: "Makeup" },
          rating: 4.7,
          status: "active"
        },
        {
          _id: "5",
          name: "Sunscreen SPF 50",
          price: 28.75,
          image: "cosmetic5.png",
          category: { categoryName: "Skincare" },
          rating: 4.6,
          status: "active"
        },
        {
          _id: "6",
          name: "Eyeshadow Palette",
          price: 45.00,
          image: "cosmetic6.png",
          category: { categoryName: "Makeup" },
          rating: 4.9,
          discount: 20,
          status: "active"
        }
      ];

      // Create fallback ratings for fallback products
      const fallbackRatings = {};
      fallbackProducts.forEach(product => {
        fallbackRatings[product._id] = {
          avgRating: product.rating || 0,
          reviewCount: Math.floor(Math.random() * 100) + 10
        };
      });

      this.setState({
        products: fallbackProducts,
        categories: [],
        liked: new Array(fallbackProducts.length).fill(false),
        productRatings: fallbackRatings,
        isLoading: false
      });
    }
  };

  // Function to render star ratings
  renderStars = (avgRating) => {
    const stars = [];
    const roundedRating = Math.round(avgRating * 2) / 2; // Round to nearest 0.5

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        // Full star
        stars.push(<FaStar key={i} className="text-warning" />);
      } else if (i - 0.5 <= roundedRating) {
        // Half star
        stars.push(<FaStar key={i} className="text-warning" style={{ opacity: 0.7 }} />);
      } else {
        // Empty star
        stars.push(<FaStar key={i} className="text-muted" style={{ opacity: 0.3 }} />);
      }
    }

    return stars;
  };

  // Add to cart functionality
  addToCart = async (productId) => {
    const currentLoading = this.state.isLoading;
    this.setState({ isLoading: true });

    try {
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        window.location.href = "/login";
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.post(
        "http://localhost:5000/api/CartModel/add",
        {
          userId,
          productId,
        }
      );

      console.log("Added to cart response:", response.data);
      alert("Product added to cart successfully!");
      window.location.reload();
    } catch (error) {
      console.error(
        "Error adding to cart:",
        error.response?.data || error.message
      );
      alert(
        "Failed to add product to cart: " +
        (error.response?.data?.error || error.message)
      );
    } finally {
      this.setState({ isLoading: currentLoading });
    }
  };

  // Buy Now functionality
  handleBuyNow = async (product) => {
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
        productImage: product.image || product.productImage,
      };

      // Save to localStorage
      localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

      // Redirect to checkout page using the navigate prop
      this.props.navigate("/Checkout");

    } catch (error) {
      console.error(
        "Error in Buy Now:",
        error.response?.data || error.message
      );
      alert(
        "Failed to process Buy Now: " +
        (error.response?.data?.error || error.message)
      );
    }
  };

  // Add to Wishlist
  toggleLike = async (index, productId) => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");

    if (!userData) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(userData);
    const userId = user.id;

    this.setState({ isLikeLoading: true });

    try {
      const { liked, products } = this.state;

      if (!liked[index]) {
        await axios.post("http://localhost:5000/api/WishlistModel/add", {
          userId,
          productId,
        });
        const newLiked = [...liked];
        newLiked[index] = true;
        this.setState({ liked: newLiked });
        alert("Added to wishlist!");
        window.location.reload();
      } else {
        // Remove from wishlist
        await axios.delete(`http://localhost:5000/api/WishlistModel/${userId}/${productId}`);
        const newLiked = [...liked];
        newLiked[index] = false;
        this.setState({ liked: newLiked });
        alert("Removed from wishlist!");
        window.location.reload();
      }
    } catch (error) {
      console.error(
        "Error updating wishlist:",
        error.response?.data || error.message
      );
      alert(
        "Failed to update wishlist: " +
        (error.response?.data?.error || error.message)
      );
    } finally {
      this.setState({ isLikeLoading: false });
    }
  };

  // Handle sorting
  handleSortChange = (e) => {
    this.setState({ sortOption: e.target.value });
  };

  // Handle category filter
  handleCategoryFilter = (category) => {
    this.setState({ filterCategory: category, currentPage: 1 });
  };

  // Handle search
  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value, currentPage: 1 });
  };

  // Pagination handlers
  handlePageChange = (pageNumber) => {
    this.setState({ currentPage: pageNumber });
  };

  // Get filtered, sorted, and paginated products
  getProcessedProducts = () => {
    const { products, sortOption, filterCategory, searchQuery, currentPage, productsPerPage, productRatings } = this.state;

    // Filter by category
    let filteredProducts = products;
    if (filterCategory !== "all") {
      filteredProducts = products.filter(product =>
        product.category?.categoryName === filterCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category?.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortOption) {
      case "price-low":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating":
        filteredProducts.sort((a, b) => {
          const ratingA = productRatings[a._id]?.avgRating || 0;
          const ratingB = productRatings[b._id]?.avgRating || 0;
          return ratingB - ratingA;
        });
        break;
      default:
        // Default sorting (featured)
        break;
    }

    // Pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    return {
      currentProducts,
      totalPages,
      totalProducts: filteredProducts.length
    };
  };

  render() {
    const {
      isLoading,
      isLikeLoading,
      sortOption,
      filterCategory,
      searchQuery,
      currentPage,
      categories,
      productRatings
    } = this.state;

    const { currentProducts, totalPages, totalProducts } = this.getProcessedProducts();

    // Get unique categories
    const uniqueCategories = [...new Set(categories
      .filter(cat => cat.categoryStatus === "Active")
      .map(cat => cat.categoryName)
    )];

    return (
      <div className="container mt-4 cosmetic-products-container">
        {/* Header Section */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold text-dark mb-3">Our Beauty Collection</h1>
          <p className="text-muted lead">Discover products that enhance your natural beauty</p>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FaFilter className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search products..."
                value={searchQuery}
                onChange={this.handleSearchChange}
              />
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => this.handleCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <select
              className="form-select"
              value={sortOption}
              onChange={this.handleSortChange}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <p className="text-muted mb-0">
            Showing {currentProducts.length} of {totalProducts} products
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading our beautiful collection...</p>
          </div>
        ) : currentProducts.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <FaFilter size={48} className="text-muted" />
            </div>
            <h4 className="text-muted">No products found</h4>
            <p className="text-muted">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
              {currentProducts.map((product, index) => {
                const discountedPrice = product.discount
                  ? (product.price - (product.price * product.discount / 100)).toFixed(2)
                  : null;
                const outOfStock = (product.stock || 0) <= 0 || product.status === 'inactive';

                // Get rating from productRatings state
                const ratingData = productRatings[product._id] || { avgRating: 0, reviewCount: 0 };
                const avgRating = ratingData.avgRating;
                const reviewCount = ratingData.reviewCount;

                return (
                  <div className="col" key={product._id}>
                    <div className="card cosmetic-product-card h-100 border-0 shadow-sm">
                      {/* Product Image with Overlay */}
                      <div className="cosmetic-image-container position-relative overflow-hidden rounded-top">
                        <img
                          src={
                            product.image
                              ? `http://localhost:5000/public/images/product_images/${product.image}`
                              : placeholder
                          }
                          alt={product.name}
                          className="cosmetic-product-img"
                          onError={(e) => (e.target.src = placeholder)}
                        />

                        {/* Discount Badge */}
                        {product.discount && (
                          <div className="discount-badge position-absolute top-0 start-0 bg-danger text-white px-2 py-1 m-2 rounded-pill">
                            <span className="fw-bold">-{product.discount}%</span>
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
                            className={`btn btn-icon mb-2 ${this.state.liked[index] ? "btn-danger" : "btn-light"}`}
                            onClick={() => !isLikeLoading && this.toggleLike(index, product._id)}
                            disabled={isLikeLoading}
                            title={this.state.liked[index] ? "Remove from Wishlist" : "Add to Wishlist"}
                          >
                            <FaHeart />
                          </button>
                          <Link
                            to={`/SinglePro/${product._id}`}
                            className="btn btn-icon btn-light mb-2"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                        </div>

                        {/* Action Buttons on Hover */}
                        <div className="cosmetic-add-to-cart position-absolute bottom-0 w-100 p-3">
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-dark w-50 rounded-pill d-flex align-items-center justify-content-center"
                              onClick={() => this.addToCart(product._id)}
                              disabled={isLoading || outOfStock}
                            >
                              {isLoading ? (
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              ) : (
                                <>
                                  <FaShoppingCart className="me- -1" />
                                   Add to Cart
                                </>
                              )}
                            </button>

                            <button
                              className={`btn glow-buy-now w-50 rounded-pill d-flex align-items-center justify-content-center ${outOfStock ? 'btn-secondary' : ''}`}
                              onClick={() => this.handleBuyNow(product)}
                              disabled={isLoading || outOfStock}
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
                          {product.name}
                        </h6>

                        {/* Category */}
                        <small className="text-muted d-block mb-2" style={{ fontSize: '0.8rem' }}>
                          {product.category?.categoryName || "Uncategorized"}
                        </small>

                        {/* Rating Section - Beautiful Design */}
                        <div className="rating-section mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <div className="stars me-2">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className="text-warning" size={12} />
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
                                  ${product.price}
                                </span>
                              </>
                            ) : (
                              <span className="h5 fw-bold text-dark mb-0">${product.price}</span>
                            )}
                          </div>

                          {/* Stock Indicator */}
                          <div className="stock-indicator">
                            {!outOfStock && product.stock && (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="d-flex justify-content-center mt-5">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => this.handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => this.handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => this.handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}

        {/* Add custom CSS with your website's color scheme */}
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
      </div>
    );
  }
}

// Wrapper component to use navigate hook
function Product(props) {
  const navigate = useNavigate();
  return <ProductComponent {...props} navigate={navigate} />;
}

export default Product;
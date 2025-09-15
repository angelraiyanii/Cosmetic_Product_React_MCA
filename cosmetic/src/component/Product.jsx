import React, { Component } from "react";
import axios from "axios";
import { FaHeart, FaShoppingCart, FaEye, FaStar, FaFilter } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../App.css";

// Placeholder image for cosmetics
import placeholder from "./images/c1.jpeg";

export class Product extends Component {
  constructor() {
    super();
    this.state = {
      products: [],
      categories: [],
      liked: [],
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

      // Initialize liked array
      const liked = Array(allProducts.length).fill(false);

      // Check if user has liked products
      const userData = localStorage.getItem("user") || localStorage.getItem("admin");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const userId = user.id;
          
          const wishlistResponse = await axios.get(
            `http://localhost:5000/api/WishlistModel/${userId}`
          );
          const wishlistProductIds = wishlistResponse.data.map(
            (item) => item.productId._id
          );
          
          allProducts.forEach((product, index) => {
            if (wishlistProductIds.includes(product._id)) {
              liked[index] = true;
            }
          });
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      }

      this.setState({
        products: allProducts,
        categories,
        liked,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      this.setState({
        isLoading: false,
        products: [
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
        ],
        liked: [false, false, false, false, false, false]
      });
    }
  };

  // Add to cart functionality
  addToCart = async (productId) => {
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
      this.setState({ isLoading: false });
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
      } else {
        // Remove from wishlist
        await axios.delete(`http://localhost:5000/api/WishlistModel/${userId}/${productId}`);
        const newLiked = [...liked];
        newLiked[index] = false;
        this.setState({ liked: newLiked });
        alert("Removed from wishlist!");
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
    const { products, sortOption, filterCategory, searchQuery, currentPage, productsPerPage } = this.state;
    
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
    
    // Filter only active products
    filteredProducts = filteredProducts.filter(product => product.status === "active");
    
    // Sort products
    switch(sortOption) {
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
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
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
      categories 
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
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
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
                  
                return (
                  <div className="col" key={product._id}>
                    <div className="card cosmetic-product-card h-100 border-0">
                      {/* Product Image with Overlay */}
                      <div className="cosmetic-image-container position-relative overflow-hidden">
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
                          <div className="discount-badge position-absolute top-0 start-0 bg-danger text-white px-2 py-1 m-2 rounded">
                            -{product.discount}%
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
                        
                        {/* Add to Cart Button on Hover */}
                        <div className="cosmetic-add-to-cart position-absolute bottom-0 w-100 text-center p-2">
                          <button
                            className="btn btn-dark w-100 rounded-pill"
                            onClick={() => this.addToCart(product._id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            ) : (
                              <>
                                <FaShoppingCart className="me-2" />
                                Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="card-body pb-0">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="cosmetic-product-name fw-bold mb-1 text-dark">{product.name}</h6>
                          <div className="d-flex align-items-center">
                            <FaStar className="text-warning me-1" />
                            <small className="text-muted">{product.rating || "4.5"}</small>
                          </div>
                        </div>
                        
                        <small className="text-muted d-block mb-2">{product.category?.categoryName || "Uncategorized"}</small>
                        
                        <div className="d-flex align-items-center">
                          {discountedPrice ? (
                            <>
                              <span className="h5 fw-bold text-dark mb-0 me-2">${discountedPrice}</span>
                              <span className="text-muted text-decoration-line-through">${product.price}</span>
                            </>
                          ) : (
                            <span className="h5 fw-bold text-dark mb-0">${product.price}</span>
                          )}
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
        
        {/* Add custom CSS */}
        <style>
          {`
            .cosmetic-products-container {
              padding-bottom: 80px;
            }
            
            .cosmetic-product-card {
              transition: transform 0.3s, box-shadow 0.3s;
              border-radius: 12px;
              overflow: hidden;
            }
            
            .cosmetic-product-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            
            .cosmetic-image-container {
              height: 250px;
              background: #f8f9fa;
            }
            
            .cosmetic-product-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.5s;
            }
            
            .cosmetic-product-card:hover .cosmetic-product-img {
              transform: scale(1.05);
            }
            
            .cosmetic-action-buttons {
              opacity: 0;
              transition: opacity 0.3s;
            }
            
            .cosmetic-product-card:hover .cosmetic-action-buttons {
              opacity: 1;
            }
            
            .cosmetic-add-to-cart {
              opacity: 0;
              transform: translateY(100%);
              transition: all 0.3s;
              background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
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
            }
            
            .cosmetic-product-name {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            .discount-badge {
              font-size: 12px;
              font-weight: bold;
            }
            
            .page-item.active .page-link {
              background-color: #6c757d;
              border-color: #6c757d;
            }
            
            .page-link {
              color: #6c757d;
            }
            
            .page-link:hover {
              color: #495057;
            }
          `}
        </style>
      </div>
    );
  }
}

export default Product;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHeart, FaShoppingCart, FaEye, FaStar, FaFilter } from "react-icons/fa";
import Category from "../component/Category";
import placeholder from "./images/c1.jpeg";

export default function Ct_product() {
  const [products, setProducts] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [liked, setLiked] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [sortOption, setSortOption] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch active categories first
  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/CategoryModel/categories"
        );
        const activeCats = response.data.filter(
          (cat) => cat.categoryStatus === "Active"
        );
        setActiveCategories(activeCats);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setActiveCategories([
          {
            _id: "fallback1",
            categoryName: "Skincare",
            categoryStatus: "Active",
          },
          {
            _id: "fallback2",
            categoryName: "Makeup",
            categoryStatus: "Active",
          },
          {
            _id: "fallback3",
            categoryName: "Haircare",
            categoryStatus: "Active",
          },
        ]);
      }
    };
    fetchActiveCategories();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location.search]);

  // Fetch products - simplified approach like in Product component
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // Always fetch all products first (like in Product component)
        const response = await axios.get("http://localhost:5000/api/ProductModel/");
        const allProducts = response.data;
        
        // Filter products by active categories and status
        const activeCategoryNames = activeCategories.map(cat => cat.categoryName);
        let filteredProducts = allProducts.filter((product) =>
          product.status === "active" &&
          (activeCategoryNames.length === 0 || activeCategoryNames.includes(product.category?.categoryName))
        );
        
        // Further filter by selected category if one is chosen
        if (selectedCategory) {
          filteredProducts = filteredProducts.filter(product => 
            product.category?.categoryName === selectedCategory
          );
        }

        setProducts(filteredProducts);
        
        // Initialize liked array
        const initialLiked = new Array(filteredProducts.length).fill(false);
        setLiked(initialLiked);

        // Check user wishlist
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
            
            const updatedLiked = filteredProducts.map((product) =>
              wishlistProductIds.includes(product._id)
            );
            setLiked(updatedLiked);
          } catch (error) {
            console.error("Error fetching wishlist:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback data for cosmetics
        const fallbackProducts = [
          {
            _id: "fallback1",
            name: "Luxury Face Cream",
            price: 42.99,
            image: "cosmetic1.png",
            category: { categoryName: "Skincare" },
            rating: 4.5,
            discount: 15,
            status: "active"
          },
          {
            _id: "fallback2",
            name: "Matte Lipstick",
            price: 24.99,
            image: "cosmetic2.png",
            category: { categoryName: "Makeup" },
            rating: 4.8,
            status: "active"
          },
          {
            _id: "fallback3",
            name: "Hydrating Serum",
            price: 35.50,
            image: "cosmetic3.png",
            category: { categoryName: "Skincare" },
            rating: 4.3,
            discount: 10,
            status: "active"
          },
          {
            _id: "fallback4",
            name: "Volume Mascara",
            price: 19.99,
            image: "cosmetic4.png",
            category: { categoryName: "Makeup" },
            rating: 4.7,
            status: "active"
          },
        ];
        
        // Filter fallback by selected category
        const filteredFallback = selectedCategory 
          ? fallbackProducts.filter(p => p.category?.categoryName === selectedCategory)
          : fallbackProducts;
        
        setProducts(filteredFallback);
        setLiked(new Array(filteredFallback.length).fill(false));
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch products after categories are loaded or if we have a selected category from URL
    if (activeCategories.length > 0 || selectedCategory) {
      fetchProducts();
    }
  }, [selectedCategory, activeCategories]);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const toggleLike = async (index, productId) => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");

    if (!userData) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(userData);
    const userId = user.id;

    setIsLikeLoading(true);
    try {
      if (!liked[index]) {
        await axios.post("http://localhost:5000/api/WishlistModel/add", {
          userId,
          productId,
        });
        setLiked((prevLiked) =>
          prevLiked.map((likedState, i) => (i === index ? true : likedState))
        );
        alert("Added to wishlist!");
      } else {
        // Remove from wishlist
        await axios.delete(`http://localhost:5000/api/WishlistModel/${userId}/${productId}`);
        setLiked((prevLiked) =>
          prevLiked.map((likedState, i) => (i === index ? false : likedState))
        );
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
      setIsLikeLoading(false);
    }
  };

  // Add to cart functionality
  const addToCart = async (productId) => {
    const currentLoading = isLoading;
    setIsLoading(true);

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
      setIsLoading(currentLoading); // Restore previous loading state
    }
  };

  // Handle sorting
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Get filtered and sorted products
  const getProcessedProducts = () => {
    let filteredProducts = [...products]; // Create a copy
    
    // Filter by search query
    if (searchQuery) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category?.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
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
    
    return filteredProducts;
  };

  const processedProducts = getProcessedProducts();

  return (
    <div className="cosmetic-category-container">
      <Category onCategorySelect={handleCategorySelect} />

      {/* Header Section */}
      <div className="container mt-4">
        <div className="text-center mb-4">
          <h1 className="display-6 fw-bold text-dark mb-2">
            {selectedCategory ? `${selectedCategory} Collection` : "All Beauty Products"}
          </h1>
          <p className="text-muted">
            Discover our curated selection of {selectedCategory ? selectedCategory.toLowerCase() : "beauty"} products
          </p>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-md-8 mb-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <FaFilter className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <select 
              className="form-select" 
              value={sortOption} 
              onChange={handleSortChange}
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
            Showing {processedProducts.length} products
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading beautiful products...</p>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <FaFilter size={48} className="text-muted" />
            </div>
            <h4 className="text-muted">No products found</h4>
            <p className="text-muted">Try adjusting your search or select a different category</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {processedProducts.map((product, index) => {
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
                          className={`btn btn-icon mb-2 ${liked[index] ? "btn-danger" : "btn-light"}`}
                          onClick={() => !isLikeLoading && toggleLike(index, product._id)}
                          disabled={isLikeLoading}
                          title={liked[index] ? "Remove from Wishlist" : "Add to Wishlist"}
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
                          onClick={() => addToCart(product._id)}
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
        )}
      </div>
      
      {/* Add custom CSS */}
      <style>
        {`
          .cosmetic-category-container {
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
        `}
      </style>
    </div>
  );
}
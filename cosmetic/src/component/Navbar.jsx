import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../App.css";

function Navbar() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0); // Added wishlist count state
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [products, setProducts] = useState([]);
  
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Static pages for search
  const staticPages = [
    { name: 'Home', path: '/', icon: 'fa-home', type: 'page' },
    { name: 'About Us', path: '/Aboutus', icon: 'fa-info-circle', type: 'page' },
    { name: 'Contact', path: '/Contactus', icon: 'fa-phone', type: 'page' },
    { name: 'Products', path: '/Ct_product', icon: 'fa-shopping-bag', type: 'page' },
    { name: 'Cart', path: '/Cart', icon: 'fa-shopping-cart', type: 'page' },
    { name: 'Wishlist', path: '/Wishlist', icon: 'fa-heart', type: 'page' },
    { name: 'Account', path: '/Account', icon: 'fa-user', type: 'page' },
    { name: 'Order History', path: '/OrderHistory', icon: 'fa-history', type: 'page' },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    fetchCategories();
    fetchCartCount();
    fetchWishlistCount(); // Added wishlist count fetch
    fetchProducts();
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) &&
          searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/CategoryModel/categories"
      );

      const activeCategories = response.data.filter(
        (category) => category.categoryStatus === "Active"
      );

      setCategories(activeCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([
        { _id: "1", categoryName: "Skincare", categoryStatus: "Active" },
        { _id: "2", categoryName: "Makeup", categoryStatus: "Active" },
        { _id: "3", categoryName: "Haircare", categoryStatus: "Active" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/ProductModel/products");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  const fetchCartCount = async () => {
    try {
      const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!savedUser) return;

      const user = JSON.parse(savedUser);
      const userId = user.id;

      const response = await axios.get(`http://localhost:5000/api/CartModel/${userId}`);
      setCartCount(response.data.length);
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  // Added wishlist count fetch function
  const fetchWishlistCount = async () => {
    try {
      const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!savedUser) return;

      const user = JSON.parse(savedUser);
      const userId = user.id;

      // Adjust the API endpoint according to your wishlist model
      const response = await axios.get(`http://localhost:5000/api/WishlistModel/${userId}`);
      setWishlistCount(response.data.length);
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  // Enhanced search function
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    const results = [];
    const queryLower = query.toLowerCase();

    try {
      // Search in categories
      const matchingCategories = categories.filter(category =>
        category.categoryName.toLowerCase().includes(queryLower)
      );

      matchingCategories.forEach(category => {
        results.push({
          id: `category-${category._id}`,
          name: category.categoryName,
          type: 'category',
          icon: getCategoryIcon(category.categoryName),
          color: getCategoryColor(category.categoryName),
          action: () => handleCategoryClick(category.categoryName)
        });
      });

      // Search in static pages
      const matchingPages = staticPages.filter(page =>
        page.name.toLowerCase().includes(queryLower)
      );

      matchingPages.forEach(page => {
        results.push({
          id: `page-${page.path}`,
          name: page.name,
          type: 'page',
          icon: page.icon,
          color: 'text-primary',
          action: () => {
            navigate(page.path);
            setShowSearchResults(false);
            setSearchQuery('');
          }
        });
      });

      // Search in products
      const matchingProducts = products.filter(product => {
        const searchFields = [
          product.productName,
          product.productDescription,
          product.productPrice?.toString(),
          product.productCategory,
          product.productBrand
        ].filter(Boolean);

        return searchFields.some(field =>
          field.toLowerCase().includes(queryLower)
        );
      }).slice(0, 8); // Limit to 8 products

      matchingProducts.forEach(product => {
        results.push({
          id: `product-${product._id}`,
          name: product.productName,
          type: 'product',
          icon: 'fa-box',
          color: 'text-success',
          price: product.productPrice,
          category: product.productCategory,
          image: product.productImage,
          action: () => {
            navigate(`/ProductDetails/${product._id}`);
            setShowSearchResults(false);
            setSearchQuery('');
          }
        });
      });

      // Add special searches
      if (queryLower.includes('best seller') || queryLower.includes('bestseller')) {
        results.push({
          id: 'bestsellers',
          name: 'Best Sellers',
          type: 'special',
          icon: 'fa-fire',
          color: 'text-danger',
          action: () => handleBestSellersClick()
        });
      }

      if (queryLower.includes('new arrival') || queryLower.includes('latest')) {
        results.push({
          id: 'newarrivals',
          name: 'New Arrivals',
          type: 'special',
          icon: 'fa-star',
          color: 'text-warning',
          action: () => handleNewArrivalsClick()
        });
      }

      // Price-based searches
      if (queryLower.includes('under') || queryLower.includes('below')) {
        const priceMatch = query.match(/(\d+)/);
        if (priceMatch) {
          const price = priceMatch[1];
          results.push({
            id: `price-under-${price}`,
            name: `Products under $${price}`,
            type: 'price',
            icon: 'fa-dollar-sign',
            color: 'text-info',
            action: () => {
              navigate(`/Ct_product?maxPrice=${price}`);
              setShowSearchResults(false);
              setSearchQuery('');
            }
          });
        }
      }

      setSearchResults(results);
      setShowSearchResults(results.length > 0);

    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, categories, products]);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/Ct_product?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("usertoken");
    localStorage.removeItem("admintoken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    setUser(null);
    setCartCount(0);
    setWishlistCount(0); // Reset wishlist count on logout
    navigate("/");
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/Ct_product?category=${encodeURIComponent(categoryName)}`);

    const dropdownElement = document.getElementById('productsDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap.Dropdown.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const handleBestSellersClick = () => {
    navigate("/Ct_product?sort=sales-desc");
    setShowSearchResults(false);
    setSearchQuery('');

    const dropdownElement = document.getElementById('productsDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap.Dropdown.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const handleNewArrivalsClick = () => {
    navigate("/Ct_product?sort=newest");
    setShowSearchResults(false);
    setSearchQuery('');

    const dropdownElement = document.getElementById('productsDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap.Dropdown.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const isAdmin = user && user.role === "admin";

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'skincare': return 'fa-spray-can';
      case 'makeup': return 'fa-palette';
      case 'haircare': return 'fa-spa';
      case 'fragrance': return 'fa-wind';
      case 'bath & body': return 'fa-bath';
      case 'face': return 'fa-smile';
      case 'lips': return 'fa-kiss';
      case 'eyes': return 'fa-eye';
      case 'nails': return 'fa-hand-paper';
      case 'gift sets': return 'fa-gift';
      case 'luxury collection': return 'fa-crown';
      default: return 'fa-shopping-bag';
    }
  };

  const getCategoryColor = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'skincare': return 'text-info';
      case 'makeup': return 'text-danger';
      case 'haircare': return 'text-success';
      case 'fragrance': return 'text-warning';
      case 'bath & body': return 'text-primary';
      case 'face': return 'text-info';
      case 'lips': return 'text-danger';
      case 'eyes': return 'text-purple';
      case 'nails': return 'text-pink';
      case 'gift sets': return 'text-success';
      case 'luxury collection': return 'text-warning';
      default: return 'text-secondary';
    }
  };

  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'category': return 'Category';
      case 'product': return 'Product';
      case 'page': return 'Page';
      case 'special': return 'Collection';
      case 'price': return 'Price Filter';
      default: return 'Result';
    }
  };

  return (
    <>
      {/* External CSS and JS */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        rel="stylesheet"
      />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>

      {/* Special offers banner */}
      <div className="offers-banner fade-in py-2 text-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <span className="me-2">✨ Free shipping on orders over $50! Limited time offer ✨</span>
        <a href="#" className="text-decoration-none fw-bold" style={{ color: 'white' }}>
          Shop Now <i className="fas fa-arrow-right ms-1"></i>
        </a>
      </div>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg cosmetics-navbar sticky-top bg-white shadow-sm">
        <div className="container-fluid">
          {/* Brand */}
          <Link className="navbar-brand fw-bold" to="/">
            <i className="fas fa-gem me-2"></i>
            <i className=" text-pink"></i>GlowCosmetics
          </Link>

          {/* Toggle for mobile */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="fas fa-bars"></i>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" to="/">
                  <i className="fas fa-home me-1"></i>Home
                </Link>
              </li>

              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="productsDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-shopping-bag me-1"></i>Products
                </a>
                <ul className="dropdown-menu" aria-labelledby="productsDropdown">
                  {loading ? (
                    <li>
                      <div className="dropdown-item-text">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Loading categories...
                      </div>
                    </li>
                  ) : (
                    <>
                      <li className="dropdown-header fw-bold">Categories</li>
                      {categories.map((category) => (
                        <li key={category._id}>
                          <button
                            className="dropdown-item d-flex align-items-center"
                            onClick={() => handleCategoryClick(category.categoryName)}
                            style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                          >
                            <i className={`fas ${getCategoryIcon(category.categoryName)} me-2 ${getCategoryColor(category.categoryName)}`}></i>
                            {category.categoryName}
                          </button>
                        </li>
                      ))}

                      <li><hr className="dropdown-divider" /></li>

                      <li className="dropdown-header fw-bold">Special Collections</li>

                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={handleBestSellersClick}
                          style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                        >
                          <i className="fas fa-fire me-2 text-danger"></i>
                          Best Sellers
                        </button>
                      </li>

                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={handleNewArrivalsClick}
                          style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                        >
                          <i className="fas fa-star me-2 text-warning"></i>
                          New Arrivals
                        </button>
                      </li>

                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => handleCategoryClick("Gift Sets")}
                          style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                        >
                          <i className="fas fa-gift me-2 text-success"></i>
                          Gift Sets
                        </button>
                      </li>

                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => handleCategoryClick("Luxury Collection")}
                          style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                        >
                          <i className="fas fa-crown me-2 text-warning"></i>
                          Luxury Collection
                        </button>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      <li>
                        <Link className="dropdown-item d-flex align-items-center" to="/Ct_product">
                          <i className="fas fa-boxes me-2 text-primary"></i>
                          All Products
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/Aboutus">
                  <i className="fas fa-info-circle me-1"></i>About Us
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/Contactus">
                  <i className="fas fa-phone me-1"></i>Contact
                </Link>
              </li>

              {/* Admin Menu */}
              {isAdmin && (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="adminDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="fas fa-user-shield me-1 text-danger"></i>Admin
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="adminDropdown">
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdCategory">
                        <i className="fas fa-list me-2 text-primary"></i> Category
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdPro">
                        <i className="fas fa-box me-2 text-success"></i> Product
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdUser">
                        <i className="fas fa-user me-2 text-info"></i> User
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdOrder">
                        <i className="fas fa-shopping-bag me-2 text-warning"></i> Order
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdOffers">
                        <i className="fas fa-tags me-2 text-primary"></i> Offers
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdReviews">
                        <i className="fas fa-star me-2 text-success"></i> Reviews
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdBanner">
                        <i className="fas fa-ad me-2 text-info"></i> Banners
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdContact">
                        <i className="fas fa-phone me-2 text-danger"></i> Contact
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/Admin/AdAbout">
                        <i className="fas fa-info-circle me-2 text-secondary"></i> About Us
                      </Link>
                    </li>
                  </ul>
                </li>
              )}
            </ul>

            {/* Right side: search, wishlist, cart, login/user */}
            <div className="d-flex align-items-center gap-3">
              {/* Enhanced Search */}
              <div className="search-container position-relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="position-relative">
                  <input
                    type="text"
                    className="form-control rounded-pill px-4 pe-5"
                    placeholder="Search everything..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    style={{ minWidth: "250px" }}
                  />
                  
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn btn-sm position-absolute"
                      onClick={clearSearch}
                      style={{ 
                        right: "35px", 
                        top: "50%", 
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "none",
                        color: "#888",
                        padding: "0"
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    className="btn btn-sm position-absolute"
                    style={{ 
                      right: "8px", 
                      top: "50%", 
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "none",
                      color: "#888"
                    }}
                  >
                    {searchLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <i className="fas fa-search"></i>
                    )}
                  </button>
                </form>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div 
                    ref={searchResultsRef}
                    className="search-results position-absolute bg-white border rounded shadow-lg"
                    style={{
                      top: "100%",
                      left: "0",
                      right: "0",
                      zIndex: "1050",
                      maxHeight: "400px",
                      overflowY: "auto"
                    }}
                  >
                    {searchResults.length > 0 ? (
                      <>
                        <div className="p-2 border-bottom bg-light">
                          <small className="text-muted">
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                          </small>
                        </div>
                        
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            className="search-result-item p-3 border-bottom d-flex align-items-center"
                            onClick={result.action}
                            style={{ cursor: 'pointer' }}
                          >
                            <i className={`fas ${result.icon} me-3 ${result.color}`}></i>
                            
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="fw-medium">{result.name}</span>
                                <small className="badge bg-light text-dark">
                                  {getResultTypeLabel(result.type)}
                                </small>
                              </div>
                              
                              {result.type === 'product' && (
                                <div className="mt-1">
                                  {result.price && (
                                    <small className="text-success fw-bold me-2">
                                      ${result.price}
                                    </small>
                                  )}
                                  {result.category && (
                                    <small className="text-muted">
                                      in {result.category}
                                    </small>
                                  )}
                                </div>
                              )}
                            </div>

                            {result.type === 'product' && result.image && (
                              <img
                                src={result.image}
                                alt={result.name}
                                className="ms-2 rounded"
                                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        ))}
                        
                        <div className="p-2 bg-light text-center">
                          <button
                            className="btn btn-link btn-sm text-decoration-none"
                            onClick={handleSearchSubmit}
                          >
                            View all results for "{searchQuery}" <i className="fas fa-arrow-right ms-1"></i>
                          </button>
                        </div>
                      </>
                    ) : searchQuery && !searchLoading ? (
                      <div className="p-4 text-center text-muted">
                        <i className="fas fa-search fa-2x mb-2"></i>
                        <div>No results found for "{searchQuery}"</div>
                        <small>Try searching for categories, products, or pages</small>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link to="/Wishlist" className="position-relative text-dark">
                <i className="fas fa-heart fa-lg"></i>
                {wishlistCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/Cart" className="position-relative text-dark">
                <i className="fas fa-shopping-cart fa-lg"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-light dropdown-toggle d-flex align-items-center"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fas fa-user-circle"></i>
                  {user && <span className="ms-2">{user.fullname}</span>}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  {!user && (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/login">
                          <i className="fas fa-sign-in-alt me-2 text-primary"></i> Login
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/Userlogin">
                          <i className="fas fa-user-plus me-2 text-success"></i> Register
                        </Link>
                      </li>
                    </>
                  )}

                  {user && (
                    <>
                      <li className="dropdown-item-text">
                        <i className="fas fa-user me-2 text-info"></i> {user.fullname}
                      </li>
                      <li className="dropdown-item-text">{user.email}</li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link className="dropdown-item" to="/Account">
                          <i className="fas fa-user me-2 text-info"></i> Account
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/Wishlist">
                          <i className="fas fa-heart me-2 text-danger"></i> Wishlist
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/Cart">
                          <i className="fas fa-shopping-cart me-2 text-primary"></i> Cart
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/OrderHistory">
                          <i className="fas fa-history me-2 text-warning"></i> Order History
                        </Link>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger d-flex align-items-center"
                          onClick={handleLogout}
                        >
                          <i className="fas fa-sign-out-alt me-2"></i> Logout
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
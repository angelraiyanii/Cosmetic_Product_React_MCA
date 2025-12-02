import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../App.css";

function Navbar() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add these notification states
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const searchResultsRef = useRef(null);
  const notificationsRef = useRef(null); // Add this ref for notifications

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

  // Check if a nav link is active
  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    fetchCategories();
    fetchCartCount();
    fetchWishlistCount();
    fetchProducts();
    fetchDiscountedProducts(); // Add this line
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

  // Rest of your existing functions remain the same...
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
      const response = await axios.get("http://localhost:5000/api/ProductModel/");
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

  const fetchWishlistCount = async () => {
    try {
      const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!savedUser) return;

      const user = JSON.parse(savedUser);
      const userId = user.id;

      const response = await axios.get(`http://localhost:5000/api/WishlistModel/${userId}`);
      setWishlistCount(response.data.length);
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };
  // Fetch discounted products for notifications
  // Fetch discounted products for notifications
  const fetchDiscountedProducts = async () => {
    try {
      setNotificationsLoading(true);
      const response = await axios.get("http://localhost:5000/api/ProductModel/");
      const allProducts = response.data || [];

      console.log("All products:", allProducts); // Debug log

      // Filter products with discount - adjust property names based on your actual data
      const discounted = allProducts.filter(product => {
        // Check different possible property names for discount
        const hasDiscount = (product.discount > 0) ||
          (product.productDiscount > 0) ||
          (product.discountPercentage > 0);

        const isActive = product.status === "active" ||
          product.productStatus === "active" ||
          product.isActive === true;

        return hasDiscount && isActive;
      }).slice(0, 10); // Limit to 10 products

      console.log("Discounted products:", discounted); // Debug log

      setDiscountedProducts(discounted);
      setNotificationCount(discounted.length);
    } catch (error) {
      console.error("Error fetching discounted products:", error);
      setDiscountedProducts([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSearchResults(false);

    // Refresh discounted products when opening notifications
    if (!showNotifications) {
      fetchDiscountedProducts();
    }
  };

  // Handle notification click - navigate to product
  const handleNotificationClick = (productId) => {
    navigate(`/SinglePro/${productId}`);
    setShowNotifications(false);
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotificationCount(0);
    setDiscountedProducts([]);
    setShowNotifications(false);
  };

  // Navigate to all discounted products
  const viewAllDiscountedProducts = () => {
    navigate('/Ct_product?filter=discounted');
    setShowNotifications(false);
  };
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
      }).slice(0, 8);

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
    const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    fetchCategories();
    fetchCartCount();
    fetchWishlistCount();
    fetchProducts();
    fetchDiscountedProducts(); // Add this line
  }, []);

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
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    navigate("/");
    window.location.reload();
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

          {/* Beautiful Animated Burger Button */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="burger-line"></span>
            <span className="burger-line"></span>
            <span className="burger-line"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
                  to="/"
                >
                  <i className="fas fa-home me-1"></i>Home
                </Link>
              </li>

              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${isActiveLink('/Ct_product') ? 'active' : ''}`}
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
                <Link
                  className={`nav-link ${isActiveLink('/Aboutus') ? 'active' : ''}`}
                  to="/Aboutus"
                >
                  <i className="fas fa-info-circle me-1"></i>About Us
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${isActiveLink('/Contactus') ? 'active' : ''}`}
                  to="/Contactus"
                >
                  <i className="fas fa-phone me-1"></i>Contact
                </Link>
              </li>

              {/* Admin Menu */}
              {isAdmin && (
                <li className="nav-item dropdown">
                  <a
                    className={`nav-link dropdown-toggle ${location.pathname.startsWith('/Admin') ? 'active' : ''}`}
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
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdCategory' ? 'active' : ''}`}
                        to="/Admin/AdCategory"
                      >
                        <i className="fas fa-list me-2 text-primary"></i> Category
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdPro' ? 'active' : ''}`}
                        to="/Admin/AdPro"
                      >
                        <i className="fas fa-box me-2 text-success"></i> Product
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdUser' ? 'active' : ''}`}
                        to="/Admin/AdUser"
                      >
                        <i className="fas fa-user me-2 text-info"></i> User
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdOrder' ? 'active' : ''}`}
                        to="/Admin/AdOrder"
                      >
                        <i className="fas fa-shopping-bag me-2 text-warning"></i> Order
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdOffers' ? 'active' : ''}`}
                        to="/Admin/AdOffers"
                      >
                        <i className="fas fa-tags me-2 text-primary"></i> Offers
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdReviews' ? 'active' : ''}`}
                        to="/Admin/AdReviews"
                      >
                        <i className="fas fa-star me-2 text-success"></i> Reviews
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdBanner' ? 'active' : ''}`}
                        to="/Admin/AdBanner"
                      >
                        <i className="fas fa-ad me-2 text-info"></i> Banners
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdContact' ? 'active' : ''}`}
                        to="/Admin/AdContact"
                      >
                        <i className="fas fa-phone me-2 text-danger"></i> Contact
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={`dropdown-item ${location.pathname === '/Admin/AdAbout' ? 'active' : ''}`}
                        to="/Admin/AdAbout"
                      >
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
              <Link
                to="/Wishlist"
                className={`position-relative text-dark ${isActiveLink('/Wishlist') ? 'active' : ''}`}
              >
                <i className="fas fa-heart fa-lg"></i>
                {wishlistCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notifications Bell */}
              <div className="position-relative" ref={notificationsRef}>
                <button
                  className={`btn btn-link position-relative text-dark p-0 ${showNotifications ? 'text-primary' : ''}`}
                  onClick={toggleNotifications}
                  style={{ border: 'none', background: 'none' }}
                >
                  <i className="fas fa-bell fa-lg"></i>
                  {notificationCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div
                    className="position-absolute bg-white border rounded shadow-lg"
                    style={{
                      top: "100%",
                      right: "0",
                      zIndex: "1050",
                      width: "350px",
                      maxHeight: "400px",
                      overflowY: "auto"
                    }}
                  >
                    <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 fw-bold">
                        <i className="fas fa-tag me-2 text-danger"></i>
                        Special Offers ({notificationCount})
                      </h6>
                      <div>
                        <button
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={viewAllDiscountedProducts}
                        >
                          View All
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={clearNotifications}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div className="p-4 text-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Loading offers...
                      </div>
                    ) : discountedProducts.length > 0 ? (
                      <>
                        {discountedProducts.map((product) => {
                          // Get the correct property names
                          const productName = product.productName || product.name || 'Product';
                          const productPrice = product.productPrice || product.price || 0;
                          const discount = product.discount || product.productDiscount || product.discountPercentage || 0;
                          const productCategory = product.productCategory || product.category?.categoryName || product.category || 'Beauty';
                          const productImage = product.productImage || product.image;

                          const discountedPrice = discount > 0 ? (productPrice - (productPrice * discount / 100)).toFixed(2) : productPrice;

                          return (
                            <div
                              key={product._id}
                              className="notification-item p-3 border-bottom d-flex align-items-center"
                              onClick={() => handleNotificationClick(product._id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="flex-shrink-0 me-3">
                                <img
                                  src={productImage ? `http://localhost:5000/public/images/product_images/${productImage}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNSAxNkMzMC41MjI4IDE2IDM1IDIwLjQ3NzIgMzUgMjZDMzUgMzEuNTIyOCAzMC41MjI4IDM2IDI1IDM2QzE5LjQ3NzIgMzYgMTUgMzEuNTIyOCAxNSAyNkMxNSAyMC40NzcyIDE5LjQ3NzIgMTYgMjUgMTZaIiBmaWxsPSIjQ0RDRENEIi8+Cjwvc3ZnPgo='}
                                  alt={productName}
                                  className="rounded"
                                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNSAxNkMzMC41MjI4IDE2IDM1IDIwLjQ3NzIgMzUgMjZDMzUgMzEuNTIyOCAzMC41MjI4IDM2IDI1IDM2QzE5LjQ3NzIgMzYgMTUgMzEuNTIyOCAxNSAyNkMxNSAyMC40NzcyIDE5LjQ3NzIgMTYgMjUgMTZaIiBmaWxsPSIjQ0RDRENEIi8+Cjwvc3ZnPgo=';
                                  }}
                                />
                              </div>

                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <span className="fw-medium text-dark">{productName}</span>
                                  <span className="badge bg-danger ms-2">
                                    -{discount}% OFF
                                  </span>
                                </div>

                                <div className="d-flex align-items-center">
                                  <span className="fw-bold text-success me-2">
                                    ${discountedPrice}
                                  </span>
                                  <span className="text-muted text-decoration-line-through small">
                                    ${productPrice}
                                  </span>
                                </div>

                                <small className="text-muted d-block">
                                  {productCategory}
                                </small>
                              </div>

                              <div className="flex-shrink-0 ms-2">
                                <i className="fas fa-chevron-right text-muted"></i>
                              </div>
                            </div>
                          );
                        })}

                        <div className="p-2 bg-light text-center">
                          <button
                            className="btn btn-link btn-sm text-decoration-none"
                            onClick={viewAllDiscountedProducts}
                          >
                            View all discounted products <i className="fas fa-arrow-right ms-1"></i>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-muted">
                        <i className="fas fa-bell-slash fa-2x mb-2"></i>
                        <div>No special offers right now</div>
                        <small>Check back later for discounts!</small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                to="/Cart"
                className={`position-relative text-dark ${isActiveLink('/Cart') ? 'active' : ''}`}
              >
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
                        <Link
                          className={`dropdown-item ${isActiveLink('/Account') ? 'active' : ''}`}
                          to="/Account"
                        >
                          <i className="fas fa-user me-2 text-info"></i> Account
                        </Link>
                      </li>
                      <li>
                        <Link
                          className={`dropdown-item ${isActiveLink('/Wishlist') ? 'active' : ''}`}
                          to="/Wishlist"
                        >
                          <i className="fas fa-heart me-2 text-danger"></i> Wishlist
                        </Link>
                      </li>
                      <li>
                        <Link
                          className={`dropdown-item ${isActiveLink('/Cart') ? 'active' : ''}`}
                          to="/Cart"
                        >
                          <i className="fas fa-shopping-cart me-2 text-primary"></i> Cart
                        </Link>
                      </li>
                      <li>
                        <Link
                          className={`dropdown-item ${isActiveLink('/OrderHistory') ? 'active' : ''}`}
                          to="/OrderHistory"
                        >
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
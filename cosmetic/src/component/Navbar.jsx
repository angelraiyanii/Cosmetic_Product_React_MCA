import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function Navbar() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Fetch categories from the database
    fetchCategories();
    fetchCartCount();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/CategoryModel/categories"
      );

      // Filter only active categories
      const activeCategories = response.data.filter(
        (category) => category.categoryStatus === "Active"
      );

      setCategories(activeCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback categories if API fails
      setCategories([
        { _id: "1", categoryName: "Skincare", categoryStatus: "Active" },
        { _id: "2", categoryName: "Makeup", categoryStatus: "Active" },
        { _id: "3", categoryName: "Haircare", categoryStatus: "Active" },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const fetchCartCount = async () => {
    try {
      const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
      if (!savedUser) return;

      const user = JSON.parse(savedUser);
      const userId = user.id;

      const response = await axios.get(`http://localhost:5000/api/CartModel/${userId}`);

      // Set count based on length of cart items
      setCartCount(response.data.length);
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("usertoken");
    localStorage.removeItem("admintoken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    setUser(null);
    setCartCount(0);
    navigate("/");
  };

  const handleCategoryClick = (categoryName) => {
    // Navigate to Ct_product page with the selected category
    navigate(`/Ct_product?category=${encodeURIComponent(categoryName)}`);

    // Close the dropdown (optional)
    const dropdownElement = document.getElementById('productsDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap.Dropdown.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const handleBestSellersClick = () => {
    // Navigate to products page with best sellers sorting
    navigate("/Ct_product?sort=sales-desc");

    // Close the dropdown
    const dropdownElement = document.getElementById('productsDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap.Dropdown.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const handleNewArrivalsClick = () => {
    // Navigate to products page with new arrivals sorting
    navigate("/Ct_product?sort=newest");

    // Close the dropdown
    const dropdownElement = document.getElementById('productsDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap.Dropdown.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const isAdmin = user && user.role === "admin";

  // Helper functions for category icons and colors
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

      {/* Special offers banner with theme colors */}
      <div className="offers-banner fade-in py-2 text-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>        <span className="me-2">✨ Free shipping on orders over $50! Limited time offer ✨</span>
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
                      {/* Main Categories */}
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

                      {/* Special Collections */}
                      <li className="dropdown-header fw-bold">Special Collections</li>

                      {/* Best Sellers */}
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

                      {/* New Arrivals */}
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

                      {/* Gift Sets */}
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

                      {/* Luxury Collection */}
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

                      {/* All Products */}
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

            {/* Right side: search, cart, login/user */}
            <div className="d-flex align-items-center gap-3">
              {/* Search */}
              <div className="search-container position-relative">
                <input
                  type="text"
                  className="form-control rounded-pill px-4"
                  placeholder="Search products..."
                  style={{ maxWidth: "200px" }}
                />
                <i
                  className="fas fa-search position-absolute"
                  style={{ right: "15px", top: "50%", transform: "translateY(-50%)", color: "#888" }}
                ></i>
              </div>

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

      {/* Custom CSS for additional colors */}
      <style>
        {`
          .text-pink { color: #e83e8c; }
          .text-purple { color: #6f42c1; }
          .offers-banner {
            background: linear-gradient(45deg, #e83e8c, #d63384);
            font-size: 0.9rem;
          }
          .dropdown-header {
            font-size: 0.85rem;
            padding: 0.5rem 1rem;
          }
          .navbar-brand {
            color: #e83e8c !important;
          }
          .nav-link {
            color: #495057;
          }
          .nav-link:hover {
            color: #e83e8c;
          }
          .dropdown-item:hover {
            background-color: #f8d7da;
          }
        `}
      </style>
    </>
  );
}

export default Navbar;
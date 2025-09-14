import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user") || localStorage.getItem("admin");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("usertoken");
    localStorage.removeItem("admintoken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    setUser(null);
    navigate("/");
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
      <div className="offers-banner fade-in bg-light py-2 text-center">
        <span className="me-2">✨ Free shipping on orders over $50! Limited time offer ✨</span>
        <a href="#" className="text-decoration-none fw-bold">
          Shop Now <i className="fas fa-arrow-right ms-1"></i>
        </a>
      </div>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg cosmetics-navbar sticky-top bg-white shadow-sm">
        <div className="container-fluid">
          {/* Brand */}
          <a className="navbar-brand fw-bold" href="#">
            <i className="fas fa-gem me-2 text-pink"></i>GlowCosmetics
          </a>

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

          {/* Nav links */}
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" href="#">
                  <i className="fas fa-home me-1"></i>Home
                </a>
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
                  <li>
                    <a className="dropdown-item" href="#">
                      <i className="fas fa-spray-can me-2 text-info"></i>Skincare
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      <i className="fas fa-smile-beam me-2 text-warning"></i>Haircare
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      <i className="fas fa-star me-2 text-primary"></i>Fragrance
                    </a>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <a className="dropdown-item" href="#">
                      <i className="fas fa-gift me-2 text-success"></i>Gift Sets
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      <i className="fas fa-crown me-2 text-secondary"></i>Luxury Collection
                    </a>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#">
                  <i className="fas fa-leaf me-1 text-success"></i>Skincare
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#">
                  <i className="fas fa-info-circle me-1"></i>About Us
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#">
                  <i className="fas fa-phone me-1"></i>Contact
                </a>
              </li>
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
              <a href="#" className="position-relative text-dark">
                <i className="fas fa-shopping-cart fa-lg"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  3
                </span>
              </a>

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

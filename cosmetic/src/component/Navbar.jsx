import React from 'react';

function Navbar() {
  return (
    <>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>

      {/* Special offers banner */}
      <div className="offers-banner fade-in">
        <div className="container">
          <span>✨ Free shipping on orders over $50! Limited time offer ✨</span>
          <a href="#" className="text-nowrap">Shop Now <i className="fas fa-arrow-right ms-1"></i></a>
        </div>
      </div>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg cosmetics-navbar sticky-top fade-in">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <i className="fas fa-gem me-2"></i>GlowCosmetics
          </a>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
            <i className="fas fa-bars"></i>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" href="#" aria-current="page">
                  <i className="fas fa-home me-1"></i>Home
                </a>
              </li>
              
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="productsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="fas fa-shopping-bag me-1"></i>Products
                </a>
                <ul className="dropdown-menu" aria-labelledby="productsDropdown">
                  <li><a className="dropdown-item" href="#"><i className="fas fa-spray-can me-2 text-info"></i>Skincare</a></li>
                  <li><a className="dropdown-item" href="#"><i className="fas fa-smile me-2 text-warning"></i>Haircare</a></li>
                  <li><a className="dropdown-item" href="#"><i className="fas fa-star me-2 text-primary"></i>Fragrance</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#"><i className="fas fa-gift me-2 text-success"></i>Gift Sets</a></li>
                  <li><a className="dropdown-item" href="#"><i className="fas fa-crown me-2 text-secondary"></i>Luxury Collection</a></li>
                </ul>
              </li>
              
              <li className="nav-item">
                <a className="nav-link" href="#">
                  <i className="fas fa-leaf me-1"></i>Skincare
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
            
            <div className="navbar-actions">
              <div className="search-container">
                <input type="text" className="search-input" placeholder="Search products, brands..." />
                {/* <button className="search-btn"><i className="fas fa-search"></i></button> */}
              </div>
              
              <a href="#" className="cart-icon">
                <i className="fas fa-shopping-cart"></i>
                <span className="cart-count">3</span>
              </a>
              <a href="#" className="user-icon">
  <i className="fas fa-user"></i>  {/* This is the correct user icon */}
</a>
             
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
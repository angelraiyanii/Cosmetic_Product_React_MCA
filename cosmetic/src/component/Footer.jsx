import React from 'react';
import App from '../App';
function Footer() {
  return (
    <>
     
      <footer className="cosmetics-footer">
        <div className="container">
          <div className="footer-main">
            <div className="row">
              {/* Brand Section */}
              <div className="col-lg-3 col-md-6 mb-4">
                <div className="footer-section">
                  <a href="#" className="footer-brand">
                    <i className="fas fa-gem me-2"></i>
                    GlowCosmetics
                  </a>
                  <p className="brand-description">
                    Your trusted partner in beauty and self-care. We bring you premium cosmetics and skincare products to enhance your natural glow.
                  </p>
                  <div className="social-icons">
                    <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                    <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                    <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                    <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
                    <a href="#" className="social-icon"><i className="fab fa-pinterest"></i></a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="col-lg-2 col-md-6 mb-4">
                <div className="footer-section">
                  <h5>Quick Links</h5>
                  <ul className="footer-links">
                    <li><a href="#"><i className="fas fa-chevron-right"></i>Home</a></li>
                    <li><a href="#"><i className="fas fa-chevron-right"></i>About Us</a></li>
                    <li><a href="#"><i className="fas fa-chevron-right"></i>Products</a></li>
                    <li><a href="#"><i className="fas fa-chevron-right"></i>Brands</a></li>
                    <li><a href="#"><i className="fas fa-chevron-right"></i>Blog</a></li>
                    <li><a href="#"><i className="fas fa-chevron-right"></i>Contact</a></li>
                  </ul>
                </div>
              </div>

              {/* Categories */}
              <div className="col-lg-2 col-md-6 mb-4">
                <div className="footer-section">
                  <h5>Categories</h5>
                  <ul className="footer-links">
                    <li><a href="#"><i className="fas fa-spray-can"></i>Skincare</a></li>
                    <li><a href="#"><i className="fas fa-palette"></i>Makeup</a></li>
                    <li><a href="#"><i className="fas fa-smile"></i>Haircare</a></li>
                    <li><a href="#"><i className="fas fa-star"></i>Fragrance</a></li>
                    <li><a href="#"><i className="fas fa-gift"></i>Gift Sets</a></li>
                    <li><a href="#"><i className="fas fa-crown"></i>Luxury</a></li>
                  </ul>
                </div>
              </div>

              {/* Customer Service */}
              <div className="col-lg-2 col-md-6 mb-4">
                <div className="footer-section">
                  <h5>Customer Care</h5>
                  <ul className="footer-links">
                    <li><a href="#"><i className="fas fa-headset"></i>Help Center</a></li>
                    <li><a href="#"><i className="fas fa-truck"></i>Shipping Info</a></li>
                    <li><a href="#"><i className="fas fa-undo"></i>Returns</a></li>
                    <li><a href="#"><i className="fas fa-shield-alt"></i>Privacy Policy</a></li>
                    <li><a href="#"><i className="fas fa-file-contract"></i>Terms of Service</a></li>
                    <li><a href="#"><i className="fas fa-question-circle"></i>FAQ</a></li>
                  </ul>
                </div>
              </div>

              {/* Contact & Newsletter */}
              <div className="col-lg-3 col-md-6 mb-4">
                
                  
                  <div className="contact-info">
                    <div className="contact-item">
                      <i className="fas fa-phone-alt"></i>
                      <span>+1 (555) 123-4567</span>
                    </div>
                    <div className="contact-item">
                      <i className="fas fa-envelope"></i>
                      <span>hello@glowcosmetics.com</span>
                    </div>
                    <div className="contact-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>123 Beauty Street, NY 10001</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div>
                <p style={{margin: 0, fontSize: '14px'}}>
                  © 2024 GlowCosmetics. All rights reserved. | Made with ❤️ for beauty lovers
                </p>
              </div>
              <div className="payment-methods">
                <span style={{marginRight: '15px', fontSize: '14px'}}>We Accept:</span>
                <span className="payment-icon"><i className="fab fa-cc-visa"></i></span>
                <span className="payment-icon"><i className="fab fa-cc-mastercard"></i></span>
                <span className="payment-icon"><i className="fab fa-cc-amex"></i></span>
                <span className="payment-icon"><i className="fab fa-paypal"></i></span>
              </div>
            </div>
          </div>
      
      </footer>
    </>
  );
}

export default Footer;
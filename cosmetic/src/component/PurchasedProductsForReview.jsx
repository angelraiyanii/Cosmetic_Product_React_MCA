import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaStar, 
  FaCalendarAlt, 
  FaShoppingBag,
  FaCheckCircle,
  FaEdit,
  FaTag,
  FaShippingFast,
  FaClock,
  FaHeart,
  FaEye,
  FaBolt,
  FaFilter,
  FaExclamationCircle
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import placeholder from './images/c1.jpeg'; // Your placeholder image
import '../App.css';

const PurchasedProductsForReview = ({ userId, isAuthenticated }) => {
   const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000" 
    : "https://gowcosmetic-backed.onrender.com";
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const navigate = useNavigate();

  // Helper function to build product image URL
  const getProductImageUrl = (imagePath) => {
    if (!imagePath || imagePath === placeholder) {
      return placeholder;
    }
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a relative path
    if (imagePath.includes('/')) {
      return `${url}/public/images/${imagePath}`;
    }
    
    // Otherwise, assume it's just a filename
    return `${url}/public/images/product_images/${imagePath}`;
  };

  // Fetch product image from API if not in order
  const fetchProductImage = async (productId) => {
    try {
      const response = await axios.get(`${url}/api/ProductModel/${productId}`);
      const productImage = response.data?.image || response.data?.productImage || placeholder;
      console.log('📸 Fetched product image for', productId, ':', productImage);
      return productImage;
    } catch (err) {
      console.error('Error fetching product image:', err);
      return placeholder;
    }
  };

  // Fetch user's purchased products that need review
  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      if (!userId || !isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('🔍 Fetching purchased products for user:', userId);
        
        // First, get user's orders with paid status
        const ordersResponse = await axios.get(`${url}/api/orderModel/user/${userId}`);
        console.log('📦 Orders fetched:', ordersResponse.data);
        
        // Extract orders from response
        let ordersArray = [];
        if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
          ordersArray = ordersResponse.data.orders;
        } else if (Array.isArray(ordersResponse.data)) {
          ordersArray = ordersResponse.data;
        } else if (ordersResponse.data.data && Array.isArray(ordersResponse.data.data)) {
          ordersArray = ordersResponse.data.data;
        }
        
        console.log('📋 Extracted orders array:', ordersArray);
        
        if (!Array.isArray(ordersArray)) {
          console.warn('⚠️ Orders response is not an array:', ordersArray);
          ordersArray = [];
        }
        
        const paidOrders = ordersArray.filter(order => 
          order.paymentStatus === 'paid' || order.status === 'paid' || order.paymentStatus === 'completed' || order.status === 'completed'
        );

        // Extract unique products from all paid orders
        const allPurchasedProducts = [];

        // Extract all products from all paid orders (including duplicates initially)
        for (const order of paidOrders) {
          if (order.products && Array.isArray(order.products)) {
            for (const item of order.products) {
              const productId = item.productId?._id || item.productId;
              
              if (productId) {
                // Extract image - try multiple field names
                let rawImage = item.productId?.image || item.image || item.productImage || null;
                
                // If no image from order, fetch it from product API
                if (!rawImage || rawImage === placeholder) {
                  console.log('🖼️ No image in order for', productId, ', fetching from product API...');
                  rawImage = await fetchProductImage(productId);
                }
                
                allPurchasedProducts.push({
                  _id: productId,
                  name: item.productId?.name || item.name || 'Product',
                  image: rawImage, // Will be processed by getProductImageUrl in render
                  price: item.price || item.productId?.price || 0,
                  purchasedDate: order.createdAt || order.orderDate || new Date(),
                  orderId: order._id,
                  variant: item.variant || item.size || item.color,
                  color: item.color || null,
                  size: item.size || null,
                  category: item.productId?.category?.categoryName || item.category || 'General',
                  rating: 0, // Will be fetched from reviews API
                  discount: item.productId?.discount || 0,
                  brand: item.productId?.brand || '',
                  quantity: item.quantity || 1,
                  ...item
                });
              }
            }
          }
        }

        console.log('🛍️ All purchased products (before filtering):', allPurchasedProducts);

        // Fetch real ratings and check review status for each product
        const productsWithReviewStatus = await Promise.all(
          allPurchasedProducts.map(async (product) => {
            try {
              // Fetch actual reviews and rating stats for this product
              const reviewsResponse = await axios.get(
                `${url}/api/reviewModel/product/${product._id}`
              );
              
              let avgRating = 0;
              if (reviewsResponse.data.statistics && reviewsResponse.data.statistics.averageRating) {
                avgRating = parseFloat(reviewsResponse.data.statistics.averageRating);
              }
              
              // Check if user has already reviewed this product
              const reviewCheckResponse = await axios.get(
                `${url}/api/reviewModel/check-review/${userId}/${product._id}`
              );
              
              console.log(`📝 Product ${product._id} (${product.name}) - hasReviewed: ${reviewCheckResponse.data.hasReviewed}`);
              
              return {
                ...product,
                rating: avgRating,
                hasReviewed: reviewCheckResponse.data.hasReviewed,
                existingReview: reviewCheckResponse.data.review
              };
            } catch (error) {
              console.error('Error fetching review stats for product:', product._id, error);
              return {
                ...product,
                rating: 0,
                hasReviewed: false,
                existingReview: null
              };
            }
          })
        );

        // Filter out products that have already been reviewed
        const productsNeedingReview = productsWithReviewStatus.filter(
          product => !product.hasReviewed
        );

        // Remove duplicate products (keep only the most recent purchase)
        const seenProductIds = new Set();
        const uniqueProductsNeedingReview = productsNeedingReview.filter(product => {
          if (seenProductIds.has(product._id)) {
            return false; // Skip duplicates
          }
          seenProductIds.add(product._id);
          return true;
        });

        console.log('📊 Total products with review status:', productsWithReviewStatus.length);
        console.log('🔍 Products already reviewed:', productsWithReviewStatus.filter(p => p.hasReviewed).length);
        console.log('⭐ Products needing review (before dedup):', productsNeedingReview.length);
        console.log('✨ Unique products needing review:', uniqueProductsNeedingReview.length);
        
        // Debug: Log which products were filtered out (already reviewed)
        const reviewedProducts = productsWithReviewStatus.filter(p => p.hasReviewed);
        if (reviewedProducts.length > 0) {
          console.log('✓ Already reviewed - filtered out:', reviewedProducts.map(p => ({ id: p._id, name: p.name })));
        }
        
        setPurchasedProducts(uniqueProductsNeedingReview);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching purchased products:', err);
        setError('Failed to load purchased products. Please try again later.');
        setLoading(false);
      }
    };

    fetchPurchasedProducts();
  }, [userId, isAuthenticated]);

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays/7)} weeks ago`;
      
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Recently purchased';
    }
  };

  // Handle review button click - navigate to SinglePro page
  const handleReviewClick = (productId) => {
    navigate(`/SinglePro/${productId}?review=true`);
  };

  // If user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mt-5 cosmetic-products-container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-5 text-center" style={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}>
                <div className="mb-4">
                  <div className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <FaEdit size={40} color="#667eea" />
                  </div>
                </div>
                <h3 className="fw-bold text-dark mb-3">Review Your Purchases</h3>
                <p className="text-muted mb-4">
                  Sign in to see products you've purchased and share your valuable reviews.
                </p>
                <Link to="/login" className="btn btn-primary btn-lg px-5 py-2 rounded-pill"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
                        border: 'none',
                        fontWeight: '600'
                      }}>
                  Sign In to Review
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5 cosmetic-products-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading your purchased products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5 cosmetic-products-container">
        <div className="alert alert-danger border-0 rounded-3 shadow-sm">
          <div className="d-flex align-items-center">
            <FaExclamationCircle className="me-3" size={24} />
            <div>
              <h5 className="alert-heading mb-1">Error Loading Purchases</h5>
              <p className="mb-0">{error}</p>
            </div>
          </div>
          <button 
            className="btn btn-outline-danger mt-3" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (purchasedProducts.length === 0) {
    return (
    <div></div>
    );
  }

  return (
    <div className="container mt-4 cosmetic-products-container">
      {/* Header Section */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark mb-3">Review Your Purchases</h1>
        <p className="text-muted lead">Share your experience with products you've bought</p>
      </div>

      {/* Stats Banner */}
      <div className="card border-0 mb-4 shadow-sm" style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)'
      }}>
        <div className="card-body p-4 text-white">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3" 
                     style={{ width: '50px', height: '50px' }}>
                  <FaEdit size={24} color="#8B5CF6" />
                </div>
                <div>
                  <h4 className="fw-bold mb-1">Help other shoppers</h4>
                  <p className="mb-0 opacity-90">Your reviews make a difference!</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <div className="badge bg-white text-dark px-3 py-2 rounded-pill me-2">
                <FaStar className="me-1" /> Earn loyalty points
              </div>
              <div className="badge bg-white text-dark px-3 py-2 rounded-pill">
                {purchasedProducts.length} product{purchasedProducts.length !== 1 ? 's' : ''} to review
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        {purchasedProducts.map((product) => {
          const discountedPrice = product.discount 
            ? (product.price - (product.price * product.discount / 100)).toFixed(2)
            : null;
          const isHovered = hoveredProduct === product._id;
          
          return (
            <div className="col" key={product._id} 
                 onMouseEnter={() => setHoveredProduct(product._id)}
                 onMouseLeave={() => setHoveredProduct(null)}>
              <div className="card cosmetic-product-card h-100 border-0">
                {/* Product Image with Overlay */}
                <div className="cosmetic-image-container position-relative overflow-hidden">
                  <img
                    src={getProductImageUrl(product.image)}
                    alt={product.name}
                    className="cosmetic-product-img"
                    onError={(e) => (e.target.src = placeholder)}
                  />
                  
                  {/* Purchase Date Badge */}
                  <div className="purchase-date-badge position-absolute top-0 start-0 bg-info text-white px-2 py-1 m-2 rounded d-flex align-items-center">
                    <FaCalendarAlt className="me-1" size={12} />
                    <small>{formatDate(product.purchasedDate)}</small>
                  </div>

                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <div className="discount-badge position-absolute top-0 end-0 bg-danger text-white px-2 py-1 m-2 rounded">
                      -{product.discount}%
                    </div>
                  )}
                  
                  {/* Action Buttons Overlay */}
                  <div className="cosmetic-action-buttons position-absolute top-0 end-0 d-flex flex-column p-2">
                    <Link 
                      to={`/SinglePro/${product._id}`}
                      className="btn btn-icon btn-light mb-2"
                      title="View Details"
                    >
                      <FaEye />
                    </Link>
                  </div>
                  
                  {/* Review Button on Hover */}
                  <div className="cosmetic-add-to-cart position-absolute bottom-0 w-100 p-2">
                    <button
                      className="btn btn-warning w-100 rounded-pill d-flex align-items-center justify-content-center"
                      onClick={() => handleReviewClick(product._id)}
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        border: 'none',
                        fontWeight: '600',
                        color: '#000'
                      }}
                    >
                      <FaEdit className="me-2" />
                      Write Review
                    </button>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="card-body pb-0">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="cosmetic-product-name fw-bold mb-1 text-dark">{product.name}</h6>
                    <div className="d-flex align-items-center">
                      <FaStar className="text-warning me-1" />
                      <small className="text-muted">{product.rating > 0 ? product.rating.toFixed(1) : "No ratings yet"}</small>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center mb-2">
                    <FaTag className="text-muted me-1" size={12} />
                    <small className="text-muted">{product.category || "General"}</small>
                  </div>
                  
                  {product.variant && (
                    <div className="mb-2">
                      <small className="badge bg-light text-dark border">
                        {product.variant}
                      </small>
                    </div>
                  )}
                  
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
                  
                  {/* Purchase Info */}
                  <div className="mt-3 pt-2 border-top">
                    <div className="d-flex align-items-center">
                      <FaShoppingBag className="text-success me-2" size={14} />
                      <small className="text-muted">Purchased</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="card border-0 mt-5 shadow-sm" style={{
        background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
      }}>
        <div className="card-body p-4">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3" 
                     style={{ width: '50px', height: '50px' }}>
                  <FaStar size={20} color="#f6d365" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Help Others Choose</h6>
                  <p className="small mb-0">95% of shoppers read reviews</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3" 
                     style={{ width: '50px', height: '50px' }}>
                  <FaEdit size={20} color="#f6d365" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Be Specific & Honest</h6>
                  <p className="small mb-0">Detail what you loved or didn't</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3" 
                     style={{ width: '50px', height: '50px' }}>
                  <FaBolt size={20} color="#f6d365" />
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Photos Welcome!</h6>
                  <p className="small mb-0">Visuals help everyone see the real product</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
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
            box-shadow: 0 10px 25px rgba(139, 92, 246, 0.2) !important;
          }
          
          .cosmetic-image-container {
            height: 250px;
            background: #f8f9fa;
            position: relative;
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
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
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
            line-height: 1.4;
          }
          
          .discount-badge {
            font-size: 12px;
            font-weight: bold;
          }
          
          .purchase-date-badge {
            font-size: 11px;
            font-weight: 500;
            backdrop-filter: blur(4px);
            background-color: rgba(13, 110, 253, 0.9) !important;
          }
          
          /* Purple accent for loading spinner */
          .text-primary {
            color: #8B5CF6 !important;
          }
          
          /* Review button hover effects */
          .cosmetic-add-to-cart .btn-warning:hover {
            background: linear-gradient(135deg, #FFC107 0%, #FF8C00 100%) !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 193, 7, 0.3);
          }
          
          .cosmetic-add-to-cart .btn-warning:active {
            transform: translateY(0);
          }
          
          /* Adjust button sizes */
          .cosmetic-add-to-cart .btn {
            font-size: 0.9rem;
            padding: 0.6rem;
            white-space: nowrap;
          }
        `}
      </style>
    </div>
  );
};

export default PurchasedProductsForReview;
import React, { useState, useEffect } from 'react';
import {
  FaShoppingBag,
  FaSpinner,
  FaBox,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaTimesCircle,
  FaArrowLeft,
  FaReceipt,
  FaChevronDown,
  FaChevronUp,
  FaImage,
  FaShoppingCart
} from 'react-icons/fa';

const OrderHistory = () => {
  const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000"
    : "https://gowcosmetic-backed.onrender.com";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Placeholder image for missing product images
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Check if imagePath already contains the full URL structure
    if (imagePath.includes('product_images')) {
      return `${url}/public/images/${imagePath}`;
    }

    // Default path for product images
    return `${url}/public/images/product_images/${imagePath}`;
  };

  const getProductImage = (item) => {
    // Check multiple possible image fields
    return item.productId?.productImage ||
      item.productId?.productImageName ||
      item.productId?.product_image ||
      item.productId?.image ||
      item.productId?.productImageUrl ||
      item.image ||
      item.productImage ||
      null;
  };

  // Fetch product image from API if not stored in order
  const fetchProductImage = async (productId) => {
    try {
      const response = await fetch(`${url}/api/ProductModel/${productId}`);
      const data = await response.json();

      // The API returns the product directly, not wrapped in a 'product' property
      const productImage = data?.productImage || data?.product_image || data?.image || null;
      console.log('📸 Fetched product image for', productId, ':', productImage);
      return productImage;
    } catch (err) {
      console.error('Error fetching product image:', err);
      return null;
    }
  };

  // Function to open image preview
  const openImagePreview = (imagePath) => {
    if (imagePath) {
      setSelectedImage(getImageUrl(imagePath));
    }
  };

  useEffect(() => {
    const getUserId = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('✅ User found in localStorage:', user);
          return user.id;
        }
        console.log('❌ No user found in localStorage');
        return null;
      } catch (err) {
        console.error('❌ Error parsing user from localStorage:', err);
        return null;
      }
    };

    const id = getUserId();
    setUserId(id);

    if (id) {
      fetchOrders(id);
    } else {
      setError('Please log in to view your order history');
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (id) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching orders for userId:', id);

      const response = await fetch(`${url}/api/OrderModel/user/${id}`);
      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Orders found:', data.orders.length);

        // Transform and fetch missing images
        const transformedOrders = await Promise.all(data.orders.map(async (order) => {
          if (order.products && order.products.length > 0) {
            const productsWithImages = await Promise.all(order.products.map(async (item) => {
              // Use the image stored in the order
              let productImage = item.image;

              // If no image is stored, try to fetch it from the API
              if (!productImage && item.productId) {
                productImage = await fetchProductImage(item.productId);
              }

              console.log('🖼️ Product image data:', {
                productName: item.name,
                productImage,
                storedImage: item.image,
                productId: item.productId
              });

              return {
                _id: item.productId,
                name: item.name || 'Unknown Product',
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                image: productImage,
                fullProduct: item.productId
              };
            }));

            return {
              ...order,
              products: productsWithImages,
              orderId: order._id.substring(order._id.length - 8).toUpperCase(),
              totalAmount: order.totalAmount || 0,
              subtotal: order.subtotal || 0,
              tax: order.tax || 0,
              shipping: order.shipping || 0,
              discount: order.discount || 0,
              paymentStatus: order.paymentStatus || 'pending',
              shippingAddress: order.shippingAddress || {
                name: 'N/A',
                address: 'N/A',
                city: 'N/A',
                state: 'N/A',
                zip: 'N/A',
                country: 'India',
                email: 'N/A',
                phone: 'N/A'
              },
              createdAt: order.createdAt || new Date().toISOString()
            };
          }
          return order;
        }));

        console.log('🔄 Transformed orders:', transformedOrders);
        setOrders(transformedOrders);
        setError('');
      } else {
        console.error('❌ API returned success: false');
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setError(`Failed to load order history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatCurrency = (value) => {
    const num = typeof value === 'number' ? value : parseFloat(value || 0);
    if (Number.isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: '#f59e0b',
        background: '#fef3c7',
        icon: FaClock,
        text: 'Pending'
      },
      paid: {
        color: '#10b981',
        background: '#d1fae5',
        icon: FaCheckCircle,
        text: 'Paid'
      },
      processing: {
        color: '#3b82f6',
        background: '#dbeafe',
        icon: FaBox,
        text: 'Processing'
      },
      shipped: {
        color: '#8b5cf6',
        background: '#ede9fe',
        icon: FaTruck,
        text: 'Shipped'
      },
      delivered: {
        color: '#10b981',
        background: '#d1fae5',
        icon: FaCheckCircle,
        text: 'Delivered'
      },
      cancelled: {
        color: '#ef4444',
        background: '#fee2e2',
        icon: FaTimesCircle,
        text: 'Cancelled'
      }
    };
    return configs[status] || configs.pending;
  };

  // Function to close image preview
  const closeImagePreview = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <FaSpinner style={{
            fontSize: '50px',
            color: '#667eea',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            marginTop: '20px',
            fontSize: '18px',
            color: '#666',
            fontWeight: '600'
          }}>
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Gradient Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        marginBottom: '40px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            style={{
              width: '60px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontSize: '18px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FaArrowLeft />
          </button>

          {/* Receipt Icon */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '15px',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <FaReceipt style={{
              fontSize: '28px',
              color: '#667eea'
            }} />
          </div>

          {/* Title and Subtitle */}
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 5px 0',
              letterSpacing: '-0.5px'
            }}>
              Order History
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontWeight: '400'
            }}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px 40px'
      }}>
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px',
              opacity: 0.2
            }}>
              <FaShoppingBag style={{ fontSize: '40px', color: 'white' }} />
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px'
            }}>
              No Orders Yet
            </h2>
            <p style={{
              color: '#666',
              marginBottom: '30px'
            }}>
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.paymentStatus);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedOrders.has(order._id);

              return (
                <div key={order._id} style={{
                  background: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  transition: 'all 0.3s'
                }}>
                  {/* Order Header */}
                  <div style={{
                    padding: '25px 30px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {/* Order Icon */}
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FaShoppingCart style={{ fontSize: '24px' }} />
                      </div>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          opacity: 0.9,
                          marginBottom: '5px'
                        }}>
                          Order ID
                        </p>
                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          margin: 0
                        }}>
                          #{order.orderId}
                        </h3>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: statusConfig.background,
                      color: statusConfig.color,
                      padding: '10px 20px',
                      borderRadius: '25px',
                      fontWeight: '600'
                    }}>
                      <StatusIcon />
                      {statusConfig.text}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div style={{ padding: '25px 30px' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '20px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#f0f4ff',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaCalendarAlt style={{ color: '#667eea' }} />
                        </div>
                        <div>
                          <p style={{
                            fontSize: '12px',
                            color: '#999',
                            margin: '0 0 3px 0'
                          }}>
                            Order Date
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            margin: 0
                          }}>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#f0fdf4',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaCreditCard style={{ color: '#10b981' }} />
                        </div>
                        <div>
                          <p style={{
                            fontSize: '12px',
                            color: '#999',
                            margin: '0 0 3px 0'
                          }}>
                            Total Amount
                          </p>
                          <p style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#667eea',
                            margin: 0
                          }}>
                            ₹{formatCurrency(order.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#fef3c7',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaBox style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                          <p style={{
                            fontSize: '12px',
                            color: '#999',
                            margin: '0 0 3px 0'
                          }}>
                            Items
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            margin: 0
                          }}>
                            {order.products.length} {order.products.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleOrderExpansion(order._id)}
                      style={{
                        width: '100%',
                        background: '#f8f9fa',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#667eea',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#e9ecef';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <FaChevronUp />
                        </>
                      ) : (
                        <>
                          View Details <FaChevronDown />
                        </>
                      )}
                    </button>

                    {/* Expanded Details - Like Checkout Form */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '2px solid #f0f0f0'
                      }}>
                        {/* Products Section - Matching Checkout Form Style */}
                        <div style={{ marginBottom: '25px' }}>
                          <h4 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '20px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #f0f0f0'
                          }}>
                            Order Items ({order.products.length})
                          </h4>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                          }}>
                            {order.products.map((product, index) => {
                              const imagePath = product.image;
                              const imageUrl = getImageUrl(imagePath);

                              return (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '20px',
                                  padding: '15px',
                                  background: '#f8f9fa',
                                  borderRadius: '12px',
                                  transition: 'all 0.3s',
                                  position: 'relative'
                                }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateX(5px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateX(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  {/* Product Image - Matching Checkout Form */}
                                  <div
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      borderRadius: '10px',
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                      background: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px solid #e9ecef',
                                      cursor: imageUrl ? 'pointer' : 'default',
                                      position: 'relative'
                                    }}
                                    onClick={() => imageUrl && openImagePreview(imagePath)}
                                  >
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={product.name}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          transition: 'transform 0.3s'
                                        }}
                                        onError={(e) => {
                                          console.error('Image failed to load:', imageUrl);
                                          e.target.style.display = 'none';
                                          // Show fallback with first letter
                                          e.target.parentElement.innerHTML = `
                                            <div style="
                                              width: 100%;
                                              height: 100%;
                                              display: flex;
                                              align-items: center;
                                              justify-content: center;
                                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                              color: white;
                                              font-size: 24px;
                                              font-weight: bold;
                                              text-transform: uppercase;
                                            ">
                                              ${product.name.charAt(0)}
                                            </div>
                                          `;
                                        }}
                                        onMouseOver={(e) => {
                                          if (imageUrl) e.target.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseOut={(e) => {
                                          if (imageUrl) e.target.style.transform = 'scale(1)';
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                      }}>
                                        {product.name.charAt(0)}
                                      </div>
                                    )}

                                    {/* View Image Icon */}
                                    {imageUrl && (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: '5px',
                                        right: '5px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        opacity: 0,
                                        transition: 'opacity 0.3s'
                                      }}>
                                        <FaImage />
                                      </div>
                                    )}
                                  </div>

                                  {/* Product Details */}
                                  <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '5px'
                                  }}>
                                    <h5 style={{
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      color: '#333',
                                      margin: 0
                                    }}>
                                      {product.name}
                                    </h5>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      flexWrap: 'wrap'
                                    }}>
                                      <span style={{
                                        fontSize: '14px',
                                        color: '#666',
                                        background: '#e9ecef',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                      }}>
                                        ₹{formatCurrency(product.price)} each
                                      </span>
                                      <span style={{
                                        fontSize: '14px',
                                        color: '#666'
                                      }}>
                                        Quantity: {product.quantity}
                                      </span>
                                      {product.size && (
                                        <span style={{
                                          fontSize: '14px',
                                          color: '#666',
                                          background: '#e0f2fe',
                                          padding: '2px 8px',
                                          borderRadius: '4px'
                                        }}>
                                          Size: {product.size}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Product Total */}
                                  <div style={{
                                    textAlign: 'right',
                                    minWidth: '100px'
                                  }}>
                                    <div style={{
                                      fontSize: '18px',
                                      fontWeight: 'bold',
                                      color: '#667eea',
                                      marginBottom: '5px'
                                    }}>
                                      ₹{formatCurrency(product.price * product.quantity)}
                                    </div>
                                    <div style={{
                                      fontSize: '12px',
                                      color: '#999'
                                    }}>
                                      Total
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Shipping Address - Matching Checkout Form Style */}
                        <div style={{ marginBottom: '25px' }}>
                          <h4 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #f0f0f0'
                          }}>
                            <FaMapMarkerAlt style={{ color: '#667eea' }} />
                            Shipping Address
                          </h4>
                          <div style={{
                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #dee2e6'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px',
                              marginBottom: '15px'
                            }}>
                              <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '10px',
                                background: 'rgba(102, 126, 234, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <FaMapMarkerAlt style={{ fontSize: '24px', color: '#667eea' }} />
                              </div>
                              <div>
                                <h5 style={{
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  color: '#333',
                                  margin: '0 0 5px 0'
                                }}>
                                  {order.shippingAddress.name}
                                </h5>
                                <p style={{ color: '#666', margin: 0 }}>
                                  {order.shippingAddress.address}
                                </p>
                              </div>
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '15px',
                              marginTop: '15px'
                            }}>
                              <div>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#999',
                                  margin: '0 0 3px 0'
                                }}>
                                  Location
                                </p>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#333',
                                  margin: 0
                                }}>
                                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                                </p>
                              </div>
                              <div>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#999',
                                  margin: '0 0 3px 0'
                                }}>
                                  Country
                                </p>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#333',
                                  margin: 0
                                }}>
                                  {order.shippingAddress.country}
                                </p>
                              </div>
                              <div>
                                <p style={{
                                  fontSize: '12px',
                                  color: '#999',
                                  margin: '0 0 3px 0'
                                }}>
                                  Contact
                                </p>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#333',
                                  margin: 0
                                }}>
                                  {order.shippingAddress.email}
                                </p>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#333',
                                  margin: '3px 0 0 0'
                                }}>
                                  {order.shippingAddress.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price Breakdown - Matching Checkout Form Style */}
                        <div style={{
                          background: 'white',
                          borderRadius: '12px',
                          padding: '25px',
                          border: '2px solid #f0f0f0'
                        }}>
                          <h4 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '20px',
                            textAlign: 'center'
                          }}>
                            Order Summary
                          </h4>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            marginBottom: '20px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingBottom: '10px',
                              borderBottom: '1px solid #f0f0f0'
                            }}>
                              <span style={{ color: '#666', fontSize: '14px' }}>Subtotal</span>
                              <span style={{ fontWeight: '600', color: '#333' }}>
                                ₹{formatCurrency(order.subtotal)}
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingBottom: '10px',
                              borderBottom: '1px solid #f0f0f0'
                            }}>
                              <span style={{ color: '#666', fontSize: '14px' }}>Tax (GST)</span>
                              <span style={{ fontWeight: '600', color: '#333' }}>
                                ₹{formatCurrency(order.tax)}
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingBottom: '10px',
                              borderBottom: '1px solid #f0f0f0'
                            }}>
                              <span style={{ color: '#666', fontSize: '14px' }}>Shipping</span>
                              <span style={{
                                fontWeight: '600',
                                color: order.shipping === 0 ? '#10b981' : '#333'
                              }}>
                                {order.shipping === 0 ? 'FREE' : `₹${formatCurrency(order.shipping)}`}
                              </span>
                            </div>

                            {order.discount > 0 && (
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingBottom: '10px',
                                borderBottom: '1px solid #f0f0f0'
                              }}>
                                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                                  Discount
                                </span>
                                <span style={{ fontWeight: '600', color: '#10b981' }}>
                                  -₹{formatCurrency(order.discount)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Total Amount - Highlighted like Checkout */}
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '10px',
                            padding: '20px',
                            textAlign: 'center'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              color: 'white'
                            }}>
                              <span style={{ fontSize: '18px', fontWeight: '600' }}>
                                Total Amount
                              </span>
                              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                                ₹{formatCurrency(order.totalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
          onClick={closeImagePreview}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={closeImagePreview}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '30px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Product Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '10px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Hover effect for product images */
          div[style*="width: '80px'"][style*="height: '80px'"]:hover div[style*="opacity: 0"] {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
};

export default OrderHistory;
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
  FaImage
} from 'react-icons/fa';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.includes('/')) {
      return `http://localhost:5000/${imagePath}`;
    }
    
    return `http://localhost:5000/public/images/product_images/${imagePath}`;
  };

  const getProductImage = (item) => {
    return item.productId?.productImage ||
      item.productId?.productImageName ||
      item.productId?.product_image ||
      item.productId?.image ||
      item.image ||
      null;
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

      const response = await fetch(`http://localhost:5000/api/OrderModel/user/${id}`);
      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Orders found:', data.orders.length);

        const transformedOrders = data.orders.map(order => {
          if (order.items && order.items.length > 0) {
            return {
              ...order,
              products: order.items.map(item => {
                const productImage = getProductImage(item);

                return {
                  _id: item.productId?._id || item.productId,
                  name: item.productId?.productName ||
                    item.productId?.name ||
                    'Unknown Product',
                  price: item.price,
                  quantity: item.quantity,
                  size: item.size,
                  image: productImage,
                  fullProduct: item.productId
                };
              }),
              orderId: order._id.substring(order._id.length - 8).toUpperCase(),
              totalAmount: order.total || 0,
              subtotal: order.subtotal || 0,
              tax: order.tax || 0,
              shipping: order.shipping || 0,
              discount: order.discount || 0,
              paymentStatus: order.status || 'pending',
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
        });

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
            onClick={() => window.location.href = '/'}
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
                  {/* Order Header - FIXED: Removed product reference */}
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
                      {/* Show a simple order icon instead of product image */}
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
                        <FaBox style={{ fontSize: '24px' }} />
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

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '2px solid #f0f0f0'
                      }}>
                        {/* Products */}
                        <div style={{ marginBottom: '25px' }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '15px'
                          }}>
                            Order Items
                          </h4>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}>
                            {order.products.map((product, index) => {
                              const imagePath = product.image || product.fullProduct?.productImage || product.fullProduct?.image;
                              const imageUrl = getImageUrl(imagePath);

                              console.debug('Product image data:', {
                                index,
                                productName: product.name,
                                imagePath,
                                imageUrl,
                                hasImage: !!imagePath,
                                productData: product
                              });

                              return (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '15px',
                                  padding: '12px',
                                  background: '#f8f9fa',
                                  borderRadius: '10px',
                                  transition: 'all 0.3s'
                                }}>
                                  {/* Product Image - Clickable for preview */}
                                  <div
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                      background: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      position: 'relative',
                                      border: '1px solid #e9ecef',
                                      cursor: imageUrl ? 'pointer' : 'default'
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
                                          e.target.parentElement.innerHTML = `
                                            <div style="
                                              width: 100%;
                                              height: 100%;
                                              display: flex;
                                              align-items: center;
                                              justify-content: center;
                                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                              color: white;
                                              font-size: 30px;
                                              font-weight: bold;
                                              text-transform: uppercase;
                                            ">
                                              ${product.name.charAt(0)}
                                            </div>
                                          `;
                                        }}
                                        onMouseOver={(e) => {
                                          if (imageUrl) e.target.style.transform = 'scale(1.05)';
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
                                        fontSize: '30px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                      }}>
                                        {product.name.charAt(0)}
                                      </div>
                                    )}
                                  </div>

                                  {/* Product Details */}
                                  <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <p style={{
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '5px',
                                        fontSize: '15px'
                                      }}>
                                        {product.name}
                                      </p>
                                      <p style={{
                                        fontSize: '14px',
                                        color: '#666',
                                        marginBottom: '3px'
                                      }}>
                                        ₹{formatCurrency(product.price)} × {product.quantity}
                                      </p>
                                      {product.size && (
                                        <p style={{
                                          fontSize: '13px',
                                          color: '#888',
                                          margin: 0
                                        }}>
                                          Size: {product.size}
                                        </p>
                                      )}
                                    </div>
                                    <p style={{
                                      fontSize: '16px',
                                      fontWeight: 'bold',
                                      color: '#667eea'
                                    }}>
                                      ₹{formatCurrency(product.price * product.quantity)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div style={{ marginBottom: '25px' }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <FaMapMarkerAlt style={{ color: '#667eea' }} />
                            Shipping Address
                          </h4>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '10px',
                            color: '#666',
                            lineHeight: '1.6'
                          }}>
                            <p style={{ fontWeight: '600', color: '#333', marginBottom: '5px' }}>
                              {order.shippingAddress.name}
                            </p>
                            <p>{order.shippingAddress.address}</p>
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            <p style={{ marginTop: '8px' }}>
                              📧 {order.shippingAddress.email}
                            </p>
                            <p>📞 {order.shippingAddress.phone}</p>
                          </div>
                        </div>

                        {/* Price Breakdown */}
                        <div style={{
                          background: '#f8f9fa',
                          padding: '20px',
                          borderRadius: '10px'
                        }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333',
                            marginBottom: '15px'
                          }}>
                            Price Breakdown
                          </h4>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ color: '#666' }}>Subtotal</span>
                              <span style={{ fontWeight: '600' }}>
                                ₹{formatCurrency(order.subtotal)}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ color: '#666' }}>Tax (GST)</span>
                              <span style={{ fontWeight: '600' }}>
                                ₹{formatCurrency(order.tax)}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ color: '#666' }}>Shipping</span>
                              <span style={{ fontWeight: '600', color: order.shipping === 0 ? '#10b981' : '#333' }}>
                                {order.shipping === 0 ? 'FREE' : `₹${formatCurrency(order.shipping)}`}
                              </span>
                            </div>
                            {order.discount > 0 && (
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <span style={{ color: '#10b981', fontWeight: '600' }}>Discount</span>
                                <span style={{ fontWeight: '600', color: '#10b981' }}>
                                  -₹{formatCurrency(order.discount)}
                                </span>
                              </div>
                            )}
                            <div style={{
                              borderTop: '2px solid #dee2e6',
                              paddingTop: '10px',
                              marginTop: '5px',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#333'
                              }}>
                                Total
                              </span>
                              <span style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#667eea'
                              }}>
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%'
          }}>
            <button
              onClick={closeImagePreview}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px 15px',
                borderRadius: '5px',
                backdropFilter: 'blur(10px)'
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
                borderRadius: '10px'
              }}
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
        `}
      </style>
    </div>
  );
};

export default OrderHistory;
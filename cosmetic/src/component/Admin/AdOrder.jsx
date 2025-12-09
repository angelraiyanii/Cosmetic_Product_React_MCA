import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../App.css";

const AdOrder = () => {
const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000"
    : "https://gowcosmetic-backed.onrender.com";
    
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [formData, setFormData] = useState({ 
    status: "", 
    paymentStatus: "" 
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);

  // Helper function to format product image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it contains 'product_images', construct the full path
    if (imagePath.includes('product_images')) {
      return `${url}/public/images/${imagePath}`;
    }
    
    // Otherwise assume it's just a filename
    return `${url}/public/images/product_images/${imagePath}`;
  };

  // Fetch orders on mount
  useEffect(() => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (!userData) {
      window.location.href = "/Login";
      return;
    }
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${url}/api/orderModel`
        );
        const orders = response.data.orders || response.data;
        console.log("🔍 Full API Response:", response.data);
        console.log("📦 Orders Array:", orders);
        if (orders.length > 0) {
          console.log("👤 First Order User ID:", orders[0].userId);
          console.log("📋 First Order Complete:", orders[0]);
        }
        setOrders(orders);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const toggleOrderDetails = (orderId) => {
    setShowDetails(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle Edit
  const handleEdit = (order) => {
    setSelectedOrder(order);
    setShowEditForm(true);
    setFormData({ 
      status: order.status || "", 
      paymentStatus: order.paymentStatus || "" 
    });
    setErrors({});
  };

  const handleClose = () => {
    setShowEditForm(false);
    setSelectedOrder(null);
    setFormData({ status: "", paymentStatus: "" });
    setErrors({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const response = await axios.put(
        `${url}/api/orderModel/${selectedOrder._id}`,
        formData
      );
      
      setOrders(
        orders.map((order) =>
          order._id === selectedOrder._id ? response.data.order : order
        )
      );
      alert("Order updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating order:", error.response?.data || error.message);
      setErrors({
        form: error.response?.data?.message || "Failed to update order",
      });
    }
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "warning", icon: "fa-clock" },
      processing: { color: "info", icon: "fa-cogs" },
      shipped: { color: "primary", icon: "fa-shipping-fast" },
      delivered: { color: "success", icon: "fa-check-circle" },
      cancelled: { color: "danger", icon: "fa-times-circle" }
    };
    
    const config = statusConfig[status?.toLowerCase()] || { color: "secondary", icon: "fa-question" };
    
    return (
      <span className={`badge fs-6 px-3 py-2 bg-${config.color}`}>
        <i className={`fas ${config.icon} me-1`}></i>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Payment status badge styling
  const getPaymentBadge = (paymentStatus) => {
    const paymentConfig = {
      pending: { color: "warning", icon: "fa-clock" },
      paid: { color: "success", icon: "fa-check-circle" },
      failed: { color: "danger", icon: "fa-times-circle" },
      refunded: { color: "info", icon: "fa-undo" }
    };
    
    const config = paymentConfig[paymentStatus?.toLowerCase()] || { color: "secondary", icon: "fa-question" };
    
    return (
      <span className={`badge fs-6 px-3 py-2 bg-${config.color}`}>
        <i className={`fas ${config.icon} me-1`}></i>
        {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}
      </span>
    );
  };

  // Order Details Component (Inline)
  const OrderDetailsRow = ({ order }) => (
    <tr className="order-details-row">
      <td colSpan="7" className="p-0">
        <div className="bg-light border-top">
          <div className="container-fluid p-4">
            <div className="row g-4">
              {/* Order Summary */}
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-receipt me-2"></i>
                      Order Summary
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-hashtag text-primary me-2"></i>
                        <small className="text-muted">Order ID</small>
                      </div>
                      <div className="fw-bold text-primary font-monospace fs-5">
                        {order.orderId || order._id}
                      </div>
                    </div>

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-user text-success me-2"></i>
                        <small className="text-muted">Customer</small>
                      </div>
                      <div className="fw-bold fs-5">
                        {typeof order.userId === 'object' ? (order.userId?.fullname || order.userId?.name || "N/A") : "User Data Missing"}
                      </div>
                      {typeof order.userId === 'object' && order.userId?.email && (
                        <div className="text-muted">
                          <i className="fas fa-envelope me-1"></i>
                          {order.userId.email}
                        </div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-6 info-item mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-tag text-warning me-2"></i>
                          <small className="text-muted">Order Status</small>
                        </div>
                        <div>{getStatusBadge(order.status)}</div>
                      </div>

                      <div className="col-md-6 info-item mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-credit-card text-info me-2"></i>
                          <small className="text-muted">Payment Status</small>
                        </div>
                        <div>{getPaymentBadge(order.paymentStatus)}</div>
                      </div>
                    </div>

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-map-marker-alt text-danger me-2"></i>
                        <small className="text-muted">Shipping Address</small>
                      </div>
                      <div className="fw-bold">
                        {order.shippingAddress?.address || order.shippingAddress?.street || "N/A"}
                      </div>
                      <div className="text-muted">
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip || order.shippingAddress?.pincode}
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-calendar text-info me-2"></i>
                        <small className="text-muted">Order Date</small>
                      </div>
                      <div className="fw-bold">
                        {order.createdAt 
                          ? new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Date not available'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items & Payment */}
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-info text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-shopping-cart me-2"></i>
                      Order Items & Payment
                    </h6>
                  </div>
                  <div className="card-body">
                    {/* Order Items */}
                    <div className="mb-4">
                      <h6 className="fw-bold border-bottom pb-2">
                        <i className="fas fa-boxes me-2"></i>
                        Items ({order.products?.length || 0})
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.products?.map((item, idx) => (
                              <tr key={idx}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {item.image && (
                                      <img 
                                        src={getImageUrl(item.image)} 
                                        alt={item.name}
                                        className="rounded me-2"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    )}
                                    <div>
                                      <div className="fw-bold">{item.name}</div>
                                      <small className="text-muted">{item.productId}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="align-middle">{item.quantity}</td>
                                <td className="align-middle">₹{item.price}</td>
                                <td className="align-middle fw-bold">₹{item.quantity * item.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div>
                      <h6 className="fw-bold border-bottom pb-2">
                        <i className="fas fa-money-check-alt me-2"></i>
                        Payment Information
                      </h6>
                      <div className="row">
                        <div className="col-6">
                          <small className="text-muted">Subtotal</small>
                          <div className="fw-bold">₹{order.subtotal || 0}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Shipping</small>
                          <div className="fw-bold">₹{order.shippingCharge || 0}</div>
                        </div>
                      </div>
                      <div className="row mt-2">
                        <div className="col-6">
                          <small className="text-muted">Tax</small>
                          <div className="fw-bold">₹{order.tax || 0}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Discount</small>
                          <div className="fw-bold text-success">-₹{order.discount || 0}</div>
                        </div>
                      </div>
                      <div className="row mt-3 border-top pt-3">
                        <div className="col-12">
                          <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Total Amount</h5>
                            <h3 className="mb-0 text-primary">₹{order.totalAmount || 0}</h3>
                          </div>
                        </div>
                      </div>
                      
                      {order.razorpayPaymentId && (
                        <div className="mt-3">
                          <small className="text-muted">Payment ID</small>
                          <div className="font-monospace small">
                            {order.razorpayPaymentId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="row mt-4">
              <div className="col-12 text-end">
                <button 
                  className="btn btn-outline-secondary me-2"
                  onClick={() => toggleOrderDetails(order._id)}
                >
                  <i className="fas fa-times me-1"></i>
                  Hide Details
                </button>
                <button 
                  className="btn btn-outline-warning me-2"
                  onClick={() => handleEdit(order)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Order
                </button>
                <button 
                  className="btn btn-outline-info"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-1"></i>
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  // Filter orders based on search query
  const filteredOrders = orders.filter(order =>
    order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order._id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">
        <i className="fas fa-shopping-bag me-2 text-primary"></i>
        Manage Orders
      </h2>

      {/* Search & Stats */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="input-group" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-light">
            <i className="fas fa-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Order ID, Customer Name or Email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="d-flex gap-3">
          <div className="text-center">
            <div className="fs-3 fw-bold text-primary">{orders.length}</div>
            <small className="text-muted">Total Orders</small>
          </div>
          <div className="text-center">
            <div className="fs-3 fw-bold text-success">
              {orders.filter(o => o.paymentStatus === 'paid').length}
            </div>
            <small className="text-muted">Paid Orders</small>
          </div>
          <div className="text-center">
            <div className="fs-3 fw-bold text-warning">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <small className="text-muted">Pending</small>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover text-center align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th><i className="fas fa-hashtag me-1"></i>Order ID</th>
                <th><i className="fas fa-user me-1"></i>Customer</th>
                <th><i className="fas fa-calendar me-1"></i>Date</th>
                <th><i className="fas fa-indian-rupee-sign me-1"></i>Amount</th>
                <th><i className="fas fa-tag me-1"></i>Status</th>
                <th><i className="fas fa-credit-card me-1"></i>Payment</th>
                <th><i className="fas fa-cogs me-1"></i>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted py-5">
                    <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                    {searchQuery ? "No orders found matching your search." : "No orders found."}
                  </td>
                </tr>
              ) : (
                currentItems.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr className="border-bottom">
                      <td className="fw-bold font-monospace text-primary">
                        {order.orderId || order._id.slice(-8)}
                      </td>
                      <td>
                        <div className="text-start">
                          <div className="fw-bold">
                            {typeof order.userId === 'object' ? (order.userId?.fullname || order.userId?.name || "N/A") : "User Data Missing"}
                          </div>
                          <small className="text-muted">
                            {typeof order.userId === 'object' ? order.userId?.email : (order.userId || "N/A")}
                          </small>
                        </div>
                      </td>
                      <td>
                        {order.createdAt 
                          ? new Date(order.createdAt).toLocaleDateString('en-US')
                          : 'N/A'
                        }
                      </td>
                      <td className="fw-bold fs-5">
                        ₹{order.totalAmount || 0}
                      </td>
                      <td>
                        {getStatusBadge(order.status)}
                      </td>
                      <td>
                        {getPaymentBadge(order.paymentStatus)}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {/* View Details Icon */}
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => toggleOrderDetails(order._id)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {/* Edit Icon */}
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleEdit(order)}
                            title="Edit Order"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          {/* Print Icon */}
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => window.print()}
                            title="Print Invoice"
                          >
                            <i className="fas fa-print"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Order Details Row */}
                    {showDetails[order._id] && (
                      <OrderDetailsRow order={order} />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {filteredOrders.length > itemsPerPage && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
            </li>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <li
                  key={number}
                  className={`page-item ${
                    currentPage === number ? "active" : ""
                  }`}
                >
                  <button
                    onClick={() => paginate(number)}
                    className="page-link"
                  >
                    {number}
                  </button>
                </li>
              )
            )}

            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Summary Info */}
      <div className="mt-3 text-center text-muted">
        <i className="fas fa-info-circle me-1"></i>
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
        {searchQuery && ` (filtered from ${orders.length} total orders)`}
      </div>

      {/* Edit Order Form Modal */}
      {showEditForm && selectedOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ 
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'
              }}>
                <h4 className="modal-title text-white">
                  <i className="fas fa-edit me-2"></i>
                  Edit Order #{selectedOrder.orderId}
                </h4>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClose}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-tag text-primary me-1"></i>
                      Order Status
                    </label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-credit-card text-success me-1"></i>
                      Payment Status
                    </label>
                    <select
                      name="paymentStatus"
                      className="form-control"
                      value={formData.paymentStatus}
                      onChange={handleInputChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Changing order status may trigger notifications to the customer.
                  </div>
                  
                  {errors.form && (
                    <div className="alert alert-danger">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {errors.form}
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleClose}
                    >
                      <i className="fas fa-times me-1"></i>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-warning text-white">
                      <i className="fas fa-save me-1"></i>
                      Update Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdOrder;
import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const AdContact = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [reply, setReply] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    'in progress': 0,
    resolved: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Base URL for API calls - adjust according to your backend URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/ContactModel';

  // Fetch inquiries from MongoDB
  const fetchInquiries = async (page = 1, search = "", status = "all") => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}`, {
        params: {
          page,
          limit: itemsPerPage,
          search,
          status,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });

      if (response.data.success) {
        setInquiries(response.data.data);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      } else {
        setError(response.data.message || 'Failed to fetch inquiries');
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setError(
        err.response?.data?.message || 
        'Failed to connect to server. Please check if your backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInquiries(currentPage, searchQuery, statusFilter);
  }, [currentPage, statusFilter]);

  // Search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      fetchInquiries(1, searchQuery, statusFilter);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const toggleInquiryDetails = (inquiryId) => {
    setShowDetails(prev => ({
      ...prev,
      [inquiryId]: !prev[inquiryId]
    }));
  };

  const viewInquiryModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowModal(true);
    setReply(inquiry.reply || "");
  };

  const handleReplyChange = (e) => setReply(e.target.value);

  const sendReply = async () => {
    if (!reply.trim()) {
      alert("Please enter a reply before sending.");
      return;
    }

    try {
      setSendingReply(true);
      
      const response = await axios.put(`${API_BASE_URL}/${selectedInquiry._id}`, {
        reply: reply.trim(),
        status: 'Resolved'
      });

      if (response.data.success) {
        // Update the inquiry in the local state
        setInquiries(prev => 
          prev.map(inquiry => 
            inquiry._id === selectedInquiry._id 
              ? { ...inquiry, reply: reply.trim(), status: 'Resolved' }
              : inquiry
          )
        );

        // Update stats
        setStats(prev => ({
          ...prev,
          resolved: prev.resolved + 1,
          new: selectedInquiry.status === 'New' ? prev.new - 1 : prev.new,
          'in progress': selectedInquiry.status === 'In Progress' ? prev['in progress'] - 1 : prev['in progress']
        }));

        if (response.data.emailInfo?.emailSent) {
          alert(`✅ Reply sent successfully to ${selectedInquiry.email}!`);
        } else if (response.data.emailError) {
          alert(`⚠️ Reply saved but email delivery failed: ${response.data.emailError.error}`);
        }

        setShowModal(false);
        setReply("");
      } else {
        alert(`❌ Error: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert(`❌ Error sending reply: ${err.response?.data?.message || err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const deleteInquiry = async (id) => {
    if (window.confirm("Are you sure you want to delete this inquiry? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        
        if (response.data.success) {
          // Refresh the data after deletion
          await fetchInquiries(currentPage, searchQuery, statusFilter);
          alert("✅ Inquiry deleted successfully");
        } else {
          alert(`❌ Error: ${response.data.message}`);
        }
      } catch (err) {
        console.error("Error deleting inquiry:", err);
        alert(`❌ Error deleting inquiry: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, {
        status: newStatus
      });

      if (response.data.success) {
        // Refresh data
        await fetchInquiries(currentPage, searchQuery, statusFilter);
        alert(`✅ Status updated to "${newStatus}"`);
      } else {
        alert(`❌ Error: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert(`❌ Error updating status: ${err.response?.data?.message || err.message}`);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "New": return "bg-primary";
      case "In Progress": return "bg-warning text-dark";
      case "Resolved": return "bg-success";
      default: return "bg-secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "New": return "fas fa-star";
      case "In Progress": return "fas fa-clock";
      case "Resolved": return "fas fa-check-circle";
      default: return "fas fa-question-circle";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubject = (message) => {
    // Extract first 50 characters as subject
    return message.length > 50 ? message.substring(0, 50) + "..." : message;
  };

  // Inline Inquiry Details Component
  const InquiryDetailsRow = ({ inquiry }) => (
    <tr className="inquiry-details-row">
      <td colSpan="6" className="p-0">
        <div className="bg-light border-top">
          <div className="container-fluid p-4">
            <div className="row g-4">
              {/* Customer Information */}
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-info text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-user me-2"></i>
                      Customer Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-signature text-primary me-2"></i>
                        <small className="text-muted">Customer Name</small>
                      </div>
                      <div className="fw-bold fs-5 text-primary">{inquiry.name}</div>
                    </div>

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-envelope text-success me-2"></i>
                        <small className="text-muted">Email Address</small>
                      </div>
                      <div className="fw-bold">{inquiry.email}</div>
                    </div>

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-phone text-warning me-2"></i>
                        <small className="text-muted">Phone Number</small>
                      </div>
                      <div className="fw-bold">{inquiry.phone || 'Not provided'}</div>
                    </div>

                    <div className="info-item">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-eye text-info me-2"></i>
                        <small className="text-muted">Message Seen</small>
                      </div>
                      <div className="fw-bold">
                        {inquiry.seen ? (
                          <span className="text-success">
                            <i className="fas fa-check-circle me-1"></i>
                            Yes {inquiry.seenAt && `(${formatDate(inquiry.seenAt)})`}
                          </span>
                        ) : (
                          <span className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            Not yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Inquiry Details
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-calendar text-info me-2"></i>
                        <small className="text-muted">Date Submitted</small>
                      </div>
                      <div className="fw-bold">{formatDate(inquiry.createdAt)}</div>
                    </div>

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-toggle-on text-success me-2"></i>
                        <small className="text-muted">Current Status</small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge fs-6 px-3 py-2 ${getStatusBadgeClass(inquiry.status)}`}>
                          <i className={`${getStatusIcon(inquiry.status)} me-1`}></i>
                          {inquiry.status}
                        </span>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                  type="button" 
                                  data-bs-toggle="dropdown">
                            Change
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button className="dropdown-item" 
                                      onClick={() => updateStatus(inquiry._id, 'New')}>
                                <i className="fas fa-star me-2 text-primary"></i>New
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" 
                                      onClick={() => updateStatus(inquiry._id, 'In Progress')}>
                                <i className="fas fa-clock me-2 text-warning"></i>In Progress
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" 
                                      onClick={() => updateStatus(inquiry._id, 'Resolved')}>
                                <i className="fas fa-check-circle me-2 text-success"></i>Resolved
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-hashtag text-secondary me-2"></i>
                        <small className="text-muted">Inquiry ID</small>
                      </div>
                      <div className="fw-bold font-monospace text-muted small">{inquiry._id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Section */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-secondary text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-comment me-2"></i>
                      Customer Message
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="mb-0 lead">{inquiry.message}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Section (if exists) */}
            {inquiry.reply && (
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-success text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-reply me-2"></i>
                        Admin Reply
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-0 lead">{inquiry.reply}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={() => viewInquiryModal(inquiry)}
                  >
                    <i className="fas fa-reply me-2"></i>
                    {inquiry.reply ? 'View/Edit Reply' : 'Send Reply'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteInquiry(inquiry._id)}
                  >
                    <i className="fas fa-trash me-2"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  // Pagination Component
  const Pagination = () => (
    <nav aria-label="Contact inquiries pagination">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => setCurrentPage(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
        </li>
        
        {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, index) => {
          let pageNumber;
          if (pagination.totalPages <= 5) {
            pageNumber = index + 1;
          } else {
            const start = Math.max(1, currentPage - 2);
            pageNumber = start + index;
          }
          
          if (pageNumber <= pagination.totalPages) {
            return (
              <li
                key={pageNumber}
                className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              </li>
            );
          }
          return null;
        })}
        
        <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => setCurrentPage(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );

  if (loading && inquiries.length === 0) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading contact inquiries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <br />
          <button 
            className="btn btn-outline-danger mt-2" 
            onClick={() => fetchInquiries(currentPage, searchQuery, statusFilter)}
          >
            <i className="fas fa-redo me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h3 mb-0">
              <i className="fas fa-envelope-open-text me-2 text-primary"></i>
              Contact Inquiries Management
            </h1>
            <button
              className="btn btn-outline-primary"
              onClick={() => fetchInquiries(currentPage, searchQuery, statusFilter)}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">{stats.total || 0}</h4>
                  <p className="mb-0">Total Inquiries</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-envelope fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">{stats.new || 0}</h4>
                  <p className="mb-0">New</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-star fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">{stats['in progress'] || 0}</h4>
                  <p className="mb-0">In Progress</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-clock fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h4 className="mb-0">{stats.resolved || 0}</h4>
                  <p className="mb-0">Resolved</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-check-circle fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or message content..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      <div className="row mb-3">
        <div className="col-12">
          <p className="text-muted mb-0">
            Showing {inquiries.length} of {pagination.totalItems || 0} inquiries
            {searchQuery && ` matching "${searchQuery}"`}
            {statusFilter !== 'all' && ` with status "${statusFilter}"`}
          </p>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Customer</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Seen</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.length > 0 ? (
                      inquiries.map((inquiry) => (
                        <React.Fragment key={inquiry._id}>
                          <tr className="align-middle">
                            <td>
                              <div>
                                <div className="fw-bold">{inquiry.name}</div>
                                <small className="text-muted">{inquiry.email}</small>
                              </div>
                            </td>
                            <td>
                              <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                                {getSubject(inquiry.message)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(inquiry.status)}`}>
                                <i className={`${getStatusIcon(inquiry.status)} me-1`}></i>
                                {inquiry.status}
                              </span>
                            </td>
                            <td>
                              <small>{formatDate(inquiry.createdAt)}</small>
                            </td>
                            <td>
                              {inquiry.seen ? (
                                <i className="fas fa-check-circle text-success" title="Message seen"></i>
                              ) : (
                                <i className="fas fa-clock text-muted" title="Not seen yet"></i>
                              )}
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => toggleInquiryDetails(inquiry._id)}
                                  title="View Details"
                                >
                                  <i className={`fas ${showDetails[inquiry._id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => viewInquiryModal(inquiry)}
                                  title="Reply"
                                >
                                  <i className="fas fa-reply"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteInquiry(inquiry._id)}
                                  title="Delete"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {showDetails[inquiry._id] && <InquiryDetailsRow inquiry={inquiry} />}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="text-muted">
                            <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                            <h5>No inquiries found</h5>
                            <p>
                              {searchQuery || statusFilter !== 'all' 
                                ? 'Try adjusting your search or filter criteria.' 
                                : 'No contact inquiries have been submitted yet.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="row mt-4">
          <div className="col-12">
            <Pagination />
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showModal && selectedInquiry && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-reply me-2"></i>
                  Reply to {selectedInquiry.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Customer Info */}
                <div className="alert alert-info">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Customer:</strong> {selectedInquiry.name}<br />
                      <strong>Email:</strong> {selectedInquiry.email}
                    </div>
                    <div className="col-md-6">
                      <strong>Phone:</strong> {selectedInquiry.phone || 'Not provided'}<br />
                      <strong>Status:</strong> 
                      <span className={`badge ms-1 ${getStatusBadgeClass(selectedInquiry.status)}`}>
                        {selectedInquiry.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Original Message:</label>
                  <div className="p-3 bg-light rounded">
                    {selectedInquiry.message}
                  </div>
                </div>

                {/* Reply Text Area */}
                <div className="mb-3">
                  <label htmlFor="replyText" className="form-label fw-bold">
                    Your Reply:
                  </label>
                  <textarea
                    id="replyText"
                    className="form-control"
                    rows="6"
                    placeholder="Type your reply here..."
                    value={reply}
                    onChange={handleReplyChange}
                  ></textarea>
                </div>

                <div className="alert alert-warning">
                  <i className="fas fa-info-circle me-2"></i>
                  This reply will be sent to <strong>{selectedInquiry.email}</strong> and the inquiry status will be marked as "Resolved".
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={sendReply}
                  disabled={sendingReply || !reply.trim()}
                >
                  {sendingReply ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending Reply...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        .inquiry-details-row {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .card-header {
          font-weight: 600;
        }

        .info-item {
          transition: all 0.2s ease;
        }

        .info-item:hover {
          transform: translateY(-1px);
        }

        .table-hover tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05);
        }

        .btn-group .btn {
          border-radius: 0.25rem !important;
          margin-right: 2px;
        }

        .modal.show {
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pagination .page-link {
          border-radius: 0.25rem;
          margin: 0 2px;
          border: 1px solid #dee2e6;
        }

        .pagination .page-item.active .page-link {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .badge {
          font-size: 0.75em;
          font-weight: 500;
        }

        .alert {
          border: none;
          border-radius: 0.5rem;
        }

        .card {
          border: none;
          border-radius: 0.5rem;
          box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
          transition: box-shadow 0.15s ease-in-out;
        }

        .card:hover {
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
        }

        .btn {
          border-radius: 0.375rem;
          font-weight: 500;
        }

        .form-control, .form-select {
          border-radius: 0.375rem;
          border: 1px solid #ced4da;
        }

        .form-control:focus, .form-select:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }

        .input-group-text {
          background-color: #f8f9fa;
          border-color: #ced4da;
        }

        .table th {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.875rem;
          letter-spacing: 0.5px;
        }

        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }

        .opacity-75 {
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
};

export default AdContact;
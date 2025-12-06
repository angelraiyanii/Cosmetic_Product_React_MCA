import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export class AdReviews extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reviews: [],
      showReviewView: false,
      selectedReview: null,
      selectedProduct: null,
      selectedUser: null,
      error: null,
      successMessage: null,
      searchQuery: "",
      currentPage: 1,
      itemsPerPage: 10,
      filterStatus: "all", // "all", "pending", "approved", "rejected"
    };
  }

  componentDidMount() {
    this.fetchReviews();
  }

  fetchReviews = () => {
    axios
      .get("http://localhost:5000/api/ReviewModel/all-reviews")
      .then((res) => {
        if (Array.isArray(res.data.reviews)) {
          this.setState({ reviews: res.data.reviews });
        } else if (Array.isArray(res.data)) {
          this.setState({ reviews: res.data });
        } else if (res.data.Review) {
          // Handle if response has Review key
          this.setState({ reviews: Array.isArray(res.data.Review) ? res.data.Review : [] });
        } else {
          // Try to see what structure we have
          console.log("Response structure:", res.data);
          this.setState({ reviews: [] });
        }
      })
      .catch((error) => {
        this.setState({
          error: error.response?.data?.error || "Failed to fetch reviews",
        });
        console.error("Fetch error:", error);
      });
  };

  handlePageChange = (pageNumber) => {
    this.setState({
      currentPage: pageNumber,
    });
  };

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value, currentPage: 1 });
  };

  handleFilterChange = (e) => {
    this.setState({ filterStatus: e.target.value, currentPage: 1 });
  };

  showReviewView = async (review) => {
    try {
      // Fetch product details (if available)
      if (review.productId) {
        try {
          const productRes = await axios.get(
            `http://localhost:5000/api/products/${review.productId}`
          );
          this.setState({
            selectedProduct: productRes.data.product || productRes.data,
          });
        } catch (productError) {
          console.log("Product fetch failed, continuing without product data");
        }
      }
      
      // Fetch user details (if available)
      if (review.userId) {
        try {
          const userRes = await axios.get(
            `http://localhost:5000/api/UserModel/${review.userId}`
          );
          this.setState({
            selectedUser: userRes.data.Login || userRes.data,
          });
        } catch (userError) {
          console.log("User fetch failed, continuing without user data");
        }
      }

      this.setState({
        selectedReview: review,
        showReviewView: true,
      });
    } catch (error) {
      console.error("Error in showReviewView:", error);
      // Still show review even if product/user fetch fails
      this.setState({
        selectedReview: review,
        selectedProduct: null,
        selectedUser: null,
        showReviewView: true,
      });
    }
  };

  hideReviewView = () => {
    this.setState({
      showReviewView: false,
      selectedReview: null,
      selectedProduct: null,
      selectedUser: null,
    });
  };

  handleStatusChange = async (reviewId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/ReviewModel/${reviewId}/status`,
        { status: newStatus }
      );

      this.setState((prevState) => ({
        reviews: prevState.reviews.map((review) =>
          review._id === reviewId
            ? { ...review, status: newStatus }
            : review
        ),
        successMessage: `✅ Review ${newStatus} successfully.`,
        error: null,
      }));

      setTimeout(() => this.setState({ successMessage: null }), 5000);
    } catch (error) {
      this.setState({
        error: error.response?.data?.error || "Failed to update review status",
        successMessage: null,
      });
    }
  };

  handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      axios
        .delete(`http://localhost:5000/api/ReviewModel/${id}`)
        .then(() => {
          this.setState((prevState) => ({
            reviews: prevState.reviews.filter((review) => review._id !== id),
            successMessage: "✅ Review deleted successfully.",
            error: null,
          }));
          setTimeout(() => this.setState({ successMessage: null }), 5000);
        })
        .catch((error) => {
          this.setState({
            error: error.response?.data?.error || "Error deleting review",
            successMessage: null,
          });
        });
    }
  };

  getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "bg-warning", text: "Pending" },
      approved: { class: "bg-success", text: "Approved" },
      rejected: { class: "bg-danger", text: "Rejected" },
    };

    const config = statusConfig[status] || { class: "bg-secondary", text: status };
    return (
      <span className={`badge ${config.class} text-white`}>
        {config.text}
      </span>
    );
  };

  getStarRating = (rating) => {
    return (
      <div className="text-warning">
        {[...Array(5)].map((_, index) => (
          <i
            key={index}
            className={`fas fa-star${index < rating ? "" : "-o"}`}
          ></i>
        ))}
        <span className="ms-2 fw-bold">{rating}.0</span>
      </div>
    );
  };

  // Beautiful Review Details Modal
  renderReviewDetails = () => {
    const { selectedReview, selectedProduct, selectedUser } = this.state;
    if (!selectedReview) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            {/* Header */}
            <div className="modal-header border-0" style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem 0.5rem 0 0'
            }}>
              <div className="d-flex align-items-center w-100">
                <div className="flex-grow-1 text-white">
                  <h4 className="mb-1 fw-bold">{selectedReview.title}</h4>
                  <div className="d-flex align-items-center">
                    {this.getStarRating(selectedReview.rating)}
                    <span className="ms-3 text-white opacity-75">
                      <i className="fas fa-calendar me-1"></i>
                      {new Date(selectedReview.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={this.hideReviewView}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4" style={{ backgroundColor: '#f8f9ff' }}>
              <div className="row g-4 mb-4">
                {/* User Information */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-primary text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-user me-2"></i>
                        User Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="info-item mb-3">
                        <small className="text-muted">Name</small>
                        <div className="fw-bold">{selectedReview.userName}</div>
                      </div>
                      <div className="info-item mb-3">
                        <small className="text-muted">Email</small>
                        <div className="fw-bold">{selectedReview.userEmail}</div>
                      </div>
                      {selectedUser && selectedUser.profilePic && (
                        <div className="text-center mt-3">
                          <img
                            src={`http://localhost:5000/public/images/profile_pictures/${selectedUser.profilePic}`}
                            alt="User Profile"
                            className="rounded-circle"
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-info text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-box me-2"></i>
                        Product Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="info-item mb-3">
                        <small className="text-muted">Product ID</small>
                        <div className="fw-bold text-truncate">{selectedReview.productId}</div>
                      </div>
                      {selectedProduct && (
                        <div className="info-item">
                          <small className="text-muted">Product Name</small>
                          <div className="fw-bold">{selectedProduct.name || "Unknown"}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-comment me-2"></i>
                    Review Content
                  </h6>
                </div>
                <div className="card-body">
                  <p className="mb-0">{selectedReview.comment}</p>
                </div>
              </div>

              {/* Review Images */}
              {selectedReview.images && selectedReview.images.length > 0 && (
                <div className="mt-4">
                  <h6 className="mb-3">
                    <i className="fas fa-images me-2"></i>
                    Review Images ({selectedReview.images.length})
                  </h6>
                  <div className="row g-2">
                    {selectedReview.images.map((image, index) => (
                      <div key={index} className="col-md-3 col-6">
                        <img
                          src={image}
                          alt={`Review ${index + 1}`}
                          className="img-thumbnail w-100"
                          style={{ height: '100px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/100x100?text=Image+Not+Found";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Stats */}
              <div className="row mt-4">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      <i className="fas fa-thumbs-up me-1"></i>
                      Helpful votes:
                    </span>
                    <span className="fw-bold">{selectedReview.helpful || 0}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      <i className="fas fa-shopping-cart me-1"></i>
                      Verified Purchase:
                    </span>
                    <span className={`badge ${selectedReview.isVerifiedPurchase ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedReview.isVerifiedPurchase ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 bg-light">
              <div className="btn-group">
                <button
                  className={`btn ${selectedReview.status === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => this.handleStatusChange(selectedReview._id, 'pending')}
                  disabled={selectedReview.status === 'pending'}
                >
                  <i className="fas fa-clock me-1"></i>
                  Set Pending
                </button>
                <button
                  className={`btn ${selectedReview.status === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => this.handleStatusChange(selectedReview._id, 'approved')}
                  disabled={selectedReview.status === 'approved'}
                >
                  <i className="fas fa-check me-1"></i>
                  Approve
                </button>
                <button
                  className={`btn ${selectedReview.status === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => this.handleStatusChange(selectedReview._id, 'rejected')}
                  disabled={selectedReview.status === 'rejected'}
                >
                  <i className="fas fa-times me-1"></i>
                  Reject
                </button>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={this.hideReviewView}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      reviews,
      showReviewView,
      error,
      successMessage,
      searchQuery,
      filterStatus,
      currentPage,
      itemsPerPage,
    } = this.state;

    // Filter reviews based on search query and status
    const filteredReviews = reviews.filter((review) => {
      const matchesSearch =
        (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (review.comment && review.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (review.userName && review.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (review.userEmail && review.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" || review.status === filterStatus;

      return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

    return (
      <center>
        <div className="container mt-4">
          <h2 className="text-center mb-4">Manage Reviews</h2>
          
          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3 col-6 mb-3">
              <div className="card text-white bg-primary">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-star me-2"></i>
                    Total Reviews
                  </h5>
                  <h3 className="mb-0">{reviews.length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="card text-white bg-success">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-check me-2"></i>
                    Approved
                  </h5>
                  <h3 className="mb-0">
                    {reviews.filter(r => r.status === 'approved').length}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="card text-white bg-warning">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-clock me-2"></i>
                    Pending
                  </h5>
                  <h3 className="mb-0">
                    {reviews.filter(r => r.status === 'pending').length}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="card text-white bg-danger">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="fas fa-times me-2"></i>
                    Rejected
                  </h5>
                  <h3 className="mb-0">
                    {reviews.filter(r => r.status === 'rejected').length}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="d-flex justify-content-between mb-3 flex-wrap">
            <div className="d-flex mb-2">
              <input
                type="text"
                className="form-control me-2"
                placeholder="🔍 Search reviews..."
                value={searchQuery}
                onChange={this.handleSearchChange}
                style={{ minWidth: '250px' }}
              />
              <select
                className="form-select"
                value={filterStatus}
                onChange={this.handleFilterChange}
                style={{ width: 'auto' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button 
              className="btn btn-outline-primary mb-2"
              onClick={this.fetchReviews}
              title="Refresh reviews"
            >
              <i className="fas fa-sync-alt me-2"></i>
              Refresh
            </button>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show">
              {successMessage}
              <button type="button" className="btn-close" onClick={() => this.setState({ successMessage: null })}></button>
            </div>
          )}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button type="button" className="btn-close" onClick={() => this.setState({ error: null })}></button>
            </div>
          )}

          {/* Review Details Modal */}
          {showReviewView && this.renderReviewDetails()}

          {/* Reviews Table */}
          <div className="table-responsive mt-3">
            <table className="table table-hover table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Review Details</th>
                  <th>Rating</th>
                  <th>User</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentReviews.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <i className="fas fa-comment-slash fa-2x text-muted mb-3"></i>
                      <p className="text-muted">No reviews found.</p>
                      <button 
                        className="btn btn-primary"
                        onClick={this.fetchReviews}
                      >
                        <i className="fas fa-sync-alt me-2"></i>
                        Refresh
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentReviews.map((review, index) => (
                    <tr key={review._id}>
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>
                        <div>
                          <strong className="d-block">{review.title}</strong>
                          <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>
                            {review.comment}
                          </small>
                          {review.images && review.images.length > 0 && (
                            <small className="text-info">
                              <i className="fas fa-image me-1"></i>
                              {review.images.length} image(s)
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{this.getStarRating(review.rating)}</td>
                      <td>
                        <div>
                          <div className="fw-bold">{review.userName}</div>
                          <small className="text-muted">{review.userEmail}</small>
                        </div>
                      </td>
                      <td>{this.getStatusBadge(review.status)}</td>
                      <td>
                        <small className="text-muted">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-info"
                            onClick={() => this.showReviewView(review)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => this.handleStatusChange(review._id, 'approved')}
                            title="Approve"
                            disabled={review.status === 'approved'}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => this.handleDelete(review._id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredReviews.length > 0 && (
            <div className="row mt-3">
              <div className="col-md-12 d-flex justify-content-between align-items-center">
                <div className="text-muted">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReviews.length)} of {filteredReviews.length} reviews
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li
                      className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => this.handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        &laquo; Prev
                      </button>
                    </li>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <li
                        key={number}
                        className={`page-item ${currentPage === number ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => this.handlePageChange(number)}
                        >
                          {number}
                        </button>
                      </li>
                    ))}

                    <li
                      className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => this.handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </center>
    );
  }
}

export default AdReviews;
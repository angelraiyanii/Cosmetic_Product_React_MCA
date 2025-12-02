import React, { Component } from 'react';
import axios from 'axios';
import { FaStar, FaRegStar, FaThumbsUp, FaEdit, FaTrash, FaCheckCircle } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

class Rating_Review extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reviews: [],
      statistics: {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      },
      // Review form
      rating: 0,
      hoverRating: 0,
      title: '',
      comment: '',
      isSubmitting: false,
      // User status
      currentUser: null,
      hasReviewed: false,
      hasPurchased: false,
      userReview: null,
      // UI states
      showReviewForm: false,
      isEditing: false,
      error: '',
      success: ''
    };
  }

  componentDidMount() {
    this.loadUserData();
    this.fetchReviews();
  }

  loadUserData = () => {
    const userData = localStorage.getItem('user') || localStorage.getItem('admin');
    if (userData) {
      const user = JSON.parse(userData);
      this.setState({ currentUser: user }, () => {
        this.checkUserReviewStatus();
      });
    }
  };

  fetchReviews = async () => {
    const { productId } = this.props;
    try {
      const response = await axios.get(
        `http://localhost:5000/api/ReviewModel/product/${productId}`
      );
      this.setState({
        reviews: response.data.reviews,
        statistics: response.data.statistics
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  checkUserReviewStatus = async () => {
    const { currentUser } = this.state;
    const { productId } = this.props;

    if (!currentUser) return;

    try {
      // Check if user has reviewed
      const reviewResponse = await axios.get(
        `http://localhost:5000/api/ReviewModel/check-review/${currentUser.id}/${productId}`
      );
      
      this.setState({
        hasReviewed: reviewResponse.data.hasReviewed,
        userReview: reviewResponse.data.review
      });

      // Check if user has purchased (optional)
      try {
        const purchaseResponse = await axios.get(
          `http://localhost:5000/api/ReviewModel/check-purchase/${currentUser.id}/${productId}`
        );
        this.setState({ hasPurchased: purchaseResponse.data.hasPurchased });
      } catch (error) {
        // If purchase check fails, still allow review
        this.setState({ hasPurchased: true });
      }
    } catch (error) {
      console.error('Error checking user review status:', error);
    }
  };

  handleRatingClick = (rating) => {
    this.setState({ rating });
  };

  handleRatingHover = (rating) => {
    this.setState({ hoverRating: rating });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  validateForm = () => {
    const { rating, title, comment } = this.state;
    
    if (rating === 0) {
      this.setState({ error: 'Please select a rating' });
      return false;
    }
    if (title.trim().length < 5) {
      this.setState({ error: 'Title must be at least 5 characters' });
      return false;
    }
    if (comment.trim().length < 20) {
      this.setState({ error: 'Review must be at least 20 characters' });
      return false;
    }
    
    return true;
  };

  handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!this.validateForm()) return;

    const { currentUser, rating, title, comment, isEditing, userReview } = this.state;
    const { productId } = this.props;

    this.setState({ isSubmitting: true, error: '', success: '' });

    try {
      if (isEditing && userReview) {
        // Update existing review
        await axios.put(
          `http://localhost:5000/api/ReviewModel/update/${userReview._id}`,
          {
            userId: currentUser.id,
            rating,
            title,
            comment
          }
        );
        this.setState({ success: 'Review updated successfully!' });
      } else {
        // Add new review
        await axios.post('http://localhost:5000/api/ReviewModel/add', {
          userId: currentUser.id,
          productId,
          rating,
          title,
          comment,
          // User model uses 'fullname' in backend; fall back to other fields
          userName: currentUser.fullname || currentUser.name || currentUser.username || currentUser.email,
          userEmail: currentUser.email || currentUser.userEmail || ''
        });
        this.setState({ success: 'Review submitted successfully!' });
      }

      // Reset form and refresh reviews
      setTimeout(() => {
        this.setState({
          rating: 0,
          hoverRating: 0,
          title: '',
          comment: '',
          showReviewForm: false,
          isEditing: false,
          success: ''
        });
        this.fetchReviews();
        this.checkUserReviewStatus();
      }, 2000);

    } catch (error) {
      console.error('Error submitting review:', error.response?.data || error.message || error);
      this.setState({ 
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to submit review' 
      });
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  handleEditReview = () => {
    const { userReview } = this.state;
    this.setState({
      rating: userReview.rating,
      title: userReview.title,
      comment: userReview.comment,
      showReviewForm: true,
      isEditing: true
    });
  };

  handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;

    const { currentUser, userReview } = this.state;

    try {
      await axios.delete(
        `http://localhost:5000/api/ReviewModel/delete/${userReview._id}/${currentUser.id}`
      );
      this.setState({ success: 'Review deleted successfully!' });
      setTimeout(() => {
        this.setState({ success: '' });
        this.fetchReviews();
        this.checkUserReviewStatus();
      }, 2000);
    } catch (error) {
      console.error('Error deleting review:', error);
      this.setState({ error: 'Failed to delete review' });
    }
  };

  handleMarkHelpful = async (reviewId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/ReviewModel/helpful/${reviewId}`
      );
      this.fetchReviews();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  renderStars = (rating, interactive = false, size = 'md') => {
    const { hoverRating } = this.state;
    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
    const sizeClass = size === 'lg' ? 'fs-3' : size === 'sm' ? 'fs-6' : 'fs-5';

    return (
      <div className={`d-flex ${interactive ? 'cursor-pointer' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => interactive && this.handleRatingClick(star)}
            onMouseEnter={() => interactive && this.handleRatingHover(star)}
            onMouseLeave={() => interactive && this.handleRatingHover(0)}
            className={`${sizeClass} ${interactive ? 'rating-star' : ''}`}
          >
            {star <= displayRating ? (
              <FaStar className="text-warning" />
            ) : (
              <FaRegStar className="text-muted" />
            )}
          </span>
        ))}
      </div>
    );
  };

  renderRatingDistribution = () => {
    const { statistics } = this.state;
    const { ratingDistribution, totalReviews } = statistics;

    return (
      <div className="rating-distribution mb-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="d-flex align-items-center mb-2">
              <span className="me-2 fw-bold" style={{ minWidth: '60px' }}>
                {star} <FaStar className="text-warning" style={{ fontSize: '12px' }} />
              </span>
              <div className="progress flex-grow-1" style={{ height: '20px' }}>
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: `${percentage}%` }}
                  aria-valuenow={percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
              <span className="ms-2 text-muted" style={{ minWidth: '40px', textAlign: 'right' }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  renderReviewForm = () => {
    const { 
      rating, 
      title, 
      comment, 
      isSubmitting, 
      error, 
      success,
      isEditing 
    } = this.state;

    return (
      <div className="review-form-container bg-light p-4 rounded-3 mb-4">
        <h5 className="mb-3">{isEditing ? 'Edit Your Review' : 'Write a Review'}</h5>
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => this.setState({ error: '' })}
            />
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show">
            {success}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => this.setState({ success: '' })}
            />
          </div>
        )}

        <form onSubmit={this.handleSubmitReview}>
          <div className="mb-3">
            <label className="form-label fw-bold">Your Rating *</label>
            {this.renderStars(rating, true, 'lg')}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Review Title *</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={title}
              onChange={this.handleInputChange}
              placeholder="Summarize your experience"
              maxLength="100"
              required
            />
            <small className="text-muted">{title.length}/100 characters</small>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Your Review *</label>
            <textarea
              className="form-control"
              name="comment"
              value={comment}
              onChange={this.handleInputChange}
              rows="5"
              placeholder="Share your experience with this product..."
              maxLength="1000"
              required
            />
            <small className="text-muted">{comment.length}/1000 characters</small>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-dark px-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Submitting...
                </>
              ) : (
                isEditing ? 'Update Review' : 'Submit Review'
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => this.setState({ 
                showReviewForm: false, 
                isEditing: false,
                rating: 0,
                title: '',
                comment: '',
                error: ''
              })}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  render() {
    const { 
      reviews, 
      statistics, 
      currentUser, 
      hasReviewed, 
      hasPurchased,
      userReview,
      showReviewForm 
    } = this.state;

    return (
      <div className="rating-review-section">
        <div className="container py-5">
          {/* Rating Summary */}
          <div className="row mb-5">
            <div className="col-md-4">
              <div className="text-center p-4 bg-light rounded-3">
                <h1 className="display-3 fw-bold mb-0">{statistics.averageRating}</h1>
                {this.renderStars(parseFloat(statistics.averageRating), false, 'lg')}
                <p className="text-muted mt-2 mb-0">
                  Based on {statistics.totalReviews} review{statistics.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="col-md-8">
              <div className="p-4 bg-light rounded-3">
                <h5 className="mb-3">Rating Distribution</h5>
                {this.renderRatingDistribution()}
              </div>
            </div>
          </div>

          {/* User Review Section */}
          {currentUser && (
            <div className="mb-5">
              {hasReviewed && userReview && !showReviewForm ? (
                <div className="user-review-card bg-light border-start border-4 border-success p-4 rounded-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-2">Your Review</h5>
                      {this.renderStars(userReview.rating, false, 'md')}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={this.handleEditReview}
                      >
                        <FaEdit className="me-1" /> Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={this.handleDeleteReview}
                      >
                        <FaTrash className="me-1" /> Delete
                      </button>
                    </div>
                  </div>
                  <h6 className="fw-bold">{userReview.title}</h6>
                  <p className="mb-0">{userReview.comment}</p>
                  {userReview.isVerifiedPurchase && (
                    <div className="mt-2">
                      <span className="badge bg-success">
                        <FaCheckCircle className="me-1" />
                        Verified Purchase
                      </span>
                    </div>
                  )}
                </div>
              ) : !hasReviewed && !showReviewForm ? (
                <div className="text-center p-4 bg-light rounded-3">
                  <p className="mb-3">
                    {hasPurchased 
                      ? "You haven't reviewed this product yet. Share your experience!"
                      : "Purchase this product to leave a review"}
                  </p>
                  {hasPurchased && (
                    <button
                      className="btn btn-dark px-4"
                      onClick={() => this.setState({ showReviewForm: true })}
                    >
                      Write a Review
                    </button>
                  )}
                </div>
              ) : showReviewForm ? (
                this.renderReviewForm()
              ) : null}
            </div>
          )}

          {!currentUser && (
            <div className="text-center p-4 bg-light rounded-3 mb-5">
              <p className="mb-3">Please log in to write a review</p>
              <a href="/login" className="btn btn-dark px-4">
                Log In
              </a>
            </div>
          )}

          {/* Reviews List */}
          <div className="reviews-list">
            <h4 className="mb-4">Customer Reviews ({statistics.totalReviews})</h4>
            
            {reviews.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-card mb-4 p-4 bg-light rounded-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <strong className="me-2">{review.userName}</strong>
                        {review.isVerifiedPurchase && (
                          <span className="badge bg-success badge-sm">
                            <FaCheckCircle style={{ fontSize: '10px' }} className="me-1" />
                            Verified
                          </span>
                        )}
                      </div>
                      {this.renderStars(review.rating, false, 'sm')}
                    </div>
                    <small className="text-muted">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </small>
                  </div>
                  
                  <h6 className="fw-bold mb-2">{review.title}</h6>
                  <p className="mb-3">{review.comment}</p>
                  
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => this.handleMarkHelpful(review._id)}
                  >
                    <FaThumbsUp className="me-1" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Styles */}
        <style>{`
          .rating-star {
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          
          .rating-star:hover {
            transform: scale(1.1);
          }
          
          .review-card {
            transition: box-shadow 0.3s ease;
          }
          
          .review-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .badge-sm {
            font-size: 10px;
            padding: 4px 8px;
          }
          
          .progress {
            background-color: #e9ecef;
          }
          
          .form-control:focus {
            border-color: #6c757d;
            box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.25);
          }
        `}</style>
      </div>
    );
  }
}

export default Rating_Review;
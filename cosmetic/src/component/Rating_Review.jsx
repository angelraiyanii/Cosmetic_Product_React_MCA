import React, { Component } from 'react';
import axios from 'axios';
import { FaStar, FaRegStar, FaThumbsUp, FaEdit, FaTrash, FaCheckCircle, FaImage, FaTimes } from 'react-icons/fa';
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
      selectedImages: [],
      imagePreviews: [],
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
      success: '',
      // Image modal
      showImageModal: false,
      modalImages: [],
      currentImageIndex: 0
    };
    this.fileInputRef = React.createRef();
  }

  componentDidMount() {
    this.loadUserData();
    this.fetchReviews();
  }

  loadUserData = () => {
    const userData = localStorage.getItem('user');
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
      const reviewResponse = await axios.get(
        `http://localhost:5000/api/ReviewModel/check-review/${currentUser.id}/${productId}`
      );

      this.setState({
        hasReviewed: reviewResponse.data.hasReviewed,
        userReview: reviewResponse.data.review
      });

      try {
        const purchaseResponse = await axios.get(
          `http://localhost:5000/api/ReviewModel/check-purchase/${currentUser.id}/${productId}`
        );
        this.setState({ hasPurchased: purchaseResponse.data.hasPurchased });
      } catch (error) {
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

  handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const { selectedImages, imagePreviews } = this.state;

    // Limit to 5 images total
    const remainingSlots = 5 - selectedImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      this.setState({
        error: `You can only upload up to 5 images. ${files.length - remainingSlots} file(s) ignored.`
      });
      setTimeout(() => this.setState({ error: '' }), 3000);
    }

    // Validate file sizes (5MB each)
    const validFiles = filesToAdd.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        this.setState({
          error: `${file.name} is too large. Maximum size is 5MB.`
        });
        setTimeout(() => this.setState({ error: '' }), 3000);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    this.setState({
      selectedImages: [...selectedImages, ...validFiles],
      imagePreviews: [...imagePreviews, ...newPreviews]
    });
  };

  handleRemoveImage = (index) => {
    const { selectedImages, imagePreviews } = this.state;

    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    this.setState({
      selectedImages: selectedImages.filter((_, i) => i !== index),
      imagePreviews: imagePreviews.filter((_, i) => i !== index)
    });

    // Reset file input
    if (this.fileInputRef.current) {
      this.fileInputRef.current.value = '';
    }
  };

  validateForm = () => {
    const { rating, title, comment } = this.state;

    if (rating === 0) {
      this.setState({ error: 'Please select a rating' });
      return false;
    }
    if (title.trim().length < 2) {
      this.setState({ error: 'Title must be at least 2 characters' });
      return false;
    }
    if (comment.trim().length < 2) {
      this.setState({ error: 'Review must be at least 2 characters' });
      return false;
    }

    return true;
  };

  handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!this.validateForm()) return;

    const { currentUser, rating, title, comment, selectedImages, isEditing, userReview, imagePreviews } = this.state;
    const { productId } = this.props;

    this.setState({ isSubmitting: true, error: '', success: '' });

    try {
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('productId', productId);
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('comment', comment);
      formData.append('userName', currentUser.fullname || currentUser.name || currentUser.username || currentUser.email);
      formData.append('userEmail', currentUser.email || '');

      // Append images (optional)
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      if (isEditing && userReview) {
        // If editing, you might want to keep some existing images
        formData.append('imagesToKeep', JSON.stringify(userReview.images || []));
        await axios.put(
          `http://localhost:5000/api/ReviewModel/update/${userReview._id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        this.setState({ success: 'Review updated successfully!' });
      } else {
        await axios.post('http://localhost:5000/api/ReviewModel/add', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.setState({ success: 'Review submitted successfully!' });
      }

      // Clean up previews
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));

      setTimeout(() => {
        this.setState({
          rating: 0,
          hoverRating: 0,
          title: '',
          comment: '',
          selectedImages: [],
          imagePreviews: [],
          showReviewForm: false,
          isEditing: false,
          success: ''
        });
        if (this.fileInputRef.current) {
          this.fileInputRef.current.value = '';
        }
        this.fetchReviews();
        this.checkUserReviewStatus();
      }, 2000);

    } catch (error) {
      console.error('Error submitting review:', error.response?.data || error.message || error);
      this.setState({
        error: error.response?.data?.error || error.response?.data?.message || 'Failed to submit review'
      });

      // Clean up previews even on error
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
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
      isEditing: true,
      selectedImages: [],
      imagePreviews: []
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

  openImageModal = (images, startIndex = 0) => {
    this.setState({
      showImageModal: true,
      modalImages: images,
      currentImageIndex: startIndex
    });
  };

  closeImageModal = () => {
    this.setState({
      showImageModal: false,
      modalImages: [],
      currentImageIndex: 0
    });
  };

  navigateImage = (direction) => {
    const { currentImageIndex, modalImages } = this.state;
    let newIndex = currentImageIndex + direction;

    if (newIndex < 0) newIndex = modalImages.length - 1;
    if (newIndex >= modalImages.length) newIndex = 0;

    this.setState({ currentImageIndex: newIndex });
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

  renderImageModal = () => {
    const { showImageModal, modalImages, currentImageIndex } = this.state;

    if (!showImageModal || modalImages.length === 0) return null;

    return (
      <div
        className="modal d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        onClick={this.closeImageModal}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content bg-transparent border-0">
            <div className="modal-header border-0">
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={this.closeImageModal}
              />
            </div>
            <div className="modal-body text-center position-relative">
              <img
                src={`http://localhost:5000${modalImages[currentImageIndex]}`}
                className="img-fluid"
                style={{ maxHeight: "80vh" }}
                alt={`Review image ${currentImageIndex + 1}`}
              />

              {modalImages.length > 1 && (
                <>
                  <button
                    className="btn btn-light position-absolute start-0 top-50 translate-middle-y ms-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.navigateImage(-1);
                    }}
                  >
                    ‹
                  </button>
                  <button
                    className="btn btn-light position-absolute end-0 top-50 translate-middle-y me-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.navigateImage(1);
                    }}
                  >
                    ›
                  </button>
                  <div className="text-white mt-2">
                    {currentImageIndex + 1} / {modalImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  renderReviewImages = (images) => {
    console.log('Review images:', images);
    if (!images || images.length === 0) return null;

    return (
      <div className="review-images mt-3">
        <div className="d-flex flex-wrap gap-2">
          {images.map((imageUrl, index) => {
            // FIXED: Use the correct path - images are in /images/ratingreview_images/
            const fullImageUrl = `http://localhost:5000/images/ratingreview_images/${imageUrl.split('/').pop()}`;

            return (
              <div
                key={index}
                className="review-image-thumbnail cursor-pointer"
                onClick={() => this.openImageModal(images, index)}
              >
                <img
                  src={fullImageUrl}
                  alt={`Review image ${index + 1}`}
                  className="img-thumbnail"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  onError={(e) => {
                    // Set a fallback image or hide it
                    e.target.style.display = 'none';
                    console.warn(`Failed to load review image: ${imageUrl}`);
                  }}
                  onLoad={(e) => {
                    console.log(`Successfully loaded image: ${imageUrl}`);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  renderImageModal = () => {
    const { showImageModal, modalImages, currentImageIndex } = this.state;

    if (!showImageModal || modalImages.length === 0) return null;

    const currentImage = modalImages[currentImageIndex];
    // FIXED: Extract just the filename and build correct URL
    const fileName = currentImage.split('/').pop();
    const fullImageUrl = `http://localhost:5000/images/ratingreview_images/${fileName}`;

    return (
      <div
        className="modal d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        onClick={this.closeImageModal}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content bg-transparent border-0">
            <div className="modal-header border-0">
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={this.closeImageModal}
              />
            </div>
            <div className="modal-body text-center position-relative">
              <img
                src={fullImageUrl}
                className="img-fluid"
                style={{ maxHeight: "80vh" }}
                alt={`Review image ${currentImageIndex + 1}`}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg'; // Fallback
                  console.error(`Failed to load modal image: ${currentImage}`);
                }}
              />

              {modalImages.length > 1 && (
                <>
                  <button
                    className="btn btn-light position-absolute start-0 top-50 translate-middle-y ms-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.navigateImage(-1);
                    }}
                  >
                    ‹
                  </button>
                  <button
                    className="btn btn-light position-absolute end-0 top-50 translate-middle-y me-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.navigateImage(1);
                    }}
                  >
                    ›
                  </button>
                  <div className="text-white mt-2">
                    {currentImageIndex + 1} / {modalImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderImagePreviews = () => {
    const { imagePreviews, selectedImages } = this.state;

    if (imagePreviews.length === 0) return null;

    return (
      <div className="mb-3">
        <label className="form-label fw-bold">Image Previews:</label>
        <div className="d-flex flex-wrap gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="img-thumbnail w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
              <button
                type="button"
                className="btn btn-sm btn-danger position-absolute top-0 end-0 p-1"
                onClick={() => this.handleRemoveImage(index)}
                style={{ transform: 'translate(50%, -50%)' }}
              >
                <FaTimes />
              </button>
              <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 text-white text-center py-1">
                {selectedImages[index]?.name || `Image ${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };



  renderReviewForm = () => {
    const {
      rating,
      title,
      comment,
      selectedImages,
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

        <div onSubmit={this.handleSubmitReview}>
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

          <div className="mb-3">
            <label className="form-label fw-bold">
              <FaImage className="me-2" />
              Add Images (Optional - Max 5)
            </label>
            <input
              ref={this.fileInputRef}
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={this.handleImageSelect}
              disabled={selectedImages.length >= 5}
            />
            <small className="text-muted d-block mt-1">
              You can upload up to 5 images. Max 5MB per image. Supported formats: JPG, PNG, GIF
            </small>
            <small className="text-muted">
              <strong>Note:</strong> Images are optional - you can submit your review without any images.
            </small>
          </div>

          {this.renderImagePreviews()}

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-dark px-4"
              disabled={isSubmitting}
              onClick={this.handleSubmitReview}
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
              onClick={() => {
                // Clean up previews
                this.state.imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
                this.setState({
                  showReviewForm: false,
                  isEditing: false,
                  rating: 0,
                  title: '',
                  comment: '',
                  selectedImages: [],
                  imagePreviews: [],
                  error: ''
                });
                if (this.fileInputRef.current) {
                  this.fileInputRef.current.value = '';
                }
              }}
            >
              Cancel
            </button>
          </div>
        </div>
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
                  {this.renderReviewImages(userReview.images)}
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
                <div className="text-center bg-light rounded-3">
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

          {/* Reviews List */}
          {reviews.length > 0 && (
            <div className="reviews-list ">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Customer Reviews</h4>
                <span className="badge bg-primary bg-gradient rounded-pill px-3 py-2">
                  {statistics.totalReviews || 0} reviews
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="card border-dashed">
                  <div className="card-body text-center py-5">
                    <div className="display-1 text-muted mb-3">
                      <FaRegStar />
                    </div>
                    <h5 className="mb-3">No reviews yet</h5>
                    <p className="text-muted mb-0">Be the first to review this product!</p>
                  </div>
                </div>
              ) : (
                <div className="row">
                  {reviews.map((review, index) => (
                    <div key={review._id} className="col-lg-6 mb-4">
                      <div className="card h-100 shadow-sm border-hover">
                        <div className="card-body">
                          {/* Review Header */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar me-3">
                                <div
                                  className="bg-primary bg-gradient text-white rounded-circle d-flex align-items-center justify-content-center"
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  {review.userName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              </div>
                              <div>
                                <h6 className="mb-1 fw-bold">{review.userName}</h6>
                                <div className="d-flex align-items-center">
                                  {this.renderStars(review.rating, false, 'sm')}
                                  {review.isVerifiedPurchase && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 ms-2">
                                      <FaCheckCircle size={10} className="me-1" />
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <small className="text-muted text-end">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </small>
                          </div>

                          {/* Review Content */}
                          <h6 className="fw-bold text-primary mb-2">{review.title}</h6>
                          <p className="card-text mb-3 line-clamp-3">{review.comment}</p>

                          {/* Images */}
                          {this.renderReviewImages(review.images)}

                          {/* Helpful Button */}
                          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                            <button
                              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                              onClick={() => this.handleMarkHelpful(review._id)}
                            >
                              <FaThumbsUp className="me-1" />
                              Helpful ({review.helpful || 0})
                            </button>
                            {index === 0 && (
                              <span className="badge bg-warning bg-gradient text-dark">
                                <FaStar className="me-1" />
                                Most Recent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {this.renderImageModal()}

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

          .review-image-thumbnail {
            cursor: pointer;
            transition: transform 0.2s ease;
          }

          .review-image-thumbnail:hover {
            transform: scale(1.05);
          }

          .cursor-pointer {
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
}

export default Rating_Review;
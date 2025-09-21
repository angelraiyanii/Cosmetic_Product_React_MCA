import React, { useState, useEffect } from "react";
import axios from "axios";
// import s1 from "../images/slide1.png"; // Default image
import "../../App.css";

const AdBanner = () => {
  const [banners, setBanners] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [formData, setFormData] = useState({ name: "", status: "Active" });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(3);

  // Fetch banners on mount
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/BannerModel/banners"
        );
        setBanners(response.data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchBanners();
  }, []);

  const toggleBannerDetails = (bannerId) => {
    setShowDetails(prev => ({
      ...prev,
      [bannerId]: !prev[bannerId]
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === "image/png" ||
        file.type === "image/jpeg" ||
        file.type === "image/jpg")
    ) {
      const imageUrl = URL.createObjectURL(file);
      setNewImage({ file, url: imageUrl });
      setErrors({ ...errors, image: "" });
    } else {
      setErrors({ ...errors, image: "Only JPG, JPEG, and PNG formats are allowed." });
    }
  };

  // Toggle Add Form
  const handleAddToggle = () => {
    setShowAddForm(true);
    setShowEditForm(false);
    setFormData({ name: "", status: "Active" });
    setNewImage(null);
    setErrors({});
  };

  // Handle Add Banner
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!newImage) newErrors.image = "Image is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const addFormData = new FormData();
    addFormData.append("name", formData.name);
    addFormData.append("status", formData.status);
    addFormData.append("bannerImage", newImage.file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/BannerModel/add-banner",
        addFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setBanners([...banners, response.data.banner]);
      alert("Banner added successfully!");
      setShowAddForm(false);
      setNewImage(null);
      setFormData({ name: "", status: "Active" });
    } catch (error) {
      console.error("Error adding banner:", error.response?.data || error.message);
      setErrors({
        form: error.response?.data?.error || "Failed to add banner",
      });
    }
  };

  // Handle Edit
  const handleEdit = (banner) => {
    setSelectedBanner(banner);
    setShowEditForm(true);
    setShowAddForm(false);
    setFormData({ name: banner.name, status: banner.status });
    setNewImage(null);
    setErrors({});
  };

  const handleClose = () => {
    setShowEditForm(false);
    setShowAddForm(false);
    setSelectedBanner(null);
    setNewImage(null);
    setFormData({ name: "", status: "Active" });
    setErrors({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedBanner) return;

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("status", formData.status);
    if (newImage && newImage.file) {
      formDataToSend.append("bannerImage", newImage.file);
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/BannerModel/update-banner/${selectedBanner._id}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setBanners(
        banners.map((b) =>
          b._id === selectedBanner._id ? response.data.banner : b
        )
      );
      alert("Banner updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating banner:", error.response?.data || error.message);
      setErrors({
        form: error.response?.data?.error || "Failed to update banner",
      });
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/BannerModel/delete-banner/${id}`
      );
      setBanners(banners.filter((b) => b._id !== id));
      alert("Banner deleted successfully!");
    } catch (error) {
      console.error("Error deleting banner:", error.response?.data || error.message);
      alert(
        "Failed to delete banner: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  // Banner Details Component (Inline)
  const BannerDetailsRow = ({ banner }) => (
    <tr className="banner-details-row">
      <td colSpan="5" className="p-0">
        <div className="bg-light border-top">
          <div className="container-fluid p-4">
            <div className="row g-4">
              {/* Banner Image Section */}
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-image me-2"></i>
                      Banner Preview
                    </h6>
                  </div>
                  <div className="card-body text-center">
                    <img
                      src={
                        banner.image
                          ? `http://localhost:5000/public/images/banner_images/${banner.image}`
                          : "https://via.placeholder.com/600x200?text=Banner+Image"
                      }
                      alt={banner.name}
                      className="img-fluid rounded-3 shadow-sm"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        border: '2px solid #dee2e6'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Banner Information */}
              <div className="col-md-6">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-info text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Banner Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="info-item mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-tag text-primary me-2"></i>
                        <small className="text-muted">Banner ID</small>
                      </div>
                      <div className="fw-bold text-muted font-monospace">{banner._id}</div>
                    </div>

                    <div className="info-item mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-signature text-success me-2"></i>
                        <small className="text-muted">Banner Name</small>
                      </div>
                      <div className="fw-bold fs-5 text-primary">{banner.name}</div>
                    </div>

                    <div className="info-item mb-4">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-toggle-on text-warning me-2"></i>
                        <small className="text-muted">Status</small>
                      </div>
                      <span className={`badge fs-6 px-3 py-2 ${
                        banner.status === 'Active' 
                          ? 'bg-success-subtle text-success border border-success' 
                          : 'bg-danger-subtle text-danger border border-danger'
                      }`}>
                        <i className={`fas ${banner.status === 'Active' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                        {banner.status}
                      </span>
                    </div>

                    <div className="info-item">
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-calendar text-info me-2"></i>
                        <small className="text-muted">Created</small>
                      </div>
                      <div className="fw-bold">
                        {banner.createdAt 
                          ? new Date(banner.createdAt).toLocaleDateString('en-US', {
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
            </div>

            {/* Action Buttons */}
            <div className="row mt-4">
              <div className="col-12 text-end">
                <button 
                  className="btn btn-outline-secondary me-2"
                  onClick={() => toggleBannerDetails(banner._id)}
                >
                  <i className="fas fa-times me-1"></i>
                  Hide Details
                </button>
                <button 
                  className="btn btn-outline-warning me-2"
                  onClick={() => handleEdit(banner)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Banner
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(banner._id)}
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  // Filter banners based on search query
  const filteredBanners = banners.filter(banner =>
    banner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    banner._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBanners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">
        <i className="fas fa-images me-2 text-primary"></i>
        Manage Banners
      </h2>

      {/* Search & Add Button */}
      <div className="d-flex justify-content-between mb-3">
        <div className="input-group" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-light">
            <i className="fas fa-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search banners..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="btn btn-success shadow-sm" onClick={handleAddToggle}>
          <i className="fas fa-plus me-2"></i>
          Add Banner
        </button>
      </div>

      {/* Enhanced Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover text-center align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th><i className="fas fa-hashtag me-1"></i>Sr No</th>
                <th><i className="fas fa-signature me-1"></i>Name</th>
                <th><i className="fas fa-image me-1"></i>Image</th>
                <th><i className="fas fa-toggle-on me-1"></i>Status</th>
                <th><i className="fas fa-cogs me-1"></i>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-muted py-4">
                    <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                    {searchQuery ? "No banners found matching your search." : "No banners found."}
                  </td>
                </tr>
              ) : (
                currentItems.map((banner, idx) => (
                  <React.Fragment key={banner._id}>
                    <tr className="border-bottom">
                      <td className="fw-bold">{indexOfFirstItem + idx + 1}</td>
                      <td className="fw-bold text-primary">{banner.name}</td>
                      <td>
                        <img
                          src={
                            banner.image
                              ? `http://localhost:5000/public/images/banner_images/${banner.image}`
                              : "https://via.placeholder.com/100x50?text=Banner"
                          }
                          alt={banner.name}
                          className="rounded-3 shadow-sm"
                          style={{ 
                            width: "100px", 
                            height: "50px", 
                            objectFit: "cover",
                            border: '1px solid #dee2e6'
                          }}
                        />
                      </td>
                      <td>
                        <span
                          className={`badge fs-6 px-3 py-2 ${
                            banner.status === "Active" ? "bg-success" : "bg-danger"
                          }`}
                        >
                          <i className={`fas ${banner.status === "Active" ? 'fa-check' : 'fa-times'} me-1`}></i>
                          {banner.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {/* View Details Icon */}
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => toggleBannerDetails(banner._id)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {/* Edit Icon */}
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleEdit(banner)}
                            title="Edit Banner"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          {/* Delete Icon */}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(banner._id)}
                            title="Delete Banner"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Banner Details Row */}
                    {showDetails[banner._id] && (
                      <BannerDetailsRow banner={banner} />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {filteredBanners.length > itemsPerPage && (
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
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBanners.length)} of {filteredBanners.length} banners
        {searchQuery && ` (filtered from ${banners.length} total banners)`}
      </div>

      {/* Add Banner Form Modal */}
      {showAddForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ 
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
              }}>
                <h4 className="modal-title text-white">
                  <i className="fas fa-plus me-2"></i>
                  Add New Banner
                </h4>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClose}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleAddSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-signature text-primary me-1"></i>
                        Banner Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter banner name"
                      />
                      {errors.name && (
                        <div className="invalid-feedback">{errors.name}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-toggle-on text-success me-1"></i>
                        Status
                      </label>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-image text-info me-1"></i>
                      Banner Image <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className={`form-control ${errors.image ? "is-invalid" : ""}`}
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleImageChange}
                    />
                    {errors.image && (
                      <div className="invalid-feedback">{errors.image}</div>
                    )}
                    {newImage && (
                      <div className="mt-3 text-center">
                        <img
                          src={newImage.url}
                          alt="Preview"
                          className="img-fluid rounded-3 shadow-sm"
                          style={{ maxHeight: "200px", border: '2px solid #dee2e6' }}
                        />
                      </div>
                    )}
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
                    <button type="submit" className="btn btn-success">
                      <i className="fas fa-plus me-1"></i>
                      Add Banner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Banner Form Modal */}
      {showEditForm && selectedBanner && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ 
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'
              }}>
                <h4 className="modal-title text-white">
                  <i className="fas fa-edit me-2"></i>
                  Edit Banner
                </h4>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClose}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSave}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-signature text-primary me-1"></i>
                        Banner Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                      {errors.name && (
                        <div className="invalid-feedback">{errors.name}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-toggle-on text-success me-1"></i>
                        Status
                      </label>
                      <select
                        name="status"
                        className="form-control"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-image text-info me-1"></i>
                        Current Banner
                      </label>
                      <img
                        src={
                          selectedBanner.image
                            ? `http://localhost:5000/public/images/banner_images/${selectedBanner.image}`
                            : "https://via.placeholder.com/300x150?text=Current+Banner"
                        }
                        alt={selectedBanner.name}
                        className="img-fluid d-block rounded-3 shadow-sm"
                        style={{ border: '2px solid #dee2e6' }}
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        <i className="fas fa-upload text-warning me-1"></i>
                        Upload New Banner
                      </label>
                      <input
                        type="file"
                        className="form-control mb-2"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageChange}
                      />
                      {errors.image && (
                        <small className="text-danger">{errors.image}</small>
                      )}
                      {newImage ? (
                        <img
                          src={newImage.url}
                          alt="New Preview"
                          className="img-fluid d-block rounded-3 shadow-sm"
                          style={{ border: '2px solid #28a745' }}
                        />
                      ) : (
                        <div className="text-center text-muted p-3 border rounded-3">
                          <i className="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                          <div>No new image selected</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {errors.form && (
                    <div className="alert alert-danger mt-3">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {errors.form}
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-end gap-2 mt-4">
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
                      Save Changes
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

export default AdBanner;
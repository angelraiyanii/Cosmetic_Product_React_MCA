import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";


function AdCategory() {
   const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000" 
    : "https://gowcosmetic-backed.onrender.com";
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: "",
    categoryStatus: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (!userData) {
      window.location.href = "/Login";
      return;
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        `${url}/api/CategoryModel/categories`
      );
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({ categoryName: "", categoryStatus: "" });
    setImage(null);
    setImagePreview(null);
    setSelectedCategoryId(null);
    setIsUpdate(false);
    setShowForm(false);
  };

  const showCategoryDetails = (category) => {
    setSelectedCategory(category);
    setShowDetails(true);
  };

  const hideCategoryDetails = () => {
    setShowDetails(false);
    setSelectedCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryName || !formData.categoryStatus) {
      alert("Please fill all fields");
      return;
    }

    const data = new FormData();
    data.append("categoryName", formData.categoryName);
    data.append("categoryStatus", formData.categoryStatus);
    if (image) data.append("categoryImage", image);

    try {
      let res;
      if (isUpdate) {
        res = await axios.put(
          `${url}/api/CategoryModel/update-category/${selectedCategoryId}`,
          data
        );
      } else {
        res = await axios.post(
          `${url}/api/CategoryModel/add-category`,
          data
          
        );
      }
      alert(res.data.message);
      resetForm();
      fetchCategories();
      window.location.reload();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (category) => {
    setShowForm(true);
    setIsUpdate(true);
    setSelectedCategoryId(category._id);
    setFormData({
      categoryName: category.categoryName,
      categoryStatus: category.categoryStatus,
    });
      window.location.reload();
    setImagePreview(
      category.categoryImage
        ? `${url}/public/images/category_images/${category.categoryImage}`
        : null
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const res = await axios.delete(
        `${url}/api/CategoryModel/delete-category/${id}`
      );
      alert(res.data.message);
      fetchCategories();
        window.location.reload();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Delete failed");
    }
  };

  // Beautiful Category Details Modal
  const renderCategoryDetails = () => {
    if (!selectedCategory) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            {/* Header with gradient */}
            <div className="modal-header border-0 position-relative" style={{ 
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              borderRadius: '0.5rem 0.5rem 0 0'
            }}>
              <div className="d-flex align-items-center w-100">
                <div className="position-relative me-3">
                  <img
                    src={
                      selectedCategory.categoryImage
                        ? `${url}/public/images/category_images/${selectedCategory.categoryImage}`
                        : "https://via.placeholder.com/100x100?text=No+Image"
                    }
                    alt="Category"
                    className="rounded-3 border border-white border-3"
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  />
                  <span className={`position-absolute bottom-0 end-0 badge rounded-pill ${
                    selectedCategory.categoryStatus === 'Active' ? 'bg-success' : 'bg-danger'
                  }`} style={{ fontSize: '0.7rem' }}>
                    {selectedCategory.categoryStatus === 'Active' ? '●' : '●'}
                  </span>
                </div>
                <div className="flex-grow-1 text-white">
                  <h4 className="mb-1 fw-bold">{selectedCategory.categoryName}</h4>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-layer-group me-1"></i>
                    Category Details
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white position-absolute end-0 top-0 m-3" 
                onClick={hideCategoryDetails}
                style={{ fontSize: '1.2rem' }}
              ></button>
            </div>

            {/* Body with detailed info */}
            <div className="modal-body p-4" style={{ backgroundColor: '#f8f9ff' }}>
              <div className="row g-4">
                {/* Category Image Card */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-primary text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-image me-2"></i>
                        Category Image
                      </h6>
                    </div>
                    <div className="card-body text-center">
                      <img
                        src={
                          selectedCategory.categoryImage
                            ? `${url}/public/images/category_images/${selectedCategory.categoryImage}`
                            : "https://via.placeholder.com/200x200?text=No+Image"
                        }
                        alt="Category"
                        className="img-fluid rounded-3 shadow-sm"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Category Information Card */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-info text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-info-circle me-2"></i>
                        Category Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="info-item mb-4">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-tag text-primary me-2"></i>
                          <small className="text-muted">Category Name</small>
                        </div>
                        <div className="fw-bold fs-5 text-primary">{selectedCategory.categoryName}</div>
                      </div>

                      <div className="info-item mb-4">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-toggle-on text-success me-2"></i>
                          <small className="text-muted">Status</small>
                        </div>
                        <span className={`badge fs-6 px-3 py-2 ${
                          selectedCategory.categoryStatus === 'Active' 
                            ? 'bg-success-subtle text-success border border-success' 
                            : 'bg-danger-subtle text-danger border border-danger'
                        }`}>
                          <i className={`fas ${selectedCategory.categoryStatus === 'Active' ? 'fa-check-circle' : 'fa-times-circle'} me-2`}></i>
                          {selectedCategory.categoryStatus}
                        </span>
                      </div>

                      <div className="info-item">
                        <div className="d-flex align-items-center mb-2">
                          <i className="fas fa-calendar text-warning me-2"></i>
                          <small className="text-muted">Created</small>
                        </div>
                        <div className="fw-bold">
                          {selectedCategory.createdAt 
                            ? new Date(selectedCategory.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Date not available'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats or Info */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="card-body text-white text-center">
                      <i className="fas fa-chart-bar fa-2x mb-2"></i>
                      <h6 className="mb-0">Category Statistics</h6>
                      <small className="opacity-75">This category contains products and subcategories</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with action buttons */}
            <div className="modal-footer border-0 bg-light">
              <button 
                type="button" 
                className="btn btn-outline-warning"
                onClick={() => {
                  hideCategoryDetails();
                  handleEdit(selectedCategory);
                }}
              >
                <i className="fas fa-edit me-1"></i>
                Edit Category
              </button>
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => {
                  hideCategoryDetails();
                  handleDelete(selectedCategory._id);
                }}
              >
                <i className="fas fa-trash me-1"></i>
                Delete Category
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={hideCategoryDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pagination
  const filteredCategories = categories.filter((cat) =>
    cat.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">
        <i className="fas fa-layer-group me-2 text-primary"></i>
        Manage Categories
      </h2>

      {/* Search & Add */}
      <div className="d-flex justify-content-between mb-3">
        <div className="input-group" style={{ maxWidth: '400px' }}>
          <span className="input-group-text bg-light">
            <i className="fas fa-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="btn btn-success shadow-sm"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <i className="fas fa-plus me-2"></i>
          Add Category
        </button>
      </div>

      {/* Beautiful Category Details Modal */}
      {showDetails && renderCategoryDetails()}

      {/* Form */}
      {showForm && (
        <div className="card shadow-lg border-0 p-4 mb-4">
          <div className="card-header bg-gradient text-white border-0 rounded-top" 
               style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <h4 className="mb-0">
              <i className={`fas ${isUpdate ? 'fa-edit' : 'fa-plus'} me-2`}></i>
              {isUpdate ? "Update" : "Add"} Category
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-tag text-primary me-1"></i>
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="categoryName"
                    value={formData.categoryName}
                    className="form-control"
                    placeholder="Enter category name"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-image text-success me-1"></i>
                    Category Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {imagePreview && (
                <div className="text-center mb-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-thumbnail shadow-sm"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">
                  <i className="fas fa-toggle-on text-warning me-1"></i>
                  Category Status
                </label>
                <div className="mt-2">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="categoryStatus"
                      id="active"
                      value="Active"
                      checked={formData.categoryStatus === "Active"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label text-success fw-bold" htmlFor="active">
                      <i className="fas fa-check-circle me-1"></i>
                      Active
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="categoryStatus"
                      id="inactive"
                      value="Inactive"
                      checked={formData.categoryStatus === "Inactive"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label text-danger fw-bold" htmlFor="inactive">
                      <i className="fas fa-times-circle me-1"></i>
                      Inactive
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  <i className={`fas ${isUpdate ? 'fa-save' : 'fa-plus'} me-1`}></i>
                  {isUpdate ? "Update" : "Add"} Category
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  <i className="fas fa-times me-1"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover text-center align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th><i className="fas fa-hashtag me-1"></i>Sr No</th>
                <th><i className="fas fa-image me-1"></i>Image</th>
                <th><i className="fas fa-tag me-1"></i>Name</th>
                <th><i className="fas fa-toggle-on me-1"></i>Status</th>
                <th><i className="fas fa-cogs me-1"></i>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-muted py-4">
                    <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                    No categories found.
                  </td>
                </tr>
              ) : (
                currentItems.map((cat, idx) => (
                  <tr key={cat._id} className="border-bottom">
                    <td className="fw-bold">{indexOfFirstItem + idx + 1}</td>
                    <td>
                      <img
                        src={
                          cat.categoryImage
                            ? `${url}/public/images/category_images/${cat.categoryImage}`
                            : "https://via.placeholder.com/70x70?text=No+Image"
                        }
                        alt={cat.categoryName}
                        className="rounded-3 shadow-sm"
                        style={{ width: "70px", height: "70px", objectFit: "cover" }}
                      />
                    </td>
                    <td className="fw-bold text-primary">{cat.categoryName}</td>
                    <td>
                      <span className={`badge fs-6 px-3 py-2 ${
                        cat.categoryStatus === "Active"
                          ? "bg-success"
                          : "bg-danger"
                      }`}>
                        <i className={`fas ${cat.categoryStatus === "Active" ? 'fa-check' : 'fa-times'} me-1`}></i>
                        {cat.categoryStatus}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        {/* View Details Icon */}
                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={() => showCategoryDetails(cat)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        {/* Edit Icon */}
                        <button
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => handleEdit(cat)}
                          title="Edit Category"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        
                        {/* Delete Icon */}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(cat._id)}
                          title="Delete Category"
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
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <li
                key={num}
                className={`page-item ${currentPage === num ? "active" : ""}`}
              >
                <button className="page-link" onClick={() => setCurrentPage(num)}>
                  {num}
                </button>
              </li>
            ))}
            <li
              className={`page-item ${
                currentPage === totalPages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default AdCategory;
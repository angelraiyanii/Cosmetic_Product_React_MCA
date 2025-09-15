import React, { useState, useEffect } from "react";
import axios from "axios";
// import s1 from "../images/slide1.png"; // Default image
import "../../App.css";

const AdBanner = () => {
  const [banners, setBanners] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [formData, setFormData] = useState({ name: "", status: "Active" });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
      setErrors({});
    } else {
      setErrors({ image: "Only JPG, JPEG, and PNG formats are allowed." });
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
    if (!formData.name || !newImage) {
      setErrors({
        name: !formData.name ? "Name is required" : "",
        image: !newImage ? "Image is required" : "",
      });
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
      console.error(
        "Error adding banner:",
        error.response?.data || error.message
      );
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
      console.error(
        "Error updating banner:",
        error.response?.data || error.message
      );
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
      console.error(
        "Error deleting banner:",
        error.response?.data || error.message
      );
      alert(
        "Failed to delete banner: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = banners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(banners.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Manage Banners</h2>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-success" onClick={handleAddToggle}>
          Add Banner
        </button>
      </div>
      <table className="table table-bordered">
        <thead className="thead-dark">
          <tr>
            <th>Banner ID</th>
            <th>Name</th>
            <th>Image</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((banner) => (
            <tr key={banner._id}>
              <td>{banner._id}</td>
              <td>{banner.name}</td>
              <td>
                <img
                  src={
                    banner.image
                      ? `http://localhost:5000/public/images/banner_images/${banner.image}`
                      : s1
                  }
                  alt={banner.name}
                  style={{ width: "100px", height: "50px", objectFit: "cover" }}
                  onError={(e) => (e.target.src = s1)}
                />
              </td>
              <td>
                <span
                  className={`badge ${
                    banner.status === "Active" ? "bg-success" : "bg-danger"
                  }`}
                >
                  {banner.status}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => handleEdit(banner)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(banner._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Pagination  start*/}
      {banners.length > itemsPerPage && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Previous
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
                Next &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
      {/* Pagination End */}
      {/* Add Banner Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Add Banner</h4>
            <form onSubmit={handleAddSubmit}>
              <div className="mb-3">
                <label className="form-label">Banner Name</label>
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
              <div className="mb-3">
                <label className="form-label">Status</label>
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
              <div className="mb-3">
                <label className="form-label">Banner Image</label>
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
                  <img
                    src={newImage.url}
                    alt="Preview"
                    className="img-fluid d-block mt-2"
                    style={{ maxWidth: "100%" }}
                  />
                )}
              </div>
              {errors.form && (
                <small className="text-danger">{errors.form}</small>
              )}
              <div className="d-flex justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Banner Popup */}
      {showEditForm && selectedBanner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Edit Banner</h4>
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">Banner Name</label>
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
              <div className="mb-3">
                <label className="form-label">Status</label>
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
              <div className="row">
                <div className="col-6">
                  <label>Current Banner:</label>
                  <img
                    src={
                      selectedBanner.image
                        ? `http://localhost:5000/public/images/banner_images/${selectedBanner.image}`
                        : s1
                    }
                    alt={selectedBanner.name}
                    className="img-fluid d-block mb-2"
                    style={{ maxWidth: "100%" }}
                    onError={(e) => (e.target.src = s1)}
                  />
                </div>
                <div className="col-6">
                  <label>Upload New Banner:</label>
                  <input
                    type="file"
                    className="form-control"
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
                      className="img-fluid d-block mb-2"
                      style={{ maxWidth: "100%" }}
                    />
                  ) : (
                    <img
                      src={
                        selectedBanner.image
                          ? `http://localhost:5000/public/images/banner_images/${selectedBanner.image}`
                          : s1
                      }
                      alt="Current Preview"
                      className="img-fluid d-block mb-2"
                      style={{ maxWidth: "100%" }}
                    />
                  )}
                </div>
              </div>
              {errors.form && (
                <small className="text-danger">{errors.form}</small>
              )}
              <div className="d-flex justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdBanner;

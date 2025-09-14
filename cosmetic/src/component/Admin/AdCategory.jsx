import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
// import c1 from "../images/category1.png";

function AdCategory() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/CategoryModel/categories"
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
          `http://localhost:5000/api/CategoryModel/update-category/${selectedCategoryId}`,
          data
        );
      } else {
        res = await axios.post(
          "http://localhost:5000/api/CategoryModel/add-category",
          data
        );
      }
      alert(res.data.message);
      resetForm();
      fetchCategories();
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
    setImagePreview(
      category.categoryImage
        ? `http://localhost:5000/public/images/category_images/${category.categoryImage}`
        : null
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/CategoryModel/delete-category/${id}`
      );
      alert(res.data.message);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Delete failed");
    }
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
      <h2 className="text-center mb-4">Categories</h2>

      {/* Search & Add */}
      <div className="d-flex justify-content-between mb-3">
        <input
          type="text"
          className="form-control w-50"
          placeholder="🔎 Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn btn-success"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card shadow p-4 mb-4">
          <h4 className="mb-3">{isUpdate ? "Update" : "Add"} Category</h4>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                name="categoryName"
                value={formData.categoryName}
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Category Image</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="img-thumbnail mt-2"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Category Status</label>
              <div>
                <label className="me-3">
                  <input
                    type="radio"
                    name="categoryStatus"
                    value="Active"
                    checked={formData.categoryStatus === "Active"}
                    onChange={handleChange}
                  />{" "}
                  Active
                </label>
                <label>
                  <input
                    type="radio"
                    name="categoryStatus"
                    value="Inactive"
                    checked={formData.categoryStatus === "Inactive"}
                    onChange={handleChange}
                  />{" "}
                  Inactive
                </label>
              </div>
            </div>

            <button className="btn btn-primary">
              {isUpdate ? "Update" : "Add"} Category
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Image</th>
              <th>Name</th>
              <th>Status</th>
              <th>Update</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-muted">
                  No categories found.
                </td>
              </tr>
            ) : (
              currentItems.map((cat, idx) => (
                <tr key={cat._id}>
                  <td>{indexOfFirstItem + idx + 1}</td>
                  <td>
                    <img
                      src={
                        cat.categoryImage
                          ? `http://localhost:5000/public/images/category_images/${cat.categoryImage}`
                          : c1
                      }
                      alt={cat.categoryName}
                      style={{ width: "70px", height: "70px", objectFit: "cover" }}
                    />
                  </td>
                  <td>{cat.categoryName}</td>
                  <td
                    className={
                      cat.categoryStatus === "Active"
                        ? "text-success fw-bold"
                        : "text-danger fw-bold"
                    }
                  >
                    {cat.categoryStatus}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(cat)}
                    >
                      Update
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(cat._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                &laquo; Prev
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
                Next &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default AdCategory;

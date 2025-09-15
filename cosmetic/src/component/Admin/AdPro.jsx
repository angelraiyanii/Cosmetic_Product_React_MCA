import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function AdProduct() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    status: "active",
    ml: "",
    discount: "",
    category: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const itemsPerPage = 5;

  useEffect(() => {
  console.log("Component mounted - fetching data");
  fetchProducts();
  fetchCategories();
}, []);

const fetchProducts = async () => {
  try {
    console.log("Fetching products from API...");
    const res = await axios.get("http://localhost:5000/api/ProductModel/");
    console.log("Products fetched successfully:", res.data.length);
    setProducts(res.data);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    console.error("Error response:", error.response?.data);
  }
};


  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/CategoryModel/categories"
      );
      // Filter only active categories
      const activeCategories = res.data.filter(cat => cat.categoryStatus === "Active");
      setCategories(activeCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      if (errors.image) {
        setErrors({ ...errors, image: "" });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
    if (!formData.stock || formData.stock < 0) newErrors.stock = "Valid stock quantity is required";
    if (!formData.category) newErrors.category = "Category selection is required";
    if (!isUpdate && !image) newErrors.image = "Product image is required";
    if (formData.discount && (formData.discount < 0 || formData.discount > 100)) {
      newErrors.discount = "Discount must be between 0-100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      status: "active",
      ml: "",
      discount: "",
      category: "",
    });
    setImage(null);
    setImagePreview(null);
    setSelectedProductId(null);
    setIsUpdate(false);
    setShowForm(false);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("stock", formData.stock);
    data.append("status", formData.status);
    data.append("ml", formData.ml);
    data.append("discount", formData.discount || 0);
    data.append("category", formData.category);
    
    if (image) {
      data.append("image", image);
    }

    try {
      let res;
      if (isUpdate) {
        res = await axios.put(
          `http://localhost:5000/api/ProductModel/${selectedProductId}`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        res = await axios.post(
          "http://localhost:5000/api/ProductModel/add",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }
      
      alert(res.data.message || `Product ${isUpdate ? 'updated' : 'added'} successfully!`);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (product) => {
    setShowForm(true);
    setIsUpdate(true);
    setSelectedProductId(product._id);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      status: product.status,
      ml: product.ml || "",
      discount: product.discount || "",
      category: product.category?._id || "",
    });
    
if (product.image) {
  setImagePreview(`http://localhost:5000/public/images/product_images/${product.image}`);
}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const res = await axios.delete(`http://localhost:5000/api/ProductModel/${id}`);
      alert(res.data.message || "Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Delete failed");
    }
  };

  // Pagination logic
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category?.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">Product Management</h2>

      {/* Search & Add Button */}
      <div className="d-flex justify-content-between mb-3">
        <input
          type="text"
          className="form-control w-50"
          placeholder="🔎 Search products..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
        />
        <button
          className="btn btn-success"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Product
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="card shadow p-4 mb-4">
          <h4 className="mb-3">{isUpdate ? "Update" : "Add"} Product</h4>
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Product Name */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Product Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  onChange={handleChange}
                  placeholder="Enter product name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              {/* Category Selection */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Category <span className="text-danger">*</span></label>
                <select
                  name="category"
                  className={`form-control ${errors.category ? "is-invalid" : ""}`}
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>

              {/* Price */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Price <span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  className={`form-control ${errors.price ? "is-invalid" : ""}`}
                  onChange={handleChange}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                />
                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
              </div>

              {/* Stock */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Stock Quantity <span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  className={`form-control ${errors.stock ? "is-invalid" : ""}`}
                  onChange={handleChange}
                  placeholder="Enter stock quantity"
                  min="0"
                />
                {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
              </div>

              {/* ML/Volume */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Volume/ML</label>
                <input
                  type="text"
                  name="ml"
                  value={formData.ml}
                  className="form-control"
                  onChange={handleChange}
                  placeholder="e.g., 100ml, 250ml"
                />
              </div>

              {/* Discount */}
              <div className="col-md-6 mb-3">
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  className={`form-control ${errors.discount ? "is-invalid" : ""}`}
                  onChange={handleChange}
                  placeholder="Enter discount percentage"
                  min="0"
                  max="100"
                />
                {errors.discount && <div className="invalid-feedback">{errors.discount}</div>}
              </div>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                className="form-control"
                onChange={handleChange}
                rows="3"
                placeholder="Enter product description"
              ></textarea>
            </div>

            {/* Product Image */}
            <div className="mb-3">
              <label className="form-label">Product Image {!isUpdate && <span className="text-danger">*</span>}</label>
              <input
                type="file"
                className={`form-control ${errors.image ? "is-invalid" : ""}`}
                accept="image/*"
                onChange={handleImageChange}
              />
              {errors.image && <div className="invalid-feedback">{errors.image}</div>}
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="img-thumbnail mt-2"
                  style={{ width: "120px", height: "120px", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Status */}
            <div className="mb-3">
              <label className="form-label">Status</label>
              <div>
                <label className="me-3">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={handleChange}
                  />{" "}
                  Active
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={handleChange}
                  />{" "}
                  Inactive
                </label>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                {isUpdate ? "Update" : "Add"} Product
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle">
          <thead className="table">
            <tr>
              <th>Sr No</th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Discount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-muted py-4">
                  {searchQuery ? "No products found matching your search." : "No products found."}
                </td>
              </tr>
            ) : (
              currentItems.map((product, idx) => (
                <tr key={product._id}>
                  <td>{indexOfFirstItem + idx + 1}</td>
                  <td>
                   <img
  src={
    product.image
      ? `http://localhost:5000/public/images/product_images/${product.image}`
      : "/placeholder-image.png"
  }
  alt={product.name}
  style={{ 
    width: "60px", 
    height: "60px", 
    objectFit: "cover",
    borderRadius: "8px"
  }}
  onError={(e) => {
    e.target.src = "/placeholder-image.png";
  }}
/>
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    {product.ml && <div className="text-muted small">{product.ml}</div>}
                  </td>
                  <td>{product.category?.categoryName || "N/A"}</td>
                  <td>
                    <span className="fw-bold">₹{product.price}</span>
                    {product.discount > 0 && (
                      <div className="text-success small">{product.discount}% off</div>
                    )}
                  </td>
                  <td>
                    <span className={product.stock <= 10 ? "text-warning" : "text-success"}>
                      {product.stock}
                    </span>
                    {product.stock <= 10 && product.stock > 0 && (
                      <div className="small text-warning">Low Stock</div>
                    )}
                    {product.stock === 0 && (
                      <div className="small text-danger">Out of Stock</div>
                    )}
                  </td>
                  <td>{product.discount || 0}%</td>
                  <td>
                    <span
                      className={`badge ${
                        product.status === "active"
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 justify-content-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(product)}
                        title="Edit Product"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(product._id)}
                        title="Delete Product"
                      >
                        🗑️
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
      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo; Previous
              </button>
            </li>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <li
                key={num}
                className={`page-item ${currentPage === num ? "active" : ""}`}
              >
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(num)}
                >
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
                disabled={currentPage === totalPages}
              >
                Next &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Summary Info */}
      <div className="mt-3 text-center text-muted">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
        {searchQuery && ` (filtered from ${products.length} total products)`}
      </div>
    </div>
  );
}

export default AdProduct;
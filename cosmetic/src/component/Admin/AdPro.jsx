import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function AdProduct() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState({});
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
      const activeCategories = res.data.filter(cat => cat.categoryStatus === "Active");
      setCategories(activeCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const toggleProductDetails = (productId) => {
    setShowDetails(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const calculateDiscountedPrice = (price, discount) => {
    if (discount > 0) {
      return price - (price * discount / 100);
    }
    return price;
  };

  // Product Details Component (Inline)
  const ProductDetailsRow = ({ product }) => (
    <tr className="product-details-row">
      <td colSpan="9" className="p-0">
        <div className="bg-light border-top">
          <div className="container-fluid p-4">
            <div className="row g-4">
              {/* Product Image Section */}
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-primary text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-image me-2"></i>
                      Product Image
                    </h6>
                  </div>
                  <div className="card-body text-center">
                    <img
                      src={
                        product.image
                          ? `http://localhost:5000/public/images/product_images/${product.image}`
                          : "https://via.placeholder.com/300x300?text=No+Image"
                      }
                      alt={product.name}
                      className="img-fluid rounded-3 shadow-sm"
                      style={{
                        maxWidth: '250px',
                        maxHeight: '250px',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-info text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Product Information
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="fas fa-box text-primary me-2"></i>
                        <small className="text-muted">Product Name</small>
                      </div>
                      <div className="fw-bold text-primary">{product.name}</div>
                    </div>

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="fas fa-layer-group text-success me-2"></i>
                        <small className="text-muted">Category</small>
                      </div>
                      <div className="fw-bold">{product.category?.categoryName || "N/A"}</div>
                    </div>

                    {product.ml && (
                      <div className="info-item mb-3">
                        <div className="d-flex align-items-center mb-1">
                          <i className="fas fa-flask text-warning me-2"></i>
                          <small className="text-muted">Volume</small>
                        </div>
                        <div className="fw-bold">{product.ml}</div>
                      </div>
                    )}

                    <div className="info-item">
                      <div className="d-flex align-items-center mb-1">
                        <i className="fas fa-toggle-on text-info me-2"></i>
                        <small className="text-muted">Status</small>
                      </div>
                      <span className={`badge fs-6 px-3 py-2 ${
                        product.status === 'active' 
                          ? 'bg-success-subtle text-success border border-success' 
                          : 'bg-danger-subtle text-danger border border-danger'
                      }`}>
                        <i className={`fas ${product.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                        {product.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock Information */}
              <div className="col-md-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-success text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-dollar-sign me-2"></i>
                      Pricing & Stock
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="fas fa-tag text-success me-2"></i>
                        <small className="text-muted">Price</small>
                      </div>
                      <div className="d-flex align-items-center">
                        {product.discount > 0 ? (
                          <>
                            <span className="fw-bold text-success fs-5 me-2">
                              ₹{calculateDiscountedPrice(product.price, product.discount).toFixed(2)}
                            </span>
                            <span className="text-muted text-decoration-line-through">
                              ₹{product.price}
                            </span>
                          </>
                        ) : (
                          <span className="fw-bold text-success fs-5">₹{product.price}</span>
                        )}
                      </div>
                    </div>

                    {product.discount > 0 && (
                      <div className="info-item mb-3">
                        <div className="d-flex align-items-center mb-1">
                          <i className="fas fa-percent text-danger me-2"></i>
                          <small className="text-muted">Discount</small>
                        </div>
                        <span className="badge bg-danger fs-6 px-3 py-2">
                          {product.discount}% OFF
                        </span>
                      </div>
                    )}

                    <div className="info-item mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="fas fa-warehouse text-warning me-2"></i>
                        <small className="text-muted">Stock</small>
                      </div>
                      <div className={`fw-bold ${
                        product.stock === 0 ? 'text-danger' : 
                        product.stock <= 10 ? 'text-warning' : 'text-success'
                      }`}>
                        {product.stock} units
                        {product.stock <= 10 && product.stock > 0 && (
                          <span className="badge bg-warning text-dark ms-2">Low Stock</span>
                        )}
                        {product.stock === 0 && (
                          <span className="badge bg-danger ms-2">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {product.description && (
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-secondary text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-align-left me-2"></i>
                        Product Description
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-0">{product.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="row mt-4">
              <div className="col-12 text-end">
                <button 
                  className="btn btn-outline-secondary me-2"
                  onClick={() => toggleProductDetails(product._id)}
                >
                  <i className="fas fa-times me-1"></i>
                  Hide Details
                </button>
                <button 
                  className="btn btn-outline-warning me-2"
                  onClick={() => handleEdit(product)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Product
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(product._id)}
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

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
      <h2 className="text-center mb-4">
        <i className="fas fa-boxes me-2 text-primary"></i>
        Product Management
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
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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
          Add Product
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="card shadow-lg border-0 p-4 mb-4">
          <div className="card-header bg-gradient text-white border-0 rounded-top" 
               style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <h4 className="mb-0">
              <i className={`fas ${isUpdate ? 'fa-edit' : 'fa-plus'} me-2`}></i>
              {isUpdate ? "Update" : "Add"} Product
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* Product Name */}
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-box text-primary me-1"></i>
                    Product Name <span className="text-danger">*</span>
                  </label>
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
                  <label className="form-label fw-bold">
                    <i className="fas fa-layer-group text-success me-1"></i>
                    Category <span className="text-danger">*</span>
                  </label>
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
                  <label className="form-label fw-bold">
                    <i className="fas fa-tag text-warning me-1"></i>
                    Price <span className="text-danger">*</span>
                  </label>
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
                  <label className="form-label fw-bold">
                    <i className="fas fa-warehouse text-info me-1"></i>
                    Stock Quantity <span className="text-danger">*</span>
                  </label>
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
                  <label className="form-label fw-bold">
                    <i className="fas fa-flask text-purple me-1"></i>
                    Volume/ML
                  </label>
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
                  <label className="form-label fw-bold">
                    <i className="fas fa-percent text-danger me-1"></i>
                    Discount (%)
                  </label>
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
                <label className="form-label fw-bold">
                  <i className="fas fa-align-left text-secondary me-1"></i>
                  Description
                </label>
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
                <label className="form-label fw-bold">
                  <i className="fas fa-image text-primary me-1"></i>
                  Product Image {!isUpdate && <span className="text-danger">*</span>}
                </label>
                <input
                  type="file"
                  className={`form-control ${errors.image ? "is-invalid" : ""}`}
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {errors.image && <div className="invalid-feedback">{errors.image}</div>}
                {imagePreview && (
                  <div className="text-center mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-thumbnail shadow-sm"
                      style={{ width: "120px", height: "120px", objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  <i className="fas fa-toggle-on text-success me-1"></i>
                  Status
                </label>
                <div className="mt-2">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="status"
                      id="active"
                      value="active"
                      checked={formData.status === "active"}
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
                      name="status"
                      id="inactive"
                      value="inactive"
                      checked={formData.status === "inactive"}
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
                  {isUpdate ? "Update" : "Add"} Product
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={resetForm}
                >
                  <i className="fas fa-times me-1"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover text-center align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th><i className="fas fa-hashtag me-1"></i>Sr No</th>
                <th><i className="fas fa-image me-1"></i>Image</th>
                <th><i className="fas fa-box me-1"></i>Name</th>
                <th><i className="fas fa-layer-group me-1"></i>Category</th>
                <th><i className="fas fa-tag me-1"></i>Price</th>
                <th><i className="fas fa-warehouse me-1"></i>Stock</th>
                <th><i className="fas fa-percent me-1"></i>Discount</th>
                <th><i className="fas fa-toggle-on me-1"></i>Status</th>
                <th><i className="fas fa-cogs me-1"></i>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-muted py-4">
                    <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                    {searchQuery ? "No products found matching your search." : "No products found."}
                  </td>
                </tr>
              ) : (
                currentItems.map((product, idx) => (
                  <React.Fragment key={product._id}>
                    <tr className="border-bottom">
                      <td className="fw-bold">{indexOfFirstItem + idx + 1}</td>
                      <td>
                        <img
                          src={
                            product.image
                              ? `http://localhost:5000/public/images/product_images/${product.image}`
                              : "https://via.placeholder.com/60x60?text=No+Image"
                          }
                          alt={product.name}
                          className="rounded-3 shadow-sm"
                          style={{ 
                            width: "60px", 
                            height: "60px", 
                            objectFit: "cover"
                          }}
                        />
                      </td>
                      <td className="text-start">
                        <div>
                          <strong className="text-primary">{product.name}</strong>
                          {product.ml && <div className="text-muted small">{product.ml}</div>}
                        </div>
                      </td>
                      <td className="fw-bold">{product.category?.categoryName || "N/A"}</td>
                      <td>
                        <div>
                          {product.discount > 0 ? (
                            <>
                              <span className="fw-bold text-success">
                                ₹{calculateDiscountedPrice(product.price, product.discount).toFixed(2)}
                              </span>
                              <div className="text-muted small text-decoration-line-through">
                                ₹{product.price}
                              </div>
                            </>
                          ) : (
                            <span className="fw-bold text-success">₹{product.price}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`fw-bold ${
                          product.stock === 0 ? "text-danger" : 
                          product.stock <= 10 ? "text-warning" : "text-success"
                        }`}>
                          {product.stock}
                        </span>
                        {product.stock <= 10 && product.stock > 0 && (
                          <div className="small text-warning">Low Stock</div>
                        )}
                        {product.stock === 0 && (
                          <div className="small text-danger">Out of Stock</div>
                        )}
                      </td>
                      <td>
                        {product.discount > 0 ? (
                          <span className="badge bg-danger">{product.discount}%</span>
                        ) : (
                          <span className="text-muted">0%</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge fs-6 px-3 py-2 ${
                            product.status === "active"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          <i className={`fas ${product.status === "active" ? 'fa-check' : 'fa-times'} me-1`}></i>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {/* View Details Icon */}
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => toggleProductDetails(product._id)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {/* Edit Icon */}
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleEdit(product)}
                            title="Edit Product"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          {/* Delete Icon */}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(product._id)}
                            title="Delete Product"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Product Details Row */}
                    {showDetails[product._id] && (
                      <ProductDetailsRow product={product} />
                    )}
                  </React.Fragment>
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
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
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
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Summary Info */}
      <div className="mt-3 text-center text-muted">
        <i className="fas fa-info-circle me-1"></i>
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
        {searchQuery && ` (filtered from ${products.length} total products)`}
      </div>
    </div>
  );
}

export default AdProduct;
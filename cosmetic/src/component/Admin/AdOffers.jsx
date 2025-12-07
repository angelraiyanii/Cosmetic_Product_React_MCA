import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../App.css";

const AdOffer = () => {
   const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000" 
    : "https://gowcosmetic-backed.onrender.com";
    
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [newImage, setNewImage] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    offerType: "category",
    category: "",
    products: [], // Changed to array for multiple products
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    targetAudience: "all",
    promoCode: ""
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(3);

  // Fetch data on mount
  useEffect(() => {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (!userData) {
      window.location.href = "/Login";
      return;
    }
    fetchOffers();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${url}/api/OfferModel/offers`);
      setOffers(response.data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/CategoryModel/categories`);
      // Filter only active categories and map to match your expected format
      const activeCategories = response.data
        .filter(cat => cat.categoryStatus === "Active")
        .map(cat => ({
          _id: cat._id,
          name: cat.categoryName,
          status: cat.categoryStatus
        }));
      setCategories(activeCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
  try {
    // The correct endpoint based on your routes
    const response = await axios.get(`${url}/api/ProductModel/`);
    
    console.log("✅ Products fetched:", response.data);
    
    // Map the products to match your form structure
    const allProducts = response.data.map(prod => ({
      _id: prod._id,
      name: prod.name,
      price: prod.price,
      image: prod.image,        // ✅ ADD THIS LINE
      description: prod.description,
      stock: prod.stock,
      status: prod.status,
      category: prod.category
    }));
    
    setProducts(allProducts);
    console.log("✅ Products loaded:", allProducts.length);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    console.error("❌ Response:", error.response?.data);
  }
};

  const toggleOfferDetails = (offerId) => {
    setShowDetails(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg")) {
      const imageUrl = URL.createObjectURL(file);
      setNewImage({ file, url: imageUrl });
      setErrors({ ...errors, image: "" });
    } else {
      setErrors({ ...errors, image: "Only JPG, JPEG, and PNG formats are allowed." });
    }
  };

  // Product selection handlers
  const handleProductSelection = (e) => {
    const selectedProductId = e.target.value;
    console.log("Selected product:", selectedProductId);

    if (selectedProductId && !formData.products.includes(selectedProductId)) {
      setFormData({
        ...formData,
        products: [...formData.products, selectedProductId]
      });
      // Clear the dropdown after selection
      setSelectedProductId("");
    }
  };

  const removeProduct = (productId) => {
    setFormData({
      ...formData,
      products: formData.products.filter(id => id !== productId)
    });
  };

  const handleAddToggle = () => {
    setShowAddForm(true);
    setShowEditForm(false);
    setSelectedProductId("");
    setFormData({
      name: "",
      description: "",
      offerType: "category",
      category: "",
      products: [],
      discountType: "percentage",
      discountValue: "",
      maxDiscount: "",
      minOrderValue: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
      targetAudience: "all",
      promoCode: ""
    });
    setNewImage(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.discountValue || formData.discountValue <= 0) newErrors.discountValue = "Valid discount value is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    if (formData.offerType === "category" && !formData.category) {
      newErrors.category = "Category is required";
    }
    if (formData.offerType === "product" && formData.products.length === 0) {
      newErrors.products = "At least one product is required";
    }
    if (formData.offerType === "banner" && !newImage && !showEditForm) {
      newErrors.image = "Banner image is required";
    }
    if (formData.offerType === "promo_code" && !formData.promoCode) {
      newErrors.promoCode = "Promo code is required";
    }
    if (formData.discountType === "percentage" && (!formData.maxDiscount || formData.maxDiscount <= 0)) {
      newErrors.maxDiscount = "Maximum discount is required for percentage offers";
    }

    return newErrors;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const addFormData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        if (Array.isArray(formData[key])) {
          // For arrays (products), append each item separately
          formData[key].forEach(item => {
            addFormData.append(key, item);
          });
        } else {
          addFormData.append(key, formData[key]);
        }
      }
    });

    if (newImage) {
      addFormData.append("bannerImage", newImage.file);
    }

    try {
      const response = await axios.post(
        `${url}/api/OfferModel/add-offer`,
        addFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setOffers([...offers, response.data.offer]);
      alert("Offer added successfully!");
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error("Error adding offer:", error.response?.data || error.message);
      setErrors({
        form: error.response?.data?.error || "Failed to add offer",
      });
    }
  };

  const handleEdit = (offer) => {
    setSelectedOffer(offer);
    setShowEditForm(true);
    setShowAddForm(false);
    setFormData({
      name: offer.name,
      description: offer.description,
      offerType: offer.offerType,
      category: offer.category?._id || "",
      products: offer.products ? offer.products.map(p => p._id || p) : [],
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      maxDiscount: offer.maxDiscount || "",
      minOrderValue: offer.minOrderValue || "",
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : "",
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : "",
      usageLimit: offer.usageLimit || "",
      targetAudience: offer.targetAudience,
      promoCode: offer.promoCode || ""
    });
    setNewImage(null);
    setErrors({});
  };

  const handleClose = () => {
    setShowEditForm(false);
    setShowAddForm(false);
    setSelectedOffer(null);
    setNewImage(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      offerType: "category",
      category: "",
      products: [],
      discountType: "percentage",
      discountValue: "",
      maxDiscount: "",
      minOrderValue: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
      targetAudience: "all",
      promoCode: ""
    });
    setErrors({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        if (Array.isArray(formData[key])) {
          // For arrays (products), append each item separately
          formData[key].forEach(item => {
            formDataToSend.append(key, item);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
    });

    if (newImage) {
      formDataToSend.append("bannerImage", newImage.file);
    }

    try {
      const response = await axios.put(
        `${url}/api/OfferModel/update-offer/${selectedOffer._id}`,
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setOffers(offers.map(o => o._id === selectedOffer._id ? response.data.offer : o));
      alert("Offer updated successfully!");
      handleClose();
    } catch (error) {
      console.error("Error updating offer:", error.response?.data || error.message);
      setErrors({
        form: error.response?.data?.error || "Failed to update offer",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;

    try {
      await axios.delete(`${url}/api/OfferModel/delete-offer/${id}`);
      setOffers(offers.filter(o => o._id !== id));
      alert("Offer deleted successfully!");
    } catch (error) {
      console.error("Error deleting offer:", error.response?.data || error.message);
      alert("Failed to delete offer: " + (error.response?.data?.error || error.message));
    }
  };

  const OfferDetailsRow = ({ offer }) => (
    <tr className="offer-details-row">
      <td colSpan="7" className="p-0">
        <div className="bg-light border-top">
          <div className="container-fluid p-4">
            <div className="row g-4">
              {/* Offer Image Section */}
              {offer.offerType === 'banner' && offer.bannerImage && (
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-primary text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-image me-2"></i>
                        Offer Banner
                      </h6>
                    </div>
                    <div className="card-body text-center">
                      <img
                        src={`${url}/public/images/offer_images/${offer.bannerImage}`}
                        alt={offer.name}
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
              )}

              {/* Offer Information */}
              <div className={offer.offerType === 'banner' && offer.bannerImage ? "col-md-6" : "col-12"}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-info text-white border-0">
                    <h6 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      Offer Details
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-tag text-primary me-2"></i>
                            <small className="text-muted">Offer ID</small>
                          </div>
                          <div className="fw-bold text-muted font-monospace small">{offer._id}</div>
                        </div>

                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-signature text-success me-2"></i>
                            <small className="text-muted">Offer Name</small>
                          </div>
                          <div className="fw-bold text-primary">{offer.name}</div>
                        </div>

                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-tags text-warning me-2"></i>
                            <small className="text-muted">Offer Type</small>
                          </div>
                          <span className="badge bg-primary">{offer.offerType}</span>
                        </div>

                        {/* Category or Products Info */}
                        {offer.offerType === 'category' && (
                          <div className="info-item mb-3">
                            <div className="d-flex align-items-center mb-1">
                              <i className="fas fa-folder text-info me-2"></i>
                              <small className="text-muted">Category</small>
                            </div>
                            <div className="fw-bold text-success">
                              {offer.category?.categoryName || offer.category?.name || 'N/A'}
                            </div>
                          </div>
                        )}

                        {offer.offerType === 'product' && offer.products && (
                          <div className="info-item mb-3">
                            <div className="d-flex align-items-center mb-1">
                              <i className="fas fa-cubes text-info me-2"></i>
                              <small className="text-muted">Products ({offer.products.length})</small>
                            </div>
                            <div className="selected-products-list">
                              {offer.products.slice(0, 3).map((product, index) => (
                                <div key={index} className="fw-bold text-success small">
                                  • {product.productName || product.name}
                                </div>
                              ))}
                              {offer.products.length > 3 && (
                                <div className="text-muted small">
                                  + {offer.products.length - 3} more products
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-percentage text-danger me-2"></i>
                            <small className="text-muted">Discount</small>
                          </div>
                          <div className="fw-bold">
                            {offer.discountType === 'percentage'
                              ? `${offer.discountValue}% (Max: ₹${offer.maxDiscount})`
                              : `₹${offer.discountValue}`
                            }
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-toggle-on text-warning me-2"></i>
                            <small className="text-muted">Status</small>
                          </div>
                          <span className={`badge fs-6 px-3 py-2 ${offer.status === 'Active'
                            ? 'bg-success-subtle text-success border border-success'
                            : offer.status === 'Expired'
                              ? 'bg-danger-subtle text-danger border border-danger'
                              : 'bg-warning-subtle text-warning border border-warning'
                            }`}>
                            <i className={`fas ${offer.status === 'Active' ? 'fa-check-circle' :
                              offer.status === 'Expired' ? 'fa-times-circle' : 'fa-pause-circle'
                              } me-1`}></i>
                            {offer.status}
                          </span>
                        </div>

                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-calendar text-info me-2"></i>
                            <small className="text-muted">Validity</small>
                          </div>
                          <div className="small">
                            {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="info-item mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-users text-secondary me-2"></i>
                            <small className="text-muted">Target Audience</small>
                          </div>
                          <div className="text-capitalize">{offer.targetAudience.replace('_', ' ')}</div>
                        </div>

                        {offer.promoCode && (
                          <div className="info-item mb-3">
                            <div className="d-flex align-items-center mb-1">
                              <i className="fas fa-ticket-alt text-success me-2"></i>
                              <small className="text-muted">Promo Code</small>
                            </div>
                            <div className="fw-bold font-monospace">{offer.promoCode}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="info-item mt-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="fas fa-align-left text-muted me-2"></i>
                        <small className="text-muted">Description</small>
                      </div>
                      <div className="text-muted">{offer.description}</div>
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
                  onClick={() => toggleOfferDetails(offer._id)}
                >
                  <i className="fas fa-times me-1"></i>
                  Hide Details
                </button>
                <button
                  className="btn btn-outline-warning me-2"
                  onClick={() => handleEdit(offer)}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Offer
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(offer._id)}
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  // Filter and pagination logic
  const filteredOffers = offers.filter(offer =>
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offer.promoCode && offer.promoCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    offer._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOffers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getOfferTarget = (offer) => {
    switch (offer.offerType) {
      case 'category':
        return offer.category?.categoryName || offer.category?.name || 'N/A';
      case 'product':
        if (offer.products && offer.products.length > 0) {
          if (offer.products.length === 1) {
            return offer.products[0]?.productName || offer.products[0]?.name || 'N/A';
          }
          return `${offer.products.length} products selected`;
        }
        return 'N/A';
      case 'promo_code':
        return offer.promoCode;
      case 'banner':
        return 'Banner Offer';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4">
        <i className="fas fa-tags me-2 text-primary"></i>
        Manage Offers
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
            placeholder="Search offers by name, promo code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button className="btn btn-success shadow-sm" onClick={handleAddToggle}>
          <i className="fas fa-plus me-2"></i>
          Add Offer
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
                <th><i className="fas fa-tags me-1"></i>Type</th>
                <th><i className="fas fa-bullseye me-1"></i>Target</th>
                <th><i className="fas fa-percentage me-1"></i>Discount</th>
                <th><i className="fas fa-toggle-on me-1"></i>Status</th>
                <th><i className="fas fa-cogs me-1"></i>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-muted py-4">
                    <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                    {searchQuery ? "No offers found matching your search." : "No offers found."}
                  </td>
                </tr>
              ) : (
                currentItems.map((offer, idx) => (
                  <React.Fragment key={offer._id}>
                    <tr className="border-bottom">
                      <td className="fw-bold">{indexOfFirstItem + idx + 1}</td>
                      <td className="fw-bold text-primary">{offer.name}</td>
                      <td>
                        <span className="badge bg-primary text-capitalize">
                          {offer.offerType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="fw-bold text-info">{getOfferTarget(offer)}</td>
                      <td>
                        <span className="badge bg-warning text-dark fs-6">
                          {offer.discountType === 'percentage'
                            ? `${offer.discountValue}%`
                            : `₹${offer.discountValue}`
                          }
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge fs-6 px-3 py-2 ${offer.status === "Active"
                            ? "bg-success"
                            : offer.status === "Expired"
                              ? "bg-danger"
                              : "bg-warning"
                            }`}
                        >
                          <i className={`fas ${offer.status === "Active" ? 'fa-check' :
                            offer.status === "Expired" ? 'fa-times' : 'fa-pause'
                            } me-1`}></i>
                          {offer.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => toggleOfferDetails(offer._id)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleEdit(offer)}
                            title="Edit Offer"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(offer._id)}
                            title="Delete Offer"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Offer Details Row */}
                    {showDetails[offer._id] && (
                      <OfferDetailsRow offer={offer} />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {filteredOffers.length > itemsPerPage && (
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <li
                key={number}
                className={`page-item ${currentPage === number ? "active" : ""}`}
              >
                <button
                  onClick={() => paginate(number)}
                  className="page-link"
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
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOffers.length)} of {filteredOffers.length} offers
        {searchQuery && ` (filtered from ${offers.length} total offers)`}
      </div>

      {/* Add Offer Form Modal */}
      {showAddForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
              }}>
                <h4 className="modal-title text-white">
                  <i className="fas fa-plus me-2"></i>
                  Add New Offer
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
                        Offer Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter offer name"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-tags text-success me-1"></i>
                        Offer Type <span className="text-danger">*</span>
                      </label>
                      <select
                        name="offerType"
                        className="form-control"
                        value={formData.offerType}
                        onChange={handleInputChange}
                      >
                        <option value="category">Category Offer</option>
                        <option value="product">Product Offer</option>
                        <option value="banner">Banner Offer</option>
                        <option value="promo_code">Promo Code</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-align-left text-info me-1"></i>
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="description"
                      className={`form-control ${errors.description ? "is-invalid" : ""}`}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter offer description"
                      rows="3"
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* Dynamic Fields Based on Offer Type */}
                  {formData.offerType === 'category' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-folder text-warning me-1"></i>
                        Select Category <span className="text-danger">*</span>
                      </label>
                      <select
                        name="category"
                        className={`form-control ${errors.category ? "is-invalid" : ""}`}
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                    </div>
                  )}

                  {formData.offerType === 'product' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-cube text-warning me-1"></i>
                        Select Products <span className="text-danger">*</span>
                      </label>

                      {/* Product Selector */}
                      <select
                        className={`form-control ${errors.products ? "is-invalid" : ""} mb-2`}
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          handleProductSelection(e);
                        }}
                      >
                        <option value="">Select a product to add</option>
                        {products
                          .filter(prod => !formData.products.includes(prod._id))
                          .map(prod => (
                            <option key={prod._id} value={prod._id}>
                              {prod.name} - ₹{prod.price}
                            </option>
                          ))
                        }
                      </select>
                      {errors.products && <div className="invalid-feedback">{errors.products}</div>}

                      {/* Selected Products Display */}
                      {formData.products.length > 0 && (
                        <div className="mt-3">
                          <label className="form-label fw-bold">
                            <i className="fas fa-check-circle text-success me-1"></i>
                            Selected Products ({formData.products.length})
                          </label>
                          <div className="selected-products-container">
                            {formData.products.map(productId => {
                              const product = products.find(p => p._id === productId);
                              return product ? (
                                <div key={productId} className="selected-product-item bg-light rounded p-2 mb-2 d-flex justify-content-between align-items-center">
                                  <div>
                                    <span className="fw-bold">{product.name}</span>
                                    <small className="text-muted ms-2">- ₹{product.price}</small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeProduct(productId)}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.offerType === 'banner' && (
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
                      {errors.image && <div className="invalid-feedback">{errors.image}</div>}
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
                  )}

                  {formData.offerType === 'promo_code' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-ticket-alt text-success me-1"></i>
                        Promo Code <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="promoCode"
                        className={`form-control ${errors.promoCode ? "is-invalid" : ""}`}
                        value={formData.promoCode}
                        onChange={handleInputChange}
                        placeholder="Enter promo code (e.g., SUMMER20)"
                      />
                      {errors.promoCode && <div className="invalid-feedback">{errors.promoCode}</div>}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-percentage text-danger me-1"></i>
                        Discount Type <span className="text-danger">*</span>
                      </label>
                      <select
                        name="discountType"
                        className="form-control"
                        value={formData.discountType}
                        onChange={handleInputChange}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-rupee-sign text-success me-1"></i>
                        Discount Value <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="discountValue"
                        className={`form-control ${errors.discountValue ? "is-invalid" : ""}`}
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        placeholder={formData.discountType === 'percentage' ? "e.g., 20" : "e.g., 100"}
                        min="0"
                      />
                      {errors.discountValue && <div className="invalid-feedback">{errors.discountValue}</div>}
                    </div>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-chart-line text-warning me-1"></i>
                        Maximum Discount (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="maxDiscount"
                        className={`form-control ${errors.maxDiscount ? "is-invalid" : ""}`}
                        value={formData.maxDiscount}
                        onChange={handleInputChange}
                        placeholder="e.g., 500"
                        min="0"
                      />
                      {errors.maxDiscount && <div className="invalid-feedback">{errors.maxDiscount}</div>}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-shopping-cart text-info me-1"></i>
                        Minimum Order Value (₹)
                      </label>
                      <input
                        type="number"
                        name="minOrderValue"
                        className="form-control"
                        value={formData.minOrderValue}
                        onChange={handleInputChange}
                        placeholder="e.g., 1000"
                        min="0"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-users text-secondary me-1"></i>
                        Target Audience
                      </label>
                      <select
                        name="targetAudience"
                        className="form-control"
                        value={formData.targetAudience}
                        onChange={handleInputChange}
                      >
                        <option value="all">All Users</option>
                        <option value="new_users">New Users</option>
                        <option value="existing_users">Existing Users</option>
                        <option value="vip">VIP Users</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-play-circle text-success me-1"></i>
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
                        value={formData.startDate}
                        onChange={handleInputChange}
                      />
                      {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-stop-circle text-danger me-1"></i>
                        End Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                      {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-chart-bar text-warning me-1"></i>
                      Usage Limit (Leave empty for unlimited)
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      className="form-control"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      placeholder="e.g., 100"
                      min="0"
                    />
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
                      Add Offer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offer Form Modal */}
      {showEditForm && selectedOffer && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{
                background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'
              }}>
                <h4 className="modal-title text-white">
                  <i className="fas fa-edit me-2"></i>
                  Edit Offer
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
                        Offer Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-tags text-success me-1"></i>
                        Offer Type
                      </label>
                      <select
                        name="offerType"
                        className="form-control"
                        value={formData.offerType}
                        onChange={handleInputChange}
                      >
                        <option value="category">Category Offer</option>
                        <option value="product">Product Offer</option>
                        <option value="banner">Banner Offer</option>
                        <option value="promo_code">Promo Code</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-align-left text-info me-1"></i>
                      Description
                    </label>
                    <textarea
                      name="description"
                      className={`form-control ${errors.description ? "is-invalid" : ""}`}
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* Dynamic Fields for Edit */}
                  {formData.offerType === 'category' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-folder text-warning me-1"></i>
                        Select Category
                      </label>
                      <select
                        name="category"
                        className={`form-control ${errors.category ? "is-invalid" : ""}`}
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                      {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                    </div>
                  )}

                  {formData.offerType === 'product' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-cube text-warning me-1"></i>
                        Select Products <span className="text-danger">*</span>
                      </label>

                      {/* Product Selector */}
                      <select
                        className={`form-control ${errors.products ? "is-invalid" : ""} mb-2`}
                        onChange={handleProductSelection}
                        defaultValue=""
                      >
                        <option value="">Select a product to add</option>
                        {products
                          .filter(prod => !formData.products.includes(prod._id))
                          .map(prod => (
                            <option key={prod._id} value={prod._id}>
                              {prod.name} - ₹{prod.price}
                            </option>
                          ))
                        }
                      </select>
                      {errors.products && <div className="invalid-feedback">{errors.products}</div>}

                      {/* Selected Products Display */}
                      {formData.products.length > 0 && (
                        <div className="mt-3">
                          <label className="form-label fw-bold">
                            <i className="fas fa-check-circle text-success me-1"></i>
                            Selected Products ({formData.products.length})
                          </label>
                          <div className="selected-products-container">
                            {formData.products.map(productId => {
                              const product = products.find(p => p._id === productId);
                              return product ? (
                                <div key={productId} className="selected-product-item bg-light rounded p-2 mb-2 d-flex justify-content-between align-items-center">
                                  <div>
                                    <span className="fw-bold">{product.name}</span>
                                    <small className="text-muted ms-2">- ₹{product.price}</small>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeProduct(productId)}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.offerType === 'banner' && (
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          <i className="fas fa-image text-info me-1"></i>
                          Current Banner
                        </label>
                        {selectedOffer.bannerImage && (
                          <img
                            src={`${url}/public/images/offer_images/${selectedOffer.bannerImage}`}
                            alt={selectedOffer.name}
                            className="img-fluid d-block rounded-3 shadow-sm"
                            style={{ border: '2px solid #dee2e6' }}
                          />
                        )}
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
                        {errors.image && <small className="text-danger">{errors.image}</small>}
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
                  )}

                  {formData.offerType === 'promo_code' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-ticket-alt text-success me-1"></i>
                        Promo Code
                      </label>
                      <input
                        type="text"
                        name="promoCode"
                        className={`form-control ${errors.promoCode ? "is-invalid" : ""}`}
                        value={formData.promoCode}
                        onChange={handleInputChange}
                      />
                      {errors.promoCode && <div className="invalid-feedback">{errors.promoCode}</div>}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-percentage text-danger me-1"></i>
                        Discount Type
                      </label>
                      <select
                        name="discountType"
                        className="form-control"
                        value={formData.discountType}
                        onChange={handleInputChange}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-rupee-sign text-success me-1"></i>
                        Discount Value
                      </label>
                      <input
                        type="number"
                        name="discountValue"
                        className={`form-control ${errors.discountValue ? "is-invalid" : ""}`}
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        min="0"
                      />
                      {errors.discountValue && <div className="invalid-feedback">{errors.discountValue}</div>}
                    </div>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-chart-line text-warning me-1"></i>
                        Maximum Discount (₹)
                      </label>
                      <input
                        type="number"
                        name="maxDiscount"
                        className={`form-control ${errors.maxDiscount ? "is-invalid" : ""}`}
                        value={formData.maxDiscount}
                        onChange={handleInputChange}
                        min="0"
                      />
                      {errors.maxDiscount && <div className="invalid-feedback">{errors.maxDiscount}</div>}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-shopping-cart text-info me-1"></i>
                        Minimum Order Value (₹)
                      </label>
                      <input
                        type="number"
                        name="minOrderValue"
                        className="form-control"
                        value={formData.minOrderValue}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-users text-secondary me-1"></i>
                        Target Audience
                      </label>
                      <select
                        name="targetAudience"
                        className="form-control"
                        value={formData.targetAudience}
                        onChange={handleInputChange}
                      >
                        <option value="all">All Users</option>
                        <option value="new_users">New Users</option>
                        <option value="existing_users">Existing Users</option>
                        <option value="vip">VIP Users</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-play-circle text-success me-1"></i>
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
                        value={formData.startDate}
                        onChange={handleInputChange}
                      />
                      {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        <i className="fas fa-stop-circle text-danger me-1"></i>
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                      {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="fas fa-chart-bar text-warning me-1"></i>
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      className="form-control"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      min="0"
                    />
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

export default AdOffer;
import React, { useState, useEffect } from "react";

const CosmeticOffers = () => {
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [editOfferId, setEditOfferId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    maxdiscount: "",
    description: "",
    rate: "",
    startDate: "",
    endDate: "",
    orderTotal: "",
    banner: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [expandedOfferId, setExpandedOfferId] = useState(null);

  // Pre-defined cosmetic offers data
  const cosmeticOffersData = [
    {
      _id: "1",
      title: "Beauty Bundle Bonanza",
      rate: "25%",
      maxdiscount: "500",
      description: "Get 25% off when you buy any 3 or more beauty products. Mix and match from skincare, makeup, and haircare collections.",
      orderTotal: "1500",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "beauty-bundle.jpg",
      discount: "25%",
      validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "2",
      title: "First Time Glow",
      rate: "30%",
      maxdiscount: "300",
      description: "Welcome to beauty paradise! First-time customers get 30% off on their maiden purchase. Start your glow journey with us.",
      orderTotal: "800",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "first-time-glow.jpg",
      discount: "30%",
      validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "3",
      title: "Skincare Sunday Special",
      rate: "20%",
      maxdiscount: "400",
      description: "Every Sunday is skincare day! Get 20% off on all skincare products including cleansers, serums, moisturizers, and masks.",
      orderTotal: "1000",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "skincare-sunday.jpg",
      discount: "20%",
      validity: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "4",
      title: "Makeup Monday Madness",
      rate: "35%",
      maxdiscount: "700",
      description: "Start your week with glamour! Every Monday, enjoy 35% off on all makeup products - lipsticks, foundations, eyeshadows, and more.",
      orderTotal: "1200",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "makeup-monday.jpg",
      discount: "35%",
      validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "5",
      title: "Premium Brand Privilege",
      rate: "15%",
      maxdiscount: "1000",
      description: "Exclusive offer on premium brands like Lakme, Maybelline, L'Oreal, and more. Luxury beauty at affordable prices.",
      orderTotal: "2000",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "premium-brands.jpg",
      discount: "15%",
      validity: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "6",
      title: "K-Beauty Fever",
      rate: "28%",
      maxdiscount: "650",
      description: "Get the Korean glass skin look! 28% off on K-beauty products including sheet masks, essences, and serums.",
      orderTotal: "1300",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "k-beauty.jpg",
      discount: "28%",
      validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "7",
      title: "Summer Glow Special",
      rate: "25%",
      maxdiscount: "600",
      description: "Beat the summer heat with our glow collection! 25% off on sunscreens, summer makeup, and refreshing skincare products.",
      orderTotal: "1200",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "summer-glow.jpg",
      discount: "25%",
      validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    },
    {
      _id: "8",
      title: "Bridal Beauty Package",
      rate: "20%",
      maxdiscount: "1500",
      description: "Complete bridal beauty solution! 20% off on bridal makeup kits, skincare prep products, and hair styling essentials.",
      orderTotal: "3000",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      banner: "bridal-beauty.jpg",
      discount: "20%",
      validity: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "Active"
    }
  ];

  // Initialize offers data
  useEffect(() => {
    setOffers(cosmeticOffersData);
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = "Title is required.";
    if (!formData.description.trim())
      tempErrors.description = "Description is required.";
    if (!formData.maxdiscount.trim())
      tempErrors.maxdiscount = "Maximum Discount Amount is required.";
    if (!formData.rate.trim()) tempErrors.rate = "Rate is required.";
    else if (!/^\d+%$/.test(formData.rate))
      tempErrors.rate = "Rate should be in percentage format (e.g., 30%).";
    if (!formData.startDate) tempErrors.startDate = "Start Date is required.";
    if (!formData.endDate) tempErrors.endDate = "End Date is required.";
    else {
      const today = new Date().toISOString().split("T")[0];
      if (formData.endDate < today && !isEditMode)
        tempErrors.endDate = "Date cannot be in the past.";
    }
    if (!formData.orderTotal.trim())
      tempErrors.orderTotal = "Order Total is required.";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsLoading(true);
        
        if (isEditMode) {
          // Update existing offer
          const updatedOffers = offers.map(offer =>
            offer._id === editOfferId
              ? {
                  ...offer,
                  ...formData,
                  discount: formData.rate,
                  validity: formData.endDate
                }
              : offer
          );
          setOffers(updatedOffers);
          setMessage({ text: "Offer updated successfully!", type: "success" });
        } else {
          // Add new offer
          const newOffer = {
            _id: (offers.length + 1).toString(),
            ...formData,
            discount: formData.rate,
            validity: formData.endDate,
            status: "Active"
          };
          setOffers([...offers, newOffer]);
          setMessage({ text: "Offer added successfully!", type: "success" });
        }
        resetForm();
      } catch (error) {
        setMessage({
          text: `Failed to ${isEditMode ? "update" : "add"} offer`,
          type: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (id) => {
    const offerToEdit = offers.find((offer) => offer._id === id);
    if (offerToEdit) {
      setFormData({
        title: offerToEdit.title,
        description: offerToEdit.description,
        maxdiscount: offerToEdit.maxdiscount || "",
        rate: offerToEdit.discount || offerToEdit.rate || "",
        startDate: offerToEdit.startDate,
        endDate: offerToEdit.endDate || offerToEdit.validity,
        orderTotal: offerToEdit.orderTotal || "",
        banner: offerToEdit.banner || "",
      });
      setEditOfferId(id);
      setIsEditMode(true);
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      const updatedOffers = offers.filter(offer => offer._id !== id);
      setOffers(updatedOffers);
      setMessage({ text: "Offer deleted successfully!", type: "success" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      maxdiscount: "",
      description: "",
      rate: "",
      startDate: "",
      endDate: "",
      orderTotal: "",
      banner: "",
    });
    setIsEditMode(false);
    setEditOfferId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, banner: file.name });
    }
  };

  const handleView = (id) => {
    setExpandedOfferId(expandedOfferId === id ? null : id);
  };

  const handleQuickAdd = (offerTemplate) => {
    setFormData({
      title: offerTemplate.title,
      description: offerTemplate.description,
      maxdiscount: offerTemplate.maxdiscount,
      rate: offerTemplate.rate,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      orderTotal: offerTemplate.orderTotal,
      banner: offerTemplate.banner,
    });
    setShowForm(true);
  };

  // Quick templates for easy addition
  const quickTemplates = [
    {
      title: "Flash Sale - 40% Off",
      rate: "40%",
      maxdiscount: "800",
      description: "Limited time flash sale! 40% off on selected cosmetic items. Hurry, stock limited!",
      orderTotal: "999",
      banner: "flash-sale.jpg"
    },
    {
      title: "Buy 2 Get 1 Free",
      rate: "33%",
      maxdiscount: "500",
      description: "Mix and match any 3 products and get the lowest priced item absolutely free!",
      orderTotal: "750",
      banner: "buy2get1.jpg"
    },
    {
      title: "Organic Beauty Week",
      rate: "22%",
      maxdiscount: "450",
      description: "Celebrate natural beauty! 22% off on all organic and chemical-free beauty products.",
      orderTotal: "1100",
      banner: "organic-beauty.jpg"
    }
  ];

  const filteredOffers = offers.filter((offer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      offer.title?.toLowerCase().includes(searchLower) ||
      offer.description?.toLowerCase().includes(searchLower) ||
      offer.discount?.toLowerCase().includes(searchLower) ||
      offer.maxdiscount?.toString().toLowerCase().includes(searchLower) ||
      offer.orderTotal?.toString().toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOffers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container-fluid p-4" style={{backgroundColor: '#fef7f7'}}>
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h2 className="display-4 text-primary mb-0">💄 Cosmetic Offers Manager</h2>
          <p className="text-muted">Manage your beauty and cosmetic offers</p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage({ text: "", type: "" })}
          ></button>
        </div>
      )}

      {/* Quick Templates Section */}
      <div className="card mb-4" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="card-body">
          <h5 className="text-white mb-3">🚀 Quick Add Templates</h5>
          <div className="row">
            {quickTemplates.map((template, index) => (
              <div key={index} className="col-md-4 mb-2">
                <div className="card bg-light">
                  <div className="card-body p-3">
                    <h6 className="card-title text-primary">{template.title}</h6>
                    <p className="card-text small">{template.description.substring(0, 60)}...</p>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleQuickAdd(template)}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search cosmetic offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 text-end">
          <button
            className="btn btn-gradient"
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none'
            }}
            onClick={() => {
              if (isEditMode || showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
          >
            {showForm
              ? isEditMode
                ? "❌ Cancel Edit"
                : "❌ Close Form"
              : "✨ Add New Offer"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4" style={{boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
          <div className="card-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <h4 className="text-white mb-0">
              {isEditMode ? "✏️ Edit Offer" : "🎨 Add New Cosmetic Offer"}
            </h4>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">💫 Title:</label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? "is-invalid" : ""}`}
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Summer Glow Special"
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">📝 Description:</label>
                  <textarea
                    className={`form-control ${errors.description ? "is-invalid" : ""}`}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Describe your amazing cosmetic offer..."
                  ></textarea>
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">💸 Discount Rate:</label>
                  <input
                    type="text"
                    className={`form-control ${errors.rate ? "is-invalid" : ""}`}
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    placeholder="e.g., 25%"
                  />
                  {errors.rate && <div className="invalid-feedback">{errors.rate}</div>}
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">💰 Max Discount (₹):</label>
                  <input
                    type="text"
                    className={`form-control ${errors.maxdiscount ? "is-invalid" : ""}`}
                    name="maxdiscount"
                    value={formData.maxdiscount}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                  />
                  {errors.maxdiscount && <div className="invalid-feedback">{errors.maxdiscount}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">🛒 Min Order Total (₹):</label>
                  <input
                    type="text"
                    className={`form-control ${errors.orderTotal ? "is-invalid" : ""}`}
                    name="orderTotal"
                    value={formData.orderTotal}
                    onChange={handleInputChange}
                    placeholder="e.g., 1000"
                  />
                  {errors.orderTotal && <div className="invalid-feedback">{errors.orderTotal}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">📅 Start Date:</label>
                  <input
                    type="date"
                    className={`form-control ${errors.startDate ? "is-invalid" : ""}`}
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                  {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">📅 End Date:</label>
                  <input
                    type="date"
                    className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                  {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">🖼️ Banner Image:</label>
                  <input
                    type="file"
                    className="form-control"
                    name="banner"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
                <div className="col-md-4 mb-3 d-flex align-items-end">
                  <button
                    type="submit"
                    className="btn me-2"
                    style={{
                      background: 'linear-gradient(45deg, #28a745, #20c997)',
                      color: 'white',
                      border: 'none'
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {isEditMode ? "Updating..." : "Adding..."}
                      </span>
                    ) : isEditMode ? (
                      "💾 Update Offer"
                    ) : (
                      "➕ Add Offer"
                    )}
                  </button>
                  {isEditMode && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && !showForm ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card" style={{boxShadow: '0 5px 15px rgba(0,0,0,0.08)'}}>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                <tr className="text-white">
                  <th>🆔 Offer ID</th>
                  <th>💫 Title</th>
                  <th>💸 Discount</th>
                  <th>📅 Valid Until</th>
                  <th>📊 Status</th>
                  <th>⚙️ Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="text-muted">
                        <i className="fas fa-search fa-2x mb-3"></i>
                        <p>{searchTerm ? "No matching offers found" : "No offers available"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((offer) => (
                    <React.Fragment key={offer._id}>
                      <tr style={{borderLeft: '4px solid #667eea'}}>
                        <td><code>{offer._id}</code></td>
                        <td><strong className="text-primary">{offer.title}</strong></td>
                        <td>
                          <span className="badge bg-success fs-6">{offer.discount}</span>
                        </td>
                        <td>
                          {new Date(offer.validity || offer.endDate).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <span
                            className={`badge fs-6 ${
                              new Date(offer.validity || offer.endDate) >= new Date()
                                ? "bg-success"
                                : "bg-danger"
                            }`}
                          >
                            {new Date(offer.validity || offer.endDate) >= new Date()
                              ? "🟢 Active"
                              : "🔴 Expired"}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleView(offer._id)}
                              title="View Details"
                            >
                              {expandedOfferId === offer._id ? "👁️ Hide" : "👁️ View"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleEdit(offer._id)}
                              title="Edit Offer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(offer._id)}
                              title="Delete Offer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOfferId === offer._id && (
                        <tr>
                          <td colSpan="6">
                            <div className="p-4" style={{backgroundColor: '#f8f9ff', borderRadius: '10px'}}>
                              <h6 className="text-primary mb-3">📋 Offer Details</h6>
                              <div className="row">
                                <div className="col-md-6">
                                  <p><strong>📝 Description:</strong> {offer.description}</p>
                                  <p><strong>💰 Maximum Discount:</strong> ₹{offer.maxdiscount || "N/A"}</p>
                                  <p><strong>🛒 Minimum Order Total:</strong> ₹{offer.orderTotal || "N/A"}</p>
                                </div>
                                <div className="col-md-6">
                                  <p><strong>📅 Start Date:</strong> {new Date(offer.startDate || offer.validity).toLocaleDateString('en-IN')}</p>
                                  <p><strong>📅 End Date:</strong> {new Date(offer.endDate || offer.validity).toLocaleDateString('en-IN')}</p>
                                  <p><strong>🖼️ Banner:</strong> {offer.banner || "No banner"}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredOffers.length > itemsPerPage && (
        <div className="row mt-4">
          <div className="col-12 d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    « Previous
                  </button>
                </li>
                {pageNumbers.map((number) => (
                  <li
                    key={number}
                    className={`page-item ${currentPage === number ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(number)}
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Statistics Card */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card text-center" style={{background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)'}}>
            <div className="card-body text-white">
              <h3>{offers.length}</h3>
              <p className="mb-0">Total Offers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{background: 'linear-gradient(135deg, #51cf66, #40c057)'}}>
            <div className="card-body text-white">
              <h3>{offers.filter(offer => new Date(offer.validity || offer.endDate) >= new Date()).length}</h3>
              <p className="mb-0">Active Offers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{background: 'linear-gradient(135deg, #ffd43b, #fab005)'}}>
            <div className="card-body text-white">
              <h3>{offers.filter(offer => new Date(offer.validity || offer.endDate) < new Date()).length}</h3>
              <p className="mb-0">Expired Offers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center" style={{background: 'linear-gradient(135deg, #748ffc, #5f3dc4)'}}>
            <div className="card-body text-white">
              <h3>{Math.round(offers.reduce((sum, offer) => sum + parseFloat(offer.rate.replace('%', '')), 0) / offers.length) || 0}%</h3>
              <p className="mb-0">Avg Discount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 text-center text-muted">
        <p>💄 Cosmetic Offers Management System | Built for Beauty Businesses 🌟</p>
      </div>
    </div>
  );
};

export default CosmeticOffers;
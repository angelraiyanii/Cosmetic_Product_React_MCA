import React, { Component } from "react";
import axios from "axios";
import u1 from "../images/pro1.jpeg";

export class AdUser extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Login: [],
      showUserView: false,
      selectedUser: null,
      error: null,
      successMessage: null,
      showUserForm: false,
      showUpdateFormUser: false,
      searchQuery: "",
      formData: {
        fullname: "",
        email: "",
        mobile: "",
        gender: "",
        address: "",
        password: "",
        pincode: "",
        profilePic: null,
      },
      errors: {},
      imagePreview: null,

      currentPage: 1,
      itemsPerPage: 3,
    };
  }

  handlePageChange = (pageNumber) => {
    this.setState({
      currentPage: pageNumber,
    });
  };

  componentDidMount() {
    const userData = localStorage.getItem("user") || localStorage.getItem("admin");
    if (!userData) {
      window.location.href = "/Login";
      return;
    }
    axios
      .get("http://localhost:5000/api/UserModel/all-Usermodel")
      .then((res) => {
        if (Array.isArray(res.data.Usermodel)) {
          this.setState({ Login: res.data.Usermodel });
        } else {
          throw new Error("Invalid response format");
        }
      })
      .catch((error) => {
        this.setState({
          error: error.response?.data?.error || "Failed to fetch User",
        });
        console.error(error);
      });
  }

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  showUserView = (user) => {
    this.setState({ selectedUser: user, showUserView: true });
  };

  hideUserView = () => {
    this.setState({ showUserView: false, selectedUser: null });
  };

  handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      axios
        .delete(`http://localhost:5000/api/UserModel/${id}`)
        .then(() => {
          this.setState((prevState) => ({
            Login: prevState.Login.filter((user) => user._id !== id),
            successMessage: "✅ User deleted successfully.",
            error: null,
          }));
          setTimeout(() => this.setState({ successMessage: null }), 8000);
        })
        .catch(() => {
          this.setState({
            error: "❌ Error deleting user",
            successMessage: null,
          });
        });
    }
  };

  showUserForm = () => {
    this.setState({
      showUserForm: true,
      showUpdateFormUser: false,
      formData: {
        fullname: "",
        email: "",
        mobile: "",
        gender: "",
        address: "",
        password: "",
        pincode: "",
        profilePic: null,
      },
      imagePreview: null,
    });
  };

  showUpdateFormUser = (user) => {
    this.setState({
      showUserForm: false,
      showUpdateFormUser: true,
      selectedUser: user,
      formData: {
        fullname: user.fullname || "",
        email: user.email || "",
        mobile: user.mobile || "",
        gender: user.gender || "",
        address: user.address || "",
        password: user.password || "",
        pincode: user.pincode || "",
        profilePic: null,
      },
      imagePreview: user.profilePic
        ? `http://localhost:5000/public/images/profile_pictures/${user.profilePic}`
        : null,
    });
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
    }));
  };

  handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState((prevState) => ({
        formData: { ...prevState.formData, profilePic: file },
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  validateForm = () => {
    const { formData, showUpdateFormUser } = this.state;
    let errors = {};

    if (!formData.fullname) errors.fullname = "Full name is required.";
    else if (formData.fullname.length < 3)
      errors.fullname = "Full name must be at least 3 characters.";

    if (!formData.email) errors.email = "Email is required.";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
      errors.email = "Invalid email format.";

    if (!formData.mobile) errors.mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(formData.mobile))
      errors.mobile = "Enter a valid 10-digit mobile number.";

    if (!formData.gender) errors.gender = "Please select a gender.";

    if (!formData.address) errors.address = "Address is required.";

    if (!showUpdateFormUser && !formData.password)
      errors.password = "Password is required.";

    if (!formData.pincode) errors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(formData.pincode))
      errors.pincode = "Pincode must be a 6-digit number.";

    if (!showUpdateFormUser && !formData.profilePic)
      errors.profilePic = "Profile image is required.";

    return errors;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const errors = this.validateForm();

    if (Object.keys(errors).length === 0) {
      const { formData, showUpdateFormUser, selectedUser } = this.state;
      const formDataObj = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataObj.append(key, formData[key]);
        }
      });

      try {
        let response;
        if (showUpdateFormUser) {
          response = await axios.put(
            `http://localhost:5000/api/UserModel/${selectedUser._id}`,
            formDataObj,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          this.setState((prevState) => ({
            Login: prevState.Login.map((user) =>
              user._id === selectedUser._id ? response.data.Login : user
            ),
            showUpdateFormUser: false,
            successMessage: "✅ User updated successfully.",
            error: null,
          }));
        } else {
          response = await axios.post(
            "http://localhost:5000/api/UserModel/add-Login",
            formDataObj,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          this.setState((prevState) => ({
            Login: [...prevState.Login, response.data.Login],
            showUserForm: false,
            successMessage: "✅ User added successfully. Please verify email.",
            error: null,
          }));
        }

        this.setState({
          formData: {
            fullname: "",
            email: "",
            mobile: "",
            gender: "",
            address: "",
            password: "",
            pincode: "",
            profilePic: null,
          },
          imagePreview: null,
          errors: {},
        });

        setTimeout(() => this.setState({ successMessage: null }), 8000);
      } catch (error) {
        this.setState({
          error: error.response?.data?.error || "Something went wrong",
          successMessage: null,
        });
      }
    } else {
      this.setState({ errors });
    }
  };

  renderForm = () => {
    const { formData, errors, imagePreview, showUpdateFormUser } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Full Name</label>
            <input
              type="text"
              name="fullname"
              className={`form-control ${errors.fullname ? "is-invalid" : ""}`}
              value={formData.fullname}
              onChange={this.handleChange}
              placeholder="Enter your full name"
            />
            {errors.fullname && (
              <div className="invalid-feedback">{errors.fullname}</div>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={formData.email}
              onChange={this.handleChange}
              placeholder="Enter your email"
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Mobile No</label>
            <input
              type="tel"
              name="mobile"
              className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
              value={formData.mobile}
              onChange={this.handleChange}
              placeholder="Enter your mobile number"
            />
            {errors.mobile && (
              <div className="invalid-feedback">{errors.mobile}</div>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Gender</label>
            <select
              name="gender"
              className={`form-control ${errors.gender ? "is-invalid" : ""}`}
              value={formData.gender}
              onChange={this.handleChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && (
              <div className="invalid-feedback">{errors.gender}</div>
            )}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">Address</label>
          <textarea
            name="address"
            className={`form-control ${errors.address ? "is-invalid" : ""}`}
            value={formData.address}
            onChange={this.handleChange}
            placeholder="Enter your address"
            rows="2"
          />
          {errors.address && (
            <div className="invalid-feedback">{errors.address}</div>
          )}
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Password</label>
            <input
              type="password"
              name="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={formData.password}
              onChange={this.handleChange}
              placeholder="Enter your password"
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Pincode</label>
            <input
              type="text"
              name="pincode"
              className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
              value={formData.pincode}
              onChange={this.handleChange}
              placeholder="Enter your pincode"
            />
            {errors.pincode && (
              <div className="invalid-feedback">{errors.pincode}</div>
            )}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold">Profile Image</label>
          <input
            type="file"
            name="profilePic"
            className={`form-control ${errors.profilePic ? "is-invalid" : ""}`}
            onChange={this.handleFileChange}
          />
          {errors.profilePic && (
            <div className="invalid-feedback">{errors.profilePic}</div>
          )}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 img-thumbnail"
              width="100"
            />
          )}
        </div>
        <button type="submit" className="btn btn-primary w-50">
          {showUpdateFormUser ? "Update User" : "Add User"}
        </button>
      </form>
    );
  };

  // Beautiful User Details Modal/Card
  renderUserDetails = () => {
    const { selectedUser } = this.state;
    if (!selectedUser) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            {/* Header with gradient */}
            <div className="modal-header border-0 position-relative" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem 0.5rem 0 0'
            }}>
              <div className="d-flex align-items-center w-100">
                <div className="position-relative me-3">
                  <img
                    src={
                      selectedUser.profilePic
                        ? `http://localhost:5000/public/images/profile_pictures/${selectedUser.profilePic}`
                        : u1
                    }
                    alt="User Profile"
                    className="rounded-circle border border-white border-3"
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  />
                  <span className={`position-absolute bottom-0 end-0 badge rounded-pill ${selectedUser.status === 'Active' ? 'bg-success' : 'bg-danger'
                    }`} style={{ fontSize: '0.7rem' }}>
                    {selectedUser.status === 'Active' ? '●' : '●'}
                  </span>
                </div>
                <div className="flex-grow-1 text-white">
                  <h4 className="mb-1 fw-bold">{selectedUser.fullname}</h4>
                  <p className="mb-0 opacity-75">
                    <i className="fas fa-envelope me-1"></i>
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white position-absolute end-0 top-0 m-3"
                onClick={this.hideUserView}
                style={{ fontSize: '1.2rem' }}
              ></button>
            </div>

            {/* Body with detailed info */}
            <div className="modal-body p-4" style={{ backgroundColor: '#f8f9ff' }}>
              <div className="row g-4">
                {/* Personal Information Card */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-primary text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-user me-2"></i>
                        Personal Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="info-item mb-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-venus-mars text-primary me-2"></i>
                          <small className="text-muted">Gender</small>
                        </div>
                        <div className="fw-bold text-capitalize">{selectedUser.gender}</div>
                      </div>
                      <div className="info-item mb-3">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-phone text-success me-2"></i>
                          <small className="text-muted">Mobile</small>
                        </div>
                        <div className="fw-bold">{selectedUser.mobile}</div>
                      </div>
                      <div className="info-item">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-map-pin text-danger me-2"></i>
                          <small className="text-muted">Pin Code</small>
                        </div>
                        <div className="fw-bold">{selectedUser.pincode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Card */}
                <div className="col-md-6">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-header bg-info text-white border-0">
                      <h6 className="mb-0">
                        <i className="fas fa-map-marker-alt me-2"></i>
                        Address Information
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="info-item">
                        <div className="d-flex align-items-start">
                          <i className="fas fa-home text-warning me-2 mt-1"></i>
                          <div>
                            <small className="text-muted">Full Address</small>
                            <div className="fw-bold">{selectedUser.address}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-center mt-4">
                <span className={`badge fs-6 px-4 py-2 ${selectedUser.status === 'Active'
                  ? 'bg-success-subtle text-success border border-success'
                  : 'bg-danger-subtle text-danger border border-danger'
                  }`}>
                  <i className={`fas ${selectedUser.status === 'Active' ? 'fa-check-circle' : 'fa-times-circle'} me-2`}></i>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            {/* Footer with action buttons */}
            <div className="modal-footer border-0 bg-light">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  this.hideUserView();
                  this.showUpdateFormUser(selectedUser);
                }}
              >
                <i className="fas fa-edit me-1"></i>
                Edit User
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={this.hideUserView}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const {
      Login,
      showUserView,
      selectedUser,
      error,
      successMessage,
      searchQuery,
    } = this.state;

    // Filter users based on search query
    const filteredUsers = Login.filter(
      (user) =>
        user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const { currentPage, itemsPerPage } = this.state;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Generate page numbers
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <center>
        <div className="container mt-4">
          <h2 className="text-center mb-4">Manage Users</h2>
          <div className="d-flex justify-content-between mb-3">
            <div className="d-flex">
              <input
                type="text"
                className="form-control me-2"
                placeholder="🔎Search users..."
                value={searchQuery}
                onChange={this.handleSearchChange}
              />
            </div>
            <button className="btn btn-success" onClick={this.showUserForm}>
              <i className="fas fa-plus me-2"></i>
              Add User
            </button>
          </div>
          {successMessage && (
            <p className="text-success text-center">{successMessage}</p>
          )}
          {error && <p className="text-danger text-center">{error}</p>}
        </div>

        {/* Beautiful User Details Modal */}
        {showUserView && this.renderUserDetails()}

        {this.state.showUserForm && (
          <div className="container d-flex justify-content-center align-items-center">
            <div
              className="card shadow-lg p-4 w-100"
              style={{ maxWidth: "600px" }}
            >
              <h2 className="text-center mb-2">Add User</h2>
              {this.renderForm()}
            </div>
          </div>
        )}

        {this.state.showUpdateFormUser && (
          <div className="container d-flex justify-content-center align-items-center">
            <div
              className="card shadow-lg p-4 w-100"
              style={{ maxWidth: "600px" }}
            >
              <h2 className="text-center mb-2">Update User</h2>
              {this.renderForm()}
            </div>
          </div>
        )}

        <div className="container mt-5">
          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle">
              <thead className="table table-bordered">
                <tr>
                  <th>Sr No</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user, index) => (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td className="text-start">
                        <div className="d-flex align-items-center">
                          <img
                            src={
                              user.profilePic
                                ? `http://localhost:5000/public/images/profile_pictures/${user.profilePic}`
                                : u1
                            }
                            alt="User"
                            className="rounded-circle me-2"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              border: "2px solid #ddd",
                            }}
                          />
                          <span>{user.fullname}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.status === "Active"
                          ? "bg-success"
                          : "bg-danger"
                          }`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {/* View Icon */}
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={() => this.showUserView(user)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {/* Update Icon */}
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => this.showUpdateFormUser(user)}
                            title="Edit User"
                          >
                            <i className="fas fa-edit"></i>
                          </button>

                          {/* Delete Icon */}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => this.handleDelete(user._id)}
                            title="Delete User"
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

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="row mt-3">
            <div className="col-md-12 d-flex justify-content-center">
              <nav>
                <ul className="pagination">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => this.handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Prev
                    </button>
                  </li>

                  {pageNumbers.map((number) => (
                    <li
                      key={number}
                      className={`page-item ${currentPage === number ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => this.handlePageChange(number)}
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
                      onClick={() => this.handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </center>
    );
  }
}

export default AdUser;
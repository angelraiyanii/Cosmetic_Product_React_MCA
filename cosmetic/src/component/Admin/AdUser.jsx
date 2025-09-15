import React, { Component } from "react";
import axios from "axios";
import u1 from "../images/user1.png";
import { Link } from "react-router-dom";

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
      searchQuery: "", // Added search query state
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
    axios
      .get("http://localhost:5000/api/Login/all-Login")
      .then((res) => {
        if (Array.isArray(res.data.Login)) {
          this.setState({ Login: res.data.Login });
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

  // Handle search input change
  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  showUserView = (user) => {
    this.setState({ selectedUser: user, showUserView: true });
  };

  handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      axios
        .delete(`http://localhost:5000/api/Login/${id}`)
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
      errors.password = "Password is required."; // Optional for update

    if (!formData.pincode) errors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(formData.pincode))
      errors.pincode = "Pincode must be a 6-digit number.";

    if (!showUpdateFormUser && !formData.profilePic)
      errors.profilePic = "Profile image is required."; // Optional for update

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
          // Update existing user
          response = await axios.put(
            `http://localhost:5000/api/Login/${selectedUser._id}`,
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
          // Add new user
          response = await axios.post(
            "http://localhost:5000/api/Login/add-Login",
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
          {showUpdateFormUser ? "Update User" : "Register"}
        </button>
        {!showUpdateFormUser && (
          <p className="mt-3 text-center">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        )}
      </form>
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
              Add User
            </button>
          </div>
          {successMessage && (
            <p className="text-success text-center">{successMessage}</p>
          )}
          {error && <p className="text-danger text-center">{error}</p>}
        </div>

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
                  <th>View</th>
                  <th>Update</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user, index) => (
                    <React.Fragment key={user._id}>
                      <tr>
                        <td>{index + 1}</td>
                        <td>{user.fullname}</td>
                        <td>{user.email}</td>
                        <td
                          className={
                            user.status === "Active"
                              ? "text-success fw-bold"
                              : "text-danger fw-bold"
                          }
                        >
                          {user.status}
                        </td>
                        <td>
                          <button
                            className="btn btn-info"
                            onClick={() => this.showUserView(user)}
                          >
                            View
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-success"
                            onClick={() => this.showUpdateFormUser(user)}
                          >
                            Update
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => this.handleDelete(user._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {showUserView &&
                        selectedUser &&
                        selectedUser._id === user._id && (
                          <tr>
                            <td colSpan="7">
                              <div className="d-flex justify-content-center">
                                <div className="container mt-4">
                                  <div className="row shadow p-4 rounded">
                                    {/* Add hide button in the top right */}
                                    <div className="position-relative w-100">
                                      <button
                                        className="btn btn-sm btn-outline-secondary position-absolute end-0 top-0"
                                        onClick={() => setShowUserView(false)}
                                        style={{
                                          marginTop: "-10px",
                                          marginRight: "10px",
                                        }}
                                      >
                                        <i className="fas fa-times"></i> Hide
                                        Details
                                      </button>
                                    </div>

                                    <div className="col-md-4 text-center">
                                      <img
                                        src={
                                          selectedUser.profilePic
                                            ? `http://localhost:5000/public/images/profile_pictures/${selectedUser.profilePic}`
                                            : u1
                                        }
                                        alt="User Profile"
                                        className="img-fluid rounded-circle"
                                        style={{
                                          width: "220px",
                                          height: "230px",
                                          objectFit: "cover",
                                        }}
                                      />
                                      <h4 className="mt-3">
                                        {selectedUser.fullname}
                                      </h4>
                                      <p className="text-muted">
                                        {selectedUser.email}
                                      </p>
                                    </div>
                                    <div className="col-md-8">
                                      <fieldset className="border p-3 rounded">
                                        <h5 style={{ color: "#41566E" }}>
                                          Personal Information
                                        </h5>
                                        <p>
                                          <strong>Gender:</strong>{" "}
                                          {selectedUser.gender}
                                        </p>
                                        <p>
                                          <strong>Phone:</strong>{" "}
                                          {selectedUser.mobile}
                                        </p>
                                        <p>
                                          <strong>Address:</strong>{" "}
                                          {selectedUser.address}
                                        </p>
                                        <p>
                                          <strong>Pin Code:</strong>{" "}
                                          {selectedUser.pincode}
                                        </p>
                                      </fieldset>
                                    </div>
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
        {/* Pagination start*/}
        {filteredUsers.length > 0 && (
          <div className="row mt-3">
            <div className="col-md-12 d-flex justify-content-center">
              <nav>
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
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
                      className={`page-item ${
                        currentPage === number ? "active" : ""
                      }`}
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
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
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
        {/* Pagination end*/}
      </center>
    );
  }
}

export default AdUser;

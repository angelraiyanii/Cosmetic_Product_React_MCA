import React, { Component } from "react";
import axios from "axios";
import user1 from "./images/user1.png";

export class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showProfileForm: false,
      showPasswordForm: false,
      fullName: "",
      email: "",
      phone: "",
      gender: "",
      address: "",
      pinCode: "",
      zip: "",
      password: "",
      oldPassword: "",
      confirmPassword: "",
      profileImage: null,
      profileImagePreview: null,
      errors: {},
      userId: null,
    };
  }

  // Fetch user data on component mount
  componentDidMount() {
    const userData =
      localStorage.getItem("user") || localStorage.getItem("admin");
    if (userData) {
      const user = JSON.parse(userData);
      this.setState({
        userId: user.id,
        fullName: user.fullname,
        email: user.email,
      });
      this.fetchUserData(user.id);
    }
  }

  // Fetch user data from backend
  fetchUserData = async (userId) => {
    try {
      const token =
        localStorage.getItem("usertoken") || localStorage.getItem("admintoken");
      const response = await axios.get(
        `http://localhost:5000/api/Login/all-Login`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user = response.data.Login.find((u) => u._id === userId);
      if (user) {
        this.setState({
          fullName: user.fullname,
          email: user.email,
          phone: user.mobile,
          gender: user.gender,
          address: user.address,
          pinCode: user.pincode,
          profileImagePreview: user.profilePic
            ? `http://localhost:5000/public/images/profile_pictures/${user.profilePic}`
            : user1,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Validation for profile form
  validateForm = () => {
    const errors = {};
    if (!this.state.fullName.trim()) errors.fullName = "Full Name is required";
    if (!this.state.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(this.state.email))
      errors.email = "Invalid email format";
    if (!this.state.phone.trim()) errors.phone = "Phone Number is required";
    else if (!/^\d{10}$/.test(this.state.phone))
      errors.phone = "Phone number must be 10 digits";
    if (!this.state.gender) errors.gender = "Gender is required";
    if (!this.state.address.trim()) errors.address = "Address is required";
    if (!this.state.pinCode.trim()) errors.pinCode = "Pin Code is required";
    else if (!/^\d{6}$/.test(this.state.pinCode))
      errors.pinCode = "Pin Code must be 6 digits";

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  // Validation for password form
  validateFormP = () => {
    const errors = {};
    if (!this.state.oldPassword)
      errors.oldPassword = "Old Password is required";
    if (!this.state.password) errors.password = "New Password is required";
    if (!this.state.confirmPassword)
      errors.confirmPassword = "Confirm Password is required";
    else if (this.state.password !== this.state.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  // Handle profile update
  handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (this.validateForm()) {
      const formData = new FormData();
      formData.append("fullname", this.state.fullName);
      formData.append("email", this.state.email);
      formData.append("mobile", this.state.phone);
      formData.append("gender", this.state.gender);
      formData.append("address", this.state.address);
      formData.append("pincode", this.state.pinCode);
      if (this.state.profileImage)
        formData.append("profilePic", this.state.profileImage);

      try {
        const token =
          localStorage.getItem("usertoken") ||
          localStorage.getItem("admintoken");
        const response = await axios.put(
          `http://localhost:5000/api/Login/${this.state.userId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Update localStorage with new user data
        const updatedUser = response.data.Login;
        localStorage.setItem(
          updatedUser.role,
          JSON.stringify({
            id: updatedUser._id,
            fullname: updatedUser.fullname,
            email: updatedUser.email,
            role: updatedUser.role,
          })
        );

        alert("Profile updated successfully!");
        this.setState({ showProfileForm: false });
        this.fetchUserData(this.state.userId); // Refresh displayed data
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile.");
      }
    }
  };

  // Handle password change
  handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (this.validateFormP()) {
      try {
        const token =
          localStorage.getItem("usertoken") ||
          localStorage.getItem("admintoken");
        const response = await axios.put(
          `http://localhost:5000/api/Login/${this.state.userId}`,
          {
            password: this.state.password,
            oldPassword: this.state.oldPassword,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alert("Password updated successfully!");
        this.setState({
          showPasswordForm: false,
          password: "",
          confirmPassword: "",
          oldPassword: "",
        });
      } catch (error) {
        console.error("Error updating password:", error);
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          alert(error.response.data.message);
        } else {
          alert("Failed to update password.");
        }
      }
    }
  };

  toggleExit = () => {
    this.setState({ showProfileForm: false, showPasswordForm: false });
  };

  render() {
    return (
      <div className="container mt-5">
        <div className="row align-items shadow p-3 rounded">
          <h3 className="text-center fw-bold" style={{ color: "#41566E" }}>
            Profile Details
          </h3>

          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <div className="profile-picture mb-3">
                <img
                  src={this.state.profileImagePreview || user1}
                  alt="User Profile"
                  className="img-fluid rounded-circle"
                  style={{
                    width: "260px",
                    height: "275px",
                    objectFit: "cover",
                  }}
                />
              </div>
              <h4 className="user-name">{this.state.fullName || "User"}</h4>
              <p className="text-muted fs-5">{this.state.email || "Email"}</p>
              <button
                className="btn btn-primary mb-3"
                onClick={() =>
                  this.setState({
                    showProfileForm: true,
                    showPasswordForm: false,
                  })
                }
              >
                Update Profile
              </button>
              <br />
              <button
                className="btn btn-secondary"
                onClick={() =>
                  this.setState({
                    showPasswordForm: true,
                    showProfileForm: false,
                  })
                }
              >
                Change Password
              </button>
            </div>

            <div className="col-md-8">
              {/* Update Profile Form */}
              {this.state.showProfileForm && (
                <fieldset className="border p-4 rounded mb-4">
                  <h3
                    className="w-auto text-start"
                    style={{ color: "#41566E" }}
                  >
                    Update Profile
                  </h3>
                  <form onSubmit={this.handleSubmitProfile} className="mt-3">
                    <div className="row">
                      <div className="col-md-9 mb-3">
                        <label htmlFor="profileImage" className="form-label">
                          Profile Image
                        </label>
                        <input
                          type="file"
                          id="profileImage"
                          className={`form-control ${
                            this.state.errors.profileImage ? "is-invalid" : ""
                          }`}
                          accept="image/*"
                          onChange={(e) =>
                            this.setState({
                              profileImage: e.target.files[0],
                              profileImagePreview: e.target.files[0]
                                ? URL.createObjectURL(e.target.files[0])
                                : null,
                            })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.profileImage}
                        </div>
                      </div>

                      <div className="col-md-3 d-flex justify-content-center align-items-center">
                        {this.state.profileImagePreview && (
                          <img
                            src={this.state.profileImagePreview}
                            alt="Profile Preview"
                            className="img-thumbnail"
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              border: "2px solid #ccc",
                            }}
                          />
                        )}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="fullName" className="form-label">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          className={`form-control ${
                            this.state.errors.fullName ? "is-invalid" : ""
                          }`}
                          value={this.state.fullName}
                          onChange={(e) =>
                            this.setState({ fullName: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.fullName}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="gender" className="form-label">
                          Gender
                        </label>
                        <select
                          id="gender"
                          className={`form-control ${
                            this.state.errors.gender ? "is-invalid" : ""
                          }`}
                          value={this.state.gender}
                          onChange={(e) =>
                            this.setState({ gender: e.target.value })
                          }
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="invalid-feedback">
                          {this.state.errors.gender}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          className={`form-control ${
                            this.state.errors.email ? "is-invalid" : ""
                          }`}
                          value={this.state.email}
                          onChange={(e) =>
                            this.setState({ email: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.email}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="phone" className="form-label">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          id="phone"
                          className={`form-control ${
                            this.state.errors.phone ? "is-invalid" : ""
                          }`}
                          value={this.state.phone}
                          onChange={(e) =>
                            this.setState({ phone: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.phone}
                        </div>
                      </div>

                      <div className="col-md-12 mb-3">
                        <label htmlFor="address" className="form-label">
                          Address
                        </label>
                        <textarea
                          id="address"
                          className={`form-control ${
                            this.state.errors.address ? "is-invalid" : ""
                          }`}
                          value={this.state.address}
                          onChange={(e) =>
                            this.setState({ address: e.target.value })
                          }
                        ></textarea>
                        <div className="invalid-feedback">
                          {this.state.errors.address}
                        </div>
                      </div>

                      <div className="col-md-12 mb-3">
                        <label htmlFor="pinCode" className="form-label">
                          Pin Code
                        </label>
                        <input
                          type="text"
                          id="pinCode"
                          className={`form-control ${
                            this.state.errors.pinCode ? "is-invalid" : ""
                          }`}
                          value={this.state.pinCode}
                          onChange={(e) =>
                            this.setState({ pinCode: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.pinCode}
                        </div>
                      </div>

                      <div className="col-md-12 text-center">
                        <button type="submit" className="btn btn-success">
                          Update Profile
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger ms-2"
                          onClick={this.toggleExit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </fieldset>
              )}

              {/* Change Password Form */}
              {this.state.showPasswordForm && (
                <fieldset className="border p-4 rounded mb-4">
                  <h3
                    className="w-auto text-start"
                    style={{ color: "#41566E" }}
                  >
                    Change Password
                  </h3>
                  <form onSubmit={this.handleSubmitPassword}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="old-password" className="form-label">
                          Old Password
                        </label>
                        <input
                          type="password"
                          id="old-password"
                          className={`form-control ${
                            this.state.errors.oldPassword ? "is-invalid" : ""
                          }`}
                          value={this.state.oldPassword}
                          onChange={(e) =>
                            this.setState({ oldPassword: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.oldPassword}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="password" className="form-label">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          className={`form-control ${
                            this.state.errors.password ? "is-invalid" : ""
                          }`}
                          value={this.state.password}
                          onChange={(e) =>
                            this.setState({ password: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.password}
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          className={`form-control ${
                            this.state.errors.confirmPassword
                              ? "is-invalid"
                              : ""
                          }`}
                          value={this.state.confirmPassword}
                          onChange={(e) =>
                            this.setState({ confirmPassword: e.target.value })
                          }
                        />
                        <div className="invalid-feedback">
                          {this.state.errors.confirmPassword}
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-success mt-3">
                      Update Password
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger mt-3 ms-2"
                      onClick={this.toggleExit}
                    >
                      Cancel
                    </button>
                  </form>
                </fieldset>
              )}

              {/* Personal Information */}
              {!this.state.showProfileForm && !this.state.showPasswordForm && (
                <fieldset className="border p-4 rounded mb-4">
                  <h4 className="text-start mb-3" style={{ color: "#41566E" }}>
                    Personal Information
                  </h4>
                  <div className="row text-start fs-5">
                    <div className="col-md-6 mb-3">
                      <label className="fw-bold">Full Name</label>
                      <p>{this.state.fullName || "N/A"}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="fw-bold">Gender</label>
                      <p>{this.state.gender || "N/A"}</p>
                    </div>
                  </div>
                  <div className="row text-start fs-5">
                    <div className="col-md-6 mb-3">
                      <label className="fw-bold">Email Address</label>
                      <p>{this.state.email || "N/A"}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="fw-bold">Phone Number</label>
                      <p>{this.state.phone || "N/A"}</p>
                    </div>
                  </div>
                  <h4
                    className="text-start mt-4 mb-3"
                    style={{ color: "#41566E" }}
                  >
                    Address Information
                  </h4>
                  <div className="row text-start fs-5">
                    <div className="col-md-6 mb-3">
                      <label className="fw-bold">Address</label>
                      <p>{this.state.address || "N/A"}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="fw-bold">Pin Code</label>
                      <p>{this.state.pinCode || "N/A"}</p>
                    </div>
                  </div>
                </fieldset>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Account;

import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react"; // 👁️ import icons

const Register = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    mobile: "",
    gender: "",
    address: "",
    password: "",
    confirmPassword: "",
    pincode: "",
    profilePic: null,
  });
 const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000" 
    : "https://gowcosmetic-backed.onrender.com";
    
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // 👁️ states for show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🔢 Allow only 10 digits for mobile number
    if (name === "mobile") {
      if (/^\d{0,10}$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }

    // 📮 Allow only 6 digits for pincode
    if (name === "pincode") {
      if (/^\d{0,6}$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  // File change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, profilePic: file });
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  // Validation
  const validateForm = (data) => {
    let errors = {};

    if (!data.fullname) errors.fullname = "Full name is required.";
    else if (data.fullname.length < 3)
      errors.fullname = "Full name must be at least 3 characters.";

    if (!data.email) errors.email = "Email is required.";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email))
      errors.email = "Invalid email format.";

    if (!data.mobile) errors.mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(data.mobile))
      errors.mobile = "Enter a valid 10-digit mobile number.";

    if (!data.gender) errors.gender = "Please select a gender.";

    if (!data.address) errors.address = "Address is required.";

    if (!data.password) errors.password = "Password is required.";
    else if (data.password.length < 6)
      errors.password = "Password must be at least 6 characters.";

    if (!data.confirmPassword)
      errors.confirmPassword = "Confirm password is required.";
    else if (data.password !== data.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    if (!data.pincode) errors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(data.pincode))
      errors.pincode = "Pincode must be 6 digits.";

    if (!data.profilePic) errors.profilePic = "Profile image is required.";

    return errors;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ✅ Remove confirmPassword before sending to backend
    const { confirmPassword, ...sendData } = formData;

    const formDataObj = new FormData();
    Object.keys(sendData).forEach((key) =>
      formDataObj.append(key, sendData[key])
    );

    try {
      const response = await axios.post(
        `${url}/api/Usermodel/add-Usermodel`,
        formDataObj,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("User added: ", response.data);
      alert("User registered successfully!");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ padding: "40px" }}
    >
      <div
        className="card shadow-lg p-4 w-100"
        style={{
          maxWidth: "650px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <h2
          className="text-center mb-4 fw-bold"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          <i className="fas fa-gem me-2" style={{ color: "#f78fb3" }}></i>{" "}
          Register with GlowCosmetics
        </h2>

        <form onSubmit={handleSubmit} method="post">
          {/* Full Name & Email */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Full Name</label>
              <input
                type="text"
                name="fullname"
                className={`form-control ${errors.fullname ? "is-invalid" : ""
                  }`}
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.fullname && (
                <div className="invalid-feedback">{errors.fullname}</div>
              )}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
          </div>

          {/* Mobile & Gender */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Mobile No</label>
              <input
                type="tel"
                name="mobile"
                maxLength="10"
                className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter your mobile number"
              />

              

              {errors.mobile && (
                <div className="invalid-feedback">{errors.mobile}</div>
              )}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Gender</label>
              <select
                name="gender"
                className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              {errors.gender && (
                <div className="invalid-feedback">{errors.gender}</div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Address</label>
            <textarea
              name="address"
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              rows="2"
            ></textarea>
            {errors.address && (
              <div className="invalid-feedback">{errors.address}</div>
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password}</div>
              )}

            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">
                Confirm Password
              </label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? "is-invalid" : ""
                    }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
                {errors.confirmPassword && (
                  <div className="invalid-feedback d-block">
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pincode */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Pincode</label>
           <input
                type="text"
                name="pincode"
                maxLength="6"
                className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Enter your pincode"
              />
            {errors.pincode && (
              <div className="invalid-feedback">{errors.pincode}</div>
            )}
          </div>

          {/* Image Upload */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Profile Image</label>
            <input
              type="file"
              name="profilePic"
              className={`form-control ${errors.profilePic ? "is-invalid" : ""
                }`}
              onChange={handleFileChange}
            />
            {errors.profilePic && (
              <div className="invalid-feedback">{errors.profilePic}</div>
            )}
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-3 rounded-circle shadow"
                width="100"
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="btn px-5 py-2 fw-semibold"
              style={{
                background: "linear-gradient(90deg, #f78fb3, #a29bfe)",
                color: "#fff",
                borderRadius: "30px",
              }}
            >
              Register
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-3 text-center">
            Already have an account?{" "}
            <Link to="/login" className="fw-bold text-decoration-none">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;

import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css"; // ✅ Font Awesome
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
   const url = window.location.hostname.includes("localhost")
    ? "http://localhost:5000" 
    : "https://gowcosmetic-backed.onrender.com";
    
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate("/forgot-password");
    }
  }, [location, navigate]);

  const validateForm = () => {
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    setErrors(error);

    if (!error) {
      setIsLoading(true);
      try {
        await axios.post(`${url}/api/OtpModel/reset-password`, {
          email,
          newPassword: password,
        });
        setMessage("Password reset successfully!");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        setErrors(
          err.response?.data?.error ||
            "Password reset failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ padding: "40px", minHeight: "100vh", background: "#f3f4f6" }}
    >
      <div
        className="card shadow-lg p-4 w-100"
        style={{
          maxWidth: "500px",
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
            MozBackgroundClip: "text",
            MozTextFillColor: "transparent",
          }}
        >
          <i className="fas fa-key me-2" style={{ color: "#f78fb3" }}></i>
          Reset Your Password
        </h2>

        <p className="text-center text-muted mb-3">
          Enter a new password for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {/* New Password Field */}
          <div className="mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control text-center ${
                errors && password.length < 6 ? "is-invalid" : ""
              }`}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <i
              className={`fa-solid ${
                showPassword ? "fa-eye-slash" : "fa-eye"
              } position-absolute end-0 top-50 translate-middle-y me-3 text-muted`}
              style={{ cursor: "pointer" }}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
            {errors && password.length < 6 && (
              <div className="invalid-feedback text-center">
                Password must be at least 6 characters.
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3 position-relative">
            <input
              type={showConfirm ? "text" : "password"}
              className={`form-control text-center ${
                errors && password !== confirmPassword ? "is-invalid" : ""
              }`}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <i
              className={`fa-solid ${
                showConfirm ? "fa-eye-slash" : "fa-eye"
              } position-absolute end-0 top-50 translate-middle-y me-3 text-muted`}
              style={{ cursor: "pointer" }}
              onClick={() => setShowConfirm(!showConfirm)}
            ></i>
            {errors && password !== confirmPassword && (
              <div className="invalid-feedback text-center">
                Passwords do not match.
              </div>
            )}
          </div>

          {message && (
            <p className="text-success text-center fw-semibold">{message}</p>
          )}
          {errors && !message && (
            <p className="text-danger text-center fw-semibold">{errors}</p>
          )}

          <div className="text-center mt-3">
            <button
              type="submit"
              className="btn px-5 py-2 fw-semibold"
              style={{
                background: "linear-gradient(90deg, #f78fb3, #a29bfe)",
                color: "#fff",
                borderRadius: "30px",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Reset Password"}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <Link to="/login" className="text-decoration-none">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

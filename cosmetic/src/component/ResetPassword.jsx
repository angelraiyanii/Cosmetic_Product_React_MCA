import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import bg from "./Images/bg.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate("/forgot-password");
    }
  }, [location, navigate]);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const validateForm = () => {
    if (!password) {
      return "Password is required.";
    } else if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    setErrors(error);

    if (!error) {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "http://localhost:5000/api/OtpModel/reset-password",
          {
            email,
            newPassword: password,
          }
        );
        setMessage("Password reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
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
      className="d-flex justify-content-center align-items-center "
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "500px",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ width: "350px", background: "rgba(197, 180, 143, 0.9)" }}
      >
        <h3 className="text-center mb-4">Reset Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-bold">
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-control form-control-sm ${
                errors && password.length < 6 ? "is-invalid" : ""
              }`}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
            />
            {errors && password.length < 6 && (
              <div className="invalid-feedback">
                Password must be at least 6 characters.
              </div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label fw-bold">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-control form-control-sm ${
                errors && password !== confirmPassword ? "is-invalid" : ""
              }`}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm new password"
            />
            {errors && password !== confirmPassword && (
              <div className="invalid-feedback">Passwords do not match.</div>
            )}
          </div>
          {message && <p className="text-success text-center">{message}</p>}
          <button
            type="submit"
            className="btn btn-primary w-50 d-block mx-auto"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

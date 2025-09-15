import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import bg from "./Images/bg.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate("/forgot-password");
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '');
    setOtp(value);
  };

  const validateOtp = (otp) => {
    if (!otp) {
      return "OTP is required.";
    } else if (!/^[0-9]{6}$/.test(otp)) {
      return "Invalid OTP format. Must be 6 digits.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateOtp(otp);
    setErrors(error);

    if (!error) {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/OtpModel/verify-otp",
          {
            email,
            otp,
          }
        );
        setMessage("OTP verified successfully!");
        setTimeout(() => {
          navigate("/ResetPassword", { state: { email } });
        }, 1000);
      } catch (err) {
        setErrors(err.response?.data?.error || "OTP verification failed");
      }
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setErrors("");
    setMessage("");
    
    try {
      const response = await axios.post(
        "http://localhost:5000/api/OtpModel/send-otp",
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      setMessage("New OTP has been sent to your email");
    } catch (err) {
      setErrors(err.response?.data?.error || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
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
        <h3 className="text-center mb-4">OTP Verification</h3>
        {email && (
          <p className="text-center mb-3">
            We've sent a code to <strong>{email}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="otp" className="form-label fw-bold">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              name="otp"
              className={`form-control form-control-sm ${
                errors ? "is-invalid" : ""
              }`}
              value={otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
            />
            {errors && <div className="invalid-feedback">{errors}</div>}
            {message && <p className="text-success mt-2">{message}</p>}
          </div>
          <button
            type="submit"
            className="btn btn-primary w-50 d-block mx-auto"
          >
            Verify OTP
          </button>
          <p className="text-center mt-3">
            Didn't receive an OTP?{" "}
            <button 
              type="button"
              className="text-danger btn btn-link p-0"
              onClick={handleResendOTP}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
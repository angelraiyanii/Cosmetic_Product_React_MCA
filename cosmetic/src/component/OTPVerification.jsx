import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // coming from ForgotPassword page

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/OtpModel/verify-otp", {
        email,
        otp,
      });

      alert(response.data.message);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", background: "#f8f9fa" }}
    >
      <div className="card p-4 shadow-lg" style={{ width: "400px", borderRadius: "20px" }}>
        <h3 className="text-center mb-4 fw-bold" style={{ color: "#764ba2" }}>
          Verify OTP
        </h3>

        <p className="text-center text-muted mb-3">
          Enter the OTP sent to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className={`form-control text-center ${error ? "is-invalid" : ""}`}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            {error && <div className="invalid-feedback text-center">{error}</div>}
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="btn px-5 py-2 fw-semibold"
              style={{
                background: "linear-gradient(90deg, #f78fb3, #a29bfe)",
                color: "#fff",
                borderRadius: "30px",
              }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 📨 Send email to backend to generate OTP
      const response = await axios.post("http://localhost:5000/api/OtpModel/send-otp", {
        email,
      });

      alert(response.data.message || "OTP sent successfully!");
      navigate("/otp-verification", { state: { email } }); // redirect to verify page
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", background: "#f8f9fa" }}
    >
      <div
        className="card p-4 shadow-lg"
        style={{
          width: "400px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.95)",
        }}
      >
        <h3
          className="text-center mb-4 fw-bold"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Forgot Password
        </h3>

        <p className="text-center text-muted mb-3">
          Enter your registered email to receive an OTP.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className={`form-control ${error ? "is-invalid" : ""}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div className="invalid-feedback">{error}</div>}
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
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import bg from "./Images/bg.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");
    setMessage("");

    if (!validateEmail(email)) {
      setErrors("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/OtpModel/send-otp",
        { email },
        { headers: { "Content-Type": "application/json" } }
      );

      setMessage("OTP has been sent to your email");
      setTimeout(() => {
        navigate("/OTPVerification", { state: { email } });
      }, 1500);
    } catch (err) {
      console.error("OTP Send Error:", err);
      setErrors(
        err.response?.data?.error || "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
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
        <h3 className="text-center mb-4">Forgot Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-bold">
              Enter your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-control form-control-sm ${
                errors ? "is-invalid" : ""
              }`}
              placeholder="Enter your registered email"
              required
            />
            {errors && <div className="invalid-feedback">{errors}</div>}
            {message && <p className="text-success text-center">{message}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-50 d-block mx-auto"
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
          <p className="text-center mt-3">
            Remembered your password?{" "}
            <Link to="/login" className="text-danger">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

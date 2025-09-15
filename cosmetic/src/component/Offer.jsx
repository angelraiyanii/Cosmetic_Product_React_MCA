import React, { useState } from "react";
import { Link } from "react-router-dom";

const Offer = () => {
  const [offerCode, setOfferCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};

    if (!email) newErrors.email = "Email is required";
    if (!phone) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone))
      newErrors.phone = "Phone number must be 10 digits";

    if (!address) newErrors.address = "Address is required";
    if (!state) newErrors.state = "State is required";
    if (!city) newErrors.city = "City is required";
    if (!zip) newErrors.zip = "ZIP code is required";
    else if (!/^\d{6}$/.test(zip)) newErrors.zip = "ZIP code must be 6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyDiscount = () => {
    let newErrors = { ...errors };
    if (!offerCode) newErrors.offerCode = "Offer code is required";
    setErrors(newErrors);
  };

  const handleCheckout = () => {
    if (validateForm()) {
      console.log("Proceeding to checkout...");
    }
  };

  return (
    <div className="container">
      <div className="row align-items shadow rounded mt-5">
        <section className="cart-section">
          <div className="container">
            <div className="row mt-4">
              {/* Left Column: Apply Discount */}
              <div className="col-md-4">
                <h5>Apply Discount</h5>
                <input
                  type="text"
                  className={`form-control mb-2 ${
                    errors.offerCode ? "is-invalid" : ""
                  }`}
                  placeholder="Enter Offer Code"
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value)}
                />
                {errors.offerCode && (
                  <div className="text-danger">{errors.offerCode}</div>
                )}
                <button
                  className="btn btn-dark w-100"
                  onClick={handleApplyDiscount}
                >
                  Apply
                </button>
                <hr />
                <p>
                  <strong>Discount:</strong> ₹ 200.00
                </p>
                <p>
                  <strong>Total:</strong> ₹ 1398.22
                </p>

                <button
                  className="btn btn-success w-100"
                  onClick={handleCheckout}
                >
                  Check Out
                </button>
                <Link to="/CheckOut">Check Out</Link>
              </div>

              {/* Right Column: Billing & Location Details */}
              <div className="col-md-8">
                <div className="row">
                  {/* Billing Details */}
                  <div className="col-md-6">
                    <h5>Billing Details</h5>
                    <div className="mb-2">
                      <label>Email:</label>
                      <input
                        type="email"
                        className={`form-control ${
                          errors.email ? "is-invalid" : ""
                        }`}
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {errors.email && (
                        <div className="text-danger">{errors.email}</div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label>Phone Number:</label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                        placeholder="Enter 10-digit phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      {errors.phone && (
                        <div className="text-danger">{errors.phone}</div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label>Shipping Address:</label>
                      <textarea
                        className={`form-control ${
                          errors.address ? "is-invalid" : ""
                        }`}
                        placeholder="Enter shipping address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      {errors.address && (
                        <div className="text-danger">{errors.address}</div>
                      )}
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="col-md-6">
                    <h5>Location Details</h5>
                    <div className="mb-2">
                      <label>State:</label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.state ? "is-invalid" : ""
                        }`}
                        placeholder="Enter state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                      {errors.state && (
                        <div className="text-danger">{errors.state}</div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label>City:</label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.city ? "is-invalid" : ""
                        }`}
                        placeholder="Enter city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      {errors.city && (
                        <div className="text-danger">{errors.city}</div>
                      )}
                    </div>
                    <div className="mb-2">
                      <label>Zip Code:</label>
                      <input
                        type="text"
                        className={`form-control ${
                          errors.zip ? "is-invalid" : ""
                        }`}
                        placeholder="Enter 6-digit ZIP code"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                      {errors.zip && (
                        <div className="text-danger">{errors.zip}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Offer;

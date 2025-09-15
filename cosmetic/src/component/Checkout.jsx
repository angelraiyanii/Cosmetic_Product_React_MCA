import React, { Component } from "react";
import { Link } from "react-router-dom";
class CheckOut extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderId: "",
      netPayable: "",
      errors: {},
    };
  }

  validateForm = () => {
    let errors = {};
    if (!this.state.orderId) {
      errors.orderId = "Order ID is required";
    }
    if (!this.state.netPayable) {
      errors.netPayable = "Payable Amount is required";
    }
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleCheckout = (e) => {
    e.preventDefault();
    if (this.validateForm()) {
      console.log("Checkout Successful!");
    }
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    return (
      <div className="container mt-5 d-flex justify-content-center">
        <div className="card shadow p-4" style={{ width: "400px" }}>
          <h2 className="text-center">Checkout</h2>
          <form onSubmit={this.handleCheckout}>
            <div className="mb-3">
              <label className="form-label">Order ID:</label>
              <input
                type="text"
                name="orderId"
                className={`form-control ${
                  this.state.errors.orderId ? "is-invalid" : ""
                }`}
                value={this.state.orderId}
                onChange={this.handleChange}
                placeholder="Enter Order ID"
              />
              {this.state.errors.orderId && (
                <div className="invalid-feedback">
                  {this.state.errors.orderId}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Payable Amount:</label>
              <input
                type="text"
                name="netPayable"
                className={`form-control ${
                  this.state.errors.netPayable ? "is-invalid" : ""
                }`}
                value={this.state.netPayable}
                onChange={this.handleChange}
                placeholder="Enter Amount"
              />
              {this.state.errors.netPayable && (
                <div className="invalid-feedback">
                  {this.state.errors.netPayable}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-success w-50">
              Pay Now
            </button>
            <br />
            <Link to="/">Continue Shopping</Link>
          </form>
        </div>
      </div>
    );
  }
}

export default CheckOut;

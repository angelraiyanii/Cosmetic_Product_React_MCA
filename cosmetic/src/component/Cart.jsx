import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";
import { FaShoppingCart } from "react-icons/fa";

export class Cart extends Component {
  constructor() {
    super();
    this.state = {
      cartItems: [],
      isLoading: true,
      error: null,
      offerCode: "",
      offerError: "",
      discount: 0,
      showCheckoutForm: false,
      userData: null,
    };
  }

  componentDidMount() {
    this.fetchCartItems();
    this.fetchUserData();
  }

  fetchUserData = async () => {
    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.get(
        `http://localhost:5000/api/Login/user-details/${userId}`
      );

      console.log("User data fetched:", response.data);

      this.setState({
        userData: response.data,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  fetchCartItems = async () => {
    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        this.setState({
          error: "Please login to view your cart",
          isLoading: false,
        });
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      console.log("Fetching cart for user ID:", userId);

      const response = await axios.get(
        `http://localhost:5000/api/CartModel/${userId}`
      );

      console.log("Cart response:", response.data);

      this.setState({
        cartItems: response.data,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching cart items:", error);
      this.setState({
        error:
          "Failed to load cart items: " +
          (error.response?.data?.error || error.message),
        isLoading: false,
      });
    }
  };

  removeFromCart = async (cartItemId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/CartModel/remove/${cartItemId}`
      );
      this.fetchCartItems();
    } catch (error) {
      console.error("Error removing item from cart:", error);
      alert(
        "Failed to remove item from cart: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      await axios.put(
        `http://localhost:5000/api/CartModel/update/${cartItemId}`,
        {
          quantity: newQuantity,
        }
      );
      this.fetchCartItems();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      alert(
        "Failed to update quantity: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  calculateSubtotal = () => {
    return this.state.cartItems
      .reduce((total, item) => {
        const price = item.productId ? item.productId.price : 0;
        return total + price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  calculateTotal = () => {
    const subtotal = parseFloat(this.calculateSubtotal());
    return (subtotal - this.state.discount).toFixed(2);
  };

  handleOfferCodeChange = (e) => {
    this.setState({ offerCode: e.target.value, offerError: "" });
  };

  applyDiscount = () => {
    const { offerCode } = this.state;

    if (!offerCode) {
      this.setState({ offerError: "Please enter an offer code" });
      return;
    }
    if (offerCode.toLowerCase() === "save200") {
      this.setState({ discount: 200, offerError: "" });
    } else {
      this.setState({ offerError: "Invalid offer code", discount: 0 });
    }
  };

  proceedToCheckout = () => {
    this.setState({ showCheckoutForm: true });
  };

  render() {
    const {
      cartItems,
      isLoading,
      error,
      offerCode,
      offerError,
      discount,
      showCheckoutForm,
      userData,
    } = this.state;

    if (isLoading) {
      return (
        <div className="container mt-5 text-center">Loading your cart...</div>
      );
    }

    if (error) {
      return (
        <div className="container mt-5 text-center">
          <p className="text-danger">{error}</p>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      );
    }

    if (cartItems.length === 0) {
      return (
        <div className="container mt-5 text-center">
          <h2>Your Cart is Empty</h2>
          <Link to="/" className="btn btn-primary mt-3">
            Continue Shopping
          </Link>
        </div>
      );
    }

    if (showCheckoutForm) {
      return (
        <CheckoutForm
          subtotal={this.calculateSubtotal()}
          discount={discount}
          total={this.calculateTotal()}
          userData={userData}
        />
      );
    }

    return (
      <div className="container mt-5">
        <h2 className="mb-4">
          <FaShoppingCart  className="me-2 text-primary" /> Your Shopping Cart
        </h2>
        <div className="row">
          <div className="col-md-8">
            {cartItems.map((item) => (
              <div className="card mb-3" key={item._id}>
                <div className="row g-0">
                  <div className="col-md-3">
                    <img
                      src={
                        item.productId && item.productId.productImage
                          ? `http://localhost:5000/public/images/product_images/${item.productId.productImage}`
                          : require("./images/pro1.png")
                      }
                      alt={
                        item.productId ? item.productId.productName : "Product"
                      }
                      className="img-fluid rounded-start"
                      style={{ maxHeight: "150px", objectFit: "contain" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = require("./images/pro1.png");
                      }}
                    />
                  </div>
                  <div className="col-md-9">
                    <div className="card-body">
                      <h5 className="card-title">
                        {item.productId
                          ? item.productId.productName
                          : "Unknown Product"}
                      </h5>
                      <p className="card-text">
                        Price: ₹{item.productId ? item.productId.price : 0}
                      </p>
                      <div className="d-flex align-items-center">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            this.updateQuantity(item._id, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity}</span>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            this.updateQuantity(item._id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                        <button
                          className="btn btn-sm btn-danger ms-3"
                          onClick={() => this.removeFromCart(item._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Offer Code</h5>
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className={`form-control ${offerError ? "is-invalid" : ""}`}
                    placeholder="Enter offer code"
                    value={offerCode}
                    onChange={this.handleOfferCodeChange}
                  />
                  <button
                    className="btn btn-dark"
                    type="button"
                    onClick={this.applyDiscount}
                  >
                    Apply
                  </button>
                </div>
                {offerError && (
                  <div className="text-danger mb-3">{offerError}</div>
                )}
                {discount > 0 && (
                  <div className="alert alert-success">
                    Discount of ₹{discount.toFixed(2)} applied!
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>
                <hr />
                <div className="d-flex justify-content-between">
                  <p>Subtotal:</p>
                  <p>₹{this.calculateSubtotal()}</p>
                </div>
                <div className="d-flex justify-content-between">
                  <p>Shipping:</p>
                  <p>Free</p>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <p>Discount:</p>
                    <p>-₹{discount.toFixed(2)}</p>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <p>Total:</p>
                  <p>₹{this.calculateTotal()}</p>
                </div>
                <button
                  className="btn btn-success w-100 mt-2"
                  onClick={this.proceedToCheckout}
                >
                  Proceed to Checkout
                </button>
                <Link
                  to="/Ct_product"
                  className="btn btn-outline-primary w-100 mt-2"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class CheckoutForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: props.userData?.email || "",
      phone: props.userData?.phone || "",
      address: props.userData?.address || "",
      zip: props.userData?.zip || "",
      errors: {},
    };
  }

  componentDidMount() {
    const { userData } = this.props;
    if (userData) {
      this.setState({
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        zip: userData.zip || "",
      });
    }
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  validateForm = () => {
    let newErrors = {};

    if (!this.state.email) newErrors.email = "Email is required";
    if (!this.state.phone) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(this.state.phone))
      newErrors.phone = "Phone number must be 10 digits";

    if (!this.state.address) newErrors.address = "Address is required";
    if (!this.state.zip) newErrors.zip = "ZIP code is required";
    else if (!/^\d{6}$/.test(this.state.zip))
      newErrors.zip = "ZIP code must be 6 digits";

    this.setState({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  };

  handleCheckout = async () => {
    if (this.validateForm()) {
      try {
        const userData =
          localStorage.getItem("user") || localStorage.getItem("admin");
        const user = JSON.parse(userData);
        const userId = user.id;
        const orderData = {
          userId,
          email: this.state.email,
          phone: this.state.phone,
          address: this.state.address,
          zip: this.state.zip,
          totalAmount: this.props.total,
          discount: this.props.discount,
        };

        const response = await axios.post(
          "http://localhost:5000/api/orders/create",
          orderData
        );

        console.log("Order created:", response.data);
        alert("Order placed successfully!");
        await axios.delete(
          `http://localhost:5000/api/CartModel/clear/${userId}`
        );
        window.location.href = "/";
      } catch (error) {
        console.error("Error creating order:", error);
        alert("Failed to place order: " + error.message);
      }
    }
  };

  render() {
    const { subtotal, discount, total } = this.props;
    const { errors } = this.state;

    return (
      <div className="container mt-5">
        <h2 className="mb-4">Checkout</h2>
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Shipping Information</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${
                        errors.email ? "is-invalid" : ""
                      }`}
                      name="email"
                      value={this.state.email}
                      onChange={this.handleChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.phone ? "is-invalid" : ""
                      }`}
                      name="phone"
                      value={this.state.phone}
                      onChange={this.handleChange}
                      placeholder="Enter 10-digit phone number"
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Shipping Address</label>
                  <textarea
                    className={`form-control ${
                      errors.address ? "is-invalid" : ""
                    }`}
                    name="address"
                    value={this.state.address}
                    onChange={this.handleChange}
                    placeholder="Enter shipping address"
                    rows="3"
                  />
                  {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                  )}
                </div>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">ZIP Code</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.zip ? "is-invalid" : ""
                      }`}
                      name="zip"
                      value={this.state.zip}
                      onChange={this.handleChange}
                      placeholder="Enter 6-digit ZIP code"
                    />
                    {errors.zip && (
                      <div className="invalid-feedback">{errors.zip}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>
                <hr />
                <div className="d-flex justify-content-between">
                  <p>Subtotal:</p>
                  <p>₹{subtotal}</p>
                </div>
                <div className="d-flex justify-content-between">
                  <p>Shipping:</p>
                  <p>Free</p>
                </div>
                {discount > 0 && (
                  <div className="d-flex justify-content-between text-success">
                    <p>Discount:</p>
                    <p>-₹{discount.toFixed(2)}</p>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <p>Total:</p>
                  <p>₹{total}</p>
                </div>
                <button
                  className="btn btn-success w-100 mt-2"
                  onClick={this.handleCheckout}
                >
                  Place Order
                </button>
                <button
                  className="btn btn-outline-secondary w-100 mt-2"
                  onClick={() => {
                    window.location.href = "/cart";
                  }}
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Cart;

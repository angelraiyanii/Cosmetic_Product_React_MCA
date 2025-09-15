import React, { useState } from "react";
import "../../App.css";
import pro1 from "../Images/pro1.png";

const AdOrder = () => {
  // Sample order data (Replace with API call)
  const [orders, setOrders] = useState([
    {
      id: 1,
      user: "John Doe",
      email: "johndoe@example.com",
      product: "Product Name",
      productImage: "https://via.placeholder.com/150", // Replace with actual image URL
      amount: 500,
      quantity: 1,
      offer: "-",
      paymentMode: "Online",
      orderDate: "2024-12-18 12:30:09",
      deliveryStatus: "Delivered",
      paymentStatus: "Completed",
      address: "Ranchhod Nagar-7, Rajkot-789998, Gujarat",
      status: "Delivered",
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null); // To store selected order details
  const [showModal, setShowModal] = useState(false); // Modal visibility

  // Function to show order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Orders</h2>
      <div className="d-flex justify-content-end mb-3">
        <div className="d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Search offers..."
          />
          <button className="btn btn-primary">Search</button>
        </div>
      </div>
      <table className="table table-bordered">
        <thead className="thead table-bordered">
          <tr>
            <th>Order ID</th>
            <th>User</th>
            <th>Product</th>
            <th>Amount ($)</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.user}</td>
              <td>{order.product}</td>
              <td>${order.amount}</td>
              <td>
                <span className={`badge bg-success`}>{order.status}</span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => viewOrderDetails(order)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Order Details</h4>
            <div className="row">
              <div className="col-3">
                <img
                  src={pro1}
                  alt={selectedOrder.product}
                  className="img-fluid mb-3"
                  style={{
                    width: "100%",
                    maxHeight: "250px",
                    objectFit: "contain",
                  }}
                />
                <h6>{selectedOrder.product}</h6>
              </div>
              <div className="col-9">
                <div className="row">
                  <div className="col-6">
                    <p>
                      <strong>User Email:</strong>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.email}
                      />
                    </p>
                  </div>
                  <div className="col-6">
                    <p>
                      <strong>Address:</strong>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.address}
                      />
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <p>
                      <strong>Total Amount:</strong>{" "}
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.amount}
                      />
                    </p>
                  </div>
                  <div className="col-6">
                    <p>
                      <strong>Quantity:</strong>{" "}
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.quantity}
                      />
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <p>
                      <strong>Offer Name:</strong>{" "}
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.offer}
                      />
                    </p>
                  </div>
                  <div className="col-6">
                    <p>
                      <strong>Payment Mode:</strong>{" "}
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.paymentMode}
                      />
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <p>
                      <strong>Order Date:</strong>{" "}
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.orderDate}
                      />
                    </p>
                  </div>
                  <div className="col-6">
                    <p>
                      <strong>Delivery Status:</strong>{" "}
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.deliveryStatus}
                      />
                    </p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <p>
                      <strong>Payment Status:</strong>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedOrder.paymentStatus}
                      />
                    </p>
                  </div>
                  <div className="col-6">
                    <button
                      className="btn btn-danger mt-4"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdOrder;

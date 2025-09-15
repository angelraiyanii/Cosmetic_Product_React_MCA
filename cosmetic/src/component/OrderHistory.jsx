import React, { Component } from "react";
import c5 from "./Images/category.png";

export class OrderHistory extends Component {
  render() {
    return (
      <div>
        <div className="container mt-5">
          <div className="row align-items shadow p-3 rounded">
            <section className="order-section py-5 mb-5">
              <div className="container">
                <h2 className="mb-4 text-center">Order History</h2>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Order ID</th>
                        <th>Product Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>#12345</td>
                        <td>
                          <img
                            src={c5}
                            alt="Product"
                            className="img-fluid rounded"
                            style={{ height: "100px", objectFit: "cover" }}
                          />
                        </td>
                        <td>Earring</td>
                        <td>Diamond Earring</td>
                        <td>₹ 1598.22</td>
                        <td>1</td>
                        <td>₹ 1598.22</td>
                        <td>
                          <span className="badge bg-success">Delivered</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default OrderHistory;

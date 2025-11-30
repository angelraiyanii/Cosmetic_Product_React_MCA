import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../App.css"; // Add your CSS animations here

const OrderSuccess = () => {
  return (
    <div className="order-success-container">
      <div className="order-success-animation">
        <FaCheckCircle className="success-icon" />
      </div>
      <h1>Payment Successful!</h1>
      <p>Your order has been placed successfully.</p>
      <Link to="/orders" className="btn-primary-custom">
        View Order
      </Link>
      <Link to="/Product" className="btn-secondary-custom ms-2">
        Continue Shopping
      </Link>

      <style jsx>{`
        .order-success-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          text-align: center;
          animation: fadeIn 0.5s ease-in-out;
        }
        .order-success-animation {
          font-size: 6rem;
          color: #28a745;
          margin-bottom: 1rem;
          animation: bounce 1s infinite;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        p {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccess;

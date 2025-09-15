import React from "react";
import { FaStar, FaTrash, FaCheck } from "react-icons/fa";
import "../../App.css";

const AdReviews = () => {
  const reviews = [
    {
      id: 1,
      user: "John Doe",
      rating: 4,
      review: "Amazing quality, loved the product!",
      date: "2025-03-16",
    },
    {
      id: 2,
      user: "Jane Smith",
      rating: 5,
      review: "Absolutely stunning! Will buy again.",
      date: "2025-03-14",
    },
    {
      id: 3,
      user: "Mark Wilson",
      rating: 3,
      review: "Good, but expected better packaging.",
      date: "2025-03-10",
    },
  ];

  return (
    <div className="container mt-4">
     <h2 className="text-center mb-4">User Reviews</h2>
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

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table table-bordered">
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Review</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, index) => (
              <tr key={review.id}>
                <td>{index + 1}</td>
                <td>{review.user}</td>
                <td>{review.review}</td>
                <td>
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < review.rating ? "text-warning" : "text-secondary"}
                    />
                  ))}
                </td>
                <td>{review.date}</td>
                <td>
                  {/* <button className="btn btn-success btn-sm me-2">
                    <FaCheck /> Approve
                  </button> */}
                  <button className="btn btn-danger btn-sm">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdReviews;

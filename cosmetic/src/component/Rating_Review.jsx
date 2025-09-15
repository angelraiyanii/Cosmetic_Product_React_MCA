import React, { Component } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import u1 from "./Images/user_photo.png";
import u2 from "./Images/user_photo.png";
class Rating_Review extends Component {
  render() {
    return (
      <div className="container">
        <h2>Customer Reviews</h2>
        <div className="review-container">
          {/* Review Card 1 */}
          <div className="review-card">
            <img src={u1} alt="User 1" />
            <p>
              "Happy reviewer is super excited being part of happy addons
              family."
            </p>
            <h4>Louis Hoffman</h4>
            <small>Happy Officer</small>
            <div className="stars">
              <FaStar className="star-icon" />
              <FaStar className="star-icon" />
              <FaStar className="star-icon" />
              <FaStarHalfAlt className="star-icon" />
              <FaRegStar className="star-icon" />
            </div>
          </div>

          {/* Review Card 2 */}
          <div className="review-card">
            <img src={u2} alt="User 2" />
            <p>
              "Happy reviewer is super excited being part of happy addons
              family."
            </p>
            <h4>Thoma Middleditch</h4>
            <small>Happy Officer</small>
            <div className="stars">
              <FaStar className="star-icon" />
              <FaStar className="star-icon" />
              <FaStar className="star-icon" />
              <FaStar className="star-icon" />
              <FaStarHalfAlt className="star-icon" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Rating_Review;

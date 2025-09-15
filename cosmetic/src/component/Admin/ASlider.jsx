import React from "react";
import { Carousel } from "react-bootstrap";
// import img1 from "../images/slide1.png";
// import img2 from "../images/slide2.png";
// import img3 from "../images/slide3.png";
// import img from "../images/category2.png";

const ASlider = () => {
  return (
    <div className="container-fluid p-3">
      {/* Carousel Section */}
      <div className="p-3">
        <Carousel fade>
          <Carousel.Item>
            <img className="d-block w-100" src={img1} alt="First slide" />
            <Carousel.Caption>
              <h3>Jewellery</h3>
            </Carousel.Caption>
          </Carousel.Item>

          <Carousel.Item>
            <img className="d-block w-100" src={img2} alt="Second slide" />
            <Carousel.Caption>
              <h3>Luxury</h3>
            </Carousel.Caption>
          </Carousel.Item>

          <Carousel.Item>
            <img className="d-block w-100" src={img3} alt="Third slide" />
            <Carousel.Caption>
              <h3>Diamonds</h3>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      {/* About Section */}
      <div className="container mt-5">
        <div className="row align-items-center">
          {/* Left Image */}
          <div className="col-md-6 text-center mb-4 mb-md-0">
            <img
              src={img}
              height={300}
              
              alt="Jewellery"
              width={300}
              className="img-fluid rounded about-img"
            />
          </div>

          {/* Right Content */}
          <div className="col-md-6 text-center text-md-start">
            <h2 className="about-title">About Our Jewellery</h2>
            <p className="about-text">
              Discover timeless elegance with our exquisite jewellery
              collection. Crafted with passion, designed for beauty. Each
              piece tells a story of elegance and sophistication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASlider;

import React, { useState, useEffect } from "react";
import { Carousel } from "react-bootstrap";
import axios from "axios";
import s1 from "./images/slide1.png"; // Default fallback image

const Slider = () => {
  const [activeBanners, setActiveBanners] = useState([]);

  // Fetch banners on mount
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/BannerModel/banners");
        // Filter for active banners only
        const active = response.data.filter((banner) => banner.status === "Active");
        setActiveBanners(active);
      } catch (error) {
        console.error("Error fetching banners:", error);
        // Optional: Set fallback banners if fetch fails
        setActiveBanners([
          { _id: "fallback1", name: "Jewellery", image: "slide1.png" },
        ]);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="p-10">
      <Carousel fade>
        {activeBanners.length > 0 ? (
          activeBanners.map((banner) => (
            <Carousel.Item key={banner._id}>
              <img
                className="d-block w-100 h-100"
                src={
                  banner.image
                    ? `http://localhost:5000/public/images/banner_images/${banner.image}`
                    : s1 // Fallback to default image
                }
                alt={banner.name}
                onError={(e) => (e.target.src = s1)} // Fallback if image fails to load
              />
              <Carousel.Caption>
                <h3>{banner.name}</h3>
              </Carousel.Caption>
            </Carousel.Item>
          ))
        ) : (
          // Fallback carousel item if no active banners
          <Carousel.Item>
            <img className="d-block w-100 h-100" src={s1} alt="Default slide" />
            <Carousel.Caption>
              <h3>Jewellery</h3>
            </Carousel.Caption>
          </Carousel.Item>
        )}
      </Carousel>
    </div>
  );
};

export default Slider;
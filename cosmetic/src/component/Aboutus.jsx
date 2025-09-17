import React, { useState, useEffect } from 'react';
import axios from 'axios';
import defaultBanner from "./images/about1.jpeg";
import section1Default from "./images/about2.jpeg";
import section2Default from "./images/about3.jpeg";
import { Link } from "react-router-dom"; 
import "../App.css";

const Aboutus = () => {
  const [aboutData, setAboutData] = useState(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch About data on mount
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/AboutModel/about");
        if (response.data && response.data._id) {
          setAboutData(response.data);
        } else {
          setAboutData(null);
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
        setAboutData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAboutData();
  }, []);

  // Rotate banners every 5 seconds
  useEffect(() => {
    if (aboutData && aboutData.banners && aboutData.banners.length > 1) {
      const interval = setInterval(() => {
        setActiveBannerIndex((prevIndex) =>
          (prevIndex + 1) % aboutData.banners.length
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [aboutData]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading About Us...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Display Section */}
      <div className="about-container">
        {/* Banner Section with Multiple Banners */}
        <div className="banner-container position-relative">
          {aboutData?.banners && aboutData.banners.length > 0 ? (
            <div id="aboutBannerCarousel" className="carousel slide" data-bs-ride="carousel">
              <div className="carousel-inner">
                {aboutData.banners.map((banner, index) => (
                  <div
                    key={index}
                    className={`carousel-item ${index === activeBannerIndex ? 'active' : ''}`}
                  >
                    <img
                      src={`http://localhost:5000/public/images/about_images/${banner}`}
                      alt={`About Banner ${index + 1}`}
                      className="d-block w-100 banner-img"
                      style={{ height: "400px", objectFit: "cover" }}
                      onError={(e) => (e.target.src = defaultBanner)}
                    />
                  </div>
                ))}
              </div>

              {aboutData.banners.length > 1 && (
                <>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    onClick={() => setActiveBannerIndex(
                      (activeBannerIndex - 1 + aboutData.banners.length) % aboutData.banners.length
                    )}
                  >
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    onClick={() => setActiveBannerIndex(
                      (activeBannerIndex + 1) % aboutData.banners.length
                    )}
                  >
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <img
              src={defaultBanner}
              alt="About Us"
              className="d-block w-100 banner-img"
              style={{ height: "400px", objectFit: "cover" }}
            />
          )}
        </div>

        {/* Introduction Section */}
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h2 className="about-title">Our Story</h2>
              <p className="about-text lead">
                {aboutData?.content || "We believe in the power of natural ingredients combined with scientific innovation to create cosmetics that enhance your natural beauty."}
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        {aboutData?.mission && (
          <div className="container mt-5 py-4 mission-section">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center">
                <h3 className="mb-4">Our Mission</h3>
                <blockquote className="blockquote mission-text">
                  <p>"{aboutData.mission}"</p>
                </blockquote>
              </div>
            </div>
          </div>
        )}

        {/* Values Section */}
        {aboutData?.values && aboutData.values.length > 0 && (
          <div className="container mt-5">
            <h3 className="text-center mb-4">Our Values</h3>
            <div className="row">
              {aboutData.values.map((value, index) => (
                <div key={index} className="col-md-4 mb-4">
                  <div className="card h-100 value-card text-center">
                    <div className="card-body">
                      <h5 className="card-title">Value {index + 1}</h5>
                      <p className="card-text">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Section */}
        {aboutData?.videoUrl && (
          <div className="container mt-5">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <h3 className="text-center mb-4">Discover Our World</h3>
                <div className="ratio ratio-16x9 video-container">
                  <iframe
                    src={aboutData.videoUrl}
                    title="About our brand"
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 1 */}
        <div className="container mt-5">
          <div className="row align-items-center">
            <div className="col-md-6 text-center mb-4 mb-md-0">
              <img
                src={
                  aboutData?.section1Image
                    ? `http://localhost:5000/public/images/about_images/${aboutData.section1Image}`
                    : section1Default
                }
                height={350}
                width={350}
                alt="Our Products"
                className="img-fluid rounded about-img"
                onError={(e) => (e.target.src = section1Default)}
              />
            </div>
            <div className="col-md-6 text-center text-md-start">
              <h2 className="about-title">Our Products</h2>
              <p className="about-text">{aboutData?.section1Text || "We create high-quality cosmetics using only the finest natural ingredients, carefully sourced from around the world."}</p>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="container mt-5">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start order-2 order-lg-1">
              <h2 className="about-title">Sustainability</h2>
              <p className="about-text">{aboutData?.section2Text || "We're committed to sustainable practices, from ethically sourcing ingredients to using eco-friendly packaging."}</p>
            </div>
            <div className="col-lg-6 text-center order-1 order-lg-2">
              <img
                src={
                  aboutData?.section2Image
                    ? `http://localhost:5000/public/images/about_images/${aboutData.section2Image}`
                    : section2Default
                }
                height={350}
                width={350}
                alt="Sustainability"
                className="img-fluid rounded about-img"
                onError={(e) => (e.target.src = section2Default)}
              />
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="container mt-5 mb-5">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <div className="card bg-light p-4">
                <h3 className="mb-3">Ready to Experience Our Products?</h3>
                <p className="lead mb-4">
                  Join thousands of satisfied customers who trust our cosmetic brand for their beauty needs.
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <Link to="/Ct_product" className="btn btn-primary btn-lg">
                    Shop Now
                  </Link>
                  <Link to="/Contactus" className="btn btn-outline-primary btn-lg">
                    Contact Us
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>

        <hr className="p-2" />
      </div>

      {/* Error state */}
      {!loading && !aboutData && (
        <div className="container mt-5 text-center">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">About Us information is being updated!</h4>
            <p>We're currently updating our About Us section. Please check back soon for more information about our brand and values.</p>
            <hr />
            <p className="mb-0">In the meantime, feel free to explore our products or contact us with any questions.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Aboutus;
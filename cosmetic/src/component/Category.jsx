import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";
import c1 from "./Images/c1.jpeg";

const Category = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/CategoryModel/categories"
        );
        const activeCategories = response.data.filter(
          (category) => category.categoryStatus === "Active"
        );
        setCategories(activeCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          {
            _id: "fallback1",
            categoryName: "Finger Ring",
            categoryImage: "category1.png",
          },
          {
            _id: "fallback2",
            categoryName: "Necklace",
            categoryImage: "category2.png",
          },
          {
            _id: "fallback3",
            categoryName: "Bracelet",
            categoryImage: "category3.png",
          },
          {
            _id: "fallback4",
            categoryName: "Earrings",
            categoryImage: "category4.png",
          },
        ]);
      }
    };
    fetchCategories();
  }, []);

  // Handle category click
  const handleCategoryClick = (categoryName) => {
    if (onCategorySelect) {
      onCategorySelect(categoryName);
    } else {
      navigate(`/Ct_product?category=${encodeURIComponent(categoryName)}`);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4 display-5 fw-bold text-primary">
        Our Categories
      </h2>
      <p className="text-center mb-5 text-muted lead">
        Explore our wide range of beautiful cosmetics categories
      </p>
      
      <div className="position-relative">
        {/* Left scroll button */}
        <button 
          className="btn btn-light position-absolute start-0 top-50 translate-middle-y z-3 d-none d-md-block"
          onClick={scrollLeft}
          style={{
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          &lt;
        </button>
        
        {/* Right scroll button */}
        <button 
          className="btn btn-light position-absolute end-0 top-50 translate-middle-y z-3 d-none d-md-block"
          onClick={scrollRight}
          style={{
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          &gt;
        </button>
        
        {/* Categories container with horizontal scroll */}
        <div 
          ref={scrollContainerRef}
          className="d-flex flex-nowrap overflow-auto py-3 scroll-container"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <style>
            {`.scroll-container::-webkit-scrollbar { display: none; }`}
          </style>
          
          {(categories.length > 0 ? categories : [...Array(4)]).map((category, index) => (
            <div 
              key={category?._id || index}
              className="flex-shrink-0 me-4"
              style={{ width: "calc(25% - 1rem)", minWidth: "240px" }}
            >
              <div 
                className="card category-card h-100 shadow-sm border-0 overflow-hidden"
                onClick={() => category && handleCategoryClick(category.categoryName)}
                style={{ 
                  cursor: category ? "pointer" : "default", 
                  transition: "transform 0.3s" 
                }}
                onMouseEnter={(e) => {
                  if (category) {
                    e.currentTarget.style.transform = "translateY(-5px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (category) {
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <div className="category-img-container" style={{ height: "180px", overflow: "hidden" }}>
                  {category ? (
                    <img
                      src={
                        category.categoryImage
                          ? `http://localhost:5000/public/images/category_images/${category.categoryImage}`
                          : c1
                      }
                      className="card-img-top h-100 object-fit-cover"
                      alt={category.categoryName}
                      onError={(e) => (e.target.src = c1)}
                      style={{ transition: "transform 0.5s" }}
                      onMouseEnter={(e) => {
                        if (category) {
                          e.target.style.transform = "scale(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (category) {
                          e.target.style.transform = "scale(1)";
                        }
                      }}
                    />
                  ) : (
                    <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card-body text-center">
                  {category ? (
                    <>
                      <h5 className="card-title fw-bold text-dark mb-2">{category.categoryName}</h5>
                      <div className="d-flex justify-content-center align-items-center mt-2">
                        <span className="btn btn-outline-primary btn-sm rounded-pill px-3">
                          Explore <i className="ms-1 bi bi-arrow-right"></i>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="placeholder-glow">
                        <span className="placeholder col-8 placeholder-lg"></span>
                      </div>
                      <div className="mt-2 placeholder-glow">
                        <span className="placeholder col-5"></span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicators for mobile */}
      <div className="d-flex justify-content-center mt-3 d-md-none">
        <button className="btn btn-sm btn-outline-secondary me-2" onClick={scrollLeft}>
          &lt; Prev
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={scrollRight}>
          Next &gt;
        </button>
      </div>
      
      {/* Add custom CSS for additional styling */}
      <style>
        {`
          .category-card {
            border-radius: 12px;
            transition: all 0.3s ease;
          }
          
          .category-card:hover {
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }
          
          .object-fit-cover {
            object-fit: cover;
          }
          
          .z-3 {
            z-index: 3;
          }
        `}
      </style>
    </div>
  );
};

export default Category;
import React, { useState, useEffect } from "react";
import axios from "axios";
import defaultBanner from "../images/about1.jpeg";
import section1Default from "../images/about2.jpeg";
import section2Default from "../images/about3.jpeg";
import "../../App.css";

const AdAbout = () => {
  const [aboutData, setAboutData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [formData, setFormData] = useState({
    banners: [],
    content: "",
    section1Image: null,
    section1Text: "",
    section2Image: null,
    section2Text: "",
    videoUrl: "",
    mission: "",
    values: [],
  });
  const [errors, setErrors] = useState({});

  // Fetch About data on mount
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/AboutModel/about");
        if (response.data && response.data._id) {
          setAboutData(response.data);
          setFormData({
            banners: [],
            content: response.data.content || "",
            section1Image: null,
            section1Text: response.data.section1Text || "",
            section2Image: null,
            section2Text: response.data.section2Text || "",
            videoUrl: response.data.videoUrl || "",
            mission: response.data.mission || "",
            values: response.data.values || [],
          });
        } else {
          setAboutData(null);
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
        setAboutData(null);
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // Handle value array changes
  const handleValueChange = (index, value) => {
    const newValues = [...formData.values];
    newValues[index] = value;
    setFormData({ ...formData, values: newValues });
  };

  const addValueField = () => {
    setFormData({ ...formData, values: [...formData.values, ""] });
  };

  const removeValueField = (index) => {
    const newValues = formData.values.filter((_, i) => i !== index);
    setFormData({ ...formData, values: newValues });
  };

  // Handle image uploads
  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (file && ["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, [field]: { file, url: imageUrl } });
      setErrors({ ...errors, [field]: "" });
    } else {
      setErrors({ ...errors, [field]: "Only JPG, JPEG, and PNG allowed" });
    }
  };

  // Handle multiple banner uploads
  const handleBannerChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      ["image/png", "image/jpeg", "image/jpg"].includes(file.type)
    );
    
    if (validFiles.length !== files.length) {
      setErrors({ ...errors, banners: "Only JPG, JPEG, and PNG allowed" });
      return;
    }
    
    const bannerPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    
    setFormData({ ...formData, banners: [...formData.banners, ...bannerPreviews] });
    setErrors({ ...errors, banners: "" });
  };

  const removeBanner = (index) => {
    const newBanners = formData.banners.filter((_, i) => i !== index);
    setFormData({ ...formData, banners: newBanners });
  };

  // Validate form
  const validateForm = (isAdd = false) => {
    let tempErrors = {};
    if (!formData.content.trim()) tempErrors.content = "Content is required.";
    if (isAdd && formData.banners.length === 0) tempErrors.banners = "At least one banner is required.";
    if (!formData.section1Text.trim()) tempErrors.section1Text = "Section 1 text is required.";
    if (!formData.section2Text.trim()) tempErrors.section2Text = "Section 2 text is required.";
    if (!formData.mission.trim()) tempErrors.mission = "Mission statement is required.";
    if (formData.values.length === 0) tempErrors.values = "At least one value is required.";
    if (formData.values.some(v => !v.trim())) tempErrors.values = "All values must be filled.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Add
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    const data = new FormData();
    
    // Add banner images with indexed field names
    formData.banners.forEach((banner, index) => {
      data.append(`bannerImage${index}`, banner.file);
    });
    
    data.append("content", formData.content);
    data.append("section1Text", formData.section1Text);
    data.append("section2Text", formData.section2Text);
    data.append("videoUrl", formData.videoUrl);
    data.append("mission", formData.mission);
    
    // Add values array
    data.append("values", JSON.stringify(formData.values));
    
    // Add section images if provided
    if (formData.section1Image?.file) {
      data.append("section1Image", formData.section1Image.file);
    }
    if (formData.section2Image?.file) {
      data.append("section2Image", formData.section2Image.file);
    }

    try {
      const response = await axios.post("http://localhost:5000/api/AboutModel/about", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAboutData(response.data);
      setShowAddForm(false);
      setFormData({
        banners: [],
        content: "",
        section1Image: null,
        section1Text: "",
        section2Image: null,
        section2Text: "",
        videoUrl: "",
        mission: "",
        values: [],
      });
      alert("About data added successfully!");
    } catch (error) {
      console.error("Error adding about data:", error);
      setErrors({ form: "Failed to add about data" });
    }
  };

  // Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = new FormData();
    data.append("content", formData.content);
    data.append("section1Text", formData.section1Text);
    data.append("section2Text", formData.section2Text);
    data.append("videoUrl", formData.videoUrl);
    data.append("mission", formData.mission);
    data.append("values", JSON.stringify(formData.values));
    
    // Add banner images with indexed field names if provided
    formData.banners.forEach((banner, index) => {
      if (banner.file) {
        data.append(`bannerImage${index}`, banner.file);
      }
    });
    
    // Add section images if provided
    if (formData.section1Image?.file) {
      data.append("section1Image", formData.section1Image.file);
    }
    if (formData.section2Image?.file) {
      data.append("section2Image", formData.section2Image.file);
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/AboutModel/about/${aboutData._id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setAboutData(response.data);
      alert("About data updated successfully!");
    } catch (error) {
      console.error("Error updating about data:", error);
      setErrors({ form: "Failed to update about data" });
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!aboutData || !window.confirm("Are you sure you want to delete the About data?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/AboutModel/about/${aboutData._id}`);
      setAboutData(null);
      setFormData({
        banners: [],
        content: "",
        section1Image: null,
        section1Text: "",
        section2Image: null,
        section2Text: "",
        videoUrl: "",
        mission: "",
        values: [],
      });
      alert("About data deleted successfully!");
    } catch (error) {
      console.error("Error deleting about data:", error);
      alert("Failed to delete about data");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">About Our Cosmetic Brand</h2>

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

        <hr className="p-2" />
      </div>

      {/* Add/Update Form */}
      {!aboutData && !showAddForm && (
        <button className="btn btn-success mb-3" onClick={() => setShowAddForm(true)}>
          Add About Data
        </button>
      )}

      {(showAddForm || aboutData) && (
        <div className="card p-3 mb-3">
          <h4>{showAddForm ? "Add About Data" : "Edit About Data"}</h4>
          <form onSubmit={showAddForm ? handleAdd : handleUpdate}>
            {/* Banner Images */}
            <div className="mb-3">
              <label className="form-label">Banner Images (Multiple)</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleBannerChange}
              />
              {errors.banners && <small className="text-danger">{errors.banners}</small>}
              
              <div className="d-flex flex-wrap mt-3">
                {formData.banners.map((banner, index) => (
                  <div key={index} className="position-relative me-2 mb-2">
                    <img
                      src={banner.url}
                      alt={`Banner Preview ${index + 1}`}
                      className="img-thumbnail"
                      style={{ width: "100px", height: "70px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      className="btn-close position-absolute top-0 end-0"
                      style={{ transform: "translate(50%, -50%)" }}
                      onClick={() => removeBanner(index)}
                    ></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Content</label>
              <textarea
                name="content"
                className="form-control"
                rows="3"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Tell your brand's story..."
              />
              {errors.content && <small className="text-danger">{errors.content}</small>}
            </div>

            <div className="mb-3">
              <label className="form-label">Mission Statement</label>
              <textarea
                name="mission"
                className="form-control"
                rows="2"
                value={formData.mission}
                onChange={handleInputChange}
                placeholder="Our mission is to..."
              />
              {errors.mission && <small className="text-danger">{errors.mission}</small>}
            </div>

            <div className="mb-3">
              <label className="form-label">Company Values</label>
              {formData.values.map((value, index) => (
                <div key={index} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    placeholder={`Value ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeValueField(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={addValueField}
              >
                Add Value
              </button>
              {errors.values && <small className="text-danger">{errors.values}</small>}
            </div>

            <div className="mb-3">
              <label className="form-label">Video URL</label>
              <input
                type="url"
                name="videoUrl"
                className="form-control"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Section 1 Image</label>
              <input
                type="file"
                className="form-control"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => handleImageChange(e, "section1Image")}
              />
              {errors.section1Image && <small className="text-danger">{errors.section1Image}</small>}
              {formData.section1Image && (
                <img
                  src={formData.section1Image.url}
                  alt="Section 1 Preview"
                  className="img-fluid mt-2"
                  style={{ maxHeight: "200px" }}
                />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Section 1 Text</label>
              <textarea
                name="section1Text"
                className="form-control"
                rows="3"
                value={formData.section1Text}
                onChange={handleInputChange}
              />
              {errors.section1Text && <small className="text-danger">{errors.section1Text}</small>}
            </div>

            <div className="mb-3">
              <label className="form-label">Section 2 Image</label>
              <input
                type="file"
                className="form-control"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => handleImageChange(e, "section2Image")}
              />
              {errors.section2Image && <small className="text-danger">{errors.section2Image}</small>}
              {formData.section2Image && (
                <img
                  src={formData.section2Image.url}
                  alt="Section 2 Preview"
                  className="img-fluid mt-2"
                  style={{ maxHeight: "200px" }}
                />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Section 2 Text</label>
              <textarea
                name="section2Text"
                className="form-control"
                rows="3"
                value={formData.section2Text}
                onChange={handleInputChange}
              />
              {errors.section2Text && <small className="text-danger">{errors.section2Text}</small>}
            </div>

            {errors.form && (
              <div className="alert alert-danger" role="alert">
                {errors.form}
              </div>
            )}

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                {showAddForm ? "Add" : "Update"}
              </button>
              {showAddForm && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      banners: [],
                      content: "",
                      section1Image: null,
                      section1Text: "",
                      section2Image: null,
                      section2Text: "",
                      videoUrl: "",
                      mission: "",
                      values: [],
                    });
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
              )}
              {aboutData && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdAbout;
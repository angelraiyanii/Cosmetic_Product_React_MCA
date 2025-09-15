import React, { useState, useEffect } from "react";
import axios from "axios";
import aboutBannerDefault from "../images/about.png"; // Default banner
import img1Default from "../images/category1.png"; // Default section 1 image
import img2Default from "../images/category2.png"; // Default section 2 image
import "../../App.css";

const AdAbout = () => {
  const [aboutData, setAboutData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bannerImage: null,
    content: "",
    section1Image: null,
    section1Text: "",
    section2Image: null,
    section2Text: "",
  });
  const [errors, setErrors] = useState({});

  // Fetch About data on mount
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/AboutModel/about");
        setAboutData(response.data);
        setFormData({
          bannerImage: null,
          content: response.data.content || "",
          section1Image: null,
          section1Text: response.data.section1Text || "",
          section2Image: null,
          section2Text: response.data.section2Text || "",
        });
      } catch (error) {
        console.error("Error fetching about data:", error);
        setAboutData(null); // No data yet, show defaults
      }
    };
    fetchAboutData();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
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

  // Validate form
  const validateForm = (isAdd = false) => {
    let tempErrors = {};
    if (!formData.content.trim()) tempErrors.content = "Content is required.";
    if (isAdd && !formData.bannerImage) tempErrors.bannerImage = "Banner image is required.";
    if (isAdd && !formData.section1Image) tempErrors.section1Image = "Section 1 image is required.";
    if (!formData.section1Text.trim()) tempErrors.section1Text = "Section 1 text is required.";
    if (isAdd && !formData.section2Image) tempErrors.section2Image = "Section 2 image is required.";
    if (!formData.section2Text.trim()) tempErrors.section2Text = "Section 2 text is required.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Add
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    const data = new FormData();
    data.append("bannerImage", formData.bannerImage.file);
    data.append("content", formData.content);
    data.append("section1Image", formData.section1Image.file);
    data.append("section1Text", formData.section1Text);
    data.append("section2Image", formData.section2Image.file);
    data.append("section2Text", formData.section2Text);

    try {
      const response = await axios.post("http://localhost:5000/api/AboutModel/about", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAboutData(response.data);
      setShowAddForm(false);
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
    if (formData.bannerImage?.file) data.append("bannerImage", formData.bannerImage.file);
    if (formData.section1Image?.file) data.append("section1Image", formData.section1Image.file);
    if (formData.section2Image?.file) data.append("section2Image", formData.section2Image.file);

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
        bannerImage: null,
        content: "",
        section1Image: null,
        section1Text: "",
        section2Image: null,
        section2Text: "",
      });
      alert("About data deleted successfully!");
    } catch (error) {
      console.error("Error deleting about data:", error);
      alert("Failed to delete about data");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">About Us</h2>

      {/* Display Section */}
      <div className="about-container">
        <div className="container-fluid px-0">
          <img
            src={
              aboutData?.bannerImage
                ? `http://localhost:5000/public/images/about_images/${aboutData.bannerImage}`
                : aboutBannerDefault
            }
            alt="About Us"
            className="d-block w-100 banner-img"
            onError={(e) => (e.target.src = aboutBannerDefault)}
          />
        </div>

        <div className="container mt-5">
          <div className="row align-items-center">
            <div className="col-md-6 text-center mb-4 mb-md-0">
              <img
                src={
                  aboutData?.section1Image
                    ? `http://localhost:5000/public/images/about_images/${aboutData.section1Image}`
                    : img1Default
                }
                height={300}
                width={300}
                alt="Section 1"
                className="img-fluid rounded about-img"
                onError={(e) => (e.target.src = img1Default)}
              />
            </div>
            <div className="col-md-6 text-center text-md-start">
              <h2 className="about-title">About Our Jewellery</h2>
              <p className="about-text">{aboutData?.section1Text || "Default Section 1 Text"}</p>
            </div>
          </div>
        </div>

        <div className="container mt-5">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start">
              <h2 className="about-title">About Our Jewellery</h2>
              <p className="about-text">{aboutData?.section2Text || "Default Section 2 Text"}</p>
            </div>
            <div className="col-lg-6 text-center">
              <img
                src={
                  aboutData?.section2Image
                    ? `http://localhost:5000/public/images/about_images/${aboutData.section2Image}`
                    : img2Default
                }
                height={300}
                width={300}
                alt="Section 2"
                className="img-fluid rounded about-img"
                onError={(e) => (e.target.src = img2Default)}
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
            <div className="mb-3">
              <label className="form-label">Banner Image</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => handleImageChange(e, "bannerImage")}
              />
              {errors.bannerImage && <small className="text-danger">{errors.bannerImage}</small>}
              {formData.bannerImage && (
                <img
                  src={formData.bannerImage.url}
                  alt="Banner Preview"
                  className="img-fluid mt-2"
                  style={{ maxHeight: "200px" }}
                />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Content</label>
              <textarea
                name="content"
                className="form-control"
                rows="3"
                value={formData.content}
                onChange={handleInputChange}
              />
              {errors.content && <small className="text-danger">{errors.content}</small>}
            </div>

            <div className="mb-3">
              <label className="form-label">Section 1 Image</label>
              <input
                type="file"
                className="form-control"
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

            {errors.form && <small className="text-danger">{errors.form}</small>}
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-primary">
                {showAddForm ? "Add" : "Update"} Changes
              </button>
              {!showAddForm && aboutData && (
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
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
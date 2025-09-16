import React, { useState, useEffect } from "react";
import axios from "axios";
import aboutBannerDefault from "../images/banner1.jpeg";
import img1Default from "../images/banner2.jpg";
import img2Default from "../images/banner3.jpg";
import "../../App.css";

const AdAbout = () => {
  const [aboutData, setAboutData] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    bannerImage: null,
    bannerVideo: null,
    content: "",
    section1Image: null,
    section1Video: null,
    section1Text: "",
    section2Image: null,
    section2Video: null,
    section2Text: "",
    missionStatement: "",
    values: [""],
    teamMembers: [{ name: "", role: "", image: null }],
    mediaType1: "image", // Default to image
    mediaType2: "image"  // Default to image
  });
  const [errors, setErrors] = useState({});

  // Fetch About data on mount
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/AboutModel");
        setAboutData(response.data);
        setFormData({
          bannerImage: null,
          bannerVideo: null,
          content: response.data.content || "",
          section1Image: null,
          section1Video: null,
          section1Text: response.data.section1Text || "",
          section2Image: null,
          section2Video: null,
          section2Text: response.data.section2Text || "",
          missionStatement: response.data.missionStatement || "",
          values: response.data.values || [""],
          teamMembers: response.data.teamMembers || [{ name: "", role: "", image: null }],
          mediaType1: response.data.mediaType1 || "image",
          mediaType2: response.data.mediaType2 || "image"
        });
      } catch (error) {
        console.error("Error fetching about data:", error);
        setAboutData(null);
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

  // Handle media type changes
  const handleMediaTypeChange = (section, type) => {
    setFormData({ ...formData, [section]: type });
  };

  // Handle values array changes
  const handleValueChange = (index, value) => {
    const newValues = [...formData.values];
    newValues[index] = value;
    setFormData({ ...formData, values: newValues });
  };

  const addValueField = () => {
    setFormData({ ...formData, values: [...formData.values, ""] });
  };

  const removeValueField = (index) => {
    const newValues = [...formData.values];
    newValues.splice(index, 1);
    setFormData({ ...formData, values: newValues });
  };

  // Handle team members changes
  const handleTeamMemberChange = (index, field, value) => {
    const newTeamMembers = [...formData.teamMembers];
    newTeamMembers[index][field] = value;
    setFormData({ ...formData, teamMembers: newTeamMembers });
  };

  const handleTeamImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file && ["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      const imageUrl = URL.createObjectURL(file);
      const newTeamMembers = [...formData.teamMembers];
      newTeamMembers[index].image = { file, url: imageUrl };
      setFormData({ ...formData, teamMembers: newTeamMembers });
    }
  };

  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, { name: "", role: "", image: null }]
    });
  };

  const removeTeamMember = (index) => {
    const newTeamMembers = [...formData.teamMembers];
    newTeamMembers.splice(index, 1);
    setFormData({ ...formData, teamMembers: newTeamMembers });
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

  // Handle video uploads
  const handleVideoChange = (e, field) => {
    const file = e.target.files[0];
    if (file && ["video/mp4", "video/mov", "video/avi", "video/wmv"].includes(file.type)) {
      const videoUrl = URL.createObjectURL(file);
      setFormData({ ...formData, [field]: { file, url: videoUrl } });
      setErrors({ ...errors, [field]: "" });
    } else {
      setErrors({ ...errors, [field]: "Only MP4, MOV, AVI, and WMV allowed" });
    }
  };

  // Validate form
  const validateForm = (isAdd = false) => {
    let tempErrors = {};
    if (!formData.content.trim()) tempErrors.content = "Content is required.";

    // Banner validation
    if (isAdd && !formData.bannerImage && !formData.bannerVideo) {
      tempErrors.bannerMedia = "Banner media (image or video) is required";
    }

    // Section 1 validation
    if (formData.mediaType1 === "image" && isAdd && !formData.section1Image) {
      tempErrors.section1Image = "Section 1 image is required when using image media type";
    } else if (formData.mediaType1 === "video" && isAdd && !formData.section1Video) {
      tempErrors.section1Video = "Section 1 video is required when using video media type";
    }

    if (!formData.section1Text.trim()) tempErrors.section1Text = "Section 1 text is required.";

    // Section 2 validation
    if (formData.mediaType2 === "image" && isAdd && !formData.section2Image) {
      tempErrors.section2Image = "Section 2 image is required when using image media type";
    } else if (formData.mediaType2 === "video" && isAdd && !formData.section2Video) {
      tempErrors.section2Video = "Section 2 video is required when using video media type";
    }

    if (!formData.section2Text.trim()) tempErrors.section2Text = "Section 2 text is required.";
    if (!formData.missionStatement.trim()) tempErrors.missionStatement = "Mission statement is required.";

    // Validate values
    formData.values.forEach((value, index) => {
      if (!value.trim()) tempErrors[`value-${index}`] = "Value cannot be empty";
    });

    // Validate team members
    formData.teamMembers.forEach((member, index) => {
      if (!member.name.trim()) tempErrors[`teamName-${index}`] = "Team member name is required";
      if (!member.role.trim()) tempErrors[`teamRole-${index}`] = "Team member role is required";
      if (isAdd && !member.image) tempErrors[`teamImage-${index}`] = "Team member image is required";
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Add
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    const data = new FormData();
    if (formData.bannerImage) data.append("bannerImage", formData.bannerImage.file);
    if (formData.bannerVideo) data.append("bannerVideo", formData.bannerVideo.file);
    data.append("content", formData.content);
    if (formData.section1Image) data.append("section1Image", formData.section1Image.file);
    if (formData.section1Video) data.append("section1Video", formData.section1Video.file);
    data.append("section1Text", formData.section1Text);
    if (formData.section2Image) data.append("section2Image", formData.section2Image.file);
    if (formData.section2Video) data.append("section2Video", formData.section2Video.file);
    data.append("section2Text", formData.section2Text);
    data.append("missionStatement", formData.missionStatement);
    data.append("values", JSON.stringify(formData.values));
    data.append("mediaType1", formData.mediaType1);
    data.append("mediaType2", formData.mediaType2);

    formData.teamMembers.forEach((member, index) => {
      data.append(`teamMemberName${index}`, member.name);
      data.append(`teamMemberRole${index}`, member.role);
      if (member.image && member.image.file) {
        data.append(`teamMemberImage${index}`, member.image.file);
      }
    });

    try {
      const response = await axios.post("http://localhost:5000/api/AboutModel", data, {
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
    data.append("missionStatement", formData.missionStatement);
    data.append("values", JSON.stringify(formData.values));
    data.append("mediaType1", formData.mediaType1);
    data.append("mediaType2", formData.mediaType2);

    if (formData.bannerImage?.file) data.append("bannerImage", formData.bannerImage.file);
    if (formData.bannerVideo?.file) data.append("bannerVideo", formData.bannerVideo.file);
    if (formData.section1Image?.file) data.append("section1Image", formData.section1Image.file);
    if (formData.section1Video?.file) data.append("section1Video", formData.section1Video.file);
    if (formData.section2Image?.file) data.append("section2Image", formData.section2Image.file);
    if (formData.section2Video?.file) data.append("section2Video", formData.section2Video.file);

    formData.teamMembers.forEach((member, index) => {
      data.append(`teamMemberName${index}`, member.name);
      data.append(`teamMemberRole${index}`, member.role);
      if (member.image && member.image.file) {
        data.append(`teamMemberImage${index}`, member.image.file);
      } else if (typeof member.image === 'string') {
        data.append(`teamMemberImagePath${index}`, member.image);
      }
    });

    try {
      const response = await axios.put(
        `http://localhost:5000/api/AboutModel/${aboutData._id}`,
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
      await axios.delete(`http://localhost:5000/api/AboutModel/${aboutData._id}`);
      setAboutData(null);
      setFormData({
        bannerImage: null,
        bannerVideo: null,
        content: "",
        section1Image: null,
        section1Video: null,
        section1Text: "",
        section2Image: null,
        section2Video: null,
        section2Text: "",
        missionStatement: "",
        values: [""],
        teamMembers: [{ name: "", role: "", image: null }],
        mediaType1: "image",
        mediaType2: "image"
      });
      alert("About data deleted successfully!");
    } catch (error) {
      console.error("Error deleting about data:", error);
      alert("Failed to delete about data");
    }
  };

  // Render media preview based on type
  const renderMediaPreview = (section, imageField, videoField, defaultImage) => {
    const mediaType = formData[section];

    if (mediaType === "image") {
      return (
        <>
          <label className="form-label fw-bold">Image</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => handleImageChange(e, imageField)}
          />
          {errors[imageField] && <small className="text-danger">{errors[imageField]}</small>}
          {formData[imageField] && (
            <img
              src={formData[imageField].url}
              alt="Preview"
              className="img-fluid mt-2 rounded shadow-sm"
              style={{ maxHeight: "200px" }}
            />
          )}
          {aboutData && !formData[imageField] && aboutData[imageField] && (
            <img
              src={`http://localhost:5000/public/images/about_images/${aboutData[imageField]}`}
              alt="Current"
              className="img-fluid mt-2 rounded shadow-sm"
              style={{ maxHeight: "200px" }}
              onError={(e) => (e.target.src = defaultImage)}
            />
          )}
        </>
      );
    } else {
      return (
        <>
          <label className="form-label fw-bold">Video</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => handleVideoChange(e, videoField)}
          />
          {errors[videoField] && <small className="text-danger">{errors[videoField]}</small>}
          {formData[videoField] && (
            <video
              src={formData[videoField].url}
              controls
              className="img-fluid mt-2 rounded shadow-sm"
              style={{ maxHeight: "200px" }}
            />
          )}
          {aboutData && !formData[videoField] && aboutData[videoField] && (
            <video
              src={`http://localhost:5000/public/videos/about_videos/${aboutData[videoField]}`}
              controls
              className="img-fluid mt-2 rounded shadow-sm"
              style={{ maxHeight: "200px" }}
            />
          )}
        </>
      );
    }
  };

  // Render media display based on type
  const renderMediaDisplay = (section, imageField, videoField, defaultImage, altText) => {
    if (!aboutData) return null;

    if (aboutData[section] === "image") {
      return (
        <img
          src={
            aboutData[imageField]
              ? `http://localhost:5000/public/images/about_images/${aboutData[imageField]}`
              : defaultImage
          }
          height={350}
          width={350}
          alt={altText}
          className="img-fluid rounded-circle shadow about-img"
          onError={(e) => (e.target.src = defaultImage)}
        />
      );
    } else {
      return (
        <video
          src={`http://localhost:5000/public/videos/about_videos/${aboutData[videoField]}`}
          controls
          className="img-fluid rounded shadow about-img"
          style={{ height: "350px", width: "350px", objectFit: "cover" }}
        />
      );
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">About Our Cosmetic Brand</h2>

      {/* Display Section */}
      {aboutData && (
        <div className="about-container">
          {/* Banner Section */}
          <div className="container-fluid px-0">
            {aboutData.bannerVideo ? (
              <video
                src={`http://localhost:5000/public/videos/about_videos/${aboutData.bannerVideo}`}
                autoPlay
                muted
                loop
                className="d-block w-100 banner-img rounded shadow"
                style={{ height: "400px", objectFit: "cover" }}
              />
            ) : (
              <img
                src={
                  aboutData.bannerImage
                    ? `http://localhost:5000/public/images/about_images/${aboutData.bannerImage}`
                    : aboutBannerDefault
                }
                alt="About Us"
                className="d-block w-100 banner-img rounded shadow"
                style={{ height: "400px", objectFit: "cover" }}
                onError={(e) => (e.target.src = aboutBannerDefault)}
              />
            )}
          </div>

          {/* Mission Statement */}
          <div className="container mt-5 text-center">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <h3 className="fw-bold text-primary">Our Mission</h3>
                <p className="lead">{aboutData.missionStatement}</p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="container mt-5">
            <div className="row align-items-center">
              <div className="col-md-6 text-center mb-4 mb-md-0">
                {renderMediaDisplay("mediaType1", "section1Image", "section1Video", img1Default, "Skincare Products")}
              </div>
              <div className="col-md-6 text-center text-md-start">
                <h2 className="about-title fw-bold">Our Skincare Philosophy</h2>
                <p className="about-text">{aboutData.section1Text}</p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="container mt-5">
            <div className="row align-items-center">
              <div className="col-lg-6 text-center text-lg-start order-2 order-lg-1">
                <h2 className="about-title fw-bold">Quality Makeup Products</h2>
                <p className="about-text">{aboutData.section2Text}</p>
              </div>
              <div className="col-lg-6 text-center order-1 order-lg-2">
                {renderMediaDisplay("mediaType2", "section2Image", "section2Video", img2Default, "Makeup Products")}
              </div>
            </div>
          </div>

          {/* Values Section */}
          {aboutData.values && aboutData.values.length > 0 && (
            <div className="container mt-5">
              <h3 className="text-center fw-bold mb-4">Our Core Values</h3>
              <div className="row">
                {aboutData.values.map((value, index) => (
                  <div key={index} className="col-md-4 mb-3">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body text-center">
                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          style={{ width: "60px", height: "60px" }}>
                          <span className="text-primary fw-bold">{index + 1}</span>
                        </div>
                        <p className="card-text">{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Section */}
          {aboutData.teamMembers && aboutData.teamMembers.length > 0 && (
            <div className="container mt-5">
              <h3 className="text-center fw-bold mb-4">Meet Our Team</h3>
              <div className="row justify-content-center">
                {aboutData.teamMembers.map((member, index) => (
                  <div key={index} className="col-md-3 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <img
                        src={
                          typeof member.image === 'string'
                            ? `http://localhost:5000/public/images/about_images/${member.image}`
                            : (member.image?.url || img1Default)
                        }
                        className="card-img-top"
                        alt={member.name}
                        style={{ height: "250px", objectFit: "cover" }}
                        onError={(e) => (e.target.src = img1Default)}
                      />
                      <div className="card-body text-center">
                        <h5 className="card-title">{member.name}</h5>
                        <p className="card-text text-muted">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="p-2" />
        </div>
      )}

      {/* Add/Update Form */}
      {!aboutData && !showAddForm && (
        <div className="text-center mb-4">
          <button className="btn btn-success btn-lg" onClick={() => setShowAddForm(true)}>
            <i className="fas fa-plus me-2"></i>Add About Data
          </button>
        </div>
      )}

      {(showAddForm || aboutData) && (
        <div className="card p-4 mb-5 shadow">
          <h4 className="mb-4 border-bottom pb-2">{showAddForm ? "Add About Data" : "Edit About Data"}</h4>
          <form onSubmit={showAddForm ? handleAdd : handleUpdate}>
            {/* Banner Section */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="border-bottom pb-2">Banner Section</h5>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Banner Image</label>
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
                    className="img-fluid mt-2 rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                )}
                {aboutData && !formData.bannerImage && aboutData.bannerImage && (
                  <img
                    src={`http://localhost:5000/public/images/about_images/${aboutData.bannerImage}`}
                    alt="Current Banner"
                    className="img-fluid mt-2 rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                    onError={(e) => (e.target.src = aboutBannerDefault)}
                  />
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Banner Video</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => handleVideoChange(e, "bannerVideo")}
                />
                {errors.bannerVideo && <small className="text-danger">{errors.bannerVideo}</small>}
                {formData.bannerVideo && (
                  <video
                    src={formData.bannerVideo.url}
                    controls
                    className="img-fluid mt-2 rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                )}
                {aboutData && !formData.bannerVideo && aboutData.bannerVideo && (
                  <video
                    src={`http://localhost:5000/public/videos/about_videos/${aboutData.bannerVideo}`}
                    controls
                    className="img-fluid mt-2 rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                )}
                {errors.bannerMedia && <small className="text-danger">{errors.bannerMedia}</small>}
              </div>
            </div>

            {/* Main Content */}
            <div className="mb-4">
              <label className="form-label fw-bold">About Content</label>
              <textarea
                className="form-control"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows="5"
                placeholder="Enter the main about content..."
              />
              {errors.content && <small className="text-danger">{errors.content}</small>}
            </div>

            {/* Mission Statement */}
            <div className="mb-4">
              <label className="form-label fw-bold">Mission Statement</label>
              <textarea
                className="form-control"
                name="missionStatement"
                value={formData.missionStatement}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter your mission statement..."
              />
              {errors.missionStatement && <small className="text-danger">{errors.missionStatement}</small>}
            </div>

            {/* Section 1 */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="border-bottom pb-2">Section 1</h5>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Media Type</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mediaType1"
                      id="mediaType1Image"
                      value="image"
                      checked={formData.mediaType1 === "image"}
                      onChange={() => handleMediaTypeChange("mediaType1", "image")}
                    />
                    <label className="form-check-label" htmlFor="mediaType1Image">
                      Image
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mediaType1"
                      id="mediaType1Video"
                      value="video"
                      checked={formData.mediaType1 === "video"}
                      onChange={() => handleMediaTypeChange("mediaType1", "video")}
                    />
                    <label className="form-check-label" htmlFor="mediaType1Video">
                      Video
                    </label>
                  </div>
                </div>
                {renderMediaPreview("mediaType1", "section1Image", "section1Video", img1Default)}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Section 1 Text</label>
                <textarea
                  className="form-control"
                  name="section1Text"
                  value={formData.section1Text}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Enter section 1 text..."
                />
                {errors.section1Text && <small className="text-danger">{errors.section1Text}</small>}
              </div>
            </div>

            {/* Section 2 */}
            <div className="row mb-4">
              <div className="col-12">
                <h5 className="border-bottom pb-2">Section 2</h5>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Media Type</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mediaType2"
                      id="mediaType2Image"
                      value="image"
                      checked={formData.mediaType2 === "image"}
                      onChange={() => handleMediaTypeChange("mediaType2", "image")}
                    />
                    <label className="form-check-label" htmlFor="mediaType2Image">
                      Image
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mediaType2"
                      id="mediaType2Video"
                      value="video"
                      checked={formData.mediaType2 === "video"}
                      onChange={() => handleMediaTypeChange("mediaType2", "video")}
                    />
                    <label className="form-check-label" htmlFor="mediaType2Video">
                      Video
                    </label>
                  </div>
                </div>
                {renderMediaPreview("mediaType2", "section2Image", "section2Video", img2Default)}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Section 2 Text</label>
                <textarea
                  className="form-control"
                  name="section2Text"
                  value={formData.section2Text}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Enter section 2 text..."
                />
                {errors.section2Text && <small className="text-danger">{errors.section2Text}</small>}
              </div>
            </div>

            {/* Values Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Core Values</h5>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addValueField}>
                  <i className="fas fa-plus me-1"></i>Add Value
                </button>
              </div>
              {formData.values.map((value, index) => (
                <div key={index} className="row mb-2 align-items-center">
                  <div className="col-10">
                    <input
                      type="text"
                      className="form-control"
                      value={value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder={`Value ${index + 1}`}
                    />
                    {errors[`value-${index}`] && <small className="text-danger">{errors[`value-${index}`]}</small>}
                  </div>
                  <div className="col-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeValueField(index)}
                      disabled={formData.values.length <= 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Members Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Team Members</h5>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addTeamMember}>
                  <i className="fas fa-plus me-1"></i>Add Member
                </button>
              </div>
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Image</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => handleTeamImageChange(e, index)}
                          accept="image/*"
                        />
                        {errors[`teamImage-${index}`] && <small className="text-danger">{errors[`teamImage-${index}`]}</small>}
                        {member.image && (
                          <img
                            src={typeof member.image === 'string'
                              ? `http://localhost:5000/public/images/about_images/${member.image}`
                              : member.image.url}
                            alt="Preview"
                            className="img-fluid mt-2 rounded shadow-sm"
                            style={{ maxHeight: "150px" }}
                            onError={(e) => (e.target.src = img1Default)}
                          />
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={member.name}
                          onChange={(e) => handleTeamMemberChange(index, "name", e.target.value)}
                          placeholder="Team member name"
                        />
                        {errors[`teamName-${index}`] && <small className="text-danger">{errors[`teamName-${index}`]}</small>}
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-bold">Role</label>
                        <input
                          type="text"
                          className="form-control"
                          value={member.role}
                          onChange={(e) => handleTeamMemberChange(index, "role", e.target.value)}
                          placeholder="Team member role"
                        />
                        {errors[`teamRole-${index}`] && <small className="text-danger">{errors[`teamRole-${index}`]}</small>}
                      </div>
                      <div className="col-md-1 mb-3 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeTeamMember(index)}
                          disabled={formData.teamMembers.length <= 1}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="d-flex gap-2 justify-content-end">
              {showAddForm && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
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
              <button type="submit" className="btn btn-primary">
                {showAddForm ? "Add About Data" : "Update About Data"}
              </button>
            </div>
            {errors.form && <div className="alert alert-danger mt-3">{errors.form}</div>}
          </form>
        </div>
      )}
    </div>
  );
};

export default AdAbout;
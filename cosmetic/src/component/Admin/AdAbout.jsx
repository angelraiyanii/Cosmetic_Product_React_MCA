import React, { useState, useEffect } from "react";
import axios from "axios";
import aboutBannerDefault from "../images/banner1.jpeg"; // Updated default banner
import img1Default from "../images/banner2.jpg"; // Updated section 1 image
import img2Default from "../images/banner3.jpg"; // Updated section 2 image
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
    missionStatement: "",
    values: [""],
    teamMembers: [{ name: "", role: "", image: null }]
  });
  const [errors, setErrors] = useState({});

  // Fetch About data on mount
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/about");
        setAboutData(response.data);
        setFormData({
          bannerImage: null,
          content: response.data.content || "",
          section1Image: null,
          section1Text: response.data.section1Text || "",
          section2Image: null,
          section2Text: response.data.section2Text || "",
          missionStatement: response.data.missionStatement || "",
          values: response.data.values || [""],
          teamMembers: response.data.teamMembers || [{ name: "", role: "", image: null }]
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

  // Validate form
  const validateForm = (isAdd = false) => {
    let tempErrors = {};
    if (!formData.content.trim()) tempErrors.content = "Content is required.";
    if (isAdd && !formData.bannerImage) tempErrors.bannerImage = "Banner image is required.";
    if (isAdd && !formData.section1Image) tempErrors.section1Image = "Section 1 image is required.";
    if (!formData.section1Text.trim()) tempErrors.section1Text = "Section 1 text is required.";
    if (isAdd && !formData.section2Image) tempErrors.section2Image = "Section 2 image is required.";
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
    data.append("bannerImage", formData.bannerImage.file);
    data.append("content", formData.content);
    data.append("section1Image", formData.section1Image.file);
    data.append("section1Text", formData.section1Text);
    data.append("section2Image", formData.section2Image.file);
    data.append("section2Text", formData.section2Text);
    data.append("missionStatement", formData.missionStatement);
    data.append("values", JSON.stringify(formData.values));
    
    formData.teamMembers.forEach((member, index) => {
      data.append(`teamMemberName${index}`, member.name);
      data.append(`teamMemberRole${index}`, member.role);
      if (member.image && member.image.file) {
        data.append(`teamMemberImage${index}`, member.image.file);
      }
    });

    try {
      const response = await axios.post("http://localhost:5000/api/about", data, {
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
    
    if (formData.bannerImage?.file) data.append("bannerImage", formData.bannerImage.file);
    if (formData.section1Image?.file) data.append("section1Image", formData.section1Image.file);
    if (formData.section2Image?.file) data.append("section2Image", formData.section2Image.file);
    
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
        `http://localhost:5000/api/about/${aboutData._id}`,
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
      await axios.delete(`http://localhost:5000/api/about/${aboutData._id}`);
      setAboutData(null);
      setFormData({
        bannerImage: null,
        content: "",
        section1Image: null,
        section1Text: "",
        section2Image: null,
        section2Text: "",
        missionStatement: "",
        values: [""],
        teamMembers: [{ name: "", role: "", image: null }]
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
      {aboutData && (
        <div className="about-container">
          {/* Banner Section */}
          <div className="container-fluid px-0">
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
                <img
                  src={
                    aboutData.section1Image
                      ? `http://localhost:5000/public/images/about_images/${aboutData.section1Image}`
                      : img1Default
                  }
                  height={350}
                  width={350}
                  alt="Skincare Products"
                  className="img-fluid rounded-circle shadow about-img"
                  onError={(e) => (e.target.src = img1Default)}
                />
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
                <img
                  src={
                    aboutData.section2Image
                      ? `http://localhost:5000/public/images/about_images/${aboutData.section2Image}`
                      : img2Default
                  }
                  height={350}
                  width={350}
                  alt="Makeup Products"
                  className="img-fluid rounded shadow about-img"
                  onError={(e) => (e.target.src = img2Default)}
                />
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
            <div className="row">
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
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Content</label>
                <textarea
                  name="content"
                  className="form-control"
                  rows="3"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Brief description of your cosmetic brand..."
                />
                {errors.content && <small className="text-danger">{errors.content}</small>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Section 1 Image (Skincare)</label>
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
                    className="img-fluid mt-2 rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Section 1 Text</label>
                <textarea
                  name="section1Text"
                  className="form-control"
                  rows="3"
                  value={formData.section1Text}
                  onChange={handleInputChange}
                  placeholder="Describe your skincare philosophy..."
                />
                {errors.section1Text && <small className="text-danger">{errors.section1Text}</small>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Section 2 Image (Makeup)</label>
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
                    className="img-fluid mt-2 rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Section 2 Text</label>
                <textarea
                  name="section2Text"
                  className="form-control"
                  rows="3"
                  value={formData.section2Text}
                  onChange={handleInputChange}
                  placeholder="Describe your makeup products and approach..."
                />
                {errors.section2Text && <small className="text-danger">{errors.section2Text}</small>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Mission Statement</label>
              <textarea
                name="missionStatement"
                className="form-control"
                rows="2"
                value={formData.missionStatement}
                onChange={handleInputChange}
                placeholder="Your brand's mission statement..."
              />
              {errors.missionStatement && <small className="text-danger">{errors.missionStatement}</small>}
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Core Values</label>
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
                    disabled={formData.values.length <= 1}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  {errors[`value-${index}`] && <small className="text-danger">{errors[`value-${index}`]}</small>}
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={addValueField}>
                <i className="fas fa-plus me-1"></i>Add Value
              </button>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Team Members</label>
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Team Member Image</label>
                        <input
                          type="file"
                          className="form-control"
                          onChange={(e) => handleTeamImageChange(e, index)}
                        />
                        {errors[`teamImage-${index}`] && <small className="text-danger">{errors[`teamImage-${index}`]}</small>}
                        {member.image && (
                          <img
                            src={typeof member.image === 'object' ? member.image.url : `http://localhost:5000/public/images/about_images/${member.image}`}
                            alt="Team Preview"
                            className="img-fluid mt-2 rounded shadow-sm"
                            style={{ maxHeight: "150px" }}
                          />
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={member.name}
                          onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                          placeholder="Team member name"
                        />
                        {errors[`teamName-${index}`] && <small className="text-danger">{errors[`teamName-${index}`]}</small>}
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Role</label>
                        <input
                          type="text"
                          className="form-control"
                          value={member.role}
                          onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                          placeholder="Team member role"
                        />
                        {errors[`teamRole-${index}`] && <small className="text-danger">{errors[`teamRole-${index}`]}</small>}
                      </div>
                      <div className="col-md-1 mb-3 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeTeamMember(index)}
                          disabled={formData.teamMembers.length <= 1}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={addTeamMember}>
                <i className="fas fa-plus me-1"></i>Add Team Member
              </button>
            </div>

            {errors.form && <div className="alert alert-danger">{errors.form}</div>}
            <div className="d-flex justify-content-between mt-4">
              <button type="submit" className="btn btn-primary btn-lg">
                <i className="fas fa-save me-2"></i>{showAddForm ? "Add" : "Update"} Changes
              </button>
              {!showAddForm && aboutData && (
                <button type="button" className="btn btn-danger btn-lg" onClick={handleDelete}>
                  <i className="fas fa-trash me-2"></i>Delete
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
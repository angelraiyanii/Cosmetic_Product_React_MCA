import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Camera,
  Save,
  X,
  CheckCircle,
  Lock,
  Shield,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

function Account() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userId = JSON.parse(atob(token.split(".")[1])).userId;

      const response = await fetch(
        `http://localhost:5000/api/Usermodel/user-details/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      setUser(data.user);
      setEditedUser(data.user);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
    setProfilePicPreview(null);
    setSelectedFile(null);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      Object.keys(editedUser).forEach((key) => {
        if (key !== "profilePic") {
          formData.append(key, editedUser[key]);
        }
      });

      if (selectedFile) formData.append("profilePic", selectedFile);

      const response = await fetch(
        `http://localhost:5000/api/Usermodel/${user._id}`,
        { method: "PUT", body: formData }
      );

      if (!response.ok) throw new Error("Failed to update user");

      const data = await response.json();
      setUser(data.Usermodel);
      setIsEditing(false);
      setProfilePicPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!oldPassword.trim()) {
      errors.oldPassword = "Old password is required";
    }

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required";
    } 

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }


    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordErrors({});

      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/Usermodel/change-password/${user._id}`,
        {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Response status:", response.status);
        console.log("Response data:", data);
        
        // Handle specific error for wrong old password
        if (response.status === 400 && 
            (data.message?.toLowerCase().includes("old password is incorrect") ||
             data.message?.toLowerCase().includes("incorrect") ||
             data.message?.toLowerCase().includes("wrong") ||
             data.message?.toLowerCase().includes("match"))) {
          setPasswordErrors({ oldPassword: "Your old password does not match with database records" });
        } else if (response.status === 400 && 
                   data.message?.toLowerCase().includes("different")) {
          setPasswordErrors({ newPassword: "New password must be different from old password" });
        } else if (response.status === 404) {
          setPasswordErrors({ general: "User not found" });
        } else {
          setPasswordErrors({ general: data.message || "Failed to update password" });
        }
        return;
      }

      // Success
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
      
      // Show success message (you can replace this with a better notification system)
      alert("Password updated successfully!");
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordErrors({ general: "Network error: " + err.message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePasswordFormClose = () => {
    setShowPasswordForm(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const handleInputChange = (field, value) =>
    setEditedUser((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading)
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center text-danger bg-light">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow border-0 rounded-3 overflow-hidden">
              {/* Cover Section */}
              <div className="profile-cover position-relative" style={{ height: '90px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="position-absolute top-0 start-0 m-3">
                  <h5 className="text-white mb-0" style={{ fontSize: '40px' }}>  <User size={33} />  Account Details</h5>
                </div>
                <div className="position-absolute top-0 end-0 m-3">
                  {!isEditing ? (
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="btn btn-light d-flex align-items-center gap-2 shadow-sm"
                      >
                        <Lock size={16} />
                        <span>Change Password</span>
                      </button>
                      <button
                        onClick={handleEdit}
                        className="btn btn-light d-flex align-items-center gap-2 shadow-sm"
                      >
                        <Edit size={16} />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="btn btn-light d-flex align-items-center gap-2 shadow-sm"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
                      >
                        <Save size={16} />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Section */}
              <div className="card-body pt-4">
                <div className="d-flex flex-column align-items-center mt-n5 position-relative">
                  <div className="position-relative mb-4">
                    <div className="avatar-xxl">
                      <div className="avatar-img rounded-circle border-4 border-white shadow-lg" style={{ width: '175px', height: '150px' }}>
                        {profilePicPreview ||
                          (user.profilePic && user.profilePic !== "null") ? (
                          <img
                            src={
                              profilePicPreview ||
                              `http://localhost:5000/public/images/profile_pictures/${user.profilePic}`
                            }
                            alt="Profile"
                            className="w-100 h-100 object-cover rounded-circle"
                          />
                        ) : (
                          <div className="w-100 h-100 rounded-circle bg-light d-flex align-items-center justify-content-center">
                            <User className="text-muted" size={60} />
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <label className="btn btn-primary rounded-circle p-2 position-absolute bottom-0 end-0 shadow cursor-pointer">
                          <Camera size={16} />
                          <input
                            type="file"
                            className="d-none"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <h2 className="mb-1">{user.fullname}</h2>
                  <p className="text-muted mb-4">{user.email}</p>
                </div>

                <div className="row g-4">
                  {/* Personal Information */}
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-header bg-transparent py-3 border-0">
                        <h5 className="mb-0">Personal Information</h5>
                      </div>
                      <div className="card-body">
                        <Field
                          label="Full Name"
                          icon={<User size={18} />}
                          value={editedUser.fullname}
                          editing={isEditing}
                          onChange={(v) => handleInputChange("fullname", v)}
                        />
                        <Field
                          label="Email Address"
                          icon={<Mail size={18} />}
                          value={editedUser.email}
                          editing={isEditing}
                          onChange={(v) => handleInputChange("email", v)}
                        />
                        <Field
                          label="Phone Number"
                          icon={<Phone size={18} />}
                          value={editedUser.mobile}
                          editing={isEditing}
                          onChange={(v) => handleInputChange("mobile", v)}
                        />
                        <Field
                          label="Gender"
                          icon={<User size={18} />}
                          value={editedUser.gender}
                          editing={isEditing}
                          type="select"
                          onChange={(v) => handleInputChange("gender", v)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-header bg-transparent py-3 border-0">
                        <h5 className="mb-0">Address Information</h5>
                      </div>
                      <div className="card-body">
                        <Field
                          label="Pincode"
                          icon={<MapPin size={18} />}
                          value={editedUser.pincode}
                          editing={isEditing}
                          onChange={(v) => handleInputChange("pincode", v)}
                        />
                        <Field
                          label="Address"
                          icon={<MapPin size={18} />}
                          value={editedUser.address}
                          editing={isEditing}
                          type="textarea"
                          onChange={(v) => handleInputChange("address", v)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Status Cards */}
                <div className="row g-4 mt-2">
                  <div className="col-md-4">
                    <div className="card bg-success bg-opacity-10 border-0 h-100">
                      <div className="card-body d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted">Status</h6>
                          <p className="card-text fw-bold text-success">{user.status}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <CheckCircle size={24} className="text-success" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-primary bg-opacity-10 border-0 h-100">
                      <div className="card-body d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted">Role</h6>
                          <p className="card-text fw-bold text-primary">{user.role}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <Shield size={24} className="text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-info bg-opacity-10 border-0 h-100">
                      <div className="card-body d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted">Member Since</h6>
                          <p className="card-text fw-bold text-info">{formatDate(user.createdAt)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <Calendar size={24} className="text-info" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Form Modal */}
      {showPasswordForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Password</h5>
                <button type="button" className="btn-close" onClick={handlePasswordFormClose}></button>
              </div>
              <div className="modal-body">
                {/* General Error */}
                {passwordErrors.general && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <AlertCircle size={18} className="me-2" />
                    {passwordErrors.general}
                  </div>
                )}

                {/* Old Password */}
                <div className="mb-3">
                  <label className="form-label">Old Password</label>
                  <div className="input-group">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter old password"
                      value={oldPassword}
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        if (passwordErrors.oldPassword) {
                          setPasswordErrors(prev => ({ ...prev, oldPassword: "" }));
                        }
                      }}
                      className={`form-control ${passwordErrors.oldPassword ? 'is-invalid' : ''}`}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.oldPassword && (
                    <div className="text-danger mt-1 d-flex align-items-center">
                      <AlertCircle size={14} className="me-1" />
                      <small>{passwordErrors.oldPassword}</small>
                    </div>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <div className="input-group">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordErrors.newPassword) {
                          setPasswordErrors(prev => ({ ...prev, newPassword: "" }));
                        }
                      }}
                      className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <div className="text-danger mt-1 d-flex align-items-center">
                      <AlertCircle size={14} className="me-1" />
                      <small>{passwordErrors.newPassword}</small>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordErrors.confirmPassword) {
                          setPasswordErrors(prev => ({ ...prev, confirmPassword: "" }));
                        }
                      }}
                      className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <div className="text-danger mt-1 d-flex align-items-center">
                      <AlertCircle size={14} className="me-1" />
                      <small>{passwordErrors.confirmPassword}</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={handlePasswordFormClose}
                  className="btn btn-secondary"
                  disabled={isUpdatingPassword}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordUpdate}
                  className="btn btn-primary"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Field Component
// Corrected spelling: functionality
const Field = ({ label, icon, value, editing, onChange, type }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold">{label}</label>
    {editing ? (
      type === "textarea" ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="form-control"
          rows="3"
        />
      ) : type === "select" ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="form-select"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      ) : (
        <div className="input-group">
          <span className="input-group-text">{icon}</span>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="form-control"
          />
        </div>
      )
    ) : (
      <div className="d-flex align-items-center p-3 bg-light rounded">
        <span className="me-2 text-muted">{icon}</span>
        <span>{value || 'Not provided'}</span>
      </div>
    )}
  </div>
);

export default Account;
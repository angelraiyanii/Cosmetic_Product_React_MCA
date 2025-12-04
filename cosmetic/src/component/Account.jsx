import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  
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
  const navigate = useNavigate();
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsRedirecting(true);
      navigate("/login");
      return;
    }

    fetchUserData(token);
  }, [navigate]);

  const fetchUserData = async (token) => {
    try {
      setLoading(true);
      const userId = JSON.parse(atob(token.split(".")[1])).userId;

      const response = await fetch(
        `http://localhost:5000/api/Usermodel/user-details/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        setIsRedirecting(true);
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      
      // ✅ FIX: Ensure _id is set properly
      const userData = {
        ...data.user,
        _id: data.user._id || data.user.id // Use _id if exists, fallback to id
      };
      
      console.log("Fetched user data:", userData); // Debug log
      
      setUser(userData);
      setEditedUser(userData);
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
    setFormErrors({});
  };

  const handleSave = async () => {
    // ✅ Check if user exists with proper _id
    if (!user) {
      setError("User data not loaded. Please refresh the page.");
      return;
    }

    // ✅ Get the ID (try both _id and id)
    const userId = user._id || user.id;
    
    if (!userId) {
      setError("User ID not found. Please refresh the page.");
      console.error("User object:", user);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const formData = new FormData();
      
      // ✅ Add all user fields to formData
      if (editedUser.fullname) formData.append("fullname", editedUser.fullname);
      if (editedUser.email) formData.append("email", editedUser.email);
      if (editedUser.mobile) formData.append("mobile", editedUser.mobile);
      if (editedUser.gender) formData.append("gender", editedUser.gender);
      if (editedUser.pincode) formData.append("pincode", editedUser.pincode);
      if (editedUser.address) formData.append("address", editedUser.address);

      if (selectedFile) formData.append("profilePic", selectedFile);

      console.log("Updating user with ID:", userId); // ✅ Debug log

      const response = await fetch(
        `http://localhost:5000/api/Usermodel/${userId}`,
        { 
          method: "PUT", 
          body: formData 
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const data = await response.json();
      console.log("Update response:", data); // Debug log
      
      // ✅ Ensure the updated user has _id
      const updatedUserData = {
        ...data.Usermodel,
        _id: data.Usermodel._id || data.Usermodel.id || userId
      };
      
      setUser(updatedUserData);
      setEditedUser(updatedUserData);
      setIsEditing(false);
      setProfilePicPreview(null);
      setSelectedFile(null);
      
      alert("Profile updated successfully!");
      
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!oldPassword.trim()) {
      errors.oldPassword = "Old password is required";
    }

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
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

    if (!user) {
      setPasswordErrors({ general: "User data not loaded properly. Please refresh the page." });
      return;
    }

    // ✅ Get the ID (try both _id and id)
    const userId = user._id || user.id;
    
    if (!userId) {
      setPasswordErrors({ general: "User ID not found. Please refresh the page." });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordErrors({});

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/Usermodel/change-password/${userId}`,
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

      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});

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
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (isRedirecting) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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
          <button onClick={() => window.location.reload()} className="btn btn-sm btn-danger ms-3">
            Reload Page
          </button>
        </div>
      </div>
    );

  if (!user) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="alert alert-warning" role="alert">
          User data not available. Please refresh the page.
        </div>
      </div>
    );
  }

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
                        disabled={isSaving}
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Changes</span>
                          </>
                        )}
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
                            style={{ objectFit: 'cover' }}
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
                          <p className="card-text fw-bold text-success">{user.status || 'Active'}</p>
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
                          <p className="card-text fw-bold text-primary">{user.role || 'User'}</p>
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
                          <p className="card-text fw-bold text-info">
                            {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                          </p>
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
                {passwordErrors.general && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <AlertCircle size={18} className="me-2" />
                    {passwordErrors.general}
                  </div>
                )}

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
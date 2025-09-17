import { useState } from "react";
import { Phone, Mail, MapPin, Send, MessageCircle, Clock, Users } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios'; // Make sure to install axios

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = (data) => {
    let errors = {};
    if (!data.name.trim()) errors.name = "Name is required";
    if (!data.email.trim()) errors.email = "Email is required";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email))
      errors.email = "Please enter a valid email";
    if (!data.phone.trim()) errors.phone = "Phone number is required";
    if (!data.subject.trim()) errors.subject = "Subject is required";
    if (!data.message.trim()) errors.message = "Message is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Send data to your backend API
      const response = await axios.post('http://localhost:5000/api/ContactModel/submit', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: `${formData.subject}: ${formData.message}` // Combine subject and message
      });

      if (response.data.success) {
        setSuccessMessage("Thank you! Your message has been sent successfully.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        setErrors({ submit: response.data.message });
      }
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to send message. Please try again later.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100" style={{background: "linear-gradient(135deg, #dbeafe 0%, white 50%, #e0e7ff 100%)"}}>
      {/* Hero Section */}
      <div className="position-relative text-white overflow-hidden" style={{background: "linear-gradient(to right, #2563eb, #4338ca)"}}>
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-20"></div>
        <div className="position-absolute top-0 end-0 rounded-circle opacity-10" style={{width: "16rem", height: "16rem", background: "white", marginRight: "-8rem", marginTop: "-8rem"}}></div>
        <div className="position-absolute bottom-0 start-0 rounded-circle opacity-20" style={{width: "12rem", height: "12rem", background: "#93c5fd", marginLeft: "-6rem", marginBottom: "-6rem"}}></div>
        
        <div className="container position-relative py-5">
          <div className="text-center">
            <h1 className="display-3 fw-bold mb-4">
              Get In Touch With
              <span className="d-block" style={{background: "linear-gradient(to right, #bfdbfe, #a5f3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
                GlowCosmetics
              </span>
            </h1>
            <p className="lead text-light opacity-75 mx-auto" style={{maxWidth: "48rem"}}>
              We're here to answer your questions and help you find the perfect beauty solutions
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row">
          
          {/* Contact Form */}
          <div className="col-lg-6 mb-5">
            <div className="bg-white rounded-3 shadow p-4 p-md-5 border-top border-primary border-4">
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{width: "4rem", height: "4rem", background: "linear-gradient(to right, #3b82f6, #4f46e5)"}}>
                  <MessageCircle className="text-white" size={24} />
                </div>
                <h2 className="fw-bold text-dark mb-2">Send us a Message</h2>
                <p className="text-muted">We'll get back to you as soon as possible</p>
              </div>

              {successMessage && (
                <div className="alert alert-success text-center">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <div className="rounded-circle bg-success d-flex align-items-center justify-content-center me-2" style={{width: "1.5rem", height: "1.5rem"}}>
                      <svg className="text-white" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {successMessage}
                </div>
              )}

              {errors.submit && (
                <div className="alert alert-danger text-center">
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <div className="form-group">
                      <label className="form-label fw-semibold text-dark">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={`form-control form-control-lg ${errors.name ? "is-invalid" : ""}`}
                      />
                      {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label fw-semibold text-dark">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        className={`form-control form-control-lg ${errors.phone ? "is-invalid" : ""}`}
                      />
                      {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label fw-semibold text-dark">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className={`form-control form-control-lg ${errors.email ? "is-invalid" : ""}`}
                  />
                  {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                </div>

                <div className="form-group mb-3">
                  <label className="form-label fw-semibold text-dark">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className={`form-control form-control-lg ${errors.subject ? "is-invalid" : ""}`}
                  />
                  {errors.subject && <div className="invalid-feedback d-block">{errors.subject}</div>}
                </div>

                <div className="form-group mb-4">
                  <label className="form-label fw-semibold text-dark">Your Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Tell us more about how we can help you..."
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                  />
                  {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                  style={{background: "linear-gradient(to right, #2563eb, #4f46e5)", border: "none"}}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="col-lg-6">
            <div className="d-flex flex-column gap-4">
              {/* Contact Cards */}
              <div className="row g-3">
                <div className="col-12">
                  <div className="bg-white rounded-3 p-4 shadow-sm border-start border-primary border-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                        <Phone className="text-primary" size={24} />
                      </div>
                      <div>
                        <h3 className="h5 fw-semibold text-dark mb-1">Call Us</h3>
                        <p className="text-muted mb-0">+1 (555) 123-4567</p>
                        <p className="text-muted mb-0">+1 (555) 987-6543</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="bg-white rounded-3 p-4 shadow-sm border-start border-indigo border-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-indigo bg-opacity-10 p-3 rounded-circle me-3">
                        <Mail className="text-indigo" size={24} />
                      </div>
                      <div>
                        <h3 className="h5 fw-semibold text-dark mb-1">Email Us</h3>
                        <p className="text-muted mb-0">hello@glowcosmetics.com</p>
                        <p className="text-muted mb-0">support@glowcosmetics.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="bg-white rounded-3 p-4 shadow-sm border-start border-info border-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3">
                        <MapPin className="text-info" size={24} />
                      </div>
                      <div>
                        <h3 className="h5 fw-semibold text-dark mb-1">Visit Us</h3>
                        <p className="text-muted mb-0">123 Beauty Avenue</p>
                        <p className="text-muted mb-0">New York, NY 10001</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="bg-white rounded-3 p-4 shadow-sm border-start border-teal border-4">
                    <div className="d-flex align-items-center">
                      <div className="bg-teal bg-opacity-10 p-3 rounded-circle me-3">
                        <Clock className="text-teal" size={24} />
                      </div>
                      <div>
                        <h3 className="h5 fw-semibold text-dark mb-1">Business Hours</h3>
                        <p className="text-muted mb-0">Mon - Fri: 9:00 AM - 6:00 PM</p>
                        <p className="text-muted mb-0">Sat: 10:00 AM - 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="rounded-3 p-4 text-white" style={{background: "linear-gradient(135deg, #3b82f6, #4f46e5)"}}>
                <div className="text-center mb-4">
                  <Users size={48} className="mb-3 mx-auto" />
                  <h3 className="h2 fw-bold mb-2">Why Choose GlowCosmetics?</h3>
                  <p className="text-light opacity-75">We're committed to your beauty journey</p>
                </div>
                
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-white rounded-circle me-3" style={{width: "8px", height: "8px"}}></div>
                    <span>Premium Quality Products</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-white rounded-circle me-3" style={{width: "8px", height: "8px"}}></div>
                    <span>Expert Beauty Advice</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-white rounded-circle me-3" style={{width: "8px", height: "8px"}}></div>
                    <span>Fast & Free Shipping Over $50</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-white rounded-circle me-3" style={{width: "8px", height: "8px"}}></div>
                    <span>100% Satisfaction Guarantee</span>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-white rounded-3 p-4 shadow-sm">
                <h3 className="h4 fw-bold text-dark mb-3">Frequently Asked Questions</h3>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <h4 className="h6 text-primary fw-semibold">How long does shipping take?</h4>
                    <p className="text-muted small mb-0">Typically 3-5 business days within the US.</p>
                  </div>
                  <div>
                    <h4 className="h6 text-primary fw-semibold">Do you offer international shipping?</h4>
                    <p className="text-muted small mb-0">Yes, we ship to over 50 countries worldwide.</p>
                  </div>
                  <div>
                    <h4 className="h6 text-primary fw-semibold">What is your return policy?</h4>
                    <p className="text-muted small mb-0">We offer a 30-day money-back guarantee on all products.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="container pb-5">
        <div className="bg-white rounded-3 shadow-sm p-4">
          <h3 className="h2 fw-bold text-dark mb-4 text-center">Find Us Here</h3>
          <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{height: "16rem"}}>
            <div className="text-center text-muted">
              <MapPin size={48} className="mb-2 mx-auto" />
              <p>Interactive Map Would Appear Here</p>
              <p className="small">123 Beauty Avenue, New York, NY 10001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
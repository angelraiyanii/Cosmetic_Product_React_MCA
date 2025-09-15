import React, { useState, useEffect } from "react";
import "../../App.css";

const AdContact = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [sendingReply, setSendingReply] = useState(false);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/contact");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success) {
        setInquiries(result.data);
      } else {
        setError("Failed to load contact inquiries: " + result.message);
      }
    } catch (err) {
      setError("Error connecting to the server: " + err.message);
      console.error("Error fetching inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewInquiryDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowModal(true);
    setReply(inquiry.reply || "");
  };

  const handleReplyChange = (e) => setReply(e.target.value);

  const sendReply = async () => {
    if (!reply.trim()) {
      alert("Please enter a reply before sending.");
      return;
    }

    try {
      setSendingReply(true);
      const response = await fetch(
        `http://localhost:5000/api/contact/${selectedInquiry._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reply: reply,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setInquiries(
          inquiries.map((inquiry) =>
            inquiry._id === selectedInquiry._id ? result.data : inquiry
          )
        );
        alert(`Reply sent to ${selectedInquiry.email} successfully!`);
        setShowModal(false);
      } else {
        alert("Failed to send reply: " + result.message);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Error sending reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  // Search functionality
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (inquiry.name && inquiry.name.toLowerCase().includes(searchLower)) ||
      (inquiry.email && inquiry.email.toLowerCase().includes(searchLower)) ||
      (inquiry.phone && inquiry.phone.toLowerCase().includes(searchLower)) ||
      (inquiry.message &&
        inquiry.message.toLowerCase().includes(searchLower)) ||
      (inquiry.status && inquiry.status.toLowerCase().includes(searchLower))
    );
  });

  const deleteInquiry = async (id) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/contact/${id}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();
        if (result.success) {
          setInquiries(inquiries.filter((inquiry) => inquiry._id !== id));
          alert("Inquiry deleted successfully");
        } else {
          alert("Failed to delete inquiry: " + result.message);
        }
      } catch (err) {
        console.error("Error deleting inquiry:", err);
        alert("Error deleting inquiry. Please try again.");
      }
    }
  };

  if (loading)
    return <div className="p-4 text-center">Loading inquiries...</div>;
  if (error) return <div className="p-4 text-center text-danger">{error}</div>;

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInquiries.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Contact Inquiries</h2>

      {/* Search Component */}
      <div className="d-flex justify-content-end mb-3">
        <div className="input-group" style={{ maxWidth: "300px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔎Search inquiries..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((inquiry) => (
              <tr key={inquiry._id}>
                <td>{inquiry._id.substring(0, 8)}...</td>
                <td>{inquiry.name || "N/A"}</td>
                <td>{inquiry.email || "N/A"}</td>
                <td>{inquiry.phone || "N/A"}</td>
                <td>
                  {inquiry.createdAt
                    ? new Date(inquiry.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      inquiry.status === "New"
                        ? "bg-primary text-white"
                        : inquiry.status === "In Progress"
                        ? "bg-warning text-dark"
                        : "bg-success text-white"
                    }`}
                  >
                    {inquiry.status || "New"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => viewInquiryDetails(inquiry)}
                    className="btn btn-info btn-sm me-2"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteInquiry(inquiry._id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">
                {searchTerm
                  ? "No matching inquiries found."
                  : "No inquiries found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {filteredInquiries.length > 0 && (
        <div className="row mt-3">
          <div className="col-md-12 d-flex justify-content-center">
            <nav>
              <ul className="pagination">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &laquo; Prev
                  </button>
                </li>

                {pageNumbers.map((number) => (
                  <li
                    key={number}
                    className={`page-item ${
                      currentPage === number ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(number)}
                    >
                      {number}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 d-flex align-items-center justify-content-center p-4">
          <div
            className="modal-overlay bg-white p-4 rounded"
            style={{ maxWidth: "600px", width: "100%" }}
          >
            <h4>Inquiry Details</h4>
            <div className="mb-3">
              <strong>Name:</strong> {selectedInquiry.name || "N/A"}
            </div>
            <div className="mb-3">
              <strong>Email:</strong> {selectedInquiry.email || "N/A"}
            </div>
            <div className="mb-3">
              <strong>Phone:</strong> {selectedInquiry.phone || "N/A"}
            </div>
            <div className="mb-3">
              <strong>Message:</strong> {selectedInquiry.message || "N/A"}
            </div>
            <div className="mb-3">
              <strong>Date:</strong>{" "}
              {selectedInquiry.createdAt
                ? new Date(selectedInquiry.createdAt).toLocaleString()
                : "N/A"}
            </div>
            <div className="mb-3">
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedInquiry.status === "New"
                    ? "bg-primary text-white"
                    : selectedInquiry.status === "In Progress"
                    ? "bg-warning text-dark"
                    : "bg-success text-white"
                }`}
              >
                {selectedInquiry.status || "New"}
              </span>
            </div>

            <div className="mb-3">
              <label>Your Reply:</label>
              <textarea
                className="form-control"
                rows="3"
                value={reply}
                onChange={handleReplyChange}
                placeholder="Type your reply here..."
              ></textarea>
              <small className="text-danger mt-1 d-block">
                This reply will be sent to the user's Email.
              </small>
            </div>

            <div className="d-flex justify-content-end">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-success"
                onClick={sendReply}
                disabled={!reply.trim() || sendingReply}
              >
                {sendingReply ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdContact;

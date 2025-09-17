import React, { useState, useEffect } from "react";
import { 
  Search, 
  Eye, 
  Trash2, 
  Send, 
  X, 
  Mail, 
  Phone, 
  User, 
  Calendar,
  MessageSquare,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Star
} from "lucide-react";

const AdContact = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data for demonstration
  const mockInquiries = [
    {
      _id: "1",
      name: "Emma Johnson",
      email: "emma.johnson@email.com",
      phone: "+1 (555) 123-4567",
      message: "I'm interested in your new foundation collection. Could you please provide more details about shade matching and coverage options?",
      status: "New",
      createdAt: "2024-01-15T10:30:00Z",
      subject: "Foundation Inquiry",
      reply: ""
    },
    {
      _id: "2",
      name: "Sophia Martinez",
      email: "sophia.m@email.com",
      phone: "+1 (555) 987-6543",
      message: "Hello! I have sensitive skin and would like to know which of your skincare products would be best for me. Any recommendations?",
      status: "In Progress",
      createdAt: "2024-01-14T14:20:00Z",
      subject: "Skincare Consultation",
      reply: "Thank you for your inquiry..."
    },
    {
      _id: "3",
      name: "Isabella Chen",
      email: "bella.chen@email.com",
      phone: "+1 (555) 456-7890",
      message: "I purchased your lipstick set last week but haven't received it yet. Could you please check the status of my order #CS12345?",
      status: "Resolved",
      createdAt: "2024-01-13T09:15:00Z",
      subject: "Order Status",
      reply: "Your order has been shipped..."
    },
    {
      _id: "4",
      name: "Olivia Thompson",
      email: "olivia.t@email.com",
      phone: "+1 (555) 321-9876",
      message: "I'm a makeup artist and interested in your professional makeup line. Do you offer bulk discounts for professionals?",
      status: "New",
      createdAt: "2024-01-12T16:45:00Z",
      subject: "Professional Inquiry",
      reply: ""
    },
    {
      _id: "5",
      name: "Ava Wilson",
      email: "ava.wilson@email.com",
      phone: "+1 (555) 654-3210",
      message: "Love your brand! I'm planning my wedding and need makeup that will last all day. What products do you recommend?",
      status: "In Progress",
      createdAt: "2024-01-11T11:30:00Z",
      subject: "Wedding Makeup",
      reply: ""
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInquiries(mockInquiries);
      setLoading(false);
    }, 1000);
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
      // Simulate API call
      setTimeout(() => {
        setInquiries(
          inquiries.map((inquiry) =>
            inquiry._id === selectedInquiry._id 
              ? { ...inquiry, reply: reply, status: "Resolved" }
              : inquiry
          )
        );
        alert(`Reply sent to ${selectedInquiry.email} successfully!`);
        setShowModal(false);
        setSendingReply(false);
      }, 2000);
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Error sending reply. Please try again.");
      setSendingReply(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch = !searchTerm || 
      inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const deleteInquiry = async (id) => {
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      setInquiries(inquiries.filter((inquiry) => inquiry._id !== id));
      alert("Inquiry deleted successfully");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-pink-600 font-semibold">Loading beauty inquiries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md">
          <div className="text-red-500 mb-4">
            <X className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case "New": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "In Progress": return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      case "Resolved": return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "New": return <Sparkles className="w-4 h-4" />;
      case "In Progress": return <Heart className="w-4 h-4" />;
      case "Resolved": return <Star className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <Sparkles className="w-10 h-10 mr-3 text-pink-200" />
                Beauty Inquiries
              </h1>
              <p className="text-pink-100 text-lg">Manage customer beauty consultations and inquiries</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{inquiries.length}</div>
              <div className="text-pink-200">Total Inquiries</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors"
                  placeholder="Search by name, email, or subject..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                className="px-4 py-3 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none bg-white"
                value={statusFilter}
                onChange={handleStatusFilter}
              >
                <option value="all">All Status</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">New Inquiries</p>
                <p className="text-2xl font-bold text-blue-600">
                  {inquiries.filter(i => i.status === "New").length}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {inquiries.filter(i => i.status === "In Progress").length}
                </p>
              </div>
              <Heart className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {inquiries.filter(i => i.status === "Resolved").length}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-2xl font-bold text-purple-600">{inquiries.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Inquiries Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentItems.length > 0 ? (
            currentItems.map((inquiry) => (
              <div key={inquiry._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {inquiry.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{inquiry.name || "Anonymous"}</h3>
                        <p className="text-sm text-gray-500">{inquiry.subject || "General Inquiry"}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getStatusColor(inquiry.status)}`}>
                      {getStatusIcon(inquiry.status)}
                      <span>{inquiry.status || "New"}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{inquiry.email || "No email"}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{inquiry.phone || "No phone"}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {inquiry.createdAt 
                          ? new Date(inquiry.createdAt).toLocaleDateString()
                          : "Unknown date"}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {inquiry.message || "No message provided"}
                  </p>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewInquiryDetails(inquiry)}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => deleteInquiry(inquiry._id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Inquiries Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No beauty inquiries have been submitted yet."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInquiries.length)} of {filteredInquiries.length} inquiries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 rounded-t-3xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold text-lg">
                    {selectedInquiry.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedInquiry.name || "Anonymous"}</h2>
                    <p className="text-pink-100">{selectedInquiry.subject || "General Inquiry"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{selectedInquiry.email || "No email"}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{selectedInquiry.phone || "No phone"}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">
                      {selectedInquiry.createdAt 
                        ? new Date(selectedInquiry.createdAt).toLocaleString()
                        : "Unknown date"}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded-xl flex items-center space-x-2 ${getStatusColor(selectedInquiry.status)}`}>
                    {getStatusIcon(selectedInquiry.status)}
                    <span className="font-semibold">{selectedInquiry.status || "New"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Customer Message</span>
                </h3>
                <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedInquiry.message || "No message provided"}
                  </p>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Your Reply</span>
                </label>
                <textarea
                  className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none transition-colors resize-none"
                  rows="5"
                  value={reply}
                  onChange={handleReplyChange}
                  placeholder="Type your personalized beauty consultation response here..."
                />
                <p className="text-sm text-pink-600 mt-2 flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>This reply will be sent to {selectedInquiry.email}</span>
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={sendReply}
                  disabled={!reply.trim() || sendingReply}
                >
                  {sendingReply ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdContact;
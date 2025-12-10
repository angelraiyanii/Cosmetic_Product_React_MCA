const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

// ✅ CORS Configuration - Works for both local and production
const allowedOrigins = [
  'http://localhost:5173',      // Vite dev server
  'http://localhost:3000',      // Create React App
  'http://localhost:5174',      // Alternative Vite port
  'http://127.0.0.1:5173',      // Alternative localhost
  'https://cosmetic-frontend-n8im.onrender.com'  // Production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/public", express.static(path.join(__dirname, "public")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB Connection Error:", error));

// Debug environment variables
console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'NOT SET');
console.log('====================================');

// Import and use routes
const mainRouter = require("./routes/index.js");
app.use("/api", mainRouter);

// Default Route
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

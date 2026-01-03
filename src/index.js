const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const lifePlanRoutes = require("./routes/lifePlanRoutes");
const diaryRoutes = require("./routes/diaryRoutes");
const timetableRoutes = require("./routes/timeTableRoutes");
const specialScheduleRoutes = require("./routes/specialScheduleRoutes");
const nilavantiAuthRoutes = require("./routes/nilavantiAuthRoutes");
const festivalRoutes = require("./routes/festivalRoutes");
const studyMaterialRoutes = require("./routes/studyMaterialRoutes.js");
const studyStructureRoutes = require("./routes/studyStructureRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS Configuration - Simplified
app.use(
  cors({
    origin: true, // Reflect the request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/life-plans", lifePlanRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/special-schedules", specialScheduleRoutes);
app.use("/api/nilavanti", nilavantiAuthRoutes);
app.use("/api/festivals", festivalRoutes);
app.use("/api/study-materials", studyMaterialRoutes);
app.use("/api/study-structure", studyStructureRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);

// Test routes
app.get("/", (req, res) => {
  res.json({
    status: "API is running",
    message: "Welcome to GoalOS API",
    endpoints: {
      test: "/api/test",
      diary: "/api/diary/entries",
      auth: "/api/auth",
    },
  });
});

// Test API route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    time: new Date().toISOString(),
  });
});

// 404 Not Found handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Server Error",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const gameRoutes = require("./routes/gameRoutes");
const bhashiniRoutes = require("./routes/bhashiniRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Uploaded patient photos/audio are served directly as static files —
// the URL saved on a Patient (e.g. /uploads/xyz.jpg) resolves straight here.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/bhashini", bhashiniRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

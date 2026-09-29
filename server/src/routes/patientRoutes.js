const express = require("express");
const { protect } = require("../middleware/auth");
const { getMine, saveMine, memoryCopilot } = require("../controllers/patientController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/me", protect, asyncHandler(getMine));
router.put("/me", protect, asyncHandler(saveMine));
router.post("/memory-copilot", protect, asyncHandler(memoryCopilot));

module.exports = router;

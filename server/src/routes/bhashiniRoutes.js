const express = require("express");
const { protect, optionalProtect } = require("../middleware/auth");
const {
  handleTranslate,
  handleTTS,
  handleASR,
  handleCSTChat,
} = require("../controllers/bhashiniController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// Translation, TTS, ASR endpoints can be called by authenticated users or for general localization
router.post("/translate", asyncHandler(handleTranslate));
router.post("/tts", asyncHandler(handleTTS));
router.post("/asr", asyncHandler(handleASR));
router.post("/cst-chat", optionalProtect, asyncHandler(handleCSTChat));

module.exports = router;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 40);
    cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  // Patient photos and a spoken voice sample — nothing else is expected here.
  if (/^(image|audio)\//.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only image or audio files are allowed."));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — generous for a photo or a short voice clip
});

module.exports = upload;

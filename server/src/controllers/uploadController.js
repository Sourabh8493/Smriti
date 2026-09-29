/*
  A single generic upload endpoint used for every file in the app — the
  patient's photo, a person's photo, a gallery photo, the voice sample. The
  frontend uploads a file the moment it's chosen and gets a URL back; that URL
  is what actually gets saved on the patient record. Keeping this decoupled
  from PUT /api/patients/me means that endpoint only ever deals with plain
  JSON, which keeps both sides simple.
*/
function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file was received." });
  }
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  });
}

module.exports = { uploadFile };

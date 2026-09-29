const Patient = require("../models/Patient");
const { analyzeMemoryWithCopilot } = require("../utils/memoryCopilot");

async function getMine(req, res) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    return res.status(404).json({ message: "No patient profile has been created yet." });
  }
  res.json(patient);
}

/*
  The client always submits its complete current state for every section, so
  saving is a straightforward whole-document replace rather than a patch —
  this is what makes "add, edit, or delete a memory/person/photo" all work
  through the same one endpoint with no extra routes.
*/
function pickPatientFields(body) {
  const {
    basic = {},
    medical = {},
    preferences = {},
    memories = [],
    people = [],
    photos = [],
    voiceSampleUrl,
    questionnaireCompleted,
  } = body;

  return { basic, medical, preferences, memories, people, photos, voiceSampleUrl, questionnaireCompleted };
}

async function saveMine(req, res) {
  const data = pickPatientFields(req.body);

  if (!data.basic?.fullName?.trim()) {
    return res.status(400).json({ message: "The patient's full name is required." });
  }

  const patient = await Patient.findOneAndUpdate(
    { user: req.user._id },
    { ...data, user: req.user._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json(patient);
}

async function memoryCopilot(req, res) {
  const { title, tag, date, description, photoUrl, patientContext } = req.body;

  let context = patientContext || {};
  if (!context.fullName) {
    const patient = await Patient.findOne({ user: req.user._id });
    if (patient) {
      context = {
        fullName: patient.basic?.fullName,
        state: patient.basic?.state,
        city: patient.basic?.city,
        preferredLanguage: patient.basic?.preferredLanguage,
        caretakerName: patient.medical?.caretakerName,
        caretakerRelation: patient.medical?.caretakerRelation,
      };
    }
  }

  const result = await analyzeMemoryWithCopilot({
    title,
    tag,
    date,
    description,
    hasPhoto: Boolean(photoUrl),
    patientContext: context,
  });

  res.json(result);
}

module.exports = { getMine, saveMine, memoryCopilot };

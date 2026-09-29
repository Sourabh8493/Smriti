const mongoose = require("mongoose");

/*
  Everything captured by the onboarding questionnaire, plus room to grow
  (memories/people/photos are arrays so they can be added to, edited, or
  removed one at a time later). Uploaded files themselves live on disk under
  /uploads — only the resulting URL is stored here (see uploadController.js).

  All array subdocuments keep their Mongo _id so the frontend can reference a
  specific memory/person/photo when editing, but the save endpoint currently
  treats these arrays as "replace with whatever the client sends" — simplest
  correct behaviour for a form that always submits its complete state.
*/

const memorySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    tag: { type: String, trim: true },
    date: { type: String, trim: true },
    description: { type: String, trim: true },
    photoUrl: { type: String },
  },
  { _id: true }
);

const personSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relation: { type: String, trim: true },
    photoUrl: { type: String },
  },
  { _id: true }
);

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, trim: true },
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    basic: {
      fullName: { type: String, required: true, trim: true },
      photoUrl: String,
      dob: String,
      gender: String,
      address: String,
      city: String,
      state: String,
      phone: String,
      preferredLanguage: String,
      emergencyName: String,
      emergencyPhone: String,
    },

    medical: {
      stage: String,
      doctorName: String,
      doctorPhone: String,
      caretakerName: String,
      caretakerRelation: String,
      allergiesMeds: String,
      dailyRoutine: String,
    },

    preferences: {
      favoriteSongs: String,
      favoritePlace: String,
      hobbies: String,
      favoriteFood: String,
      languagesSpoken: String,
    },

    memories: [memorySchema],
    people: [personSchema],
    photos: [photoSchema],
    voiceSampleUrl: String,

    // False until the questionnaire (or a full profile edit) has been
    // completed at least once — this is what gates the app past onboarding.
    questionnaireCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);

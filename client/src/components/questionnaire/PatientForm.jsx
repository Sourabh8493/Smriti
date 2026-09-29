import React, { useState } from "react";
import Logo from "../common/Logo.jsx";
import StepProgress from "./StepProgress.jsx";
import {
  StepBasicDetails,
  StepMedicalDetails,
  StepPreferences,
  StepMemories,
  StepPhotos,
  StepReview,
} from "./steps.jsx";
import { Button } from "../common/UI.jsx";
import { savePatient } from "../../api/patients.js";
import { uploadFile, resolveFileUrl } from "../../api/uploads.js";
import "./questionnaire.css";

/*
  The full onboarding questionnaire AND the "edit everything" profile form are
  the same six-step wizard — this component is that wizard. The only
  difference between the two call sites is whether `initialPatient` is passed
  (edit) or not (first-time setup), and what the last button says.

  State shape mirrors the Patient model closely, with two extra transient
  fields wherever a file lives: `photo`/`file` (a pending File to upload) and
  `photoUrl`/`url` (what to show right now — the existing server URL, or a
  local blob preview once a new file is picked). On submit, every pending
  file is uploaded in parallel and the resulting URLs replace the blob
  previews in the payload sent to the server.
*/

const STEP_LABELS = [
  "Basic details",
  "Medical & care",
  "Preferences",
  "Life memories",
  "Photos & media",
  "Review",
];

const emptyBasic = {
  fullName: "",
  photo: null,
  photoUrl: "",
  dob: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  preferredLanguage: "",
  emergencyName: "",
  emergencyPhone: "",
};

const emptyMedical = {
  stage: "",
  doctorName: "",
  doctorPhone: "",
  caretakerName: "",
  caretakerRelation: "",
  allergiesMeds: "",
  dailyRoutine: "",
};

const emptyPreferences = {
  favoriteSongs: "",
  favoritePlace: "",
  hobbies: "",
  favoriteFood: "",
  languagesSpoken: "",
};

/** Builds this component's initial state from a Patient document fetched from the API. */
function stateFromPatient(patient) {
  if (!patient) {
    return {
      basic: emptyBasic,
      medical: emptyMedical,
      preferences: emptyPreferences,
      memories: [
        {
          id: crypto.randomUUID(),
          title: "",
          tag: "Wedding",
          date: "",
          description: "",
          photo: null,
          photoUrl: "",
        },
      ],
      people: [{ id: crypto.randomUUID(), name: "", relation: "" }],
      photos: [],
      voiceSample: { file: null, url: "", name: "" },
    };
  }

  return {
    basic: {
      ...emptyBasic,
      ...patient.basic,
      photo: null,
      photoUrl: resolveFileUrl(patient.basic?.photoUrl),
    },
    medical: { ...emptyMedical, ...patient.medical },
    preferences: { ...emptyPreferences, ...patient.preferences },
    memories:
      patient.memories?.length > 0
        ? patient.memories.map((m) => ({
            id: m._id || crypto.randomUUID(),
            title: "",
            tag: "Wedding",
            date: "",
            description: "",
            ...m,
            photo: null,
            photoUrl: resolveFileUrl(m.photoUrl),
          }))
        : [
            {
              id: crypto.randomUUID(),
              title: "",
              tag: "Wedding",
              date: "",
              description: "",
              photo: null,
              photoUrl: "",
            },
          ],
    people:
      patient.people?.length > 0
        ? patient.people.map((p) => ({
            id: p._id,
            name: "",
            relation: "",
            ...p,
            photo: null,
            photoUrl: resolveFileUrl(p.photoUrl),
          }))
        : [{ id: crypto.randomUUID(), name: "", relation: "" }],
    photos:
      patient.photos?.map((p) => ({
        id: p._id,
        url: resolveFileUrl(p.url),
        file: null,
        caption: p.caption || "",
      })) || [],
    voiceSample: {
      file: null,
      url: resolveFileUrl(patient.voiceSampleUrl),
      name: patient.voiceSampleUrl ? "Voice sample already on file" : "",
    },
  };
}

export default function PatientForm({ initialPatient = null, submitLabel, onSaved, onCancel }) {
  const initial = stateFromPatient(initialPatient);

  const [stepIndex, setStepIndex] = useState(0);
  const [basic, setBasic] = useState(initial.basic);
  const [medical, setMedical] = useState(initial.medical);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [memories, setMemories] = useState(initial.memories);
  const [people, setPeople] = useState(initial.people);
  const [photos, setPhotos] = useState(initial.photos);
  const [voiceSample, setVoiceSample] = useState(initial.voiceSample);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const isLast = stepIndex === STEP_LABELS.length - 1;
  const isFirst = stepIndex === 0;

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEP_LABELS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async () => {
    setSaveError("");
    setSaving(true);
    try {
      const basicPhotoUrl = basic.photo ? await uploadFile(basic.photo) : stripOrigin(basic.photoUrl);

      const peoplePayload = await Promise.all(
        people
          .filter((p) => p.name.trim())
          .map(async (p) => ({
            name: p.name,
            relation: p.relation,
            photoUrl: p.photo ? await uploadFile(p.photo) : stripOrigin(p.photoUrl),
          }))
      );

      const photosPayload = await Promise.all(
        photos.map(async (p) => ({
          url: p.file ? await uploadFile(p.file) : stripOrigin(p.url),
          caption: p.caption || "",
        }))
      );

      const voiceSampleUrl = voiceSample.file
        ? await uploadFile(voiceSample.file)
        : stripOrigin(voiceSample.url);

      const memoriesPayload = await Promise.all(
        memories
          .filter((m) => m.title.trim() || m.description?.trim())
          .map(async ({ id, photo, ...m }) => ({
            title: m.title,
            tag: m.tag,
            date: m.date,
            description: m.description,
            photoUrl: photo ? await uploadFile(photo) : stripOrigin(m.photoUrl),
          }))
      );

      const payload = {
        basic: { ...basic, photoUrl: basicPhotoUrl, photo: undefined },
        medical,
        preferences,
        memories: memoriesPayload,
        people: peoplePayload,
        photos: photosPayload,
        voiceSampleUrl,
        questionnaireCompleted: true,
      };
      delete payload.basic.photo;

      const saved = await savePatient(payload);
      onSaved(saved);
    } catch (err) {
      setSaveError(err.message || "Couldn't save the profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="questionnaire-shell">
      <div className="questionnaire-shell__inner">
        <div className="questionnaire-shell__head">
          <Logo />
        </div>

        <div className="questionnaire-shell__head-copy" style={{ marginBottom: 28 }}>
          <h1>{initialPatient ? "Edit the patient's details" : "Tell us about the patient"}</h1>
          <p>
            {initialPatient
              ? "Everything here was filled in earlier — change, add, or remove anything, then save."
              : "This helps the app choose the right games, difficulty, and memory sessions from day one. Takes about 10 minutes."}
          </p>
        </div>

        <StepProgress steps={STEP_LABELS} currentIndex={stepIndex} />

        <div className="card q-card">
          {stepIndex === 0 && <StepBasicDetails data={basic} onChange={setBasic} />}
          {stepIndex === 1 && <StepMedicalDetails data={medical} onChange={setMedical} />}
          {stepIndex === 2 && <StepPreferences data={preferences} onChange={setPreferences} />}
          {stepIndex === 3 && (
            <StepMemories
              memories={memories}
              people={people}
              patientContext={basic}
              onChangeMemories={setMemories}
              onChangePeople={setPeople}
            />
          )}
          {stepIndex === 4 && (
            <StepPhotos
              photos={photos}
              onChangePhotos={setPhotos}
              voiceSample={voiceSample}
              onChangeVoiceSample={setVoiceSample}
            />
          )}
          {stepIndex === 5 && (
            <StepReview formData={{ basic, medical, preferences, memories, people, photos }} />
          )}

          {saveError && (
            <p className="field__error" style={{ marginTop: 4, marginBottom: 16 }}>
              {saveError}
            </p>
          )}

          <div className="q-nav">
            {isFirst && onCancel ? (
              <Button variant="ghost" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            ) : (
              <Button variant="secondary" onClick={goBack} disabled={isFirst || saving}>
                Back
              </Button>
            )}
            <div className="q-nav__spacer" />
            {isLast ? (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving…" : submitLabel}
              </Button>
            ) : (
              <Button onClick={goNext} disabled={saving}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/*
  resolveFileUrl() prefixed the API origin so images load in <img> tags — but
  the server only ever wants its own relative form back (/uploads/xyz.jpg),
  not http://localhost:5000/uploads/xyz.jpg. This undoes that prefix for
  anything unchanged from what the server sent us. Blob URLs and empty
  strings pass through as-is (a blob: here only happens if upload failed
  silently, which shouldn't occur since we await every upload above).
*/
function stripOrigin(url) {
  if (!url) return url;
  const match = url.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/);
  return match ? match[1] : url;
}

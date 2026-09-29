import React, { useState } from "react";
import { Field, Input, Select, Textarea, FileInput, Button } from "../common/UI.jsx";
import { analyzeMemoryCopilot } from "../../api/patients.js";
import "./questionnaire.css";

const NE_STATES = [
  "Assam",
  "Meghalaya",
  "Manipur",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Arunachal Pradesh",
  "Sikkim",
];

const LANGUAGES = [
  "Assamese",
  "Bengali",
  "Bodo",
  "Khasi",
  "Meitei (Manipuri)",
  "Mizo",
  "Nagamese",
  "Nepali",
  "Hindi",
  "English",
];

/* ---------- Step 1: Basic details ---------- */
export function StepBasicDetails({ data, onChange }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value });

  return (
    <div>
      <h2 className="q-card__title">Basic details</h2>
      <p className="q-card__desc">Let's start with who the patient is.</p>

      <Field label="Patient's full name" htmlFor="fullName" required>
        <Input
          id="fullName"
          placeholder="e.g. Ratna Devi Sharma"
          value={data.fullName}
          onChange={set("fullName")}
        />
      </Field>

      <FileInput
        id="patientPhoto"
        label={data.photoUrl ? "Replace the photo" : "Upload a recent photo"}
        hint="Used across the app so the patient recognizes their own profile"
        onFiles={(files) => {
          const file = files[0] || null;
          onChange({
            ...data,
            photo: file,
            photoUrl: file ? URL.createObjectURL(file) : data.photoUrl,
          });
        }}
      />
      {data.photoUrl && (
        <div className="q-photo-thumb" style={{ width: 96, height: 96, marginTop: 12 }}>
          <img src={data.photoUrl} alt="" />
        </div>
      )}
      <div style={{ marginBottom: 20 }} />

      <div className="q-grid-2">
        <Field label="Date of birth" htmlFor="dob" required>
          <Input id="dob" type="date" value={data.dob} onChange={set("dob")} />
        </Field>
        <Field label="Gender" htmlFor="gender">
          <Select id="gender" value={data.gender} onChange={set("gender")}>
            <option value="">Select</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </Select>
        </Field>
      </div>

      <Field label="Home address" htmlFor="address" required>
        <Textarea
          id="address"
          rows={2}
          placeholder="House no., street, locality"
          value={data.address}
          onChange={set("address")}
        />
      </Field>

      <div className="q-grid-2">
        <Field label="City" htmlFor="city" required>
          <Input id="city" placeholder="e.g. Guwahati" value={data.city} onChange={set("city")} />
        </Field>
        <Field label="State" htmlFor="state" required>
          <Select id="state" value={data.state} onChange={set("state")}>
            <option value="">Select state</option>
            {NE_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="q-grid-2">
        <Field label="Phone number" htmlFor="phone" required>
          <Input id="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={data.phone} onChange={set("phone")} />
        </Field>
        <Field label="Preferred language" htmlFor="preferredLanguage" required>
          <Select id="preferredLanguage" value={data.preferredLanguage} onChange={set("preferredLanguage")}>
            <option value="">Select language</option>
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="q-grid-2">
        <Field label="Emergency contact name" htmlFor="emergencyName">
          <Input id="emergencyName" value={data.emergencyName} onChange={set("emergencyName")} />
        </Field>
        <Field label="Emergency contact phone" htmlFor="emergencyPhone">
          <Input id="emergencyPhone" type="tel" value={data.emergencyPhone} onChange={set("emergencyPhone")} />
        </Field>
      </div>
    </div>
  );
}

/* ---------- Step 2: Medical & care details ---------- */
export function StepMedicalDetails({ data, onChange }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value });

  return (
    <div>
      <h2 className="q-card__title">Medical & care details</h2>
      <p className="q-card__desc">
        This shapes which games and difficulty level the app starts with.
      </p>

      <Field
        label="Current dementia stage"
        htmlFor="stage"
        required
        hint="As assessed by the doctor (e.g. using CDR or MMSE)."
      >
        <Select id="stage" value={data.stage} onChange={set("stage")}>
          <option value="">Select stage</option>
          <option>Mild (CDR 0.5–1)</option>
          <option>Moderate (CDR 2)</option>
          <option>Severe (CDR 3)</option>
          <option>Not yet formally assessed</option>
        </Select>
      </Field>

      <div className="q-grid-2">
        <Field label="Diagnosing doctor's name" htmlFor="doctorName">
          <Input id="doctorName" value={data.doctorName} onChange={set("doctorName")} />
        </Field>
        <Field label="Doctor's phone / clinic" htmlFor="doctorPhone">
          <Input id="doctorPhone" value={data.doctorPhone} onChange={set("doctorPhone")} />
        </Field>
      </div>

      <div className="q-grid-2">
        <Field label="Primary caretaker's name" htmlFor="caretakerName" required>
          <Input id="caretakerName" value={data.caretakerName} onChange={set("caretakerName")} />
        </Field>
        <Field label="Relationship to patient" htmlFor="caretakerRelation" required>
          <Input
            id="caretakerRelation"
            placeholder="e.g. Son, Daughter, Spouse"
            value={data.caretakerRelation}
            onChange={set("caretakerRelation")}
          />
        </Field>
      </div>

      <Field label="Known allergies or current medications" htmlFor="allergiesMeds" hint="Optional">
        <Textarea
          id="allergiesMeds"
          rows={2}
          value={data.allergiesMeds}
          onChange={set("allergiesMeds")}
        />
      </Field>

      <Field
        label="Daily routine notes"
        htmlFor="dailyRoutine"
        hint="Meal times, nap times, anything that affects when sessions work best"
      >
        <Textarea id="dailyRoutine" rows={3} value={data.dailyRoutine} onChange={set("dailyRoutine")} />
      </Field>
    </div>
  );
}

/* ---------- Step 3: Personality & preferences ---------- */
export function StepPreferences({ data, onChange }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value });

  return (
    <div>
      <h2 className="q-card__title">Personality & preferences</h2>
      <p className="q-card__desc">
        Small details that make the games feel personal rather than generic.
      </p>

      <Field label="Favorite song(s) or music" htmlFor="favoriteSongs">
        <Input
          id="favoriteSongs"
          placeholder="e.g. Bhupen Hazarika songs, old Bihu geet"
          value={data.favoriteSongs}
          onChange={set("favoriteSongs")}
        />
      </Field>

      <Field label="Favorite place" htmlFor="favoritePlace">
        <Input
          id="favoritePlace"
          placeholder="e.g. Their childhood village, a place they visited often"
          value={data.favoritePlace}
          onChange={set("favoritePlace")}
        />
      </Field>

      <Field label="Hobbies & interests" htmlFor="hobbies">
        <Textarea
          id="hobbies"
          rows={2}
          placeholder="e.g. Gardening, weaving, listening to the radio"
          value={data.hobbies}
          onChange={set("hobbies")}
        />
      </Field>

      <Field label="Favorite food" htmlFor="favoriteFood">
        <Input id="favoriteFood" value={data.favoriteFood} onChange={set("favoriteFood")} />
      </Field>

      <Field label="Other languages spoken fluently" htmlFor="languagesSpoken" hint="Optional">
        <Input id="languagesSpoken" value={data.languagesSpoken} onChange={set("languagesSpoken")} />
      </Field>
    </div>
  );
}

/* ---------- Step 4: Life memories ---------- */
export function StepMemories({ memories, people, patientContext, onChangeMemories, onChangePeople }) {
  const addMemory = () =>
    onChangeMemories([
      ...memories,
      {
        id: crypto.randomUUID(),
        title: "",
        tag: "Wedding",
        date: "",
        description: "",
        photo: null,
        photoUrl: "",
      },
    ]);
  const updateMemory = (id, patch) =>
    onChangeMemories(memories.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMemory = (id) => onChangeMemories(memories.filter((m) => m.id !== id));

  const addPerson = () =>
    onChangePeople([...people, { id: crypto.randomUUID(), name: "", relation: "" }]);
  const updatePerson = (id, patch) =>
    onChangePeople(people.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePerson = (id) => onChangePeople(people.filter((p) => p.id !== id));

  return (
    <div>
      <h2 className="q-card__title">Life memories</h2>
      <p className="q-card__desc">
        These become the basis for the memory-lane sessions — add as many as you can.
      </p>

      <h3 style={{ fontSize: "var(--fs-md)", marginBottom: 12 }}>Happiest memories</h3>
      <div className="q-repeatable">
        {memories.map((m, i) => (
          <div className="q-repeatable__item" key={m.id}>
            <div className="q-repeatable__item-head">
              <span className="q-repeatable__item-title">Memory {i + 1}</span>
              {memories.length > 1 && (
                <button
                  type="button"
                  className="q-repeatable__remove"
                  onClick={() => removeMemory(m.id)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="q-grid-2">
              <Field label="Title" htmlFor={`m-title-${m.id}`}>
                <Input
                  id={`m-title-${m.id}`}
                  placeholder="e.g. Wedding day"
                  value={m.title}
                  onChange={(e) => updateMemory(m.id, { title: e.target.value })}
                />
              </Field>
              <Field label="Category" htmlFor={`m-tag-${m.id}`}>
                <Select
                  id={`m-tag-${m.id}`}
                  value={m.tag}
                  onChange={(e) => updateMemory(m.id, { tag: e.target.value })}
                >
                  <option>Wedding</option>
                  <option>Trip</option>
                  <option>Achievement</option>
                  <option>Family occasion</option>
                  <option>Festival</option>
                  <option>Other</option>
                </Select>
              </Field>
            </div>
            <Field label="Approximate date" htmlFor={`m-date-${m.id}`}>
              <Input
                id={`m-date-${m.id}`}
                placeholder="e.g. 1998, or 'Winter of 1976'"
                value={m.date}
                onChange={(e) => updateMemory(m.id, { date: e.target.value })}
              />
            </Field>

            <FileInput
              id={`m-photo-${m.id}`}
              label={m.photoUrl ? "Replace photo for this memory" : "Upload photo for this memory"}
              hint="A photograph from this wedding, trip, festival, or family occasion"
              accept="image/*"
              onFiles={(files) => {
                const file = files[0] || null;
                updateMemory(m.id, {
                  photo: file,
                  photoUrl: file ? URL.createObjectURL(file) : m.photoUrl,
                });
              }}
            />
            {m.photoUrl && (
              <div className="q-photo-thumb" style={{ width: 88, height: 88, marginTop: 8, marginBottom: 12 }}>
                <img src={m.photoUrl} alt="" />
                <button
                  type="button"
                  className="q-photo-thumb__remove"
                  onClick={() => updateMemory(m.id, { photo: null, photoUrl: "" })}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            )}

            <Field label="What happened" htmlFor={`m-desc-${m.id}`}>
              <Textarea
                id={`m-desc-${m.id}`}
                rows={3}
                placeholder="Describe the memory in as much detail as you can"
                value={m.description}
                onChange={(e) => updateMemory(m.id, { description: e.target.value })}
              />
            </Field>

            <MemoryCopilotSection
              memory={m}
              patientContext={patientContext}
              onApplyDescription={(text) => updateMemory(m.id, { description: text })}
              onAppendDescription={(text) =>
                updateMemory(m.id, {
                  description: m.description ? `${m.description}\n\n${text}` : text,
                })
              }
            />
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" onClick={addMemory}>
        + Add another memory
      </Button>

      <div style={{ height: 28 }} />

      <h3 style={{ fontSize: "var(--fs-md)", marginBottom: 12 }}>Important people</h3>
      <div className="q-repeatable">
        {people.map((p, i) => (
          <div className="q-repeatable__item" key={p.id}>
            <div className="q-repeatable__item-head">
              <span className="q-repeatable__item-title">Person {i + 1}</span>
              {people.length > 1 && (
                <button
                  type="button"
                  className="q-repeatable__remove"
                  onClick={() => removePerson(p.id)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="q-grid-2">
              <Field label="Name" htmlFor={`p-name-${p.id}`}>
                <Input
                  id={`p-name-${p.id}`}
                  value={p.name}
                  onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                />
              </Field>
              <Field label="Relationship" htmlFor={`p-relation-${p.id}`}>
                <Input
                  id={`p-relation-${p.id}`}
                  placeholder="e.g. Daughter, Grandson, Best friend"
                  value={p.relation}
                  onChange={(e) => updatePerson(p.id, { relation: e.target.value })}
                />
              </Field>
            </div>
            <FileInput
              id={`p-photo-${p.id}`}
              label={p.photoUrl ? "Replace their photo" : "Upload their photo"}
              hint="Used in the 'Who is this?' recall game"
              onFiles={(files) => {
                const file = files[0] || null;
                updatePerson(p.id, {
                  photo: file,
                  photoUrl: file ? URL.createObjectURL(file) : p.photoUrl,
                });
              }}
            />
            {p.photoUrl && (
              <div className="q-photo-thumb" style={{ width: 84, height: 84, marginTop: 10 }}>
                <img src={p.photoUrl} alt="" />
              </div>
            )}
          </div>
        ))}
      </div>
      <Button variant="secondary" size="sm" onClick={addPerson}>
        + Add another person
      </Button>
    </div>
  );
}

/* ---------- Step 5: Photos & media ---------- */
export function StepPhotos({ photos, onChangePhotos, voiceSample, onChangeVoiceSample }) {
  const addPhotos = (files) => {
    const next = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    onChangePhotos([...photos, ...next]);
  };
  const removePhoto = (id) => onChangePhotos(photos.filter((p) => p.id !== id));

  return (
    <div>
      <h2 className="q-card__title">Photos & media</h2>
      <p className="q-card__desc">
        Photos of family, home, and meaningful places used across the games and memory sessions.
      </p>

      <FileInput
        id="importantPhotos"
        label="Upload photos"
        hint="Family, home, festivals, memorable places — as many as you like"
        multiple
        onFiles={addPhotos}
      />

      {photos.length > 0 && (
        <div className="q-photo-grid">
          {photos.map((p) => (
            <div className="q-photo-thumb" key={p.id}>
              <img src={p.url} alt="" />
              <button
                type="button"
                className="q-photo-thumb__remove"
                onClick={() => removePhoto(p.id)}
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 24 }} />

      <FileInput
        id="voiceSample"
        label={voiceSample?.url ? "Replace the voice sample" : "Upload a voice sample (optional)"}
        hint="A short recording of the patient or family talking, useful for future voice features"
        accept="audio/*"
        onFiles={(files) => {
          const file = files[0] || null;
          onChangeVoiceSample(
            file ? { file, url: URL.createObjectURL(file), name: file.name } : voiceSample
          );
        }}
      />
      {voiceSample?.url && (
        <div style={{ marginTop: 10 }}>
          <audio controls src={voiceSample.url} style={{ width: "100%", maxWidth: 340 }} />
          {voiceSample.name && <p className="field__hint" style={{ marginTop: 6 }}>{voiceSample.name}</p>}
        </div>
      )}
    </div>
  );
}

/* ---------- Step 6: Review ---------- */
export function StepReview({ formData }) {
  const { basic, medical, preferences, memories, people, photos } = formData;

  return (
    <div>
      <h2 className="q-card__title">Review & submit</h2>
      <p className="q-card__desc">
        Check everything looks right. You can come back and edit any of this later from the
        patient's profile.
      </p>

      <div className="q-review-section">
        <h4>Basic details</h4>
        <dl>
          <div className="q-review-row">
            <dt>Name</dt>
            <dd>{basic.fullName || "—"}</dd>
          </div>
          <div className="q-review-row">
            <dt>Date of birth</dt>
            <dd>{basic.dob || "—"}</dd>
          </div>
          <div className="q-review-row">
            <dt>Address</dt>
            <dd>
              {basic.address ? `${basic.address}, ${basic.city}, ${basic.state}` : "—"}
            </dd>
          </div>
          <div className="q-review-row">
            <dt>Phone</dt>
            <dd>{basic.phone || "—"}</dd>
          </div>
          <div className="q-review-row">
            <dt>Preferred language</dt>
            <dd>{basic.preferredLanguage || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="q-review-section">
        <h4>Medical & care</h4>
        <dl>
          <div className="q-review-row">
            <dt>Dementia stage</dt>
            <dd>{medical.stage || "—"}</dd>
          </div>
          <div className="q-review-row">
            <dt>Caretaker</dt>
            <dd>
              {medical.caretakerName
                ? `${medical.caretakerName} (${medical.caretakerRelation})`
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="q-review-section">
        <h4>Preferences</h4>
        <dl>
          <div className="q-review-row">
            <dt>Favorite song</dt>
            <dd>{preferences.favoriteSongs || "—"}</dd>
          </div>
          <div className="q-review-row">
            <dt>Favorite place</dt>
            <dd>{preferences.favoritePlace || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="q-review-section">
        <h4>Memories & people</h4>
        <div className="q-review-row">
          <dt>Memories added</dt>
          <dd>{memories.filter((m) => m.title).length}</dd>
        </div>
        <div className="q-review-row">
          <dt>People added</dt>
          <dd>{people.filter((p) => p.name).length}</dd>
        </div>
        <div className="q-review-row">
          <dt>Photos uploaded</dt>
          <dd>{photos.length}</dd>
        </div>
      </div>

      <p className="field__hint">
        Submitting saves this profile to the database and initializes personalized games and memory sessions.
      </p>
    </div>
  );
}

/* ---------- Memory Copilot Component ---------- */
function MemoryCopilotSection({ memory, patientContext, onApplyDescription, onAppendDescription }) {
  const [loading, setLoading] = useState(false);
  const [copilotData, setCopilotData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleAnalyze = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await analyzeMemoryCopilot({
        title: memory.title,
        tag: memory.tag,
        date: memory.date,
        description: memory.description,
        photoUrl: memory.photoUrl,
        patientContext,
      });
      setCopilotData(data);
      setOpen(true);
    } catch (err) {
      setError(err.message || "Could not analyze memory with Copilot.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!copilotData?.recommendedDescription) return;
    navigator.clipboard.writeText(copilotData.recommendedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="memory-copilot">
      {!open ? (
        <button
          type="button"
          className="memory-copilot__trigger"
          onClick={handleAnalyze}
          disabled={loading}
          title="Analyze memory and get AI guiding questions and suggested description"
        >
          <SparkleIcon />
          <span>{loading ? "AI Copilot is analyzing memory…" : "✨ AI Memory Copilot: Suggest details & questions"}</span>
        </button>
      ) : (
        <div className="memory-copilot__panel">
          <div className="memory-copilot__head">
            <span className="memory-copilot__title">
              <SparkleIcon /> AI Memory Copilot (Questionnaire Assister)
            </span>
            <button
              type="button"
              className="memory-copilot__close"
              onClick={() => setOpen(false)}
              aria-label="Hide Copilot"
            >
              ×
            </button>
          </div>

          {copilotData?.guidingPrompts?.length > 0 && (
            <div className="memory-copilot__prompts-box">
              <span className="memory-copilot__prompts-title">
                💡 Guiding Questions to Jog Your Memory:
              </span>
              <ul className="memory-copilot__prompts-list">
                {copilotData.guidingPrompts.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {copilotData?.recommendedDescription && (
            <div className="memory-copilot__rec-box">
              <span className="memory-copilot__rec-title">
                📝 Recommended Detailed Description (for Cognitive Stimulation Therapy):
              </span>
              <p className="memory-copilot__rec-text">{copilotData.recommendedDescription}</p>

              <div className="memory-copilot__actions">
                <button
                  type="button"
                  className="memory-copilot__btn memory-copilot__btn--copy"
                  onClick={handleCopy}
                  title="Copy recommended text to clipboard"
                >
                  <CopyIcon />
                  <span>{copied ? "✓ Copied to clipboard!" : "Copy description"}</span>
                </button>

                <button
                  type="button"
                  className="memory-copilot__btn memory-copilot__btn--append"
                  onClick={() => onAppendDescription(copilotData.recommendedDescription)}
                  title="Appends this text to your existing description notes"
                >
                  Append to notes
                </button>

                <button
                  type="button"
                  className="memory-copilot__btn memory-copilot__btn--apply"
                  onClick={() => onApplyDescription(copilotData.recommendedDescription)}
                  title="Replaces the description textarea with this text"
                >
                  Use as description
                </button>
              </div>
            </div>
          )}

          <div className="memory-copilot__footer">
            <button
              type="button"
              className="memory-copilot__re-analyze"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing…" : "↻ Re-analyze with new notes/photo"}
            </button>
            <span className="memory-copilot__engine-tag">
              Engine: {copilotData?.source === "gemini" ? "Gemini AI" : "Clinical Copilot"}
            </span>
          </div>
        </div>
      )}
      {error && <p className="field__error" style={{ marginTop: 6 }}>{error}</p>}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.39 8.26L21 9.27L16.14 13.97L17.5 20.54L12 17.27L6.5 20.54L7.86 13.97L3 9.27L9.61 8.26L12 2Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}


import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import PatientForm from "../components/questionnaire/PatientForm.jsx";
import { Button, Tag } from "../components/common/UI.jsx";
import { getMyPatient } from "../api/patients.js";
import { resolveFileUrl } from "../api/uploads.js";
import "./profile.css";

/*
  Read-only summary by default. "Edit full profile" swaps in the exact same
  wizard used for first-time setup (PatientForm), pre-filled from what's
  already saved — every field from the questionnaire can be changed, and
  memories/people/photos can be added to or removed, because the wizard
  always sends its complete state back on save.
*/
export default function Profile() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyPatient()
      .then((data) => {
        if (!cancelled) setPatient(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load the patient profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaved = (updated) => {
    setPatient(updated);
    setEditing(false);
  };

  if (editing) {
    return (
      <PatientForm
        initialPatient={patient}
        submitLabel="Save changes"
        onSaved={handleSaved}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <AppShell title="Patient profile" subtitle="View and update the patient's details anytime">
      {loading && <div className="route-loading" aria-hidden="true" />}

      {!loading && error && <p className="field__error">{error}</p>}

      {!loading && patient && (
        <>
          <div className="profile-header card">
            <div className="profile-header__avatar">
              {patient.basic?.photoUrl ? (
                <img src={resolveFileUrl(patient.basic.photoUrl)} alt="" />
              ) : (
                initials(patient.basic?.fullName)
              )}
            </div>
            <div className="profile-header__info">
              <h2>{patient.basic?.fullName}</h2>
              <div className="profile-header__tags">
                {patient.basic?.dob && <Tag tone="primary">{ageFromDob(patient.basic.dob)}</Tag>}
                {patient.medical?.stage && <Tag tone="gold">{patient.medical.stage}</Tag>}
                {patient.basic?.city && <Tag tone="accent">{patient.basic.city}</Tag>}
              </div>
            </div>
            <div className="profile-header__actions">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit full profile
              </Button>
            </div>
          </div>

          <ViewSection title="Basic details">
            <dl className="profile-grid">
              <Item label="Date of birth" value={patient.basic?.dob} />
              <Item label="Gender" value={patient.basic?.gender} />
              <Item label="Phone" value={patient.basic?.phone} />
              <Item label="Address" value={patient.basic?.address} />
              <Item
                label="City / State"
                value={[patient.basic?.city, patient.basic?.state].filter(Boolean).join(", ")}
              />
              <Item label="Preferred language" value={patient.basic?.preferredLanguage} />
              <Item
                label="Emergency contact"
                value={
                  patient.basic?.emergencyName
                    ? `${patient.basic.emergencyName} (${patient.basic.emergencyPhone || "—"})`
                    : ""
                }
              />
            </dl>
          </ViewSection>

          <ViewSection title="Medical & care">
            <dl className="profile-grid">
              <Item label="Dementia stage" value={patient.medical?.stage} />
              <Item label="Doctor" value={patient.medical?.doctorName} />
              <Item label="Doctor phone / clinic" value={patient.medical?.doctorPhone} />
              <Item
                label="Caretaker"
                value={
                  patient.medical?.caretakerName
                    ? `${patient.medical.caretakerName} (${patient.medical.caretakerRelation || "—"})`
                    : ""
                }
              />
              <Item label="Allergies / medications" value={patient.medical?.allergiesMeds} />
              <Item label="Daily routine" value={patient.medical?.dailyRoutine} />
            </dl>
          </ViewSection>

          <ViewSection title="Personality & preferences">
            <dl className="profile-grid">
              <Item label="Favorite song" value={patient.preferences?.favoriteSongs} />
              <Item label="Favorite place" value={patient.preferences?.favoritePlace} />
              <Item label="Hobbies" value={patient.preferences?.hobbies} />
              <Item label="Favorite food" value={patient.preferences?.favoriteFood} />
              <Item label="Other languages" value={patient.preferences?.languagesSpoken} />
            </dl>
          </ViewSection>

          <ViewSection title="Life memories">
            {patient.memories?.length ? (
              <div className="memory-list">
                {patient.memories.map((m) => (
                  <div className="memory-list__item" key={m._id}>
                    <div className="memory-list__head">
                      <Tag tone="gold">{m.tag}</Tag>
                      {m.date && <span className="memory-list__date">{m.date}</span>}
                    </div>
                    {m.photoUrl && (
                      <div className="q-photo-thumb" style={{ width: 96, height: 96, margin: "8px 0" }}>
                        <img src={resolveFileUrl(m.photoUrl)} alt={m.title || "Memory photo"} />
                      </div>
                    )}
                    <strong>{m.title}</strong>
                    {m.description && <p>{m.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No memories added yet.</p>
            )}
          </ViewSection>

          <ViewSection title="Important people">
            {patient.people?.length ? (
              <div className="people-list">
                {patient.people.map((p) => (
                  <div className="people-list__item" key={p._id}>
                    <div className="people-list__avatar">
                      {p.photoUrl ? (
                        <img src={resolveFileUrl(p.photoUrl)} alt="" />
                      ) : (
                        initials(p.name)
                      )}
                    </div>
                    <div>
                      <strong>{p.name}</strong>
                      <span>{p.relation}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No people added yet.</p>
            )}
          </ViewSection>

          <ViewSection title="Photos & voice sample">
            {patient.photos?.length ? (
              <div className="q-photo-grid">
                {patient.photos.map((p) => (
                  <div className="q-photo-thumb" key={p._id}>
                    <img src={resolveFileUrl(p.url)} alt={p.caption || ""} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">No photos uploaded yet.</p>
            )}

            {patient.voiceSampleUrl ? (
              <audio
                controls
                src={resolveFileUrl(patient.voiceSampleUrl)}
                style={{ marginTop: 16, width: "100%", maxWidth: 340 }}
              />
            ) : (
              <p className="profile-empty" style={{ marginTop: 12 }}>
                No voice sample uploaded yet.
              </p>
            )}
          </ViewSection>
        </>
      )}
    </AppShell>
  );
}

function ViewSection({ title, children }) {
  return (
    <section className="profile-section card">
      <div className="profile-section__head">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Item({ label, value }) {
  return (
    <div className="profile-grid__item">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ageFromDob(dob) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return dob;
  const years = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${years} years`;
}

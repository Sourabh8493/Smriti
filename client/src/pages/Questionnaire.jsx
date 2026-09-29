import React from "react";
import { useNavigate } from "react-router-dom";
import PatientForm from "../components/questionnaire/PatientForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Questionnaire() {
  const { markPatientProfileSaved } = useAuth();
  const navigate = useNavigate();

  const handleSaved = () => {
    markPatientProfileSaved();
    navigate("/dashboard", { replace: true });
  };

  return <PatientForm submitLabel="Submit & go to dashboard" onSaved={handleSaved} />;
}

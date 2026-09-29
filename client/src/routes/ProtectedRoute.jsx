import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/*
  Guards authenticated routes and enforces the first-time questionnaire flow:
  - still validating the stored token          -> render nothing (briefly)
  - not logged in                              -> /login
  - logged in, no saved patient profile        -> /questionnaire (unless already there)
  - logged in, profile saved, still on the questionnaire -> /dashboard
*/
export default function ProtectedRoute() {
  const { isAuthenticated, hasPatientProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="route-loading" aria-hidden="true" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const onQuestionnaire = location.pathname.startsWith("/questionnaire");

  if (!hasPatientProfile && !onQuestionnaire) {
    return <Navigate to="/questionnaire" replace />;
  }

  if (hasPatientProfile && onQuestionnaire) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

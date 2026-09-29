import React, { createContext, useContext, useEffect, useState } from "react";
import { signup as apiSignup, login as apiLogin, fetchMe } from "../api/auth.js";
import { TOKEN_KEY } from "../api/client.js";

/*
  Real backend-backed auth. The JWT is the source of truth for "is this
  person logged in"; hasPatientProfile comes from the server (GET /auth/me or
  the signup/login response) rather than anything stored client-side, so a
  fresh login always reflects whatever's actually in the database.
*/

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [hasPatientProfile, setHasPatientProfile] = useState(false);
  // Starts true whenever a token exists, so ProtectedRoute waits for /auth/me
  // to resolve instead of redirecting to /login on the very first render.
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    fetchMe()
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setHasPatientProfile(data.hasPatientProfile);
      })
      .catch(() => {
        if (cancelled) return;
        // Token is stale/invalid — drop it rather than get stuck.
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const signup = async ({ name, email, password }) => {
    const data = await apiSignup({ name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setHasPatientProfile(data.hasPatientProfile);
    return data;
  };

  const login = async ({ email, password }) => {
    const data = await apiLogin({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setHasPatientProfile(data.hasPatientProfile);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setHasPatientProfile(false);
  };

  // Called right after the questionnaire (or a full profile edit) saves
  // successfully, so ProtectedRoute stops sending the caretaker back to it.
  const markPatientProfileSaved = () => setHasPatientProfile(true);

  const value = {
    user,
    isAuthenticated: Boolean(token && user),
    loading,
    signup,
    login,
    logout,
    hasPatientProfile,
    markPatientProfileSaved,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

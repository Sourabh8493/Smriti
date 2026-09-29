import { useLanguage } from "../../context/LanguageContext.jsx";
import React, { useState, useEffect } from "react";
import { musicPlayer } from "../../utils/musicPlayer.js";
// import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../common/Logo.jsx";
import LanguageSwitcher from "../common/LanguageSwitcher.jsx";
import { IconButton, SpeakerIcon } from "../common/UI.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./app-shell.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/games", label: "Games", icon: <GameIcon /> },
  { to: "/dashboard/reports", label: "Reports", icon: <ReportsIcon /> },
  { to: "/profile", label: "Patient profile", icon: <ProfileIcon /> },
];

export default function AppShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const [musicPlaying, setMusicPlaying] = useState(musicPlayer.isPlaying());

  const handleMusicToggle = () => {
    setMusicPlaying(musicPlayer.toggle());
  };

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__logo">
          <Logo />
        </div>

        <nav className="shell__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) => `shell__nav-item ${isActive ? "is-active" : ""}`}
            >
              <span className="shell__nav-icon">{item.icon}</span>
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <div className="shell__woven" aria-hidden="true" />

        <button type="button" className="shell__logout" onClick={handleLogout}>
          <LogoutIcon />
          Log out
        </button>
      </aside>

      <div className="shell__body">
        <header className="shell__topbar">
          <div>
            <h1 className="shell__title">{title}</h1>
            {subtitle && <p className="shell__subtitle">{subtitle}</p>}
          </div>

          <div className="shell__topbar-actions">
            <IconButton 
              label={musicPlaying ? "Pause background music" : "Play background music"} 
              onClick={handleMusicToggle}
            >
              <SpeakerIcon />
            </IconButton>
            <LanguageSwitcher />
            <div className="shell__user">
              <div className="shell__avatar">{initials(user?.name)}</div>
              <span className="shell__user-name">{user?.name || "Caretaker"}</span>
            </div>
          </div>
        </header>

        <main className="shell__content">{children}</main>
      </div>
    </div>
  );
}

function initials(name) {
  if (!name) return "C";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DashboardIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7.5" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="3.5" width="7.5" height="5.5" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="11" width="7.5" height="9.5" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="14.5" width="7.5" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function ReportsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3.5h9l3.5 3.5V20a.7.7 0 01-.7.7H6a.7.7 0 01-.7-.7V4.2a.7.7 0 01.7-.7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.2" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.8 20c1.1-3.8 4-5.8 7.2-5.8s6.1 2 7.2 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function GameIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="11" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10v4M6 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="10.8" r="1" fill="currentColor" />
      <circle cx="18.5" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21H5.6a1.6 1.6 0 01-1.6-1.6V4.6A1.6 1.6 0 015.6 3H9M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

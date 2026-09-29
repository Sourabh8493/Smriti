import React, { useState, useRef, useEffect } from "react";
import { GlobeIcon } from "./UI.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import "./language-switcher.css";

import { SUPPORTED_LANGUAGES } from "../../data/translations.js";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="lang-switch" ref={ref}>
      <button
        type="button"
        className="lang-switch__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <GlobeIcon />
        <span>{selected.nativeName || selected.label}</span>
      </button>

      {open && (
        <ul className="lang-switch__menu" role="listbox">
          {SUPPORTED_LANGUAGES.map((langItem) => (
            <li key={langItem.code}>
              <button
                type="button"
                role="option"
                aria-selected={langItem.code === selected.code}
                className={`lang-switch__option ${
                  langItem.code === selected.code ? "is-selected" : ""
                }`}
                onClick={() => {
                  setLang(langItem.code);
                  setOpen(false);
                }}
              >
                {langItem.nativeName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
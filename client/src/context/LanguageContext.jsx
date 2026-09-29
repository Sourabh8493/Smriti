import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DICTIONARY, SUPPORTED_LANGUAGES } from "../data/translations.js";
import { translateText } from "../api/bhashini.js";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("smriti_language") || "en";
  });

  // Dynamic translation cache for AI summaries, descriptions, etc.
  const [dynamicCache, setDynamicCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smriti_trans_cache") || "{}");
    } catch {
      return {};
    }
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem("smriti_language", newLang);
  };

  /**
   * Synchronous translation lookup:
   * 1. Checks native dictionary (instant 0ms)
   * 2. Checks dynamic cache for previously translated strings
   * 3. Triggers background fetch if missing and returns fallback
   */
  const t = useCallback(
    (key, fallbackText) => {
      if (!key && !fallbackText) return "";
      if (lang === "en") return fallbackText || key;

      // 1. Static dictionary match for key
      if (key && DICTIONARY[lang]?.[key]) {
        return DICTIONARY[lang][key];
      }

      const trimmedKey = typeof key === "string" ? key.trim() : "";
      if (trimmedKey && DICTIONARY[lang]?.[trimmedKey]) {
        return DICTIONARY[lang][trimmedKey];
      }

      // 2. Static dictionary match for fallbackText
      if (fallbackText && DICTIONARY[lang]?.[fallbackText]) {
        return DICTIONARY[lang][fallbackText];
      }
      const trimmedFallback = typeof fallbackText === "string" ? fallbackText.trim() : "";
      if (trimmedFallback && DICTIONARY[lang]?.[trimmedFallback]) {
        return DICTIONARY[lang][trimmedFallback];
      }

      // 3. Dynamic cache check
      const queryText = trimmedKey || trimmedFallback;
      if (dynamicCache[lang]?.[queryText]) {
        return dynamicCache[lang][queryText];
      }

      // 4. Trigger async translation in background
      if (queryText) {
        translateAsync(queryText);
      }
      return fallbackText || key;
    },
    [lang, dynamicCache]
  );

  /**
   * Translates arbitrary dynamic strings (like 5-6 line AI daily summaries)
   */
  const translateDynamic = useCallback(
    async (text) => {
      if (!text || lang === "en") return text;

      const trimmed = text.trim();
      if (DICTIONARY[lang]?.[trimmed]) {
        return DICTIONARY[lang][trimmed];
      }

      if (dynamicCache[lang]?.[trimmed]) {
        return dynamicCache[lang][trimmed];
      }

      try {
        const translated = await translateText(trimmed, "en", lang);
        if (translated && translated !== trimmed) {
          setDynamicCache((prev) => {
            const updated = {
              ...prev,
              [lang]: { ...(prev[lang] || {}), [trimmed]: translated },
            };
            try {
              localStorage.setItem("smriti_trans_cache", JSON.stringify(updated));
            } catch {}
            return updated;
          });
          return translated;
        }
      } catch (err) {
        console.warn("Dynamic translation failed:", err);
      }
      return text;
    },
    [lang, dynamicCache]
  );

  const translateAsync = async (text) => {
    if (!text || dynamicCache[lang]?.[text] !== undefined) return;

    try {
      const translated = await translateText(text, "en", lang);
      if (translated && translated !== text) {
        setDynamicCache((prev) => {
          const updated = {
            ...prev,
            [lang]: { ...(prev[lang] || {}), [text]: translated },
          };
          try {
            localStorage.setItem("smriti_trans_cache", JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.warn("Async translation failed:", err);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        translateDynamic,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
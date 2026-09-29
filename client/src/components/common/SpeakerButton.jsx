import React, { useState } from "react";
import { IconButton, SpeakerIcon } from "./UI.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { generateSpeech } from "../../api/bhashini.js";

export default function SpeakerButton({ text, label = "Listen to this question" }) {
  const { lang } = useLanguage();
  const [playing, setPlaying] = useState(false);

  const handleSpeak = async () => {
    if (!text || playing) return;
    setPlaying(true);
    
    try {
      await generateSpeech(text, lang);
    } catch (err) {
      console.error("Bhashini TTS failed:", err);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <IconButton label={label} onClick={handleSpeak} disabled={playing}>
      <SpeakerIcon />
    </IconButton>
  );
}
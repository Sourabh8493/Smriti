// client/src/api/bhashini.js
import { DICTIONARY } from "../data/translations.js";

const BHASHINI_PIPELINE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
const AUTH_TOKEN =
  import.meta.env.VITE_BHASHINI_AUTH_TOKEN ||
  "xMKQBW4S40-OAPuJzPLkrHYQsMncmLwkI6TJ7kEmWCxz-EgaU6Kzkoyi1xdcyamc";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Local in-memory audio player reference
let activeAudioElement = null;

/**
 * Translates text to target language using backend Bhashini proxy or direct Bhashini API
 */
export async function translateText(text, sourceLang = "en", targetLang = "as") {
  if (!text || sourceLang === targetLang) return text;

  // 1. Instant check in client-side high-fidelity dictionary
  if (DICTIONARY[targetLang]?.[text]) {
    return DICTIONARY[targetLang][text];
  }

  // 2. Try backend Bhashini endpoint
  try {
    const res = await fetch(`${API_URL}/bhashini/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText) return data.translatedText;
    }
  } catch {
    // Backend request failed, fall through to direct Bhashini pipeline
  }

  // 3. Fallback: Direct call to Bhashini Dhruva Pipeline
  try {
    const directRes = await fetch(BHASHINI_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "translation",
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
              },
            },
          },
        ],
        inputData: {
          input: [{ source: text }],
        },
      }),
    });

    if (directRes.ok) {
      const data = await directRes.json();
      const output =
        data?.pipelineResponse?.[0]?.output?.[0]?.target?.trim() ||
        data?.pipelineResponse?.[0]?.output?.[0]?.targetText?.trim();
      if (output) return output;
    }
  } catch (err) {
    console.warn("Direct Bhashini translation bypassed:", err.message);
  }

  return text;
}

const MEITEI_TO_BENGALI = {
  '\uABC0': 'ক', '\uABC1': 'স', '\uABC2': 'ল', '\uABC3': 'ম', '\uABC4': 'প',
  '\uABC5': 'ন', '\uABC6': 'চ', '\uABC7': 'ত', '\uABC8': 'খ', '\uABC9': 'ঙ',
  '\uABCA': 'থ', '\uABCB': 'ও', '\uABCC': 'য়', '\uABCD': 'হ', '\uABCE': 'উ',
  '\uABCF': 'ই', '\uABD0': 'ফ', '\uABD1': 'অ', '\uABD2': 'গ', '\uABD3': 'ঝ',
  '\uABD4': 'র', '\uABD5': 'ব', '\uABD6': 'জ', '\uABD7': 'দ', '\uABD8': 'ঘ',
  '\uABD9': 'ध', '\uABDA': 'ভ',
  // Lonsum
  '\uABDB': 'ক্', '\uABDC': 'ল্', '\uABDD': 'ম্', '\uABDE': 'প্', '\uABDF': 'ন্',
  '\uABE0': 'ৎ', '\uABE1': 'ঙ্', '\uABE2': 'ই',
  // Cheitap (vowels)
  '\uABE3': 'ো', '\uABE4': 'ি', '\uABE5': 'া', '\uABE6': 'ে', '\uABE7': 'ৌ',
  '\uABE8': 'ু', '\uABE9': 'ৈ', '\uABEA': 'ং',
};

export function meiteiToBengali(text) {
  if (!text) return '';
  return text.split('').map((ch) => MEITEI_TO_BENGALI[ch] || ch).join('');
}

function sanitizeForTTS(text) {
  if (!text) return "";
  // In many TTS engines, "!" is vocalized as the word "factorial".
  // Replacing "!" with a period ensures natural emotional cadence without uttering "factorial".
  return text
    .replace(/!+/g, ".")
    .replace(/\s*([.,;?])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates and plays speech audio using Bhashini native TTS
 * Falls back transparently to browser SpeechSynthesis if audio playback is blocked
 */
export async function generateSpeech(text, lang = "as", gender = "female") {
  if (!text) return;

  // Stop any currently playing audio
  stopAudio();

  const cleanText = sanitizeForTTS(text);
  const ttsText = lang === "mni" ? meiteiToBengali(cleanText) : cleanText;

  // 1. Try Bhashini TTS via backend
  try {
    const res = await fetch(`${API_URL}/bhashini/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: ttsText, language: lang, gender }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.audioContent) {
        return playBase64Audio(data.audioContent);
      }
    }
  } catch {
    // Backend TTS request failed, try direct Bhashini API
  }

  // 2. Direct Bhashini TTS fallback
  try {
    const directRes = await fetch(BHASHINI_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "tts",
            config: {
              language: { sourceLanguage: lang },
              gender,
            },
          },
        ],
        inputData: {
          input: [{ source: ttsText }],
        },
      }),
    });

    if (directRes.ok) {
      const data = await directRes.json();
      const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
      if (audioContent) {
        return playBase64Audio(audioContent);
      }
    }
  } catch (err) {
    console.warn("Bhashini direct TTS failed, falling back to Web Speech:", err.message);
  }

  // 3. Robust Web Speech Synthesis Fallback
  return fallbackSpeechSynthesis(ttsText, lang);
}

/**
 * Plays base64 WAV/MP3 audio returned by Bhashini TTS
 */
function playBase64Audio(base64Content) {
  return new Promise((resolve) => {
    try {
      const audioUrl = `data:audio/wav;base64,${base64Content}`;
      const audio = new Audio(audioUrl);
      activeAudioElement = audio;

      audio.onended = () => {
        activeAudioElement = null;
        resolve();
      };
      audio.onerror = () => {
        activeAudioElement = null;
        resolve();
      };

      audio.play().catch(() => {
        activeAudioElement = null;
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

/**
 * Fallback Web Speech Synthesis
 */
function fallbackSpeechSynthesis(text, lang) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();

    window.speechSynthesis.cancel();
    const cleanText = sanitizeForTTS(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Map language code to browser speech synthesis locales
    const localeMap = {
      as: "hi-IN", // Assamese fallback to Indian accented engine
      bn: "bn-IN",
      brx: "hi-IN",
      mni: "hi-IN",
      hi: "hi-IN",
      en: "en-IN",
    };

    utterance.lang = localeMap[lang] || "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stops any ongoing audio playback (Bhashini audio element or speech synthesis)
 */
export function stopAudio() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Real-time Speech-to-Text (ASR)
 * Uses browser Web Speech Recognition configured with regional Indian locales
 */
export function createSpeechRecognizer({ lang = "en", onResult, onError, onEnd }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return {
      isSupported: false,
      start: () => {
        if (onError) onError("Microphone speech recognition is not supported in this browser.");
      },
      stop: () => {},
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  const localeMap = {
    as: "as-IN",
    bn: "bn-IN",
    brx: "hi-IN",
    mni: "hi-IN",
    hi: "hi-IN",
    en: "en-IN",
  };

  recognition.lang = localeMap[lang] || "en-IN";

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript && onResult) onResult(transcript);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    isSupported: true,
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition start error:", err.message);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
  };
}

/**
 * CST Cognitive Stimulation Therapy Chat API
 * Sends patient message to CST AI companion and returns supportive conversational response
 */
export async function sendCSTChat({
  message,
  memoryTitle,
  memoryTag,
  memoryDate,
  memoryDescription,
  conversationHistory = [],
  language = "en",
  generateAudio = true,
}) {
  const token =
    localStorage.getItem("sih26003_token") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/bhashini/cst-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      memoryTitle,
      memoryTag,
      memoryDate,
      memoryDescription,
      conversationHistory,
      language,
      generateAudio,
    }),
  });

  if (!res.ok) {
    throw new Error(`CST Chat error: ${res.statusText}`);
  }

  return res.json();
}
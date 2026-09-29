/**
 * Bhashini AI Services Layer
 * Integrates directly with the official Digital India Bhashini Dhruva Pipeline:
 * - NMT (Neural Machine Translation)
 * - TTS (Text-to-Speech)
 * - ASR (Automated Speech Recognition)
 *
 * Supports major North Eastern & Indian languages:
 * - as (Assamese)
 * - bn (Bengali)
 * - brx (Bodo)
 * - mni (Manipuri / Meitei)
 * - hi (Hindi)
 * - en (English)
 */

const BHASHINI_PIPELINE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
const AUTH_TOKEN =
  process.env.BHASHINI_AUTH_TOKEN ||
  "xMKQBW4S40-OAPuJzPLkrHYQsMncmLwkI6TJ7kEmWCxz-EgaU6Kzkoyi1xdcyamc";

// In-memory translation cache to guarantee instant sub-millisecond responses
const translationCache = new Map();

/**
 * Translates text between supported Indian languages using Bhashini
 */
async function translateText(text, sourceLang = "en", targetLang = "as") {
  if (!text || sourceLang === targetLang) return text;

  const cacheKey = `${sourceLang}:${targetLang}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(BHASHINI_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      signal: controller.signal,
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
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Bhashini translation returned status: ${res.status}`);
      return text;
    }

    const data = await res.json();
    const translated =
      data?.pipelineResponse?.[0]?.output?.[0]?.target?.trim() ||
      data?.pipelineResponse?.[0]?.output?.[0]?.targetText?.trim();

    if (translated) {
      translationCache.set(cacheKey, translated);
      return translated;
    }
    return text;
  } catch (err) {
    console.warn("Bhashini translation failed/timed out:", err.message);
    return text;
  }
}

const MEITEI_TO_BENGALI = {
  '\uABC0': 'ক', '\uABC1': 'স', '\uABC2': 'ল', '\uABC3': 'ম', '\uABC4': 'প',
  '\uABC5': 'ন', '\uABC6': 'চ', '\uABC7': 'ত', '\uABC8': 'খ', '\uABC9': 'ঙ',
  '\uABCA': 'থ', '\uABCB': 'ও', '\uABCC': 'য়', '\uABCD': 'হ', '\uABCE': 'উ',
  '\uABCF': 'ই', '\uABD0': 'ফ', '\uABD1': 'অ', '\uABD2': 'গ', '\uABD3': 'ঝ',
  '\uABD4': 'র', '\uABD5': 'ব', '\uABD6': 'জ', '\uABD7': 'দ', '\uABD8': 'ঘ',
  '\uABD9': 'ধ', '\uABDA': 'ভ',
  // Lonsum
  '\uABDB': 'ক্', '\uABDC': 'ল্', '\uABDD': 'ম্', '\uABDE': 'প্', '\uABDF': 'ন্',
  '\uABE0': 'ৎ', '\uABE1': 'ঙ্', '\uABE2': 'ই',
  // Cheitap (vowels)
  '\uABE3': 'ো', '\uABE4': 'ি', '\uABE5': 'া', '\uABE6': 'ে', '\uABE7': 'ৌ',
  '\uABE8': 'ু', '\uABE9': 'ৈ', '\uABEA': 'ং',
};

function meiteiToBengali(text) {
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
 * Generates natural Text-to-Speech audio in native regional language
 * Returns base64 encoded audio string
 */
async function generateTTS(text, lang = "as", gender = "female") {
  if (!text) return null;

  const cleanText = sanitizeForTTS(text);
  const ttsText = lang === "mni" ? meiteiToBengali(cleanText) : cleanText;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(BHASHINI_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      signal: controller.signal,
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "tts",
            config: {
              language: {
                sourceLanguage: lang,
              },
              gender: gender || "female",
            },
          },
        ],
        inputData: {
          input: [{ source: ttsText }],
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Bhashini TTS returned status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
    return audioContent || null;
  } catch (err) {
    console.warn("Bhashini TTS failed/timed out:", err.message);
    return null;
  }
}

/**
 * Transcribes spoken audio into text using Bhashini ASR
 */
async function transcribeAudio(audioBase64, lang = "as") {
  if (!audioBase64) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(BHASHINI_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH_TOKEN,
      },
      signal: controller.signal,
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "asr",
            config: {
              language: {
                sourceLanguage: lang,
              },
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: audioBase64 }],
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Bhashini ASR returned status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const transcript =
      data?.pipelineResponse?.[0]?.output?.[0]?.source ||
      data?.pipelineResponse?.[0]?.output?.[0]?.transcript;

    return transcript || null;
  } catch (err) {
    console.warn("Bhashini ASR failed:", err.message);
    return null;
  }
}

module.exports = {
  translateText,
  generateTTS,
  transcribeAudio,
};

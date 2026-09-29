import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  generateSpeech,
  stopAudio,
  createSpeechRecognizer,
  sendCSTChat,
} from "../../api/bhashini.js";
import { saveGameSession } from "../../api/games.js";
import { resolveFileUrl } from "../../api/uploads.js";
import { musicPlayer } from "../../utils/musicPlayer.js";
import "./game.css";

const PHASES = {
  SELECT: "select",
  CONVERSATION: "conversation",
  COMPLETED: "completed",
};

export default function MemoryLaneGame({ patient = null, onExit }) {
  const { t, lang } = useLanguage();
  const [phase, setPhase] = useState(PHASES.CONVERSATION);
  const [selectedMemory, setSelectedMemory] = useState(null);

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [suggestionCues, setSuggestionCues] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(0);

  // Anxiety reduction & soothing music state
  const [consecutiveStruggles, setConsecutiveStruggles] = useState(0);
  const [calmingMusicPlaying, setCalmingMusicPlaying] = useState(false);

  const recognizerRef = useRef(null);
  const chatEndRef = useRef(null);
  const savedRef = useRef(false);
  const autoStartedRef = useRef(false);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking, isAiSpeaking]);

  // Clean up audio & speech recognition on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  // Built-in culturally resonant memories if patient profile has none yet
  const defaultMemories = [
    {
      id: "def-1",
      title: "Rongali Bihu Spring Festival & Feast",
      tag: "Festival",
      date: "Spring Celebrations",
      description: "Celebrating Rongali Bihu with family, fresh pitha and laru, traditional dhol melodies, and welcoming neighbors.",
      photoUrl: "/uploads/festival1-1789803405384-84250.jpg",
      emoji: "🌸",
    },
    {
      id: "def-2",
      title: "Journey to Nilachal Hills & River",
      tag: "Trip",
      date: "Scenic Family Outing",
      description: "A peaceful morning trip overlooking the Brahmaputra, hearing temple bells in the gentle breeze, and drinking hot roadside tea together.",
      photoUrl: "/uploads/nilachal1-1789803405394-854888.jpg",
      emoji: "⛰️",
    },
    {
      id: "def-3",
      title: "Traditional Wedding Day & Biya Naam",
      tag: "Wedding",
      date: "Sacred Milestone",
      description: "Wearing ceremonial silk, surrounded by beloved family and lifelong friends singing traditional Biya Naam blessings with laughter.",
      photoUrl: "/uploads/bodo-1789803405359-271267.jpg",
      emoji: "💍",
    },
    {
      id: "def-4",
      title: "Evening with Family & Grandchildren",
      tag: "Family occasion",
      date: "Family Gathering",
      description: "Sitting comfortably in the courtyard, sharing folk tales with the grandchildren, and sharing a hearty dinner filled with smiles.",
      photoUrl: "/uploads/nirmala-1789803405360-676521.jpg",
      emoji: "🏡",
    },
  ];

  // Combine patient's saved memories with defaults
  const availableMemories = [
    ...(patient?.memories || []).map((m) => ({
      id: m._id || m.id || crypto.randomUUID(),
      title: m.title || "Special Memory",
      tag: m.tag || "Life Moment",
      date: m.date || "",
      description: m.description || "",
      photoUrl: m.photoUrl ? resolveFileUrl(m.photoUrl) : "",
      emoji: "✨",
    })),
    ...defaultMemories,
  ];

  // Automatically start directly with a randomly chosen memory on mount
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;

    // Prioritize feeded memories by caretaker, fallback to cultural defaults
    const pool =
      patient?.memories && patient.memories.length > 0
        ? patient.memories.map((m) => ({
            id: m._id || m.id || crypto.randomUUID(),
            title: m.title || "Special Memory",
            tag: m.tag || "Life Moment",
            date: m.date || "",
            description: m.description || "",
            photoUrl: m.photoUrl ? resolveFileUrl(m.photoUrl) : "",
            emoji: "✨",
          }))
        : defaultMemories;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    handleSelectMemory(chosen);
  }, [patient]);

  // Starts the CST session with chosen memory
  const handleSelectMemory = async (memory) => {
    setSelectedMemory(memory);
    setPhase(PHASES.CONVERSATION);
    setMessages([]);
    setSessionStartTime(Date.now());
    setIsAiThinking(true);
    setConsecutiveStruggles(0);

    try {
      const data = await sendCSTChat({
        message: "",
        memoryTitle: memory.title,
        memoryTag: memory.tag,
        memoryDate: memory.date,
        memoryDescription: memory.description,
        conversationHistory: [],
        language: lang,
        generateAudio: true,
      });

      const initialAiMsg = {
        sender: "ai",
        text: data.reply,
        englishText: data.englishReply,
        audioContent: data.audioContent,
        timestamp: Date.now(),
      };

      setMessages([initialAiMsg]);
      setSuggestionCues(data.suggestionCues || []);
      setIsAiThinking(false);

      // Play native Bhashini voice out loud
      speakReply(data.reply);
    } catch (err) {
      console.error("CST Session init failed:", err);
      setIsAiThinking(false);
      const fallbackBrief = memory.description
        ? `Your caretaker shared that ${memory.description}.`
        : "What a happy time it was!";
      const fallbackText = `Hello! It is so nice to sit together today. Let's talk about ${memory.title}. ${fallbackBrief} Do you remember any special smiles or feelings from that day?`;
      setMessages([{ sender: "ai", text: fallbackText, timestamp: Date.now() }]);
      speakReply(fallbackText);
    }
  };

  const speakReply = async (text) => {
    stopAudio();
    setIsAiSpeaking(true);
    try {
      await generateSpeech(text, lang);
    } catch (err) {
      console.warn("TTS failed:", err);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAiThinking) return;

    // Stop speaking if AI is talking
    stopAudio();
    setIsAiSpeaking(false);

    // Stop microphone if listening
    if (isListening && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsListening(false);
    }

    // Check if patient indicates struggle / forgetting
    const lower = text.toLowerCase();
    const isStruggle =
      lower.includes("don't remember") ||
      lower.includes("dont remember") ||
      lower.includes("forgot") ||
      lower.includes("can't recall") ||
      lower.includes("cant recall") ||
      lower.includes("don't know") ||
      lower.includes("dont know") ||
      lower.includes("not sure") ||
      lower.includes("help me remember");

    let updatedStruggles = isStruggle ? consecutiveStruggles + 1 : 0;
    setConsecutiveStruggles(updatedStruggles);

    // If 3 or more incorrect/struggles in a row, start calming music in low volume
    if (updatedStruggles >= 3 && !calmingMusicPlaying) {
      musicPlayer.playCalmingLowVolume();
      setCalmingMusicPlaying(true);
    }

    const patientMsg = {
      sender: "patient",
      text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, patientMsg];
    setMessages(updatedHistory);
    setInputText("");
    setIsAiThinking(true);

    try {
      const data = await sendCSTChat({
        message: text,
        memoryTitle: selectedMemory?.title,
        memoryTag: selectedMemory?.tag,
        memoryDate: selectedMemory?.date,
        memoryDescription: selectedMemory?.description,
        conversationHistory: updatedHistory.map((m) => ({
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.text,
        })),
        language: lang,
        generateAudio: true,
        consecutiveStruggles: updatedStruggles,
      });

      const aiMsg = {
        sender: "ai",
        text: data.reply,
        englishText: data.englishReply,
        audioContent: data.audioContent,
        isMemoryCompletion: data.isMemoryCompletion,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setSuggestionCues(data.suggestionCues || []);
      setIsAiThinking(false);

      // Speak AI response in chosen language
      speakReply(data.reply);

      // Handle session navigation actions if requested
      if (data.sessionAction === "next_memory") {
        setTimeout(() => {
          switchToNextMemory();
        }, 3400);
      } else if (data.sessionAction === "end_session") {
        setTimeout(() => {
          handleFinishSession();
        }, 3400);
      }
    } catch (err) {
      console.error("CST chat failed:", err);
      setIsAiThinking(false);
    }
  };

  const switchToNextMemory = () => {
    stopAudio();
    setIsAiSpeaking(false);
    const pool =
      patient?.memories && patient.memories.length > 0
        ? patient.memories.map((m) => ({
            id: m._id || m.id || crypto.randomUUID(),
            title: m.title || "Special Memory",
            tag: m.tag || "Life Moment",
            date: m.date || "",
            description: m.description || "",
            photoUrl: m.photoUrl ? resolveFileUrl(m.photoUrl) : "",
            emoji: "✨",
          }))
        : defaultMemories;
    const otherPool = pool.filter((m) => m.title !== selectedMemory?.title);
    const chosen =
      (otherPool.length > 0 ? otherPool : pool)[
        Math.floor(Math.random() * (otherPool.length > 0 ? otherPool.length : pool.length))
      ];
    handleSelectMemory(chosen);
  };

  // Toggle voice speech recognition (patient speaks)
  const handleToggleMic = () => {
    if (isListening) {
      if (recognizerRef.current) recognizerRef.current.stop();
      setIsListening(false);
      return;
    }

    stopAudio();
    setIsAiSpeaking(false);

    const recognizer = createSpeechRecognizer({
      lang,
      onResult: (transcript) => {
        setIsListening(false);
        if (transcript) {
          handleSendMessage(transcript);
        }
      },
      onError: (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;
    if (recognizer.isSupported) {
      setIsListening(true);
      recognizer.start();
    } else {
      alert("Microphone voice input is not supported in this browser. Please type or click the prompt chips.");
    }
  };

  const handleFinishSession = () => {
    stopAudio();
    const duration = sessionStartTime
      ? Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000))
      : 3;
    setSessionDurationMinutes(duration);
    setPhase(PHASES.COMPLETED);

    if (!savedRef.current) {
      savedRef.current = true;
      saveGameSession({
        gameId: "memory-lane",
        level: 1,
        accuracy: 100, // CST has no score failures, 100% emotional engagement
        totalCount: messages.length,
        correctCount: messages.length,
        totalTimeMs: Date.now() - (sessionStartTime || Date.now()),
        isAdaptive: true,
        aiInsights: `Patient relived "${selectedMemory?.title || "Life Memory"}" in a Cognitive Stimulation Therapy session. Demonstrated warm autobiographical engagement.`,
      }).catch((e) => console.warn("Could not save CST session:", e));
    }
  };

  // Render Phase 1: Selector
  if (phase === PHASES.SELECT) {
    return (
      <div className="memory-lane-root">
        <header className="cst-topbar">
          <div className="cst-topbar__title">
            <span style={{ fontSize: "1.5rem" }}>🌿</span>
            <h2>{t("Memory Lane (CST Therapy)")}</h2>
          </div>
          <button type="button" className="cst-leave-btn" onClick={onExit}>
            {t("Leave game")}
          </button>
        </header>

        <div className="cst-selector">
          <div className="cst-selector__head">
            <h1>{t("Choose a memory to revisit")}</h1>
            <p>
              {t("Relive your happiest moments with a friendly, voice-enabled AI companion.")}
            </p>
          </div>

          <div className="cst-memories-grid">
            {availableMemories.map((mem) => (
              <div
                key={mem.id}
                className="cst-memory-card"
                onClick={() => handleSelectMemory(mem)}
                role="button"
                tabIndex={0}
              >
                <div className="cst-memory-card__img-wrap">
                  {mem.photoUrl ? (
                    <img src={mem.photoUrl} alt={mem.title} />
                  ) : (
                    <div className="cst-memory-card__placeholder">{mem.emoji || "📸"}</div>
                  )}
                </div>
                <div className="cst-memory-card__content">
                  <span className="cst-memory-card__tag">{t(mem.tag, mem.tag)}</span>
                  <h3 className="cst-memory-card__title">{t(mem.title, mem.title)}</h3>
                  <p className="cst-memory-card__desc">{t(mem.description, mem.description)}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="cst-leave-btn"
            style={{ padding: "12px 28px", fontSize: "1rem" }}
            onClick={onExit}
          >
            {t("Back to games")}
          </button>
        </div>
      </div>
    );
  }

  // Render Phase 2: CST Conversation
  if (phase === PHASES.CONVERSATION) {
    return (
      <div className="memory-lane-root">
        <header className="cst-topbar">
          <div className="cst-topbar__title">
            <span style={{ fontSize: "1.4rem" }}>🌸</span>
            <h2>{t(selectedMemory?.title || "Memory Lane")}</h2>
          </div>
          <div className="cst-topbar__actions">
            <button
              type="button"
              className="cst-leave-btn"
              onClick={switchToNextMemory}
              title={t("Switch to another memory")}
            >
              🔄 {t("Another memory")}
            </button>
            <button
              type="button"
              className="cst-leave-btn"
              onClick={() => musicPlayer.toggle()}
              title={t("Play background music")}
            >
              🎵 {t("Music", "Music")}
            </button>
            <button
              type="button"
              className="cst-leave-btn"
              style={{ background: "#f5ece1", borderColor: "#bfa98d" }}
              onClick={handleFinishSession}
            >
              {t("End therapy session")}
            </button>
          </div>
        </header>

        <div className="cst-conversation-container">
          {/* Calming Music Soothing Banner */}
          {calmingMusicPlaying && (
            <div
              style={{
                background: "#f0f7f2",
                border: "2px solid #52a472",
                borderRadius: "12px",
                padding: "10px 18px",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#1c5132",
                fontSize: "0.95rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>🎵</span>
              <div>
                <strong>{t("Playing soothing calming music")}</strong>
                <p style={{ margin: "2px 0 0 0", color: "#366a4a", fontSize: "0.88rem" }}>
                  {t(
                    "Take all the time you need. We are here together in a peaceful, gentle space."
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Memory Visual Banner */}
          <div className="cst-memory-hero">
            {selectedMemory?.photoUrl ? (
              <img src={selectedMemory.photoUrl} alt="" className="cst-memory-hero__thumb" />
            ) : (
              <div
                className="cst-memory-hero__thumb"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  background: "#f4eee6",
                }}
              >
                {selectedMemory?.emoji || "📷"}
              </div>
            )}
            <div className="cst-memory-hero__info">
              <h3>{t(selectedMemory?.title)}</h3>
              <p>{t(selectedMemory?.description)}</p>
            </div>
          </div>

          {/* AI Speaking Indicator */}
          {isAiSpeaking && (
            <div className="cst-speaking-indicator">
              <div className="cst-sound-bars">
                <span className="cst-sound-bar" />
                <span className="cst-sound-bar" />
                <span className="cst-sound-bar" />
                <span className="cst-sound-bar" />
              </div>
              <span style={{ fontWeight: 600, color: "#2d5a3f", fontSize: "0.95rem" }}>
                {t("AI is speaking...")}
              </span>
            </div>
          )}

          {/* Chat Bubble Thread */}
          <div className="cst-chat-box">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`cst-msg ${msg.sender === "ai" ? "cst-msg--ai" : "cst-msg--patient"}`}
              >
                <div
                  className={`cst-avatar ${msg.sender === "ai" ? "cst-avatar--ai" : "cst-avatar--patient"}`}
                >
                  {msg.sender === "ai" ? "🤝" : "👤"}
                </div>
                <div>
                  <div className="cst-bubble">
                    <p style={{ margin: 0 }}>{msg.text}</p>
                  </div>
                  {msg.sender === "ai" && (
                    <div className="cst-msg-actions">
                      <button
                        type="button"
                        className="cst-replay-voice-btn"
                        onClick={() => speakReply(msg.text)}
                        title="Replay voice audio"
                      >
                        🔊 <span>{t("Listen", "Listen")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="cst-msg cst-msg--ai">
                <div className="cst-avatar cst-avatar--ai">🤝</div>
                <div className="cst-bubble" style={{ fontStyle: "italic", color: "#6a6152" }}>
                  {t("Thinking of a comforting memory...")}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Patient Voice & Text Controls */}
          <div className="cst-controls">
            {/* Quick Suggestion Chips */}
            {suggestionCues.length > 0 && (
              <div className="cst-suggestion-chips">
                {suggestionCues.map((cue, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="cst-chip"
                    onClick={() => handleSendMessage(cue)}
                  >
                    {cue}
                  </button>
                ))}
              </div>
            )}

            {/* Input Row with Large Mic Button */}
            <div className="cst-input-row">
              <button
                type="button"
                className={`cst-mic-btn ${isListening ? "is-recording" : ""}`}
                onClick={handleToggleMic}
                title={isListening ? t("Listening...") : t("Tap microphone to speak")}
              >
                {isListening ? (
                  <span style={{ fontSize: "1.3rem" }}>⏹</span>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>

              <input
                type="text"
                className="cst-text-input"
                placeholder={
                  isListening
                    ? t("Listening...")
                    : t("Speak or type a thought about this memory...")
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />

              <button
                type="button"
                className="cst-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
              >
                {t("Send", "Send")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Phase 3: Completion & Therapeutic Reflection
  return (
    <div className="memory-lane-root">
      <header className="cst-topbar">
        <div className="cst-topbar__title">
          <span style={{ fontSize: "1.4rem" }}>🌿</span>
          <h2>{t("Memory Lane (CST Therapy)")}</h2>
        </div>
        <button type="button" className="cst-leave-btn" onClick={onExit}>
          {t("Back to games")}
        </button>
      </header>

      <div className="cst-completion-card">
        <div className="cst-completion-badge">💖</div>
        <h2>{t("Session Complete — Heartfelt Reminiscence")}</h2>
        <p>
          {t(
            "What a heartwarming conversation today! Reliving meaningful autobiographical memories stimulates neurological pathways, preserves emotional connection, and fosters calm and well-being."
          )}
        </p>

        <div className="cst-completion-stats">
          <div className="cst-completion-stat">
            <strong>{sessionDurationMinutes} min</strong>
            <span>{t("Therapy Duration", "Therapy Duration")}</span>
          </div>
          <div className="cst-completion-stat">
            <strong>{t(selectedMemory?.tag || "Life")}</strong>
            <span>{t("Memory Category", "Memory Category")}</span>
          </div>
          <div className="cst-completion-stat">
            <strong>{messages.filter((m) => m.sender === "patient").length}</strong>
            <span>{t("Recollections Shared", "Recollections Shared")}</span>
          </div>
        </div>

        <div className="cst-completion-actions">
          <button
            type="button"
            className="cst-send-btn"
            style={{ padding: "12px 28px", fontSize: "1rem" }}
            onClick={() => {
              setPhase(PHASES.SELECT);
              savedRef.current = false;
            }}
          >
            {t("Talk about another memory")}
          </button>
          <button
            type="button"
            className="cst-leave-btn"
            style={{ padding: "12px 28px", fontSize: "1rem" }}
            onClick={onExit}
          >
            {t("Back to games")}
          </button>
        </div>
      </div>
    </div>
  );
}

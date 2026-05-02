import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

const QUESTIONS = [
  "What area of your health are you focusing on?",
  "Describe the healthiest version of yourself. What do you want your day to feel like?",
  "What healthy habits do you want to build?",
  "What is one challenge you are trying to move past?",
  "How do you want to feel at the end of a good day?"
];

const QUESTION_OPTIONS = [
  ["Physical fitness", "Better sleep", "Nutrition", "Mental wellness", "More energy"],
  ["Energetic and confident", "Calm and focused", "Strong and consistent", "Rested and balanced"],
  ["Morning walks", "Gym workouts", "Drinking more water", "Sleeping on time", "Healthy meals"],
  ["Low motivation", "Busy schedule", "Poor sleep routine", "Skipping meals", "Feeling tired"],
  ["Proud", "Energetic", "Calm", "In control", "Refreshed"]
];

export default function App() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState([]);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: QUESTIONS[0]
    }
  ]);

  const [phase, setPhase] = useState("chat"); 
  // chat | loading | done | error

  const [sessionId, setSessionId] = useState("");
const [videoUrl, setVideoUrl] = useState("");
const [narrationText, setNarrationText] = useState("");
const [voiceoverSegments, setVoiceoverSegments] = useState([]);
const [scenes, setScenes] = useState([]);
const [actionPlan, setActionPlan] = useState(null);
const [error, setError] = useState("");

const [customizing, setCustomizing] = useState(false);
const [customInput, setCustomInput] = useState("");

const [availableVoices, setAvailableVoices] = useState([]);
const [selectedVoiceName, setSelectedVoiceName] = useState("");

  const videoRef = useRef(null);
  const speechTimersRef = useRef([]);

  useEffect(() => {
  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    setAvailableVoices(voices);

    const preferred =
      voices.find((v) => v.name.includes("Microsoft Aria")) ||
      voices.find((v) => v.name.includes("Microsoft Jenny")) ||
      voices.find((v) => v.name.includes("Microsoft Guy")) ||
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];

    if (preferred && !selectedVoiceName) {
      setSelectedVoiceName(preferred.name);
    }
  }

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, [selectedVoiceName]);

  function addMessage(from, text) {
    setMessages((prev) => [...prev, { from, text }]);
  }

  function handleAnswer(answerText) {
    const cleanAnswer = answerText.trim();
    if (!cleanAnswer || phase !== "chat") return;

    addMessage("user", cleanAnswer);

    const updatedAnswers = [...answers, cleanAnswer];
    setAnswers(updatedAnswers);
    setInput("");

    const nextIndex = questionIndex + 1;

    if (nextIndex < QUESTIONS.length) {
      setQuestionIndex(nextIndex);

      setTimeout(() => {
        addMessage("bot", QUESTIONS[nextIndex]);
      }, 400);
    } else {
      setTimeout(() => {
        addMessage(
          "bot",
          "Perfect. I have enough to create your future-health story."
        );
      }, 400);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleAnswer(input);
  }

  function clearSpeech() {
    window.speechSynthesis.cancel();

    speechTimersRef.current.forEach((timer) => clearTimeout(timer));
    speechTimersRef.current = [];
  }
  function getSelectedVoice() {
  return availableVoices.find((v) => v.name === selectedVoiceName) || null;
}
  function speakNarration() {
  clearSpeech();

  const selectedVoice = getSelectedVoice();

  if (voiceoverSegments.length > 0) {
    voiceoverSegments.forEach((segment) => {
      const timer = setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(segment.voiceover);

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = 0.82;
        utterance.pitch = 0.95;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
      }, (segment.startTime || 0) * 1000);

      speechTimersRef.current.push(timer);
    });

    return;
  }

  if (narrationText) {
    const utterance = new SpeechSynthesisUtterance(narrationText);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.82;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }
}

  async function generateVideo() {
    try {
      setPhase("loading");
      setError("");
      clearSpeech();

      if (answers.length === 0) {
        throw new Error("Please answer the questions first.");
      }

      // 1. Start story session
      const startRes = await axios.post(`${API_BASE}/api/story/start`, {
        answer: answers[0]
      });

      const sessionId = startRes.data.sessionId;
      let currentQuestion = startRes.data.nextQuestion;
      setSessionId(sessionId);

      // 2. Send follow-up answers to backend
      for (let i = 1; i < answers.length; i++) {
        const answerRes = await axios.post(`${API_BASE}/api/story/answer`, {
          sessionId,
          question: currentQuestion || QUESTIONS[i],
          answer: answers[i]
        });

        currentQuestion = answerRes.data.nextQuestion;

        if (answerRes.data.done) {
          break;
        }
      }

      // 3. Finalize scenes
      const finalizeRes = await axios.post(`${API_BASE}/api/story/finalize`, {
        sessionId
      });

      // 4. Generate video
      const videoRes = await axios.post(`${API_BASE}/api/generate-video`, {
        sessionId,

        // Use false for Stability AI images.
        // If Stability fails, change to true for text placeholders.
        usePlaceholders: false

        // If your backend has demo image support, use this instead:
        // useDemoImages: true
      });

      setVideoUrl(videoRes.data.videoUrl);
      setNarrationText(videoRes.data.narrationText || "");
      setVoiceoverSegments(videoRes.data.voiceoverSegments || []);
      setScenes(videoRes.data.scenes || finalizeRes.data.scenes || []);
      setActionPlan(videoRes.data.actionPlan || finalizeRes.data.actionPlan || null);
      setSessionId(videoRes.data.sessionId || sessionId);
      
      setPhase("done");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
      setPhase("error");
    }
  }

  async function handleCustomizeVideo() {
  try {
    const cleanCustomInput = customInput.trim();

    if (!cleanCustomInput) {
      setError("Please enter what you want to customize.");
      return;
    }

    if (!sessionId) {
      setError("No session found. Please generate a video first.");
      return;
    }

    setPhase("loading");
    setError("");
    clearSpeech();

    await axios.post(`${API_BASE}/api/story/answer`, {
      sessionId,
      question: "Customize the video with one more topic",
      answer: cleanCustomInput
    });

    const finalizeRes = await axios.post(`${API_BASE}/api/story/finalize`, {
      sessionId
    });

    const videoRes = await axios.post(`${API_BASE}/api/generate-video`, {
      sessionId,
      usePlaceholders: false
    });

    setVideoUrl(videoRes.data.videoUrl);
    setNarrationText(videoRes.data.narrationText || "");
    setVoiceoverSegments(videoRes.data.voiceoverSegments || []);
    setScenes(videoRes.data.scenes || finalizeRes.data.scenes || []);
    setActionPlan(videoRes.data.actionPlan || finalizeRes.data.actionPlan || null);

    setCustomInput("");
    setCustomizing(false);
    setPhase("done");
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.error || err.message);
    setPhase("error");
  }
}

  function restart() {
    clearSpeech();

    setQuestionIndex(0);
    setInput("");
    setAnswers([]);
    setMessages([{ from: "bot", text: QUESTIONS[0] }]);
    setPhase("chat");
    setVideoUrl("");
    setNarrationText("");
    setVoiceoverSegments([]);
    setScenes([]);
    setActionPlan(null);
    setError("");
    setSessionId("");
setCustomizing(false);
setCustomInput("");
setAvailableVoices([]);
setSelectedVoiceName("");
  }

  const allQuestionsAnswered = answers.length >= QUESTIONS.length;

  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.logo}>Manifestation AI</h1>
            <p style={styles.subtitle}>
              Turn your health goals into a future-self story.
            </p>
          </div>

          <button onClick={restart} style={styles.smallButton}>
            New
          </button>
        </header>

        {phase === "chat" && (
          <>
            <div style={styles.progressWrap}>
              <div style={styles.progressText}>
                Question {Math.min(questionIndex + 1, QUESTIONS.length)} /{" "}
                {QUESTIONS.length}
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${(answers.length / QUESTIONS.length) * 100}%`
                  }}
                />
              </div>
            </div>

            <main style={styles.chatBox}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageRow,
                    justifyContent:
                      msg.from === "bot" ? "flex-start" : "flex-end"
                  }}
                >
                  <div
                    style={{
                      ...styles.message,
                      ...(msg.from === "bot"
                        ? styles.botMessage
                        : styles.userMessage)
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </main>

            {!allQuestionsAnswered && (
              <div style={styles.optionWrap}>
                {QUESTION_OPTIONS[questionIndex]?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    style={styles.optionButton}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {!allQuestionsAnswered && (
              <form onSubmit={handleSubmit} style={styles.form}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer..."
                  style={styles.input}
                />
                <button type="submit" style={styles.sendButton}>
                  Send
                </button>
              </form>
            )}

            {allQuestionsAnswered && (
              <div style={styles.generateBox}>
                <p style={styles.readyText}>
                  Your answers are ready. Generate your future-health video.
                </p>
                <button onClick={generateVideo} style={styles.mainButton}>
                  Generate My Video
                </button>
              </div>
            )}
          </>
        )}

        {phase === "loading" && (
          <div style={styles.centerBox}>
            <div style={styles.spinner} />
            <h2 style={styles.loadingTitle}>Creating your video...</h2>
            <p style={styles.loadingText}>
              Writing scenes, generating images, and stitching your story.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div style={styles.centerBox}>
            <h2 style={styles.errorTitle}>Something went wrong</h2>
            <p style={styles.errorText}>{error}</p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPhase("chat")} style={styles.smallButton}>
                Go back
              </button>
              <button onClick={restart} style={styles.mainButton}>
                Start over
              </button>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div style={styles.doneBox}>
            <div style={styles.doneHeader}>
              <div>
                <h2 style={styles.doneTitle}>Your future is ready</h2>
                <p style={styles.doneSubtitle}>
                  Press play to watch the video and hear the narration.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
  

  <button onClick={restart} style={styles.smallButton}>
    New story
  </button>
</div>
            </div>

            <div style={styles.videoWrap}>
              <video
                ref={videoRef}
                controls
                src={videoUrl}
                style={styles.video}
                onPlay={speakNarration}
                onPause={clearSpeech}
                onEnded={clearSpeech}
              />
            </div>

            <div style={styles.buttonRow}>
  <a href={videoUrl} download style={styles.downloadButton}>
    Download video
  </a>

  <button onClick={speakNarration} style={styles.smallButton}>
    Play narration
  </button>

  <button onClick={clearSpeech} style={styles.smallButton}>
    Stop narration
  </button>

  <select
    value={selectedVoiceName}
    onChange={(e) => setSelectedVoiceName(e.target.value)}
    style={styles.voiceSelect}
  >
    {availableVoices.map((voice) => (
      <option key={voice.name} value={voice.name}>
        {voice.name}
      </option>
    ))}
  </select>
</div>

{customizing && (
  <div style={styles.customizeBox}>
    <h3 style={styles.sectionTitle}>Customize your video</h3>
    <p style={styles.doneSubtitle}>
      Add one more habit, activity, or feeling you want included. We’ll rebuild
      the video with one extra scene.
    </p>

    <textarea
      value={customInput}
      onChange={(e) => setCustomInput(e.target.value)}
      placeholder="Example: Add a scene where I sleep on time and wake up refreshed."
      style={styles.customTextarea}
    />

    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
      <button onClick={handleCustomizeVideo} style={styles.mainButton}>
        Regenerate with this change
      </button>

      <button
        onClick={() => {
          setCustomizing(false);
          setCustomInput("");
        }}
        style={styles.smallButton}
      >
        Cancel
      </button>
    </div>
  </div>
)}

            {scenes.length > 0 && (
              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Story scenes</h3>

                <div style={styles.sceneGrid}>
                  {scenes.map((scene, index) => (
                    <div key={index} style={styles.sceneCard}>
                      <div style={styles.sceneNumber}>0{index + 1}</div>
                      <h4 style={styles.sceneTitle}>{scene.title}</h4>
                      <p style={styles.sceneCaption}>{scene.caption}</p>
                      <p style={styles.sceneVoiceover}>{scene.voiceover}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {actionPlan && (
              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Start today</h3>

                <div style={styles.actionGrid}>
                  <div style={styles.actionCard}>
                    <h4 style={styles.actionTitle}>Today</h4>
                    {(actionPlan.today || []).map((item, index) => (
                      <p key={index} style={styles.actionItem}>
                        {index + 1}. {item}
                      </p>
                    ))}
                  </div>

                  <div style={styles.actionCard}>
                    <h4 style={styles.actionTitle}>This week</h4>
                    {(actionPlan.thisWeek || []).map((item, index) => (
                      <p key={index} style={styles.actionItem}>
                        {index + 1}. {item}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(201,169,122,0.12), transparent 35%), #0d0b0f",
    color: "#e8ddd0",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    justifyContent: "center",
    padding: 20
  },

  app: {
    width: "100%",
    maxWidth: 920,
    minHeight: "calc(100vh - 40px)",
    border: "1px solid rgba(201,169,122,0.16)",
    borderRadius: 20,
    background: "rgba(255,255,255,0.025)",
    overflow: "hidden"
  },

  header: {
    padding: "22px 26px",
    borderBottom: "1px solid rgba(201,169,122,0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logo: {
    margin: 0,
    fontSize: 26,
    fontWeight: 400,
    letterSpacing: "0.04em",
    color: "#f3e6d4"
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "rgba(232,221,208,0.55)"
  },

  smallButton: {
    background: "transparent",
    border: "1px solid rgba(201,169,122,0.45)",
    color: "#c9a97a",
    borderRadius: 999,
    padding: "9px 15px",
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "none"
  },

  progressWrap: {
    padding: "16px 26px 0"
  },

  progressText: {
    fontSize: 12,
    color: "rgba(232,221,208,0.45)",
    marginBottom: 8
  },

  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    background: "rgba(201,169,122,0.1)",
    overflow: "hidden"
  },

  progressFill: {
    height: "100%",
    background: "#c9a97a",
    transition: "width 0.3s ease"
  },

  chatBox: {
    height: 410,
    overflowY: "auto",
    padding: 26,
    display: "flex",
    flexDirection: "column",
    gap: 14
  },

  messageRow: {
    display: "flex"
  },

  message: {
    maxWidth: "75%",
    padding: "13px 16px",
    borderRadius: 16,
    fontSize: 15,
    lineHeight: 1.5
  },

  botMessage: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,169,122,0.12)"
  },

  userMessage: {
    background: "rgba(201,169,122,0.16)",
    border: "1px solid rgba(201,169,122,0.25)"
  },

  optionWrap: {
    padding: "0 26px 14px",
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },

  optionButton: {
    background: "rgba(201,169,122,0.08)",
    border: "1px solid rgba(201,169,122,0.3)",
    color: "#c9a97a",
    borderRadius: 999,
    padding: "8px 13px",
    cursor: "pointer",
    fontSize: 13
  },

  form: {
    padding: "16px 26px 24px",
    borderTop: "1px solid rgba(201,169,122,0.1)",
    display: "flex",
    gap: 10
  },

  input: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,169,122,0.14)",
    color: "#e8ddd0",
    borderRadius: 12,
    padding: "13px 14px",
    outline: "none",
    fontSize: 15
  },

  sendButton: {
    background: "#c9a97a",
    border: "none",
    color: "#111",
    borderRadius: 12,
    padding: "0 18px",
    cursor: "pointer",
    fontWeight: 600
  },

  generateBox: {
    padding: 26,
    borderTop: "1px solid rgba(201,169,122,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16
  },

  readyText: {
    margin: 0,
    color: "rgba(232,221,208,0.65)"
  },

  mainButton: {
    background: "#c9a97a",
    border: "none",
    color: "#111",
    borderRadius: 999,
    padding: "12px 20px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14
  },

  centerBox: {
    minHeight: 520,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    textAlign: "center"
  },

  spinner: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "3px solid rgba(201,169,122,0.15)",
    borderTopColor: "#c9a97a",
    animation: "spin 1s linear infinite"
  },

  loadingTitle: {
    marginTop: 18,
    marginBottom: 6,
    fontWeight: 500
  },

  loadingText: {
    color: "rgba(232,221,208,0.55)"
  },

  errorTitle: {
    color: "#ff9b83"
  },

  errorText: {
    color: "rgba(255,180,160,0.8)",
    maxWidth: 560
  },

  doneBox: {
    padding: 26
  },

  doneHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 18
  },

  doneTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 500
  },

  doneSubtitle: {
    margin: "7px 0 0",
    color: "rgba(232,221,208,0.55)"
  },

  videoWrap: {
    background: "#050407",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(201,169,122,0.16)"
  },

  video: {
    width: "100%",
    display: "block"
  },

  buttonRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap"
  },

  downloadButton: {
    background: "#c9a97a",
    border: "none",
    color: "#111",
    borderRadius: 999,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none"
  },

  section: {
    marginTop: 24
  },

  sectionTitle: {
    margin: "0 0 12px",
    color: "#f0dfc4",
    fontWeight: 500
  },

  sceneGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12
  },

  sceneCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(201,169,122,0.12)",
    borderRadius: 14,
    padding: 15
  },

  sceneNumber: {
    color: "#c9a97a",
    fontSize: 12,
    marginBottom: 8
  },

  sceneTitle: {
    margin: "0 0 6px",
    fontSize: 16
  },

  sceneCaption: {
    margin: "0 0 9px",
    color: "#c9a97a",
    fontSize: 13
  },

  sceneVoiceover: {
    margin: 0,
    color: "rgba(232,221,208,0.65)",
    fontSize: 13,
    lineHeight: 1.5,
    fontStyle: "italic"
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12
  },

  actionCard: {
    background: "rgba(201,169,122,0.06)",
    border: "1px solid rgba(201,169,122,0.15)",
    borderRadius: 14,
    padding: 16
  },

  actionTitle: {
    margin: "0 0 10px",
    color: "#c9a97a"
  },

  actionItem: {
    margin: "7px 0",
    color: "rgba(232,221,208,0.72)",
    fontSize: 14,
    lineHeight: 1.45
  },
  voiceSelect: {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,169,122,0.25)",
  color: "#e8ddd0",
  borderRadius: 999,
  padding: "9px 14px",
  outline: "none",
  fontSize: 13
},

customizeBox: {
  marginTop: 22,
  padding: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(201,169,122,0.15)",
  borderRadius: 16
},

customTextarea: {
  width: "100%",
  minHeight: 90,
  marginTop: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,169,122,0.18)",
  color: "#e8ddd0",
  borderRadius: 12,
  padding: 14,
  outline: "none",
  resize: "vertical",
  fontSize: 14,
  fontFamily: "inherit"
}
};
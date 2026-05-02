import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const QUESTIONS = [
  "What area of your health are you focusing on — mental wellness, physical fitness, nutrition, sleep, or something else?",
  "Describe your ideal healthy self. What does your body feel like, and what are you now able to do?",
  "Walk me through a typical healthy day — your morning routine, how you move, what you eat.",
  "How has your mental and emotional wellbeing shifted? How do you feel in your mind and body?",
  "What's one thing you'd tell your current self about the health journey ahead?",
];

const LOADING_STEPS = [
  'Analyzing your vision...',
  'Generating scene 1...',
  'Generating scene 2...',
  'Generating scene 3...',
  'Generating scene 4...',
  'Generating scene 5...',
  'Adding voiceover...',
  'Stitching your video...',
];

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="#d4af37" strokeWidth="1.2" />
      <circle cx="14" cy="14" r="4" fill="#d4af37" opacity="0.9" />
      <line x1="14" y1="1" x2="14" y2="7" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="21" x2="14" y2="27" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="14" x2="7" y2="14" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="21" y1="14" x2="27" y2="14" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="4.5" x2="8.5" y2="8.5" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="19.5" y1="19.5" x2="23.5" y2="23.5" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="23.5" y1="4.5" x2="19.5" y2="8.5" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="8.5" y1="19.5" x2="4.5" y2="23.5" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState('chat'); // chat | thinking | ready | loading | done | error
  const [loadingStep, setLoadingStep] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setMessages([{ from: 'bot', text: QUESTIONS[0], id: Date.now() }]);
    }, 300);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (phase === 'chat') inputRef.current?.focus();
  }, [phase, messages]);

  function pushMessage(from, text) {
    setMessages(prev => [...prev, { from, text, id: Date.now() + Math.random() }]);
  }

  function handleSend(e) {
    e.preventDefault();
    const val = input.trim();
    if (!val || phase !== 'chat') return;

    pushMessage('user', val);
    setInput('');

    const newAnswers = [...answers, val];
    setAnswers(newAnswers);
    const next = questionIndex + 1;

    if (next < QUESTIONS.length) {
      setPhase('thinking');
      setQuestionIndex(next);
      setTimeout(() => {
        pushMessage('bot', QUESTIONS[next]);
        setPhase('chat');
      }, 700);
    } else {
      setPhase('thinking');
      setTimeout(() => {
        pushMessage('bot', "That's a powerful vision. I have everything I need to bring your health journey to life. Ready to generate your video?");
        setPhase('ready');
      }, 800);
    }
  }

  async function handleGenerate() {
    setPhase('loading');
    setLoadingStep(0);

    const prompt = QUESTIONS.map((q, i) => `${q}\n${answers[i]}`).join('\n\n');

    const timings = [0, 3000, 6000, 9000, 12000, 15000, 20000, 26000];
    const timers = timings.map((t, i) => setTimeout(() => setLoadingStep(i), t));

    try {
      const res = await axios.post('http://localhost:5000/api/generate', { prompt });
      timers.forEach(clearTimeout);
      setVideoUrl(res.data.videoUrl);
      setPhase('done');
    } catch (err) {
      timers.forEach(clearTimeout);
      setErrorMsg('Error: ' + (err.response?.data?.error || err.message));
      setPhase('error');
    }
  }

  function restart() {
    setMessages([]);
    setInput('');
    setQuestionIndex(0);
    setAnswers([]);
    setPhase('chat');
    setVideoUrl(null);
    setErrorMsg('');
    setLoadingStep(0);
    setTimeout(() => {
      setMessages([{ from: 'bot', text: QUESTIONS[0], id: Date.now() }]);
    }, 300);
  }

  const canSend = input.trim() && phase === 'chat';
  const progress = Math.min(answers.length, QUESTIONS.length);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #080808;
          font-family: 'Inter', sans-serif;
          color: #e0e0e0;
          height: 100vh;
          overflow: hidden;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 4px rgba(212,175,55,0.4); }
          50% { opacity: 1; box-shadow: 0 0 8px rgba(212,175,55,0.8); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 680px;
          margin: 0 auto;
        }

        .header {
          flex-shrink: 0;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #111;
        }
        .brand { display: flex; align-items: center; gap: 11px; }
        .brand-text { display: flex; flex-direction: column; gap: 1px; }
        .brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 600;
          color: #d4af37;
          letter-spacing: 0.3px;
          line-height: 1;
        }
        .brand-tag {
          font-size: 9px;
          color: #333;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .header-right { display: flex; align-items: center; gap: 14px; }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #d4af37;
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
        .new-btn {
          font-size: 11px; color: #333; background: none;
          border: 1px solid #1a1a1a; border-radius: 5px;
          padding: 5px 11px; cursor: pointer;
          letter-spacing: 0.5px; transition: all 0.2s;
        }
        .new-btn:hover { color: #777; border-color: #2e2e2e; }

        .progress-bar-wrap {
          flex-shrink: 0;
          padding: 10px 24px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .progress-track {
          flex: 1;
          height: 2px;
          background: #141414;
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #b8860b, #d4af37, #f0d060);
          border-radius: 2px;
          transition: width 0.5s ease;
          width: ${(progress / QUESTIONS.length) * 100}%;
        }
        .progress-label {
          font-size: 10px;
          color: #333;
          letter-spacing: 0.5px;
          white-space: nowrap;
          min-width: 40px;
          text-align: right;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px 10px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: #141414 transparent;
        }
        .messages::-webkit-scrollbar { width: 3px; }
        .messages::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 3px; }

        .bubble-row { display: flex; animation: fadeUp 0.22s ease both; }
        .bubble-row.bot  { justify-content: flex-start; }
        .bubble-row.user { justify-content: flex-end; }

        .bubble {
          max-width: 70%;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.65;
        }
        .bubble.bot {
          background: #111;
          border: 1px solid #1a1a1a;
          border-radius: 14px 14px 14px 3px;
          color: #b8b8b8;
        }
        .bubble.user {
          background: #120f00;
          border: 1px solid rgba(212,175,55,0.17);
          border-radius: 14px 14px 3px 14px;
          color: rgba(228,202,100,0.95);
        }

        .typing-row { display: flex; animation: fadeUp 0.2s ease both; }
        .typing-bubble {
          background: #111; border: 1px solid #1a1a1a;
          border-radius: 14px 14px 14px 3px;
          padding: 12px 15px;
          display: flex; gap: 5px; align-items: center;
        }
        .tdot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #d4af37;
          animation: dot-bounce 1.1s ease-in-out infinite;
        }
        .tdot:nth-child(2) { animation-delay: 0.16s; }
        .tdot:nth-child(3) { animation-delay: 0.32s; }

        .generate-wrap { padding: 8px 24px 10px; animation: fadeUp 0.3s ease both; }
        .generate-btn {
          width: 100%; padding: 14px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px; font-weight: 600;
          letter-spacing: 1px; color: #080808;
          background: linear-gradient(90deg, #c9a227, #ecd06a, #c9a227);
          background-size: 200% auto;
          border: none; border-radius: 8px; cursor: pointer;
          transition: background-position 0.5s, box-shadow 0.3s, transform 0.15s;
          animation: shimmer 3s linear infinite;
        }
        .generate-btn:hover {
          box-shadow: 0 0 32px rgba(212,175,55,0.4);
          transform: translateY(-1px);
        }

        .input-area {
          flex-shrink: 0;
          padding: 10px 24px 20px;
          border-top: 1px solid #0f0f0f;
        }
        .input-row {
          display: flex; align-items: center; gap: 8px;
          background: #0d0d0d; border: 1px solid #191919;
          border-radius: 11px; padding: 4px 4px 4px 15px;
          transition: border-color 0.2s;
        }
        .input-row:focus-within { border-color: rgba(212,175,55,0.25); }
        input[type="text"] {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 14px; font-family: 'Inter', sans-serif;
          color: #ddd; padding: 9px 0;
        }
        input::placeholder { color: #252525; }
        .send-btn {
          width: 34px; height: 34px; border-radius: 7px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s;
        }
        .send-btn:disabled { cursor: not-allowed; }

        .loading-panel {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px; gap: 30px;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 1.5px solid #181818;
          border-top: 1.5px solid #d4af37;
          border-radius: 50%;
          animation: spin 0.85s linear infinite;
        }
        .step-list { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 260px; }
        .step-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; transition: color 0.3s;
        }
        .step-item.done    { color: #2e2e2e; }
        .step-item.active  { color: #d4af37; }
        .step-item.pending { color: #1a1a1a; }
        .step-icon {
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; flex-shrink: 0;
        }
        .step-item.done    .step-icon { background: #111; color: #2e2e2e; border: 1px solid #1e1e1e; }
        .step-item.active  .step-icon { background: rgba(212,175,55,0.1); color: #d4af37; border: 1px solid rgba(212,175,55,0.4); box-shadow: 0 0 6px rgba(212,175,55,0.2); }
        .step-item.pending .step-icon { background: #0c0c0c; color: #1a1a1a; border: 1px solid #141414; }

        .video-panel { flex: 1; display: flex; flex-direction: column; padding: 24px; gap: 14px; overflow-y: auto; }
        .video-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(212,175,55,0.45); }
        video { width: 100%; border-radius: 8px; border: 1px solid #1a1a1a; background: #000; }
        .video-actions { display: flex; gap: 10px; }
        .btn-dl {
          flex: 1; padding: 11px; text-align: center;
          font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;
          color: rgba(212,175,55,0.75); text-decoration: none;
          border: 1px solid rgba(212,175,55,0.18); border-radius: 6px;
          background: rgba(212,175,55,0.03); transition: background 0.2s;
        }
        .btn-dl:hover { background: rgba(212,175,55,0.08); }
        .btn-over {
          flex: 1; padding: 11px; font-size: 11px; font-weight: 500;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #2e2e2e; background: transparent;
          border: 1px solid #161616; border-radius: 6px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-over:hover { color: #555; border-color: #2a2a2a; }

        .error-panel {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 40px; gap: 14px;
        }
        .error-msg {
          font-size: 13px; color: rgba(255,110,110,0.65);
          background: rgba(255,50,50,0.04); border: 1px solid rgba(255,50,50,0.1);
          border-radius: 7px; padding: 13px 18px; max-width: 380px; text-align: center;
        }
        .retry-btn {
          padding: 9px 22px; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
          color: #444; background: transparent; border: 1px solid #1e1e1e;
          border-radius: 6px; cursor: pointer; transition: all 0.2s;
        }
        .retry-btn:hover { color: #777; border-color: #2e2e2e; }
      `}</style>

      <div className="layout">

        <div className="header">
          <div className="brand">
            <Logo />
            <div className="brand-text">
              <div className="brand-name">Manifestation</div>
              <div className="brand-tag">Health Vision Generator</div>
            </div>
          </div>
          <div className="header-right">
            <div className="status-dot" />
            <button className="new-btn" onClick={restart}>New</button>
          </div>
        </div>

        {(phase === 'chat' || phase === 'thinking' || phase === 'ready') && (
          <div className="progress-bar-wrap">
            <div className="progress-track">
              <div className="progress-fill" />
            </div>
            <div className="progress-label">{progress} / {QUESTIONS.length}</div>
          </div>
        )}

        {(phase === 'chat' || phase === 'thinking' || phase === 'ready') && (
          <>
            <div className="messages">
              {messages.map(m => (
                <div key={m.id} className={`bubble-row ${m.from}`}>
                  <div className={`bubble ${m.from}`}>{m.text}</div>
                </div>
              ))}
              {phase === 'thinking' && (
                <div className="typing-row">
                  <div className="typing-bubble">
                    <div className="tdot" /><div className="tdot" /><div className="tdot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {phase === 'ready' && (
              <div className="generate-wrap">
                <button className="generate-btn" onClick={handleGenerate}>
                  Generate My 5-Scene Video
                </button>
              </div>
            )}

            {phase !== 'ready' && (
              <div className="input-area">
                <form className="input-row" onSubmit={handleSend}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Share your answer..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={phase === 'thinking'}
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!canSend}
                    style={{ background: canSend ? '#d4af37' : '#141414' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={canSend ? '#000' : '#252525'}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {phase === 'loading' && (
          <div className="loading-panel">
            <div className="spinner" />
            <div className="step-list">
              {LOADING_STEPS.map((s, i) => (
                <div key={i} className={`step-item ${i < loadingStep ? 'done' : i === loadingStep ? 'active' : 'pending'}`}>
                  <div className="step-icon">{i < loadingStep ? '✓' : i + 1}</div>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="video-panel">
            <div className="video-label">Your health vision video</div>
            <video controls src={videoUrl} />
            <div className="video-actions">
              <a href={videoUrl} download className="btn-dl">Download</a>
              <button className="btn-over" onClick={restart}>Start Over</button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="error-panel">
            <div className="error-msg">{errorMsg}</div>
            <button className="retry-btn" onClick={restart}>Try Again</button>
          </div>
        )}

      </div>
    </>
  );
}

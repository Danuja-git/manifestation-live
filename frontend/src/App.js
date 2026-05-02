import React, { useState, useEffect, useRef, Fragment } from 'react';
import axios from 'axios';

const QUESTIONS = [
  "What area of your health are you focusing on — mental wellness, physical fitness, nutrition, sleep, or something else?",
  "Describe your ideal healthy self. What does your body feel like, and what are you now able to do?",
  "Walk me through a typical healthy day — your morning routine, how you move, what you eat.",
  "How has your mental and emotional wellbeing shifted? How do you feel in your mind and body?",
  "What's one thing you'd tell your current self about the health journey ahead?",
];

const QUESTION_OPTIONS = [
  ['Mental wellness', 'Physical fitness', 'Nutrition & diet', 'Sleep & rest', 'Stress management'],
  ['Energized & strong every day', 'Flexible, lean & pain-free', 'Calm & clear-headed', 'At a healthy weight & confident', 'Running without effort'],
  ['Morning workout + clean eating', 'Yoga, smoothies & meditation', 'Gym, meal prep & solid sleep', 'Hiking & whole foods', 'Dancing & intuitive eating'],
  ['Confident & at peace with myself', 'Less anxious, more present', 'Motivated & clear-minded', 'Emotionally balanced & resilient', 'Proud & full of energy'],
  ['"It\'s worth every hard day"', '"Start small — consistency wins"', '"Your body is capable of amazing things"', '"Progress is not linear — keep going"', '"Be patient and kind to yourself"'],
];

const LOADING_STEPS = [
  'Writing your voiceover script...',
  'Generating scene 1...',
  'Generating scene 2...',
  'Generating scene 3...',
  'Generating scene 4...',
  'Generating scene 5...',
  'Creating your AI voiceover...',
  'Stitching your video...',
];

const BODIES = [
  {id:1,tag:'feminine', label:'Athletic',sk:'#C68B6A',ha:'#2C1810',to:'#7B9E87',bo:'#4A5568'},
  {id:2,tag:'feminine', label:'Curvy',   sk:'#8B5E3C',ha:'#1A0F0A',to:'#C9A97A',bo:'#6B4C3B'},
  {id:3,tag:'feminine', label:'Slim',    sk:'#F2D5C0',ha:'#8B4513',to:'#9B8DB8',bo:'#5B6FA6'},
  {id:4,tag:'feminine', label:'Plus',    sk:'#D4956A',ha:'#2C1810',to:'#C77B7B',bo:'#8B6260'},
  {id:5,tag:'masculine',label:'Athletic',sk:'#8B5E3C',ha:'#1A0F0A',to:'#4A5568',bo:'#2D3748'},
  {id:6,tag:'masculine',label:'Slim',    sk:'#C68B6A',ha:'#6B3A2A',to:'#7B9E87',bo:'#4A5568'},
  {id:7,tag:'masculine',label:'Stocky',  sk:'#F2D5C0',ha:'#2C1810',to:'#5B6FA6',bo:'#2D3748'},
  {id:8,tag:'masculine',label:'Plus',    sk:'#D4956A',ha:'#1A0F0A',to:'#8B7355',bo:'#4A3728'},
  {id:9,tag:'neutral',  label:'Slim',    sk:'#C68B6A',ha:'#4A3728',to:'#9B8DB8',bo:'#5B6FA6'},
  {id:10,tag:'neutral', label:'Athletic',sk:'#8B5E3C',ha:'#2C1810',to:'#7B9E87',bo:'#3D5A4A'},
  {id:11,tag:'neutral', label:'Curvy',   sk:'#F2D5C0',ha:'#8B4513',to:'#C9A97A',bo:'#8B7355'},
  {id:12,tag:'neutral', label:'Plus',    sk:'#D4956A',ha:'#1A0F0A',to:'#C77B7B',bo:'#6B4C3B'},
];

const PLACEHOLDER_SCENES = [
  {id:1,name:'Morning run',      desc:'Starting the day with movement',         voice:'"Every morning I choose to show up."',     color:'#1A2E24',accent:'#5DCAA5',loading:false},
  {id:2,name:'Meal prep Sunday', desc:'Cooking nourishing food for the week',   voice:'"I fuel my body with care."',              color:'#2A1E10',accent:'#EF9F27',loading:false},
  {id:3,name:'Yoga & stretch',   desc:'Finding calm in stillness',              voice:'"I breathe. I bend. I restore."',          color:'#1E1830',accent:'#AFA9EC',loading:false},
  {id:4,name:'Doctor check-in',  desc:'Celebrating progress with my care team', voice:'"My numbers tell a story of change."',     color:'#101E2A',accent:'#85B7EB',loading:false},
  {id:5,name:'Dance class',      desc:'Moving with joy — fitness as play',      voice:'"I move because it makes me feel alive."', color:'#2A1018',accent:'#ED93B1',loading:false},
];

const STEP_LABELS = ['Goals', 'Avatar', 'Scenes', 'Video'];

function BodyFig({ b, w=52, h=88 }) {
  const cx=w/2, f=b.tag==='feminine', m=b.tag==='masculine', sh=f?19:m?24:21, hw=f?20:m?19:19;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <ellipse cx={cx} cy={14} rx={10} ry={11} fill={b.sk}/>
      <rect x={cx-8} y={2} width={16} height={8} rx={4} fill={b.ha} opacity={0.9}/>
      <rect x={cx-sh/2} y={25} width={sh} height={m?32:28} rx={f?9:7} fill={b.to}/>
      <rect x={cx-hw} y={m?53:49} width={hw*2} height={m?36:34} rx={7} fill={b.bo}/>
      <rect x={cx-5} y={m?85:79} width={10} height={m?23:21} rx={5} fill={b.bo} opacity={0.9}/>
      <rect x={cx+2}  y={m?85:79} width={10} height={m?23:21} rx={5} fill={b.bo} opacity={0.9}/>
      <rect x={cx-sh/2-8} y={27} width={8} height={m?26:24} rx={4} fill={b.sk} opacity={0.85}/>
      <rect x={cx+sh/2}   y={27} width={8} height={m?26:24} rx={4} fill={b.sk} opacity={0.85}/>
    </svg>
  );
}

function SceneImg({ s }) {
  if (s.loading) return (
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
      <div style={{display:'flex',gap:4}}>
        {[0,1,2].map(i => <span key={i} style={{width:5,height:5,borderRadius:'50%',background:'#c9a97a',display:'inline-block',animation:`ldot 1.2s ${i*0.2}s infinite`}}/>)}
      </div>
      <div style={{fontSize:9,color:'#c9a97a',letterSpacing:'0.1em',textTransform:'uppercase'}}>Generating</div>
    </div>
  );
  return (
    <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
      <rect width={320} height={180} fill={s.color}/>
      <rect width={320} height={180} fill={s.accent} opacity={0.04}/>
      <ellipse cx={160} cy={210} rx={180} ry={60} fill="rgba(0,0,0,0.28)"/>
      <circle cx={80} cy={78} r={52} fill={s.accent} opacity={0.06}/>
      <circle cx={80} cy={78} r={34} fill={s.accent} opacity={0.09}/>
      <circle cx={80} cy={78} r={18} fill={s.accent} opacity={0.15}/>
      <rect x={152} y={34} width={148} height={108} rx={10} fill="rgba(255,255,255,0.04)" stroke={s.accent} strokeWidth={0.5} strokeOpacity={0.18}/>
      <rect x={162} y={44} width={128} height={72} rx={6} fill={s.accent} opacity={0.07}/>
      <rect x={162} y={126} width={80} height={4} rx={2} fill={s.accent} opacity={0.2}/>
      <rect x={162} y={126} width={52} height={4} rx={2} fill={s.accent} opacity={0.45}/>
      <text x={160} y={168} textAnchor="middle" fill={s.accent} opacity={0.1} fontSize={7} fontFamily="DM Sans,sans-serif" letterSpacing={2}>AI GENERATED</text>
    </svg>
  );
}

function SceneCard({ s, removed, swapping, onRemove, onRestore, onSwap }) {
  return (
    <div style={{borderRadius:12,border:`0.5px solid ${swapping?'#c9a97a':removed?'rgba(201,169,122,0.1)':'rgba(201,169,122,0.15)'}`,borderStyle:removed||swapping?'dashed':'solid',background:'rgba(255,255,255,0.03)',overflow:'hidden',opacity:removed?0.28:1,transition:'border-color 0.15s,opacity 0.2s'}}>
      <div style={{width:'100%',aspectRatio:'16/9',position:'relative',overflow:'hidden',background:'#141020'}}>
        <div style={{position:'absolute',top:8,left:8,fontSize:9,color:'#c9a97a',background:'rgba(13,11,15,0.65)',padding:'2px 7px',borderRadius:20,border:'0.5px solid rgba(201,169,122,0.3)',zIndex:2,letterSpacing:'0.08em'}}>0{s.id}</div>
        {!removed && (
          <div style={{position:'absolute',top:6,right:6,display:'flex',gap:4,zIndex:2}}>
            <div onClick={() => onSwap(s.id)} style={{width:24,height:24,borderRadius:'50%',border:'1px solid #c9a97a',background:'rgba(13,11,15,0.7)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <svg width={11} height={11} viewBox="0 0 11 11" fill="none" stroke="#c9a97a" strokeWidth={1.3} strokeLinecap="round"><path d="M1 3.5h7M6 1.5l2 2-2 2M10 7.5H3M5 5.5L3 7.5l2 2"/></svg>
            </div>
            <div onClick={() => onRemove(s.id)} style={{width:24,height:24,borderRadius:'50%',border:'1px solid #c9a97a',background:'rgba(13,11,15,0.7)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <svg width={11} height={11} viewBox="0 0 11 11" fill="none" stroke="#c9a97a" strokeWidth={1.3} strokeLinecap="round"><path d="M2 2l7 7M9 2L2 9"/></svg>
            </div>
          </div>
        )}
        <SceneImg s={s}/>
        {removed && (
          <div style={{position:'absolute',inset:0,background:'rgba(13,11,15,0.55)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:7,zIndex:4}}>
            <div style={{fontSize:10,color:'#c9a97a',letterSpacing:'0.08em',textTransform:'uppercase'}}>Removed</div>
            <div onClick={() => onRestore(s.id)} style={{fontSize:10,color:'#c9a97a',border:'1px solid #c9a97a',padding:'4px 11px',borderRadius:20,cursor:'pointer',background:'rgba(201,169,122,0.08)'}}>Restore</div>
          </div>
        )}
      </div>
      <div style={{padding:'10px 12px 12px'}}>
        <div style={{fontSize:12,color:'#e8ddd0',lineHeight:1.3}}>{s.name}</div>
        <div style={{fontSize:11,color:'rgba(232,221,208,0.4)',lineHeight:1.4,marginTop:2}}>{s.desc}</div>
        {!removed && !s.loading && (
          <div style={{fontSize:11,color:'#c9a97a',fontFamily:'Cormorant Garamond,serif',fontStyle:'italic',marginTop:5,borderTop:'0.5px solid rgba(201,169,122,0.12)',paddingTop:5,lineHeight:1.45}}>{s.voice}</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState('chat'); // chat | thinking | avatar | scenes | loading | done | error
  const [loadStep, setLoadStep] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [selfieUp, setSelfieUp] = useState(false);
  const [selBody, setSelBody] = useState(null);
  const [bodyFilter, setBodyFilter] = useState('all');
  const [scenes, setScenes] = useState(PLACEHOLDER_SCENES);
  const [removed, setRemoved] = useState(new Set());
  const [swapping, setSwapping] = useState(null);
  const [swapVal, setSwapVal] = useState('');
  const [playing, setPlaying] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const progressIv = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => { setTimeout(() => { setMessages([{from:'bot',text:QUESTIONS[0],id:Date.now()}]); }, 300); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);
  useEffect(() => { if (phase === 'chat') inputRef.current?.focus(); }, [phase, messages]);

  function handleFiles(files) {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setPhotos(prev => [...prev, { url: e.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(i) { setPhotos(prev => prev.filter((_, idx) => idx !== i)); }

  function push(from, text) { setMessages(p => [...p, {from, text, id: Date.now() + Math.random()}]); }

  function handleSend(e) {
    e.preventDefault();
    const v = input.trim();
    if (!v || phase !== 'chat') return;
    push('user', v); setInput('');
    const na = [...answers, v]; setAnswers(na);
    const next = qIdx + 1;
    if (next < QUESTIONS.length) {
      setPhase('thinking'); setQIdx(next);
      setTimeout(() => { push('bot', QUESTIONS[next]); setPhase('chat'); }, 700);
    } else {
      setPhase('thinking');
      setTimeout(() => {
        push('bot', "That's a powerful vision. I have everything I need to bring your health journey to life. Ready to build your avatar?");
        setPhase('ready');
      }, 800);
    }
  }

  function handleOptionClick(text) {
    if (phase !== 'chat') return;
    push('user', text);
    const na = [...answers, text]; setAnswers(na);
    const next = qIdx + 1;
    if (next < QUESTIONS.length) {
      setPhase('thinking'); setQIdx(next);
      setTimeout(() => { push('bot', QUESTIONS[next]); setPhase('chat'); }, 700);
    } else {
      setPhase('thinking');
      setTimeout(() => {
        push('bot', "That's a powerful vision. I have everything I need to bring your health journey to life. Ready to build your avatar?");
        setPhase('ready');
      }, 800);
    }
  }

  async function handleGenerate() {
    setPhase('loading'); setLoadStep(0);
    const prompt = QUESTIONS.map((q, i) => `${q}\n${answers[i]}`).join('\n\n');
    const keptScenes = scenes.filter(s => !removed.has(s.id)).map(s => s.name);
    const timings = [0, 2500, 5000, 7500, 10000, 13000, 17000, 22000];
    const timers = timings.map((t, i) => setTimeout(() => setLoadStep(i), t));
    try {
      const res = await axios.post('http://localhost:5000/api/generate', { prompt, scenes: keptScenes });
      timers.forEach(clearTimeout);
      setVideoUrl(res.data.videoUrl);
      setPhase('done');
    } catch (err) {
      timers.forEach(clearTimeout);
      setErrMsg('Error: ' + (err.response?.data?.error || err.message));
      setPhase('error');
    }
  }

  function restart() {
    setPhotos([]); setMessages([]); setInput(''); setQIdx(0); setAnswers([]);
    setPhase('chat'); setVideoUrl(null); setErrMsg(''); setLoadStep(0);
    setSelfieUp(false); setSelBody(null); setBodyFilter('all');
    setScenes(PLACEHOLDER_SCENES); setRemoved(new Set());
    setSwapping(null); setSwapVal(''); setPlaying(false); setVidProgress(0);
    clearInterval(progressIv.current);
    setTimeout(() => { setMessages([{from:'bot',text:QUESTIONS[0],id:Date.now()}]); }, 300);
  }

  function removeScene(id) { setRemoved(p => new Set([...p, id])); if (swapping === id) setSwapping(null); }
  function restoreScene(id) { setRemoved(p => { const n = new Set(p); n.delete(id); return n; }); }
  function startSwap(id) { setSwapping(p => p === id ? null : id); setSwapVal(''); }
  function submitSwap() {
    if (!swapVal.trim() || !swapping) return;
    const sid = swapping;
    setScenes(p => p.map(s => s.id === sid ? {...s, name:'Regenerating...', desc:swapVal, voice:'', loading:true} : s));
    setSwapping(null); setSwapVal('');
    setTimeout(() => setScenes(p => p.map(s => s.id === sid ? {...s, name:swapVal.slice(0,24), desc:'Your custom scene, generated by AI', voice:'"This is my journey, on my terms."', loading:false} : s)), 1800);
  }

  function togglePlay() {
    if (videoRef.current) { playing ? videoRef.current.pause() : videoRef.current.play(); setPlaying(!playing); return; }
    if (playing) { clearInterval(progressIv.current); setPlaying(false); }
    else {
      setPlaying(true);
      progressIv.current = setInterval(() => {
        setVidProgress(p => { if (p >= 100) { clearInterval(progressIv.current); setPlaying(false); return 100; } return p + 0.5; });
      }, 200);
    }
  }
  function scrub(e) { const r = e.currentTarget.getBoundingClientRect(); setVidProgress(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100))); }

  const chatProgress = Math.min(answers.length, QUESTIONS.length);
  const canSend = input.trim() && phase === 'chat';
  const filtBodies = bodyFilter === 'all' ? BODIES : BODIES.filter(b => b.tag === bodyFilter);
  const keptCount = scenes.filter(s => !removed.has(s.id)).length;
  const stepIdx = {chat:0,thinking:0,ready:0,avatar:1,scenes:2,loading:3,done:3,error:3}[phase] ?? 0;
  const secs = Math.round(vidProgress * 0.4);

  const btnGold = {background:'#c9a97a',color:'#1a1208',border:'none',padding:'12px 26px',borderRadius:40,fontFamily:'DM Sans,sans-serif',fontSize:13,letterSpacing:'0.05em',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8};
  const btnGoldDim = {...btnGold,background:'transparent',color:'rgba(201,169,122,0.35)',border:'1.5px solid rgba(201,169,122,0.2)',cursor:'not-allowed'};
  const btnGhost = {background:'transparent',color:'#c9a97a',border:'1.5px solid #c9a97a',padding:'11px 20px',borderRadius:40,fontFamily:'DM Sans,sans-serif',fontSize:12,cursor:'pointer'};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { background: #0d0b0f; font-family: 'DM Sans', sans-serif; color: #e8ddd0; overflow: hidden; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes ldot   { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        @keyframes glow   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes typing { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
        input[type=text]{flex:1;background:transparent;border:none;outline:none;font-size:14px;font-family:'DM Sans',sans-serif;color:#e8ddd0;padding:9px 0;}
        input::placeholder{color:rgba(232,221,208,0.2);}
        input[type=text]:disabled{color:rgba(232,221,208,0.3);}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:rgba(201,169,122,0.2);border-radius:2px;}
      `}</style>

      <div style={{display:'flex',flexDirection:'column',height:'100vh',maxWidth:820,margin:'0 auto'}}>

        {/* NAV */}
        <div style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',height:64,borderBottom:'0.5px solid rgba(201,169,122,0.12)'}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:300,letterSpacing:'0.06em'}}>
            Manifestation<em style={{fontStyle:'italic',color:'#c9a97a'}}> AI</em>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#c9a97a',animation:'glow 2.5s ease-in-out infinite'}}/>
            <button onClick={restart} style={{fontSize:11,color:'#c9a97a',background:'transparent',border:'1px solid rgba(201,169,122,0.3)',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>New</button>
          </div>
        </div>

        {/* STEP BAR */}
        <div style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 28px',borderBottom:'0.5px solid rgba(201,169,122,0.08)'}}>
          {STEP_LABELS.map((lbl, i) => (
            <Fragment key={lbl}>
              {i > 0 && <div style={{width:20,height:0.5,background:'rgba(201,169,122,0.12)'}}/>}
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:i<stepIdx?'rgba(201,169,122,0.45)':i===stepIdx?'#c9a97a':'rgba(232,221,208,0.25)'}}>
                <div style={{width:18,height:18,borderRadius:'50%',border:`0.5px solid ${i<=stepIdx?'rgba(201,169,122,0.4)':'rgba(201,169,122,0.15)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,background:i===stepIdx?'rgba(201,169,122,0.15)':i<stepIdx?'rgba(201,169,122,0.1)':'transparent',color:i<=stepIdx?'#c9a97a':'rgba(232,221,208,0.25)'}}>{i < stepIdx ? '✓' : i+1}</div>
                <span>{lbl}</span>
              </div>
            </Fragment>
          ))}
        </div>

        {/* CHAT */}
        {(phase === 'chat' || phase === 'thinking' || phase === 'ready') && (
          <>
            <div style={{flexShrink:0,display:'flex',alignItems:'center',gap:12,padding:'10px 28px'}}>
              <div style={{flex:1,height:2,background:'rgba(201,169,122,0.08)',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',background:'#c9a97a',borderRadius:2,width:`${(chatProgress/QUESTIONS.length)*100}%`,transition:'width 0.4s ease'}}/>
              </div>
              <div style={{fontSize:10,color:'rgba(201,169,122,0.4)',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>{chatProgress} / {QUESTIONS.length}</div>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'20px 28px',display:'flex',flexDirection:'column',gap:12}}>
              {messages.map(m => (
                <div key={m.id} style={{display:'flex',justifyContent:m.from==='bot'?'flex-start':'flex-end',animation:'fadeUp 0.25s ease'}}>
                  <div style={{maxWidth:'72%',padding:'12px 16px',borderRadius:m.from==='bot'?'4px 14px 14px 14px':'14px 4px 14px 14px',fontSize:14,lineHeight:1.6,background:m.from==='bot'?'rgba(255,255,255,0.04)':'rgba(201,169,122,0.12)',border:`0.5px solid ${m.from==='bot'?'rgba(201,169,122,0.15)':'rgba(201,169,122,0.25)'}`,color:'#e8ddd0'}}>{m.text}</div>
                </div>
              ))}
              {phase === 'thinking' && (
                <div style={{display:'flex'}}>
                  <div style={{padding:'14px 18px',background:'rgba(255,255,255,0.04)',border:'0.5px solid rgba(201,169,122,0.12)',borderRadius:'4px 14px 14px 14px',display:'flex',gap:5,alignItems:'center'}}>
                    {[0,1,2].map(i => <div key={i} style={{width:5,height:5,borderRadius:'50%',background:'#c9a97a',animation:`typing 1.2s ${i*0.2}s ease-in-out infinite`}}/>)}
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {phase === 'chat' && qIdx < QUESTION_OPTIONS.length && (
              <div style={{flexShrink:0,padding:'0 28px 10px',display:'flex',gap:7,flexWrap:'wrap',animation:'fadeUp 0.25s ease'}}>
                {QUESTION_OPTIONS[qIdx].map(opt => (
                  <button key={opt} onClick={() => handleOptionClick(opt)} style={{background:'rgba(201,169,122,0.08)',border:'0.5px solid rgba(201,169,122,0.28)',borderRadius:20,padding:'7px 14px',fontSize:12,color:'#c9a97a',cursor:'pointer',fontFamily:'DM Sans,sans-serif',letterSpacing:'0.02em',transition:'all 0.15s',whiteSpace:'nowrap'}}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(201,169,122,0.18)'; e.currentTarget.style.borderColor='rgba(201,169,122,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(201,169,122,0.08)'; e.currentTarget.style.borderColor='rgba(201,169,122,0.28)'; }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {phase === 'ready' && (
              <div style={{flexShrink:0,padding:'14px 28px 18px'}}>
                <button style={{...btnGold,width:'100%',justifyContent:'center'}} onClick={() => setPhase('avatar')}>
                  Build my avatar →
                </button>
              </div>
            )}

            {phase !== 'ready' && (
              <>
                {/* photo strip */}
                {photos.length > 0 && (
                  <div style={{padding:'8px 28px 0',display:'flex',gap:7,flexWrap:'wrap'}}>
                    {photos.map((p, i) => (
                      <div key={i} style={{position:'relative',width:52,height:52,flexShrink:0,animation:'fadeUp 0.2s ease both'}}>
                        <img src={p.url} alt="" style={{width:52,height:52,objectFit:'cover',borderRadius:7,border:'1px solid rgba(201,169,122,0.2)'}}/>
                        <button onClick={() => removePhoto(i)} style={{position:'absolute',top:-5,right:-5,width:16,height:16,borderRadius:'50%',background:'#1a1a1a',border:'1px solid #2e2e2e',color:'#777',fontSize:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* input */}
                <div style={{flexShrink:0,padding:'10px 28px 20px',borderTop:'0.5px solid rgba(201,169,122,0.08)'}}>
                  <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e => handleFiles(e.target.files)}/>
                  <form onSubmit={handleSend} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(201,169,122,0.15)',borderRadius:12,padding:'4px 4px 4px 8px'}}>
                    <button type="button" onClick={() => fileRef.current.click()} style={{width:32,height:32,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:photos.length>0?'#c9a97a':'rgba(201,169,122,0.25)',flexShrink:0,transition:'color 0.2s'}}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>
                    <input ref={inputRef} type="text" placeholder="Share your answer..." value={input} onChange={e => setInput(e.target.value)} disabled={phase === 'thinking'}/>
                    <button type="submit" disabled={!canSend} style={{width:34,height:34,borderRadius:8,border:'none',cursor:canSend?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:canSend?'#c9a97a':'rgba(201,169,122,0.08)',transition:'all 0.2s'}}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={canSend?'#0d0b0f':'rgba(201,169,122,0.3)'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <line x1={22} y1={2} x2={11} y2={13}/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </>
        )}

        {/* AVATAR */}
        {phase === 'avatar' && (
          <div style={{display:'grid',gridTemplateColumns:'200px 1fr',flex:1,overflow:'hidden'}}>
            <div style={{borderRight:'0.5px solid rgba(201,169,122,0.1)',padding:'22px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:16,overflowY:'auto'}}>
              <div style={{fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(201,169,122,0.5)',alignSelf:'flex-start'}}>Preview</div>
              <div style={{width:148,height:220,borderRadius:14,border:'0.5px solid rgba(201,169,122,0.18)',background:'rgba(255,255,255,0.03)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',width:48,height:48,borderRadius:'50%',border:'2px solid #0d0b0f',background:selfieUp?'rgba(201,169,122,0.3)':'rgba(201,169,122,0.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,zIndex:2}}>
                  {photos.length > 0 ? <img src={photos[0].url} alt="" style={{width:48,height:48,borderRadius:'50%',objectFit:'cover'}}/> : selfieUp ? '😊' : '?'}
                </div>
                {selBody ? <BodyFig b={selBody} w={120} h={200}/> : <div style={{fontSize:10,color:'rgba(201,169,122,0.25)',textAlign:'center',paddingTop:60}}>select body</div>}
              </div>
              <div onClick={() => fileRef.current.click()} style={{width:'100%',border:'0.5px dashed rgba(201,169,122,0.25)',borderRadius:10,padding:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer',background:'rgba(201,169,122,0.03)'}}>
                <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e => { handleFiles(e.target.files); setSelfieUp(true); }}/>
                <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(201,169,122,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="#c9a97a" strokeWidth={1.2}><circle cx={8} cy={6} r={3}/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6"/></svg>
                </div>
                <div>
                  <div style={{fontSize:12,color:selfieUp||photos.length>0?'#c9a97a':'#e8ddd0'}}>{selfieUp||photos.length>0?'Photo added ✓':'Upload selfie'}</div>
                  <div style={{fontSize:10,color:'rgba(201,169,122,0.45)'}}>{selfieUp||photos.length>0?"Face cartoonized — ready":"We'll cartoonize your face"}</div>
                </div>
              </div>
              <div style={{width:'100%',padding:'10px 12px',background:'rgba(201,169,122,0.04)',borderRadius:9,border:'0.5px solid rgba(201,169,122,0.12)'}}>
                <div style={{fontSize:10,color:'#c9a97a',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>How it works</div>
                <div style={{fontSize:11,color:'rgba(232,221,208,0.32)',lineHeight:1.55}}>Your face gets cartoonized and placed on your chosen body throughout your video.</div>
              </div>
            </div>

            <div style={{padding:'22px 24px',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300}}>Choose your <em style={{fontStyle:'italic',color:'#c9a97a'}}>body</em></div>
              <div style={{fontSize:12,color:'rgba(232,221,208,0.38)',marginTop:4}}>Pick the one that feels most like you.</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',margin:'12px 0'}}>
                {['all','feminine','masculine','neutral'].map(f => (
                  <button key={f} onClick={() => setBodyFilter(f)} style={{padding:'5px 13px',borderRadius:40,border:`0.5px solid ${bodyFilter===f?'#c9a97a':'rgba(201,169,122,0.2)'}`,fontSize:11,color:bodyFilter===f?'#1a1208':'#c9a97a',cursor:'pointer',background:bodyFilter===f?'#c9a97a':'transparent',fontFamily:'DM Sans,sans-serif'}}>
                    {f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,overflowY:'auto',flex:1,alignContent:'start'}}>
                {filtBodies.map(b => (
                  <div key={b.id} onClick={() => setSelBody(b)} style={{borderRadius:10,border:`0.5px solid ${selBody?.id===b.id?'#c9a97a':'rgba(201,169,122,0.15)'}`,background:selBody?.id===b.id?'rgba(201,169,122,0.07)':'rgba(255,255,255,0.03)',padding:'9px 5px',display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:'pointer'}}>
                    <BodyFig b={b} w={46} h={82}/>
                    <div style={{fontSize:10,color:'#c9a97a',textAlign:'center'}}>{b.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:14,borderTop:'0.5px solid rgba(201,169,122,0.1)',marginTop:14}}>
                <div style={{fontSize:11,color:'#c9a97a',fontFamily:'Cormorant Garamond,serif',fontStyle:'italic'}}>{selBody?'Looking good — ready to continue':'Select a body to continue'}</div>
                <button style={selBody?btnGold:btnGoldDim} onClick={() => selBody && setPhase('scenes')}>Continue →</button>
              </div>
            </div>
          </div>
        )}

        {/* SCENES */}
        {phase === 'scenes' && (
          <div style={{flex:1,overflowY:'auto',padding:'18px 28px',display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
              <div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300}}>Your <em style={{fontStyle:'italic',color:'#c9a97a'}}>journey,</em> scene by scene</div>
                <div style={{fontSize:12,color:'rgba(232,221,208,0.38)',marginTop:4}}>Keep what resonates. Swap or remove anything that doesn't feel like you.</div>
              </div>
              <div style={{fontSize:11,color:'#c9a97a',letterSpacing:'0.06em',whiteSpace:'nowrap'}}>{keptCount} of {scenes.length} kept</div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {scenes.slice(0,3).map(s => <SceneCard key={s.id} s={s} removed={removed.has(s.id)} swapping={swapping===s.id} onRemove={removeScene} onRestore={restoreScene} onSwap={startSwap}/>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {scenes.slice(3).map(s => <SceneCard key={s.id} s={s} removed={removed.has(s.id)} swapping={swapping===s.id} onRemove={removeScene} onRestore={restoreScene} onSwap={startSwap}/>)}
            </div>

            {swapping && (
              <div style={{background:'rgba(201,169,122,0.04)',border:'1px solid rgba(201,169,122,0.22)',borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'#c9a97a',marginBottom:8}}>Replace scene {swapping}</div>
                <div style={{display:'flex',gap:7}}>
                  <input style={{flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(201,169,122,0.25)',borderRadius:7,padding:'9px 12px',fontFamily:'DM Sans,sans-serif',fontSize:12,color:'#e8ddd0',outline:'none'}} placeholder="e.g. 'swimming laps at sunrise'" value={swapVal} onChange={e => setSwapVal(e.target.value)}/>
                  <button onClick={submitSwap} style={{background:'rgba(201,169,122,0.15)',border:'1px solid #c9a97a',borderRadius:7,padding:'9px 14px',fontSize:11,color:'#c9a97a',cursor:'pointer',fontFamily:'DM Sans,sans-serif',whiteSpace:'nowrap'}}>Regenerate</button>
                </div>
              </div>
            )}

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:14,borderTop:'0.5px solid rgba(201,169,122,0.1)'}}>
              <div style={{fontSize:11,color:keptCount<3?'#e07050':'#c9a97a',fontFamily:'Cormorant Garamond,serif',fontStyle:'italic'}}>
                {keptCount < 3 ? `Need ${3-keptCount} more scene${3-keptCount!==1?'s':''}` : `${keptCount} scenes · ~${keptCount*8}s of video`}
              </div>
              <button style={keptCount>=3?btnGold:btnGoldDim} onClick={() => keptCount >= 3 && handleGenerate()}>Generate my video →</button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,gap:28}}>
            <div style={{width:40,height:40,border:'1.5px solid rgba(201,169,122,0.15)',borderTop:'1.5px solid #c9a97a',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
            <div style={{textAlign:'center'}}>
              <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300}}>Creating your <em style={{fontStyle:'italic',color:'#c9a97a'}}>video</em></div>
              <div style={{fontSize:13,color:'#c9a97a',marginTop:6,fontFamily:'Cormorant Garamond,serif',fontStyle:'italic'}}>This takes about 30 seconds</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%',maxWidth:280}}>
              {LOADING_STEPS.map((s, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:i<loadStep?'rgba(201,169,122,0.3)':i===loadStep?'#c9a97a':'rgba(232,221,208,0.12)'}}>
                  <div style={{width:20,height:20,borderRadius:'50%',border:`1px solid ${i<=loadStep?'rgba(201,169,122,0.4)':'rgba(201,169,122,0.12)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#c9a97a',flexShrink:0,background:i<loadStep?'rgba(201,169,122,0.08)':i===loadStep?'rgba(201,169,122,0.12)':'transparent'}}>
                    {i < loadStep ? '✓' : i === loadStep ? <span style={{display:'flex',gap:2}}>{[0,1].map(j => <span key={j} style={{width:3,height:3,borderRadius:'50%',background:'#c9a97a',animation:`ldot 1.2s ${j*0.3}s infinite`}}/>)}</span> : i+1}
                  </div>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'24px 28px',gap:14,overflowY:'auto'}}>
            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300}}>Your future is <em style={{fontStyle:'italic',color:'#c9a97a'}}>ready</em></div>
            <div style={{fontSize:12,color:'rgba(232,221,208,0.38)'}}>Watch yourself arrive. Share it when you need a reminder of where you're going.</div>

            <div style={{background:'#0a0810',borderRadius:14,overflow:'hidden',border:'0.5px solid rgba(201,169,122,0.18)'}}>
              {videoUrl ? (
                <video ref={videoRef} controls src={videoUrl} style={{width:'100%',borderRadius:0,display:'block'}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>
              ) : (
                <>
                  <div onClick={togglePlay} style={{width:'100%',aspectRatio:'16/9',background:'#080610',position:'relative',cursor:'pointer',overflow:'hidden'}}>
                    <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
                      <rect width={400} height={225} fill="#0f0c1a"/><rect width={400} height={225} fill="#1D9E75" opacity={0.07}/>
                      <circle cx={200} cy={95} r={70} fill="#1D9E75" opacity={0.06}/>
                      <circle cx={200} cy={95} r={48} fill="#1D9E75" opacity={0.09}/>
                      <circle cx={200} cy={95} r={28} fill="#1D9E75" opacity={0.15}/>
                      <text x={200} y={185} textAnchor="middle" fill="#5DCAA5" opacity={0.12} fontSize={8} fontFamily="DM Sans,sans-serif" letterSpacing={2}>YOUR MANIFESTATION AI VIDEO</text>
                    </svg>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}>
                      <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(201,169,122,0.18)',border:'1.5px solid #c9a97a',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {playing
                          ? <div style={{display:'flex',gap:4}}><div style={{width:3,height:14,background:'#c9a97a',borderRadius:1}}/><div style={{width:3,height:14,background:'#c9a97a',borderRadius:1}}/></div>
                          : <div style={{width:0,height:0,borderStyle:'solid',borderWidth:'11px 0 11px 20px',borderColor:'transparent transparent transparent #c9a97a',marginLeft:5}}/>
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:9}}>
                    <div onClick={scrub} style={{width:'100%',height:3,background:'rgba(201,169,122,0.12)',borderRadius:2,cursor:'pointer'}}>
                      <div style={{height:'100%',width:`${vidProgress}%`,background:'#c9a97a',borderRadius:2,transition:'width 0.2s'}}/>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:11,color:'#c9a97a',fontFamily:'monospace'}}>0:{String(secs).padStart(2,'0')} / 0:40</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{display:'flex',gap:8}}>
              {videoUrl
                ? <a href={videoUrl} download style={{...btnGold,flex:1,justifyContent:'center',textDecoration:'none'}}>Download video</a>
                : <button style={{...btnGold,flex:1,justifyContent:'center'}}>Download video</button>
              }
              <button style={btnGhost} onClick={restart}>Make another</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {['Instagram','Copy link','Camera roll','Share'].map(lbl => (
                <div key={lbl} style={{border:'1px solid rgba(201,169,122,0.25)',background:'rgba(255,255,255,0.04)',borderRadius:9,padding:'9px 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#c9a97a',cursor:'pointer',gap:6}}>{lbl}</div>
              ))}
            </div>

            <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:13,fontStyle:'italic',color:'rgba(232,221,208,0.25)',paddingTop:14,borderTop:'0.5px solid rgba(201,169,122,0.1)',lineHeight:1.6}}>
              "I watched it every morning when I wanted to give up."
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,gap:14}}>
            <div style={{fontSize:13,color:'rgba(255,110,110,0.7)',background:'rgba(255,50,50,0.04)',border:'1px solid rgba(255,50,50,0.1)',borderRadius:8,padding:'14px 18px',maxWidth:380,textAlign:'center'}}>{errMsg}</div>
            <button style={btnGhost} onClick={restart}>Try again</button>
          </div>
        )}

      </div>
    </>
  );
}

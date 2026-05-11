import { useState } from "react";

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Gradient animation ── */
  @keyframes gradientPulse {
    0%   { opacity: 1; }
    50%  { opacity: 0.82; }
    100% { opacity: 1; }
  }

  @keyframes blob1 {
    0%,100% { transform: translate(0px, 0px) scale(1); }
    33%      { transform: translate(18px, -24px) scale(1.08); }
    66%      { transform: translate(-14px, 18px) scale(0.94); }
  }
  @keyframes blob2 {
    0%,100% { transform: translate(0px, 0px) scale(1); }
    40%      { transform: translate(-22px, 30px) scale(1.1); }
    75%      { transform: translate(26px, -16px) scale(0.91); }
  }
  @keyframes blob3 {
    0%,100% { transform: translate(0px, 0px) scale(1); }
    30%      { transform: translate(30px, 14px) scale(1.06); }
    70%      { transform: translate(-10px, -28px) scale(1.12); }
  }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideMenu {
    from { transform:translateX(-100%); }
    to   { transform:translateX(0); }
  }

  .root {
    position: relative;
    width: 100%;
    min-height: 100dvh;
    max-width: 430px;
    margin: 0 auto;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* ── BACKGROUND ── */
  /* Layer 1: base gradient — dark top → vivid blue → purple → hot pink bottom */
  .bg-gradient {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: linear-gradient(
      to bottom,
      #09090e  0%,
      #0a0a10  6%,
      #0b0b14  12%,
      #0d0d1a  18%,
      #0f1020  24%,
      #111228  30%,
      #121428  36%,
      #141830  42%,
      #161c38  48%,
      #1a2248  54%,
      #202c5c  59%,
      #2a3878  63%,
      #364490  67%,
      #3e4ea0  71%,
      #4050a8  74%,
      #4a52a8  77%,
      #6050a0  80%,
      #803090  83%,
      #a02878  86%,
      #c02264  89%,
      #d82858  92%,
      #e83050  95%,
      #f04060  98%,
      #f54868  100%
    );
  }

  /* Layer 2: radial pink/warm glow at very bottom */
  .bg-bottom-glow {
    position: absolute;
    bottom: -60px;
    left: 50%;
    transform: translateX(-50%);
    width: 140%;
    height: 45%;
    z-index: 1;
    background: radial-gradient(
      ellipse at 50% 100%,
      rgba(240, 60, 100, 0.55) 0%,
      rgba(180, 30, 100, 0.3)  35%,
      transparent 70%
    );
    animation: gradientPulse 6s ease-in-out infinite;
  }

  /* Layer 3: moving blue blob (mid-left) */
  .bg-blob-blue {
    position: absolute;
    width: 320px; height: 320px;
    border-radius: 50%;
    z-index: 1;
    left: -60px;
    top: 52%;
    background: radial-gradient(circle, rgba(50, 70, 200, 0.45) 0%, transparent 70%);
    filter: blur(55px);
    animation: blob1 11s ease-in-out infinite;
  }

  /* Layer 4: blue-right blob */
  .bg-blob-blue2 {
    position: absolute;
    width: 260px; height: 260px;
    border-radius: 50%;
    z-index: 1;
    right: -40px;
    top: 58%;
    background: radial-gradient(circle, rgba(80, 100, 210, 0.38) 0%, transparent 70%);
    filter: blur(50px);
    animation: blob2 13s ease-in-out infinite;
  }

  /* Layer 5: purple blob */
  .bg-blob-purple {
    position: absolute;
    width: 240px; height: 240px;
    border-radius: 50%;
    z-index: 1;
    left: 20%;
    top: 68%;
    background: radial-gradient(circle, rgba(130, 30, 160, 0.4) 0%, transparent 70%);
    filter: blur(50px);
    animation: blob3 9s ease-in-out infinite;
  }

  /* Layer 6: pink blob bottom */
  .bg-blob-pink {
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    z-index: 1;
    left: 10%;
    bottom: 0;
    background: radial-gradient(circle, rgba(220, 40, 90, 0.4) 0%, transparent 68%);
    filter: blur(55px);
    animation: blob1 14s ease-in-out infinite reverse;
    animation-delay: -3s;
  }

  /* ── UI CONTENT ── */
  .content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 100dvh;
  }

  /* Status bar */
  .statusbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 24px 2px;
  }
  .status-time {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }
  .status-right {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  /* Browser chrome */
  .browser {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 4px 11px 10px;
  }
  .b-btn {
    background: none; border: none; cursor: pointer;
    color: #fff; padding: 5px;
    display: flex; align-items: center; justify-content: center;
    opacity: 0.9;
  }
  .urlbar {
    flex: 1;
    background: rgba(255,255,255,0.13);
    border-radius: 10px;
    padding: 7px 11px;
    display: flex; align-items: center; gap: 6px;
    border: 0.5px solid rgba(255,255,255,0.06);
  }
  .urlbar span { color: rgba(255,255,255,0.88); font-size: 14px; }
  .ddbtn {
    background: none;
    border: 1.5px solid rgba(255,255,255,0.3);
    border-radius: 6px;
    color: #fff; font-size: 12px; font-weight: 600;
    padding: 3px 7px; cursor: pointer; font-family: inherit;
  }

  /* Nav */
  .topnav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px 0;
    animation: fadeUp 0.5s ease both 0.05s;
  }
  .hambtn {
    width: 46px; height: 46px; border-radius: 50%;
    background: rgba(255,255,255,0.09);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 5.5px; cursor: pointer;
  }
  .hl { width: 19px; height: 1.8px; background: #fff; border-radius: 2px; }
  .hl3 { width: 12px; align-self: flex-start; margin-left: 13px; }
  .logorow { display: flex; align-items: center; gap: 9px; }
  .logoname { color: #fff; font-size: 21px; font-weight: 700; letter-spacing: -0.4px; }
  .spacer { width: 46px; }

  /* Body */
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 18px 36px;
  }

  /* Connector pill */
  .pill {
    background: rgba(6,6,10,0.78);
    border-radius: 50px;
    padding: 9px 16px 9px 9px;
    display: flex; align-items: center; gap: 12px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(20px);
    margin-bottom: 22px;
    animation: fadeUp 0.5s ease both 0.18s;
  }
  .iconstack { display: flex; align-items: center; }
  .iconstack > * + * { margin-left: -9px; }
  .ic {
    width: 32px; height: 32px; border-radius: 50%;
    border: 2px solid #06060a;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 15px;
  }
  .ic-fire { background: #1a1a1a; }
  .ic-tg   { background: #229ED9; }
  .ic-pause { background: #222; border-color: #3a3a3a; }
  .pill-label { flex: 1; color: #fff; font-size: 14px; font-weight: 600; line-height: 1.35; }
  .pill-arrow { color: rgba(255,255,255,0.55); font-size: 17px; }

  /* Heading */
  .heading {
    color: #fff;
    font-size: 23px; font-weight: 700;
    text-align: center;
    letter-spacing: -0.4px;
    line-height: 1.3;
    margin-bottom: 20px;
    animation: fadeUp 0.5s ease both 0.28s;
  }

  /* Input card */
  .card {
    background: rgba(18,18,24,0.86);
    border-radius: 18px;
    padding: 14px 14px 10px;
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(22px);
    box-shadow: 0 14px 48px rgba(0,0,0,0.5);
    animation: fadeUp 0.5s ease both 0.36s;
  }
  .inp {
    width: 100%; background: none; border: none; outline: none;
    color: rgba(255,255,255,0.38);
    font-size: 15px; font-family: inherit;
    resize: none; line-height: 1.5; min-height: 42px;
    caret-color: rgba(255,255,255,0.7);
  }
  .inp::placeholder { color: rgba(255,255,255,0.35); }
  .toolbar {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }
  .tbbtn {
    background: none; border: none; cursor: pointer;
    padding: 3px; display: flex; align-items: center;
  }
  .buildbtn {
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 3px;
    color: rgba(255,255,255,0.72); font-size: 15px;
    font-weight: 600; font-family: inherit;
  }
  .tbright { display: flex; align-items: center; gap: 8px; }
  .sendbtn {
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.16);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .sendbtn:active { background: rgba(255,255,255,0.28); }

  /* Home indicator */
  .homebar {
    display: flex; justify-content: center;
    padding-bottom: 10px; position: relative; z-index: 10;
  }
  .hb {
    width: 128px; height: 5px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
  }

  /* Menu */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 200; display: flex;
  }
  .drawer {
    width: 72%; max-width: 280px; height: 100%;
    background: #0d0d12;
    border-right: 1px solid rgba(255,255,255,0.06);
    padding: 66px 22px 36px;
    display: flex; flex-direction: column; gap: 2px;
    animation: slideMenu 0.26s cubic-bezier(0.25,0.46,0.45,0.94) both;
  }
  .dlogo { display: flex; align-items: center; gap: 9px; margin-bottom: 32px; }
  .dlogo span { color: #fff; font-size: 19px; font-weight: 700; }
  .ditem {
    background: none; border: none;
    color: rgba(255,255,255,0.75);
    font-size: 17px; font-weight: 500;
    font-family: inherit; text-align: left;
    padding: 14px 2px; cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
`;

/* ── SVG icons ── */
const Heart = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 30" fill="none">
    <defs>
      <linearGradient id="hg" x1="0" y1="0" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%"  stopColor="#FF6600"/>
        <stop offset="42%" stopColor="#DD1875"/>
        <stop offset="100%" stopColor="#7020C8"/>
      </linearGradient>
    </defs>
    <path d="M16 27S3 18.5 3 10.5C3 7 5.9 4 9.5 4c2.1 0 4.1 1 5.3 2.6C16 4.9 18 4 20 4c3.6 0 6.5 3 6.5 6.5 0 8-10.5 16.5-10.5 16.5z" fill="url(#hg)"/>
  </svg>
);

const TgIcon = () => (
  <svg width="17" height="14" viewBox="0 0 18 15" fill="none">
    <path d="M1.5 7L7 12 16.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.5 7L6 9 7 12.5 9.5 9l7-7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 14" fill="none">
    <rect x="1.5" y="1.5" width="4" height="11" rx="1.3" fill="white"/>
    <rect x="7.5" y="1.5" width="4" height="11" rx="1.3" fill="white"/>
  </svg>
);

const Plus = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 3v14M3 10h14" stroke="rgba(255,255,255,0.48)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const Chev = () => (
  <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
    <path d="M2 3l4.5 4.5L11 3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Mic = () => (
  <svg width="20" height="21" viewBox="0 0 20 22" fill="none">
    <rect x="6.5" y="1" width="7" height="11" rx="3.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
    <path d="M3 10.5A7 7 0 0017 10.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="17.5" x2="10" y2="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="7" y1="20" x2="13" y2="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Home = () => (
  <svg width="21" height="21" viewBox="0 0 22 22" fill="none">
    <path d="M3 11L11 3l8 8" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 9V19h4.5v-4.5h3V19H17V9" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Globe = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2"/>
    <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1"/>
    <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="rgba(255,255,255,0.55)" strokeWidth="1"/>
    <line x1="2.5" y1="4.2" x2="11.5" y2="4.2" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9"/>
    <line x1="2.5" y1="9.8" x2="11.5" y2="9.8" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9"/>
  </svg>
);

const Moon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12.2 9.2A5.5 5.5 0 014.8 1.8 5.5 5.5 0 1012.2 9.2z" fill="white"/>
  </svg>
);

const Wifi = () => (
  <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
    <path d="M1 4.8C3.5 2.2 6.1 1 9 1s5.5 1.2 8 3.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M3.8 7.4C5.3 5.9 7 5.2 9 5.2s3.7.7 5.2 2.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M6.5 10C7.2 9.3 8 9 9 9s1.8.3 2.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <circle cx="9" cy="12.2" r="1" fill="white"/>
  </svg>
);

const Signal = () => (
  <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
    <rect x="0.5" y="9" width="3" height="4" rx="0.8" fill="white"/>
    <rect x="5"   y="6" width="3" height="7" rx="0.8" fill="white"/>
    <rect x="9.5" y="3" width="3" height="10" rx="0.8" fill="white"/>
    <rect x="14"  y="0" width="3" height="13" rx="0.8" fill="rgba(255,255,255,0.28)"/>
  </svg>
);

const Battery = () => (
  <svg width="28" height="13" viewBox="0 0 28 13" fill="none">
    <rect x="0.75" y="0.75" width="23.5" height="11.5" rx="3.3" stroke="white" strokeWidth="1.4"/>
    <rect x="2.2" y="2.2" width="12.5" height="8.6" rx="1.5" fill="white"/>
    <path d="M25.5 4.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Dots = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="4"  r="1.4" fill="white"/>
    <circle cx="9" cy="9"  r="1.4" fill="white"/>
    <circle cx="9" cy="14" r="1.4" fill="white"/>
  </svg>
);

export default function LovableClone() {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  return (
    <>
      <style>{css}</style>
      <div className="root">

        {/* ── BACKGROUND LAYERS ── */}
        <div className="bg-gradient" />
        <div className="bg-bottom-glow" />
        <div className="bg-blob-blue" />
        <div className="bg-blob-blue2" />
        <div className="bg-blob-purple" />
        <div className="bg-blob-pink" />

        {/* ── UI ── */}
        <div className="content">

          {/* Status bar */}
          <div className="statusbar">
            <span className="status-time">1:21</span>
            <div className="status-right">
              <Moon/><Wifi/><Signal/><Battery/>
            </div>
          </div>

          {/* Browser bar */}
          <div className="browser">
            <button className="b-btn"><Home/></button>
            <div className="urlbar">
              <Globe/>
              <span>lovable.dev/das</span>
            </div>
            <button className="b-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="ddbtn">:D</button>
            <button className="b-btn"><Dots/></button>
          </div>

          {/* Header nav */}
          <div className="topnav">
            <button className="hambtn" onClick={() => setOpen(true)}>
              <div className="hl"/>
              <div className="hl"/>
              <div className="hl hl3"/>
            </button>
            <div className="logorow">
              <Heart/>
              <span className="logoname">Lovable</span>
            </div>
            <div className="spacer"/>
          </div>

          {/* Bottom content */}
          <div className="body">

            {/* Connector pill */}
            <div className="pill">
              <div className="iconstack">
                <div className="ic ic-fire">🔥</div>
                <div className="ic ic-tg"><TgIcon/></div>
                <div className="ic ic-pause"><PauseIcon/></div>
              </div>
              <span className="pill-label">Power your app with<br/>connectors</span>
              <span className="pill-arrow">→</span>
            </div>

            {/* Greeting */}
            <h1 className="heading">What's on your mind, Karas?</h1>

            {/* Input */}
            <div className="card">
              <textarea
                className="inp"
                rows={2}
                placeholder="Ask Lovable to create a presentation a"
                value={val}
                onChange={e => setVal(e.target.value)}
              />
              <div className="toolbar">
                <button className="tbbtn"><Plus/></button>
                <div className="tbright">
                  <button className="buildbtn">Build <Chev/></button>
                  <button className="tbbtn"><Mic/></button>
                  <button className="sendbtn"><Arrow/></button>
                </div>
              </div>
            </div>
          </div>

          {/* Home bar */}
          <div className="homebar"><div className="hb"/></div>
        </div>

        {/* Drawer menu */}
        {open && (
          <div className="overlay" onClick={() => setOpen(false)}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
              <div className="dlogo"><Heart size={22}/><span>Lovable</span></div>
              {["Dashboard","Projects","Templates","Settings","Help"].map(t => (
                <button key={t} className="ditem">{t}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

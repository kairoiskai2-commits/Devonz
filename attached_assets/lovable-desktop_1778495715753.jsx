import { useState } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #09090b; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .root {
    min-height: 100vh;
    background: #09090b;
    overflow: hidden;
    position: relative;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* ── Blobs ── */
  .blob1 {
    position: absolute;
    top: -128px; left: -96px;
    width: 500px; height: 500px;
    background: rgba(124,58,237,0.2);
    filter: blur(140px);
    border-radius: 50%;
    animation: pulse 4s ease-in-out infinite;
    pointer-events: none;
  }
  .blob2 {
    position: absolute;
    bottom: 0; right: 0;
    width: 500px; height: 500px;
    background: rgba(59,130,246,0.2);
    filter: blur(140px);
    border-radius: 50%;
    animation: pulse 4s ease-in-out infinite 1s;
    pointer-events: none;
  }
  .dot-grid {
    position: absolute;
    inset: 0;
    opacity: 0.06;
    background-image: radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px);
    background-size: 4px 4px;
    pointer-events: none;
  }

  /* ── Shell ── */
  .shell-wrap {
    position: relative;
    z-index: 10;
    padding: 40px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media (max-width: 768px) {
    .shell-wrap { padding: 16px; }
  }

  .shell {
    width: 100%;
    max-width: 1250px;
    min-height: 760px;
    border-radius: 36px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(24px);
    box-shadow: 0 25px 80px rgba(0,0,0,0.6);
    overflow: hidden;
    animation: fadeIn 0.5s ease both;
  }

  /* ── Navbar ── */
  .navbar {
    height: 76px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0,0,0,0.2);
    backdrop-filter: blur(24px);
  }

  .nav-brand { display: flex; align-items: center; gap: 12px; }

  .heart-icon {
    width: 36px; height: 36px;
    border-radius: 14px;
    background: linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(139,92,246,0.4);
    flex-shrink: 0;
  }

  .brand-name { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; }
  .brand-sub  { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }

  .nav-links { display: flex; align-items: center; gap: 32px; }
  @media (max-width: 768px) { .nav-links { display: none; } }

  .nav-link {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.55); font-size: 14px;
    font-family: inherit; transition: color 0.15s;
  }
  .nav-link:hover { color: white; }

  .nav-actions { display: flex; align-items: center; gap: 10px; }

  .btn-ghost {
    height: 40px; padding: 0 16px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.8);
    font-size: 14px; font-family: inherit;
    cursor: pointer; transition: background 0.15s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.07); }

  .btn-new {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: white; color: black;
    font-size: 20px; font-weight: 600;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s;
  }
  .btn-new:hover { transform: scale(1.04); }

  /* ── Hero ── */
  .hero {
    padding: 80px 64px 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  @media (max-width: 768px) { .hero { padding: 48px 24px; } }

  .badge {
    margin-bottom: 20px;
    padding: 8px 16px;
    border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    font-size: 13px; color: rgba(255,255,255,0.6);
    backdrop-filter: blur(24px);
    animation: fadeUp 0.5s ease both 0.05s;
  }

  .hero-title {
    max-width: 950px;
    font-size: clamp(38px, 6vw, 84px);
    font-weight: 600;
    letter-spacing: -0.06em;
    line-height: 0.95;
    margin-bottom: 28px;
    animation: fadeUp 0.5s ease both 0.12s;
  }

  .hero-sub {
    max-width: 680px;
    color: rgba(255,255,255,0.5);
    font-size: 17px; line-height: 1.85;
    margin-bottom: 52px;
    animation: fadeUp 0.5s ease both 0.2s;
  }

  /* ── Prompt card ── */
  .prompt-card {
    width: 100%; max-width: 920px;
    border-radius: 32px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px);
    padding: 20px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.4);
    transition: border-color 0.25s;
    animation: fadeUp 0.5s ease both 0.28s;
  }
  .prompt-card:focus-within { border-color: rgba(167,139,250,0.35); }

  .prompt-textarea {
    width: 100%;
    min-height: 140px;
    resize: none;
    background: transparent;
    border: none; outline: none;
    font-size: 18px; line-height: 1.7;
    color: white;
    font-family: inherit;
  }
  .prompt-textarea::placeholder { color: rgba(255,255,255,0.3); }

  .prompt-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
    flex-wrap: wrap;
  }

  .prompt-left, .prompt-right {
    display: flex; align-items: center; gap: 10px;
  }

  .chip {
    height: 44px; padding: 0 16px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.75);
    font-size: 13px; font-family: inherit;
    cursor: pointer; transition: background 0.15s;
  }
  .chip:hover { background: rgba(255,255,255,0.07); }

  .icon-btn {
    width: 44px; height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .icon-btn:hover { background: rgba(255,255,255,0.07); }

  .btn-generate {
    height: 44px; padding: 0 28px;
    border-radius: 14px;
    background: white; color: black;
    font-size: 14px; font-weight: 500;
    font-family: inherit; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(255,255,255,0.1);
    transition: transform 0.15s;
  }
  .btn-generate:hover  { transform: scale(1.02); }
  .btn-generate:active { transform: scale(0.98); }

  /* ── Feature cards ── */
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%; max-width: 1100px;
    margin-top: 52px;
    animation: fadeUp 0.5s ease both 0.4s;
  }
  @media (max-width: 900px) {
    .cards-grid { grid-template-columns: 1fr; }
  }

  .feat-card {
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(24px);
    padding: 24px;
    text-align: left;
    cursor: default;
    transition: background 0.18s;
  }
  .feat-card:hover { background: rgba(255,255,255,0.055); }

  .feat-icon {
    width: 44px; height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3));
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    margin-bottom: 20px;
  }

  .feat-title {
    font-size: 16px; font-weight: 500;
    letter-spacing: -0.3px; margin-bottom: 8px;
  }

  .feat-desc {
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    line-height: 1.75;
  }
`;

const features = [
  {
    icon: "✨",
    title: "Generate complete SaaS products",
    desc: "Beautiful UI generation with smooth animations, glassmorphism and premium layouts.",
  },
  {
    icon: "⚡",
    title: "Create modern dashboards instantly",
    desc: "Beautiful UI generation with smooth animations, glassmorphism and premium layouts.",
  },
  {
    icon: "🚀",
    title: "Deploy production-ready apps",
    desc: "Beautiful UI generation with smooth animations, glassmorphism and premium layouts.",
  },
];

export default function LovableDesktopClone() {
  const [prompt, setPrompt] = useState("");

  return (
    <>
      <style>{css}</style>
      <div className="root">
        {/* Background */}
        <div className="blob1" />
        <div className="blob2" />
        <div className="dot-grid" />

        {/* Shell */}
        <div className="shell-wrap">
          <div className="shell">

            {/* Navbar */}
            <header className="navbar">
              <div className="nav-brand">
                <div className="heart-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-7-4.35-7-10a4 4 0 017-2.5A4 4 0 0119 11c0 5.65-7 10-7 10z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div className="brand-name">Lovable</div>
                  <div className="brand-sub">AI App Builder</div>
                </div>
              </div>

              <nav className="nav-links">
                {["Projects", "Templates", "Community", "Docs"].map(l => (
                  <button key={l} className="nav-link">{l}</button>
                ))}
              </nav>

              <div className="nav-actions">
                <button className="btn-ghost">Dashboard</button>
                <button className="btn-new">+</button>
              </div>
            </header>

            {/* Hero */}
            <main className="hero">
              <div className="badge">✨ Design, build and ship instantly</div>

              <h1 className="hero-title">
                Build apps with AI that actually feel production ready.
              </h1>

              <p className="hero-sub">
                Create beautiful full-stack applications, dashboards and landing pages with modern AI-powered workflows.
              </p>

              {/* Prompt card */}
              <div className="prompt-card">
                <textarea
                  className="prompt-textarea"
                  placeholder="Ask Lovable to build a SaaS dashboard with authentication, billing and a beautiful landing page..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />

                <div className="prompt-footer">
                  <div className="prompt-left">
                    <button className="chip">+ Attach</button>
                    <button className="chip">GPT-5.5</button>
                    <button className="chip">Full Stack</button>
                  </div>

                  <div className="prompt-right">
                    {/* Plus */}
                    <button className="icon-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4v16M4 12h16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    {/* Mic */}
                    <button className="icon-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 18a4 4 0 004-4V8a4 4 0 10-8 0v6a4 4 0 004 4zm0 0v3m-4 0h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="btn-generate">Generate</button>
                  </div>
                </div>
              </div>

              {/* Feature cards */}
              <div className="cards-grid">
                {features.map(f => (
                  <div key={f.title} className="feat-card">
                    <div className="feat-icon">{f.icon}</div>
                    <div className="feat-title">{f.title}</div>
                    <div className="feat-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
            </main>

          </div>
        </div>
      </div>
    </>
  );
}

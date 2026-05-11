import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES = [
  {
    icon: 'i-ph:lightning-fill',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    glow: 'rgba(234,179,8,0.15)',
    title: 'Build in seconds',
    desc: 'Describe your app in plain English and watch Veyra write, run, and deploy the code automatically.',
  },
  {
    icon: 'i-ph:brain-fill',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    glow: 'rgba(168,85,247,0.15)',
    title: 'AI-powered stack',
    desc: 'Powered by the latest frontier models — GPT-4o, Claude 3.5, Gemini and more — always picking the best tool.',
  },
  {
    icon: 'i-ph:code-fill',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    glow: 'rgba(59,130,246,0.15)',
    title: 'Full-stack apps',
    desc: 'From React frontends to Node backends and databases — Veyra handles the entire application lifecycle.',
  },
  {
    icon: 'i-ph:rocket-launch-fill',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    glow: 'rgba(34,197,94,0.15)',
    title: 'One-click deploy',
    desc: "Push to Vercel, Netlify or any platform instantly. Your app goes live the moment it's ready.",
  },
  {
    icon: 'i-ph:git-branch-fill',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    glow: 'rgba(245,158,11,0.15)',
    title: 'Import from GitHub',
    desc: 'Drop in a repo URL and continue where you left off — Veyra picks up any existing codebase.',
  },
  {
    icon: 'i-ph:shield-check-fill',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    glow: 'rgba(20,184,166,0.15)',
    title: 'Version control',
    desc: 'Every change is tracked. Roll back to any point in history with a single click.',
  },
];

const TEMPLATES = [
  {
    name: 'SaaS Dashboard',
    tags: ['React', 'Charts', 'Auth'],
    icon: 'i-ph:chart-bar-fill',
    iconColor: 'text-blue-400',
    gradient: 'from-blue-500/15 to-purple-500/15',
    border: 'hover:border-blue-500/40',
    accent: '#3b82f6',
  },
  {
    name: 'E-Commerce Store',
    tags: ['Next.js', 'Stripe', 'DB'],
    icon: 'i-ph:shopping-cart-fill',
    iconColor: 'text-green-400',
    gradient: 'from-green-500/15 to-teal-500/15',
    border: 'hover:border-green-500/40',
    accent: '#22c55e',
  },
  {
    name: 'Landing Page',
    tags: ['React', 'Animations', 'CMS'],
    icon: 'i-ph:layout-fill',
    iconColor: 'text-pink-400',
    gradient: 'from-pink-500/15 to-rose-500/15',
    border: 'hover:border-pink-500/40',
    accent: '#ec4899',
  },
  {
    name: 'Blog Platform',
    tags: ['MDX', 'SEO', 'Auth'],
    icon: 'i-ph:pencil-fill',
    iconColor: 'text-amber-400',
    gradient: 'from-amber-500/15 to-orange-500/15',
    border: 'hover:border-amber-500/40',
    accent: '#f59e0b',
  },
  {
    name: 'Chat App',
    tags: ['WebSockets', 'React', 'Node'],
    icon: 'i-ph:chat-circle-dots-fill',
    iconColor: 'text-cyan-400',
    gradient: 'from-cyan-500/15 to-blue-500/15',
    border: 'hover:border-cyan-500/40',
    accent: '#06b6d4',
  },
  {
    name: 'REST API',
    tags: ['Node', 'Express', 'PostgreSQL'],
    icon: 'i-ph:plugs-connected-fill',
    iconColor: 'text-violet-400',
    gradient: 'from-violet-500/15 to-purple-500/15',
    border: 'hover:border-violet-500/40',
    accent: '#8b5cf6',
  },
];

const STEPS = [
  { num: '01', title: 'Describe your idea', desc: 'Tell Veyra what you want to build in plain language — no technical knowledge required.', icon: 'i-ph:chat-circle-text-fill', color: 'from-violet-500 to-purple-600' },
  { num: '02', title: 'AI writes the code', desc: 'Watch as Veyra generates a complete, production-ready codebase in real time.', icon: 'i-ph:code-fill', color: 'from-blue-500 to-cyan-600' },
  { num: '03', title: 'Iterate & deploy', desc: 'Chat with Veyra to refine your app, then deploy to the web with a single click.', icon: 'i-ph:rocket-launch-fill', color: 'from-green-500 to-teal-600' },
];

const TYPING_DEMOS = [
  'Build me a SaaS dashboard with user auth and analytics charts',
  'Create a REST API for a todo app with PostgreSQL',
  'Make a landing page with animations and a contact form',
  'Build an e-commerce store with Stripe payments',
  'Create a real-time chat app with WebSockets',
];

const MODELS = ['GPT-4o', 'Claude 3.5', 'Gemini 2.0', 'Llama 3', 'Mistral', 'Deepseek', 'Qwen 2.5', 'Grok', 'Command R+'];

const TESTIMONIALS = [
  { name: 'Alex Chen', role: 'Indie Hacker', avatar: 'AC', color: 'from-blue-500 to-cyan-500', text: 'I shipped my SaaS MVP in a weekend. Veyra handled everything from auth to payments.' },
  { name: 'Sarah K.', role: 'Product Designer', avatar: 'SK', color: 'from-pink-500 to-rose-500', text: 'I can now prototype full-stack apps without needing a developer. Game changer.' },
  { name: 'Marcus T.', role: 'Startup Founder', avatar: 'MT', color: 'from-violet-500 to-purple-500', text: 'Went from idea to deployed product in 4 hours. The AI just gets what you want.' },
];

const SHOWCASE_TEMPLATES = [
  { id: '3d-product-explode', name: '3D Product Explode', url: 'https://3d-product-explode.vercel.app', category: 'landing-page', icon: 'i-ph:cube-fill', iconColor: 'text-violet-400', tags: ['3D', 'Three.js'] },
  { id: 'ai-landing-page', name: 'AI Landing Page', url: 'https://ai-landing-page-puce.vercel.app', category: 'landing-page', icon: 'i-ph:robot-fill', iconColor: 'text-blue-400', tags: ['AI', 'Marketing'] },
  { id: 'luxury-portfolio', name: 'Luxury Portfolio', url: 'https://luxury-portfolio-phi.vercel.app', category: 'portfolio', icon: 'i-ph:diamond-fill', iconColor: 'text-amber-400', tags: ['Portfolio', 'Elegant'] },
];

function TypingDemo() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pause' | 'erasing'>('typing');

  useEffect(() => {
    const text = TYPING_DEMOS[demoIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < text.length) {
        timeout = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 35);
      } else {
        timeout = setTimeout(() => setPhase('pause'), 2200);
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('erasing'), 500);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 16);
      } else {
        setDemoIndex((i) => (i + 1) % TYPING_DEMOS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, demoIndex]);

  return (
    <span className="text-veyra-elements-textPrimary">
      {displayed}
      <span className="inline-block w-0.5 h-5 bg-accent-400 ml-0.5 animate-pulse align-middle" />
    </span>
  );
}

function MarqueeRow({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 text-sm text-veyra-elements-textSecondary font-medium whitespace-nowrap"
          >
            <span className="i-ph:brain-fill text-accent-400/60 text-base" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function TemplatePreviewCard({ tpl, index }: { tpl: typeof SHOWCASE_TEMPLATES[0]; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="group relative rounded-2xl overflow-hidden border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 hover:border-accent-500/30 transition-all"
      style={{ minHeight: '280px' }}
    >
      <div className="relative overflow-hidden" style={{ height: '200px', background: '#0d0d12' }}>
        {!errored ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className={`${tpl.icon} text-3xl ${tpl.iconColor}`} />
                <div className="w-6 h-6 border-2 border-accent-500/40 border-t-accent-500 rounded-full animate-spin" />
              </div>
            )}
            <iframe
              src={tpl.url}
              title={tpl.name}
              className="w-full border-0 pointer-events-none"
              style={{
                height: '600px',
                transform: 'scale(0.333)',
                transformOrigin: 'top left',
                width: '300%',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 100%)' }}>
            <div className={`${tpl.icon} text-4xl ${tpl.iconColor}`} />
            <p className="text-xs text-veyra-elements-textTertiary text-center px-4">{tpl.name}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-veyra-elements-background-depth-2 via-transparent to-transparent pointer-events-none" />
        <a
          href={tpl.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium">
            <span className="i-ph:arrow-square-out" />
            Open preview
          </span>
        </a>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`${tpl.icon} text-base ${tpl.iconColor}`} />
          <h3 className="text-sm font-bold text-veyra-elements-textPrimary">{tpl.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tpl.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-veyra-elements-background-depth-3 text-veyra-elements-textTertiary border border-veyra-elements-borderColor">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const handleGetStarted = () => navigate('/signup');

  useEffect(() => {
    const prev = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    return () => {
      document.documentElement.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary overflow-x-hidden">

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute -top-64 -left-64 w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-64 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/20 to-transparent" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl border-b border-white/5"
        style={{ background: 'rgba(9,9,11,0.8)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 4L10 16L17 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 4L10 10.5L13.5 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">Veyra</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-veyra-elements-textSecondary">
          <a href="#features" className="hover:text-veyra-elements-textPrimary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-veyra-elements-textPrimary transition-colors">How it works</a>
          <a href="#templates" className="hover:text-veyra-elements-textPrimary transition-colors">Templates</a>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-1.5 text-sm text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary border border-veyra-elements-borderColor hover:border-veyra-elements-borderColorActive rounded-lg transition-all">
            Sign in
          </Link>
          <button
            onClick={handleGetStarted}
            className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 text-accent-300 text-xs font-semibold mb-8 shadow-lg shadow-accent-500/10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
          AI-powered full-stack development platform
          <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl leading-[1.05] mb-6"
        >
          Build full-stack apps{' '}
          <br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #a855f7 35%, #ec4899 65%, #f43f5e 100%)' }}>
            with AI magic
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-veyra-elements-textSecondary max-w-2xl mb-10 leading-relaxed"
        >
          Veyra turns your ideas into production-ready apps in minutes. Describe what you want — AI handles the code, deployment, and everything in between.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-16"
        >
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group relative px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 overflow-hidden shadow-xl shadow-accent-500/25"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)' }} />
            <span className="relative i-ph:sparkle-fill" />
            <span className="relative">Start building for free</span>
            <span className="relative i-ph:arrow-right group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
          <Link to="/login" className="px-8 py-3.5 rounded-xl text-sm font-medium border border-veyra-elements-borderColor text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary hover:border-accent-500/40 bg-veyra-elements-background-depth-2/80 backdrop-blur-sm transition-all">
            Already have an account? Sign in
          </Link>
        </motion.div>

        {/* Demo window */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="w-full max-w-2xl"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60" style={{ border: '1px solid rgba(99,102,241,0.25)' }}>
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(99,102,241,0.05)' }} />
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-veyra-elements-borderColor bg-veyra-elements-background-depth-3/80 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <span className="ml-2 text-xs text-veyra-elements-textTertiary font-medium">Veyra — AI App Builder</span>
            </div>
            <div className="bg-veyra-elements-background-depth-2/90 backdrop-blur-sm p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                  <div className="i-ph:sparkle-fill text-white text-sm" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-left min-h-[20px]"><TypingDemo /></p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Analyzing your request...', pct: '100%', done: true },
                  { label: 'Generating project structure...', pct: '78%', done: true },
                  { label: 'Writing React components...', pct: '45%', done: false },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500/20' : 'bg-accent-500/20'}`}>
                      {step.done
                        ? <div className="i-ph:check text-green-400 text-xs" />
                        : <div className="i-svg-spinners:ring-resize text-accent-400 text-xs" />
                      }
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-veyra-elements-background-depth-3/80 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: step.pct }}
                        transition={{ duration: 1.5, delay: 0.8 + i * 0.3, ease: 'easeOut' }}
                        style={{ background: step.done ? 'linear-gradient(90deg, #22c55e, #10b981)' : 'linear-gradient(90deg, #6366f1, #a855f7)' }}
                      />
                    </div>
                    <span className="text-xs text-veyra-elements-textTertiary shrink-0 w-32 text-right">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-veyra-elements-textTertiary"
        >
          {[
            { label: 'AI models supported', value: '31+' },
            { label: 'Avg. time to first app', value: '< 5 min' },
            { label: 'Deployment targets', value: '4+' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="font-bold text-veyra-elements-textPrimary text-base">{stat.value}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── MODELS MARQUEE ── */}
      <section className="py-6 border-y border-veyra-elements-borderColor overflow-hidden relative z-10" style={{ background: 'rgba(15,15,20,0.6)' }}>
        <div className="mb-3 text-center">
          <p className="text-xs text-veyra-elements-textTertiary uppercase tracking-widest font-semibold">Works with every major AI model</p>
        </div>
        <MarqueeRow items={MODELS} />
      </section>

      {/* ── APP SHOWCASE VIDEO ── */}
      <section className="py-28 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-3">See it in action</p>
            <h2 className="text-3xl md:text-5xl font-black">Watch Veyra build an app</h2>
            <p className="text-veyra-elements-textSecondary mt-4 text-lg max-w-xl mx-auto">
              From a single sentence to a fully working product — in under 5 minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/70"
            style={{ border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-veyra-elements-borderColor" style={{ background: 'rgba(15,15,20,0.95)' }}>
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
              <div className="flex-1 mx-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-md text-xs text-veyra-elements-textTertiary" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="i-ph:lock-fill text-green-400/60 text-xs" />
                  veyra.app
                </div>
              </div>
            </div>

            {/* Embedded app preview */}
            <div className="relative" style={{ height: '520px', background: '#08080c', overflow: 'hidden' }}>
              <iframe
                src="/"
                title="Veyra App Preview"
                className="w-full h-full border-0 pointer-events-none"
                style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '118%', height: '118%' }}
                sandbox="allow-scripts allow-same-origin"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                <motion.button
                  onClick={handleGetStarted}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  <span className="i-ph:play-fill" />
                  Try it yourself — it's free
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: 'i-ph:terminal-fill', label: 'Live code preview', color: 'text-blue-400' },
              { icon: 'i-ph:git-branch-fill', label: 'Git integration', color: 'text-green-400' },
              { icon: 'i-ph:cloud-arrow-up-fill', label: 'One-click deploy', color: 'text-purple-400' },
              { icon: 'i-ph:chat-circle-dots-fill', label: 'AI chat interface', color: 'text-amber-400' },
            ].map((pill) => (
              <div key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 text-sm text-veyra-elements-textSecondary">
                <span className={`${pill.icon} ${pill.color}`} />
                {pill.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-6 border-t border-veyra-elements-borderColor relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-20"
          >
            <p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-5xl font-black">From idea to app in minutes</h2>
            <p className="text-veyra-elements-textSecondary mt-4 text-lg max-w-xl mx-auto">No setup, no config files, no DevOps — just describe what you want.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative group"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%+12px)] w-6 z-10" style={{ marginTop: '40px' }}>
                    <div className="h-px bg-gradient-to-r from-veyra-elements-borderColor to-transparent" />
                  </div>
                )}
                <div className="p-6 rounded-2xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 hover:border-accent-500/30 transition-all group-hover:shadow-lg group-hover:shadow-accent-500/5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <div className={`${step.icon} text-xl text-white`} />
                  </div>
                  <div className="text-4xl font-black text-veyra-elements-textTertiary/15 mb-3 leading-none select-none">{step.num}</div>
                  <h3 className="text-base font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-veyra-elements-textSecondary leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6 border-t border-veyra-elements-borderColor relative overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 100%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-black">Everything you need to ship</h2>
            <p className="text-veyra-elements-textSecondary mt-4 text-lg max-w-xl mx-auto">
              Veyra is a complete AI development environment — not just a code generator.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative p-6 rounded-2xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 hover:border-veyra-elements-borderColorActive group transition-all overflow-hidden cursor-default"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(ellipse at top left, ${f.glow} 0%, transparent 60%)` }} />
                <div className={`relative w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${f.bg}`}>
                  <div className={`${f.icon} text-xl ${f.color}`} />
                </div>
                <h3 className="relative text-sm font-bold mb-2">{f.title}</h3>
                <p className="relative text-xs text-veyra-elements-textSecondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES SHOWCASE ── */}
      <section id="templates" className="py-28 px-6 border-t border-veyra-elements-borderColor relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-3">Templates</p>
            <h2 className="text-3xl md:text-5xl font-black">Start from a template</h2>
            <p className="text-veyra-elements-textSecondary mt-4 text-lg max-w-xl mx-auto">
              Pick a starting point and customize it with AI — or start from scratch with a prompt.
            </p>
          </motion.div>

          {/* Live iframe previews */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {SHOWCASE_TEMPLATES.map((tpl, i) => (
              <TemplatePreviewCard key={tpl.id} tpl={tpl} index={i} />
            ))}
          </div>

          {/* Template grid cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className={`relative p-5 rounded-2xl border border-veyra-elements-borderColor bg-gradient-to-br ${t.gradient} text-left group ${t.border} transition-all`}
              >
                <div className={`${t.icon} text-2xl ${t.iconColor} mb-3`} />
                <h3 className="text-sm font-bold mb-2.5">{t.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-veyra-elements-background-depth-3/80 text-veyra-elements-textSecondary border border-veyra-elements-borderColor">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                  <div className="i-ph:arrow-right text-accent-400" />
                </div>
              </motion.button>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-veyra-elements-borderColor text-sm font-medium text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary hover:border-accent-500/40 transition-all"
            >
              <span className="i-ph:layout-duotone text-accent-400" />
              Browse all templates
              <span className="i-ph:arrow-right text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 px-6 border-t border-veyra-elements-borderColor relative overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(168,85,247,0.05) 0%, transparent 100%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-5xl font-black">Loved by builders</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="i-ph:star-fill text-yellow-400 text-sm" />
                  ))}
                </div>
                <p className="text-sm text-veyra-elements-textSecondary leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-veyra-elements-textTertiary">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIG CTA ── */}
      <section className="py-28 px-6 border-t border-veyra-elements-borderColor relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-14 rounded-3xl overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.07) 50%, rgba(236,72,153,0.04) 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 right-1/4 w-64 h-48 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)' }}
                animate={{ scale: [1.1, 1, 1.1] }}
                transition={{ duration: 8, repeat: Infinity, delay: 2 }}
              />
            </div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-accent-500/30"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <div className="i-ph:sparkle-fill text-white text-2xl" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-5">Ready to build something amazing?</h2>
              <p className="text-veyra-elements-textSecondary mb-10 text-lg max-w-xl mx-auto">
                Join thousands of builders using Veyra to ship faster than ever before.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <motion.button
                  onClick={handleGetStarted}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative px-10 py-4 rounded-xl font-bold text-white flex items-center gap-2 overflow-hidden shadow-xl shadow-accent-500/30"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)' }} />
                  <span className="relative i-ph:sparkle-fill" />
                  <span className="relative">Start building for free</span>
                  <span className="relative i-ph:arrow-right group-hover:translate-x-0.5 transition-transform" />
                </motion.button>
                <Link to="/login" className="px-10 py-4 rounded-xl text-sm font-medium border border-veyra-elements-borderColor text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary hover:border-accent-500/40 transition-all">
                  Sign in to your account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-veyra-elements-borderColor py-10 px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M3 4L10 16L17 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold">Veyra</span>
            <span className="text-xs text-veyra-elements-textTertiary">AI App Builder</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-veyra-elements-textTertiary">
            <Link to="/login" className="hover:text-veyra-elements-textSecondary transition-colors">Sign in</Link>
            <Link to="/signup" className="hover:text-veyra-elements-textSecondary transition-colors">Sign up</Link>
            <Link to="/templates" className="hover:text-veyra-elements-textSecondary transition-colors">Templates</Link>
          </div>
          <p className="text-xs text-veyra-elements-textTertiary">
            © {new Date().getFullYear()} Veyra. Built with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

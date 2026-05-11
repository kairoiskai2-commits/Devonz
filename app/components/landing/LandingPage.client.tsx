import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { authClient } from '~/lib/auth-client';

const FEATURES = [
  {
    icon: 'i-ph:lightning-fill',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'Build in seconds',
    desc: 'Describe your app in plain English and watch Veyra write, run, and deploy the code automatically.',
  },
  {
    icon: 'i-ph:brain-fill',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'AI-powered stack',
    desc: 'Powered by the latest frontier models — GPT-4o, Claude 3.5, Gemini and more — always picking the best tool.',
  },
  {
    icon: 'i-ph:code-fill',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Full-stack apps',
    desc: 'From React frontends to Node backends and databases — Veyra handles the entire application lifecycle.',
  },
  {
    icon: 'i-ph:rocket-launch-fill',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    title: 'One-click deploy',
    desc: 'Push to Vercel, Netlify or any platform instantly. Your app goes live the moment it\'s ready.',
  },
  {
    icon: 'i-ph:git-branch-fill',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Import from GitHub',
    desc: 'Drop in a repo URL and continue where you left off — Veyra picks up any existing codebase.',
  },
  {
    icon: 'i-ph:shield-check-fill',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    title: 'Version control',
    desc: 'Every change is tracked. Roll back to any point in history with a single click.',
  },
];

const TEMPLATES = [
  { name: 'SaaS Dashboard', tags: ['React', 'Charts', 'Auth'], emoji: '📊', gradient: 'from-blue-500/20 to-purple-500/20' },
  { name: 'E-Commerce Store', tags: ['Next.js', 'Stripe', 'DB'], emoji: '🛒', gradient: 'from-green-500/20 to-teal-500/20' },
  { name: 'Landing Page', tags: ['React', 'Animations', 'CMS'], emoji: '🎨', gradient: 'from-pink-500/20 to-rose-500/20' },
  { name: 'Blog Platform', tags: ['MDX', 'SEO', 'Auth'], emoji: '✍️', gradient: 'from-amber-500/20 to-orange-500/20' },
  { name: 'Chat App', tags: ['WebSockets', 'React', 'Node'], emoji: '💬', gradient: 'from-cyan-500/20 to-blue-500/20' },
  { name: 'REST API', tags: ['Node', 'Express', 'PostgreSQL'], emoji: '⚡', gradient: 'from-violet-500/20 to-purple-500/20' },
];

const STEPS = [
  { num: '01', title: 'Describe your idea', desc: 'Tell Veyra what you want to build in plain language — no technical knowledge required.' },
  { num: '02', title: 'AI writes the code', desc: 'Watch as Veyra generates a complete, production-ready codebase in real time.' },
  { num: '03', title: 'Iterate & deploy', desc: 'Chat with Veyra to refine your app, then deploy to the web with a single click.' },
];

const TYPING_DEMOS = [
  'Build me a SaaS dashboard with user auth and analytics charts',
  'Create a REST API for a todo app with PostgreSQL',
  'Make a landing page with animations and a contact form',
  'Build an e-commerce store with Stripe payments',
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
        timeout = setTimeout(() => setPhase('pause'), 2000);
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('erasing'), 500);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18);
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

export function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  const handleGetStarted = () => navigate('/signup');

  return (
    <div className="relative min-h-screen bg-veyra-elements-background-depth-1 text-veyra-elements-textPrimary overflow-x-hidden">

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent-500/8 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/6 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-purple-500/6 blur-[80px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />

        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* ── HERO ── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative pt-28 pb-20 px-6 flex flex-col items-center text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 text-accent-300 text-xs font-medium mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
          AI-powered full-stack development
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] mb-6"
        >
          Build apps with{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #a855f7 40%, #ec4899 100%)' }}
          >
            AI
          </span>
          ,{' '}
          <span className="text-veyra-elements-textSecondary">instantly</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-veyra-elements-textSecondary max-w-2xl mb-10 leading-relaxed"
        >
          Veyra turns your ideas into production-ready apps. Just describe what you want — AI handles the code, deployment, and everything in between.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-16"
        >
          <button
            onClick={handleGetStarted}
            className="group px-6 py-3 rounded-xl font-semibold text-sm text-white flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            Start building for free
            <div className="i-ph:arrow-right group-hover:translate-x-0.5 transition-transform" />
          </button>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl text-sm font-medium border border-veyra-elements-borderColor text-veyra-elements-textSecondary hover:text-veyra-elements-textPrimary hover:border-veyra-elements-borderColorActive bg-veyra-elements-background-depth-2 transition-all"
          >
            Sign in
          </Link>
        </motion.div>

        {/* Demo prompt box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="relative rounded-2xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-veyra-elements-borderColor bg-veyra-elements-background-depth-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-xs text-veyra-elements-textTertiary">Veyra AI App Builder</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-5">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <div className="i-ph:sparkle-fill text-white text-sm" />
              </div>
              <p className="text-sm text-left min-h-[20px]">
                <TypingDemo />
              </p>
            </div>
            <div className="px-5 pb-5">
              <div className="space-y-2">
                {['Analyzing your request...', 'Generating project structure...', 'Writing React components...'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <div className="i-ph:check text-green-400 text-xs" />
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-veyra-elements-background-depth-3 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: i === 0 ? '100%' : i === 1 ? '75%' : '40%',
                          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        }}
                      />
                    </div>
                    <span className="text-xs text-veyra-elements-textTertiary shrink-0">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <section className="py-6 border-y border-veyra-elements-borderColor bg-veyra-elements-background-depth-2/50">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-veyra-elements-textTertiary text-sm">
          {['GPT-4o', 'Claude 3.5', 'Gemini 2.0', 'Llama 3', 'Mistral', 'Deepseek'].map((model) => (
            <span key={model} className="flex items-center gap-1.5 font-medium">
              <div className="i-ph:brain text-accent-400/60" />
              {model}
            </span>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold">From idea to app in minutes</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 rounded-2xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 hover:border-accent-500/30 transition-all"
              >
                <div className="text-5xl font-black text-veyra-elements-textTertiary/20 mb-4 leading-none select-none">{step.num}</div>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-veyra-elements-textSecondary leading-relaxed">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 rounded-full border border-veyra-elements-borderColor bg-veyra-elements-background-depth-1 flex items-center justify-center z-10">
                    <div className="i-ph:arrow-right text-xs text-veyra-elements-textTertiary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 border-t border-veyra-elements-borderColor">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to ship</h2>
            <p className="text-veyra-elements-textSecondary mt-3 max-w-xl mx-auto">
              Veyra is a complete development environment powered by AI — not just a code generator.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="p-5 rounded-2xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2 hover:bg-veyra-elements-background-depth-3 hover:border-veyra-elements-borderColorActive group transition-all"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.bg}`}>
                  <div className={`${f.icon} text-xl ${f.color}`} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
                <p className="text-xs text-veyra-elements-textSecondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ── */}
      <section className="py-24 px-6 border-t border-veyra-elements-borderColor">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-3">Templates</p>
            <h2 className="text-3xl md:text-4xl font-bold">Start from a template</h2>
            <p className="text-veyra-elements-textSecondary mt-3 max-w-xl mx-auto">
              Pick a starting point and customize it with AI — or start from scratch with a prompt.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetStarted}
                className={`relative p-5 rounded-2xl border border-veyra-elements-borderColor bg-gradient-to-br ${t.gradient} text-left group hover:border-accent-500/40 transition-all`}
              >
                <div className="text-3xl mb-3">{t.emoji}</div>
                <h3 className="text-sm font-semibold mb-2">{t.name}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-veyra-elements-background-depth-3/80 text-veyra-elements-textSecondary border border-veyra-elements-borderColor">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="i-ph:arrow-right text-accent-400 text-sm" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-veyra-elements-borderColor">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl overflow-hidden border border-accent-500/20"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.05) 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-accent-500/30"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4L10 16L17 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6.5 4L10 10.5L13.5 4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build something amazing?</h2>
              <p className="text-veyra-elements-textSecondary mb-8 text-lg">
                Join developers using Veyra to build and ship faster than ever before.
              </p>
              <button
                onClick={handleGetStarted}
                className="group px-8 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2 mx-auto transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                <div className="i-ph:sparkle-fill" />
                Start building for free
                <div className="i-ph:arrow-right group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="mt-4 text-xs text-veyra-elements-textTertiary">
                Already have an account?{' '}
                <Link to="/login" className="text-accent-400 hover:text-accent-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-veyra-elements-borderColor py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M3 4L10 16L17 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold">Veyra</span>
            <span className="text-xs text-veyra-elements-textTertiary">AI App Builder</span>
          </div>
          <p className="text-xs text-veyra-elements-textTertiary">
            © {new Date().getFullYear()} Veyra. Built with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

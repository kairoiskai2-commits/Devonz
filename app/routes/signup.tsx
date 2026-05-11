import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import type { MetaFunction } from 'react-router';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { authClient } from '~/lib/auth-client';

export const meta: MetaFunction = () => [
  { title: 'Create Account — Veyra' },
  { name: 'description', content: 'Create your Veyra AI App Builder account' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);
  const [providers, setProviders] = useState({ github: false, google: false });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user) {
      navigate('/', { replace: true });
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    fetch('/api/auth-providers')
      .then((r) => r.json() as Promise<{ github: boolean; google: boolean }>)
      .then(setProviders)
      .catch(() => {});
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({ name, email, password });

      if (result.error) {
        toast.error(result.error.message || 'Failed to create account');
      } else {
        toast.success('Account created! Welcome to Veyra.');
        navigate('/', { replace: true });
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setOauthLoading(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL: '/' });
    } catch {
      toast.error(`Failed to sign up with ${provider}`);
      setOauthLoading(null);
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="min-h-screen flex bg-veyra-elements-background-depth-1 overflow-hidden">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(99,102,241,0.07) 50%, rgba(59,130,246,0.05) 100%)' }} />
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 9, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 11, repeat: Infinity, delay: 2 }}
          />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/30"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            <div className="i-ph:sparkle-fill text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-black mb-4 text-veyra-elements-textPrimary">Ship in minutes,<br />not months.</h2>
          <p className="text-sm text-veyra-elements-textSecondary leading-relaxed">
            Create your free account and build your first full-stack app with AI today.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { value: '31+', label: 'AI Models' },
              { value: '< 5 min', label: 'First app' },
              { value: '4+', label: 'Deploy targets' },
              { value: '100%', label: 'Free to start' },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-veyra-elements-borderColor bg-veyra-elements-background-depth-2/50 backdrop-blur-sm text-center">
                <div className="text-lg font-black text-veyra-elements-textPrimary">{s.value}</div>
                <div className="text-xs text-veyra-elements-textTertiary mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-6"
        >
          {/* Logo (mobile) */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M3 4L10 16L17 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-base font-bold">Veyra</span>
          </div>

          <h1 className="text-2xl font-black text-veyra-elements-textPrimary mb-1">Create your account</h1>
          <p className="text-sm text-veyra-elements-textSecondary mb-8">Start building with AI — free, no credit card required</p>

          {/* OAuth buttons */}
          <div className="space-y-2.5 mb-6">
            {providers.google && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-70"
              >
                {oauthLoading === 'google'
                  ? <span className="i-svg-spinners:ring-resize w-4 h-4 shrink-0 text-gray-600" />
                  : <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                }
                Sign up with Google
              </motion.button>
            )}

            {providers.github && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleOAuth('github')}
                disabled={!!oauthLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#24292e] text-white text-sm font-semibold hover:bg-[#2f363d] transition-all disabled:opacity-70"
              >
                {oauthLoading === 'github'
                  ? <span className="i-svg-spinners:ring-resize w-4 h-4 shrink-0" />
                  : <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                }
                Sign up with GitHub
              </motion.button>
            )}

            {(providers.github || providers.google) && (
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-veyra-elements-borderColor" />
                <span className="text-xs text-veyra-elements-textTertiary font-medium">or sign up with email</span>
                <div className="flex-1 h-px bg-veyra-elements-borderColor" />
              </div>
            )}
          </div>

          {/* Sign-up form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor text-sm text-veyra-elements-textPrimary placeholder:text-veyra-elements-textTertiary focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor text-sm text-veyra-elements-textPrimary placeholder:text-veyra-elements-textTertiary focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor text-sm text-veyra-elements-textPrimary placeholder:text-veyra-elements-textTertiary focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-veyra-elements-textTertiary hover:text-veyra-elements-textSecondary transition-colors"
                >
                  <div className={showPassword ? 'i-ph:eye-slash' : 'i-ph:eye'} />
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-veyra-elements-background-depth-3'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-veyra-elements-textTertiary">{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-veyra-elements-background-depth-2 border text-sm text-veyra-elements-textPrimary placeholder:text-veyra-elements-textTertiary focus:outline-none focus:ring-2 transition-all ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/60 focus:ring-red-500/15 focus:border-red-500/60'
                    : 'border-veyra-elements-borderColor focus:border-accent-500/60 focus:ring-accent-500/15'
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <span className="i-ph:warning-circle text-sm" />
                  Passwords don't match
                </p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full px-4 py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20 mt-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {isLoading && <span className="i-svg-spinners:ring-resize w-4 h-4 shrink-0" />}
              {isLoading ? 'Creating account…' : 'Create free account'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-veyra-elements-textSecondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-400 hover:text-accent-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

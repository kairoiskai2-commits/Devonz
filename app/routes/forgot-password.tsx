import { useState } from 'react';
import { Link } from 'react-router';
import type { MetaFunction } from 'react-router';
import { motion } from 'framer-motion';
import { authClient } from '~/lib/auth-client';

export const meta: MetaFunction = () => [
  { title: 'Forgot Password — Veyra' },
  { name: 'description', content: 'Reset your Veyra password' },
];

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password',
      });

      if (result.error) {
        setError(result.error.message || 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-veyra-elements-background-depth-1 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col items-center justify-center w-[44%] px-12 bg-gradient-to-br from-veyra-elements-background-depth-2 to-veyra-elements-background-depth-1 border-r border-veyra-elements-borderColor">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mx-auto mb-6">
            <div className="i-ph:lock-key-open-duotone text-accent-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-black text-veyra-elements-textPrimary mb-3">Forgot your password?</h2>
          <p className="text-sm text-veyra-elements-textSecondary leading-relaxed">
            No worries. Enter your email and we'll send a reset link right away.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-300 text-xs font-bold">V</div>
            <span className="text-base font-bold text-veyra-elements-textPrimary">Veyra</span>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
                <div className="i-ph:envelope-simple-check-duotone text-green-400 text-2xl" />
              </div>
              <h1 className="text-2xl font-black text-veyra-elements-textPrimary mb-2">Check your inbox</h1>
              <p className="text-sm text-veyra-elements-textSecondary mb-6">
                We sent a reset link to <strong className="text-veyra-elements-textPrimary">{email}</strong>. It expires in 1 hour.
              </p>
              <Link
                to="/login"
                className="text-sm text-accent-400 hover:text-accent-300 font-semibold transition-colors"
              >
                ← Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-veyra-elements-textPrimary mb-1">Reset password</h1>
              <p className="text-sm text-veyra-elements-textSecondary mb-8">Enter your email and we'll send a reset link.</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-veyra-elements-background-depth-2 border border-veyra-elements-borderColor text-sm text-veyra-elements-textPrimary placeholder:text-veyra-elements-textTertiary focus:outline-none focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/15 transition-all"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full px-4 py-3 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-accent-500/20"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  {isLoading && <span className="i-svg-spinners:ring-resize w-4 h-4 shrink-0" />}
                  {isLoading ? 'Sending…' : 'Send reset link'}
                </motion.button>
              </form>

              <p className="text-center text-sm text-veyra-elements-textSecondary mt-6">
                Remembered it?{' '}
                <Link to="/login" className="text-accent-400 hover:text-accent-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

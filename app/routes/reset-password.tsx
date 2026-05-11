import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import type { MetaFunction } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { authClient } from '~/lib/auth-client';

export const meta: MetaFunction = () => [
  { title: 'Reset Password — Veyra' },
  { name: 'description', content: 'Set a new password for your Veyra account' },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-veyra-elements-background-depth-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <div className="i-ph:warning-circle-duotone text-red-400 text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-veyra-elements-textPrimary mb-2">Invalid link</h1>
          <p className="text-sm text-veyra-elements-textSecondary mb-6">This password reset link is missing or invalid. Please request a new one.</p>
          <Link to="/forgot-password" className="text-accent-400 hover:text-accent-300 font-semibold text-sm transition-colors">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authClient.resetPassword({ newPassword: password, token });

      if (result.error) {
        setError(result.error.message || 'This link may have expired. Request a new one.');
      } else {
        setDone(true);
        toast.success('Password updated!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-veyra-elements-background-depth-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-accent-300 text-xs font-bold">V</div>
          <span className="text-base font-bold text-veyra-elements-textPrimary">Veyra</span>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
              <div className="i-ph:check-circle-duotone text-green-400 text-2xl" />
            </div>
            <h1 className="text-2xl font-black text-veyra-elements-textPrimary mb-2">Password updated!</h1>
            <p className="text-sm text-veyra-elements-textSecondary">Redirecting you to sign in…</p>
          </motion.div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-veyra-elements-textPrimary mb-1">Set new password</h1>
            <p className="text-sm text-veyra-elements-textSecondary mb-8">Choose a strong password for your account.</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
                {error.includes('expired') && (
                  <span> <Link to="/forgot-password" className="underline text-red-300">Request a new link</Link>.</span>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoFocus
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-veyra-elements-textSecondary mb-1.5">Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
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
                {isLoading ? 'Updating…' : 'Update password'}
              </motion.button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

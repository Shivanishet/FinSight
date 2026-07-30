import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AuthShell } from '../components/AuthShell';
import { Spinner } from '../components/ui';
import { supabase } from '../services/supabase';
import { requestPasswordReset, updatePassword } from '../services/auth';

export function ResetPassword() {
  const { toast } = useToast();
  const [step, setStep] = useState<'request' | 'complete' | 'success' | 'error' | 'loading'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Checking reset link...');

  useEffect(() => {
    const checkLink = async () => {
      const url = new URL(window.location.href);
      const type = url.searchParams.get('type');
      if (type !== 'recovery' && !window.location.hash.includes('access_token=')) {
        setStep('request');
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setStep('complete');
          return;
        }
        setStep('error');
        setMessage('This reset link is invalid or expired. Request a new password reset email.');
      } catch (err) {
        setStep('error');
        setMessage(
          err instanceof Error
            ? err.message
            : 'This reset link is invalid or expired. Request a new password reset email.',
        );
      }
    };

    checkLink();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast('Password reset email sent.', 'success');
      setEmail('');
      setStep('request');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      toast('Password changed.', 'success');
      setPassword('');
      setConfirm('');
      setStep('success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <AuthShell title="Reset password" subtitle="Preparing your password reset flow.">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner className="h-10 w-10 text-brand-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (step === 'error') {
    return (
      <AuthShell title="Reset password" subtitle="There was an issue with your reset link.">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-rose-600 dark:bg-slate-800">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reset link problem</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            <Link to="/reset-password" className="inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Request a new link
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (step === 'success') {
    return (
      <AuthShell title="Password updated" subtitle="Your password is now updated.">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-brand-600 dark:bg-slate-800">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All set!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">You can now sign in with your new password.</p>
            <Link to="/login" className="inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Return to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset password" subtitle="Securely reset your password.">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {step === 'complete' ? (
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="new-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
                className="input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <button type="button" onClick={() => setShowPw((s) => !s)} className="font-semibold text-brand-600 hover:text-brand-700">
                {showPw ? 'Hide password' : 'Show password'}
              </button>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Saving…' : 'Save new password'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="label" htmlFor="reset-email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending reset email…' : 'Send reset email'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

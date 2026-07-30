import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Spinner } from '../components/ui';

export function VerifyEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get('error_description');
    const type = params.get('type');

    if (errorDescription) {
      setStatus('error');
      setMessage(errorDescription);
      return;
    }

    if (type === 'signup') {
      setStatus('success');
      setMessage('Your email verification was successful. You can now sign in.');
      return;
    }

    setStatus('error');
    setMessage('Unable to validate this verification link. Please try signing in or request a new email verification.');
  }, []);

  return (
    <AuthShell title="Email verification" subtitle="Finish setting up your account.">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner className="h-10 w-10 text-brand-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-brand-600 dark:bg-slate-800">
              {status === 'success' ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{status === 'success' ? 'Email confirmed' : 'Verification failed'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            <div className="mt-4">
              <Link
                to="/login"
                className="inline-flex rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

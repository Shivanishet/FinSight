import { useState } from 'react';
import { Mail, Lock, Check, Shield, Calendar, Receipt, TrendingUp, PiggyBank, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Card, StatCard } from '../components/ui';
import { updateEmail, updatePassword } from '../services/auth';
import { formatCurrency, formatDate } from '../utils/format';

export function Profile() {
  const { user } = useAuth();
  const { expenses, income, budgets, insights } = useData();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPw) {
      toast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      toast('Password changed.', 'success');
      setNewPassword('');
      setConfirmPw('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) {
      toast('Please enter a valid email.', 'error');
      return;
    }
    setSavingEmail(true);
    try {
      await updateEmail(newEmail);
      toast('Verification sent to your new email. Confirm it to complete the change.', 'success');
      setNewEmail('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update email', 'error');
    } finally {
      setSavingEmail(false);
    }
  };

  const createdAt = user?.created_at ? formatDate(user.created_at, { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account and view your stats.</p>
      </div>

      {/* Profile header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-3xl font-bold shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.email ?? 'User'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Free plan · Member since {createdAt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Check className="h-3 w-3" /> Active
              </span>
              <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                <Shield className="h-3 w-3" /> JWT secured
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Account stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Expenses" value={String(expenses.length)} icon={Receipt} accent="rose" />
        <StatCard label="Income records" value={String(income.length)} icon={TrendingUp} accent="accent" />
        <StatCard label="Budgets" value={String(budgets.length)} icon={PiggyBank} accent="amber" />
        <StatCard label="Insights" value={String(insights.length)} icon={Sparkles} accent="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Account details */}
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Account details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user?.email ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Member since</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{createdAt}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Auth provider</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Email + password</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Update email</h2>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="label" htmlFor="new-email">New email</label>
              <input
                id="new-email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={savingEmail}>
              {savingEmail ? 'Sending verification…' : 'Change email'}
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Update password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="label" htmlFor="np">New password</label>
              <input
                id="np"
                type="password"
                minLength={6}
                className="input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label" htmlFor="cp">Confirm password</label>
              <input
                id="cp"
                type="password"
                minLength={6}
                className="input"
                placeholder="••••••••"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </Card>
      </div>

      {/* Lifetime totals */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Lifetime totals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Total income</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(income.reduce((s, i) => s + Number(i.amount), 0))}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 p-4">
            <p className="text-xs text-rose-700 dark:text-rose-400">Total expenses</p>
            <p className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">
              {formatCurrency(expenses.reduce((s, e) => s + Number(e.amount), 0))}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 p-4">
            <p className="text-xs text-brand-700 dark:text-brand-400">Net balance</p>
            <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-300">
              {formatCurrency(
                income.reduce((s, i) => s + Number(i.amount), 0) -
                  expenses.reduce((s, e) => s + Number(e.amount), 0),
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

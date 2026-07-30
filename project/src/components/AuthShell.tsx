import type { ReactNode } from 'react';
import { Wallet, Check } from 'lucide-react';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">FinSight</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">Your AI-powered financial intelligence platform.</h2>
            <p className="text-brand-100/80 max-w-md">
              Track expenses, set budgets, and get personalized AI insights that actually help you save money.
            </p>
            <ul className="space-y-2 pt-2">
              {['Automatic expense categorization', 'Smart spending predictions', 'Unusual expense detection', 'Personalized savings coach'].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-brand-100">
                    <Check className="h-4 w-4" /> {f}
                  </li>
                ),
              )}
            </ul>
          </div>
          <p className="text-xs text-brand-200/60">© 2026 FinSight. All rights reserved.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">FinSight</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

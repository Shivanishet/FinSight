import { useMemo, useState } from 'react';
import { Plus, Trash2, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, EmptyState, Progress, Spinner, Badge } from '../components/ui';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { CATEGORIES } from '../types';
import { formatCurrency, currentMonth, formatMonth, monthKey } from '../utils/format';

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function Budgets() {
  const { budgets, expenses, loading, saveBudget, removeBudget } = useData();
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<string>('Food');
  const [limit, setLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === month), [budgets, month]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (monthKey(new Date(e.date)) === month) {
        map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
      }
    }
    return map;
  }, [expenses, month]);

  const totalBudget = monthBudgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + (spentByCategory.get(b.category) ?? 0), 0);

  const openAdd = () => {
    setCategory('Food');
    setLimit('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(limit);
    if (!amt || amt <= 0) {
      toast('Enter a valid limit.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await saveBudget({ category, limit_amount: amt, month });
      setFormOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save budget', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Set monthly spending limits per category.</p>
        </div>
        <button onClick={openAdd} className="btn-primary self-start">
          <Plus className="h-4 w-4" /> New budget
        </button>
      </div>

      {/* Month switcher */}
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth((m) => shiftMonth(m, -1))} className="btn-ghost px-2.5">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatMonth(month)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)} used
          </p>
        </div>
        <button onClick={() => setMonth((m) => shiftMonth(m, 1))} className="btn-ghost px-2.5">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : monthBudgets.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <EmptyState
                icon={PiggyBank}
                title="No budgets for this month"
                description="Create a budget to set a spending limit for a category."
                action={<button onClick={openAdd} className="btn-primary"><Plus className="h-4 w-4" /> New budget</button>}
              />
            </Card>
          </div>
        ) : (
          monthBudgets.map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            const util = b.limit_amount > 0 ? (spent / Number(b.limit_amount)) * 100 : 0;
            const remaining = Number(b.limit_amount) - spent;
            return (
              <Card key={b.id} hover>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{b.category}</h3>
                      {util >= 100 && <Badge color="rose">Over budget</Badge>}
                      {util >= 80 && util < 100 && <Badge color="amber">Near limit</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Limit {formatCurrency(Number(b.limit_amount))}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBudget(b.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                    aria-label="Delete budget"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">
                      Spent {formatCurrency(spent)}
                    </span>
                    <span className={remaining < 0 ? 'text-rose-600 font-medium' : 'text-slate-500 dark:text-slate-400'}>
                      {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                    </span>
                  </div>
                  <Progress value={util} />
                  <p className="mt-1.5 text-xs text-slate-400">{Math.round(util)}% utilized</p>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New budget"
        description={`Set a monthly limit for ${formatMonth(month)}.`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" form="budget-form" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save budget'}
            </button>
          </>
        }
      >
        <form id="budget-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="b-cat">Category</label>
            <select id="b-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="b-limit">Monthly limit</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                id="b-limit"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                className="input pl-7"
                placeholder="500.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

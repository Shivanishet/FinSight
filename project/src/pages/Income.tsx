import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, EmptyState, Badge, Spinner, StatCard } from '../components/ui';
import { IncomeForm } from '../components/IncomeForm';
import { formatCurrency, formatDate } from '../utils/format';
import type { Income } from '../types';

export function IncomePage() {
  const { income, loading, addIncome, updateIncome, removeIncome } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      income.filter(
        (i) =>
          !search ||
          i.source.toLowerCase().includes(search.toLowerCase()) ||
          i.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [income, search],
  );

  const total = income.reduce((s, i) => s + Number(i.amount), 0);
  const avgMonthly = income.length > 0 ? total / Math.max(1, new Set(income.map((i) => i.date.slice(0, 7))).size) : 0;

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (i: Income) => {
    setEditing(i);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Income</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track all your income sources.</p>
        </div>
        <button onClick={openAdd} className="btn-primary self-start">
          <Plus className="h-4 w-4" /> Add income
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Income" value={formatCurrency(total)} icon={TrendingUp} accent="accent" loading={loading} />
        <StatCard label="Avg per Month" value={formatCurrency(avgMonthly)} icon={TrendingUp} accent="brand" loading={loading} />
      </div>

      <Card>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search income…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title={income.length === 0 ? 'No income recorded' : 'No matching income'}
            description={income.length === 0 ? 'Add your first income source to see your cash flow.' : 'Adjust your search.'}
            action={income.length === 0 ? <button onClick={openAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add income</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3.5">
                      <Badge color="emerald">{i.source}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{i.description || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(i.date)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(Number(i.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(i)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-700 transition"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeIncome(i.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <IncomeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          if (editing) await updateIncome(editing.id, input);
          else await addIncome(input);
        }}
        initial={editing}
      />
    </div>
  );
}

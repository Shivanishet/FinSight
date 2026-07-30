import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Receipt, Search, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, EmptyState, Badge, Spinner } from '../components/ui';
import { ExpenseForm } from '../components/ExpenseForm';
import { formatCurrency, formatDate } from '../utils/format';
import type { Expense } from '../types';
import { CATEGORIES } from '../types';

const CAT_COLORS: Record<string, 'brand' | 'emerald' | 'amber' | 'rose' | 'slate'> = {
  Food: 'emerald',
  Transport: 'brand',
  Housing: 'rose',
  Utilities: 'amber',
  Entertainment: 'brand',
  Healthcare: 'rose',
  Shopping: 'amber',
  Education: 'emerald',
  Travel: 'brand',
  Other: 'slate',
};

export function Expenses() {
  const { expenses, loading, addExpense, updateExpense, removeExpense } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !search ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filterCat === 'all' || e.category === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [expenses, search, filterCat]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} transactions · {formatCurrency(total)}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary self-start">
          <Plus className="h-4 w-4" /> Add expense
        </button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search expenses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              className="input pl-9 sm:w-44"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
            description={expenses.length === 0 ? 'Add your first expense to start tracking your spending.' : 'Try adjusting your search or filter.'}
            action={expenses.length === 0 ? <button onClick={openAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add expense</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{e.description || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge color={CAT_COLORS[e.category] ?? 'slate'}>{e.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(e.date)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(Number(e.amount))}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(e)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-700 transition"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeExpense(e.id)}
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

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          if (editing) await updateExpense(editing.id, input);
          else await addExpense(input);
        }}
        initial={editing}
      />
    </div>
  );
}

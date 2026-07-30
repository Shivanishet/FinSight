import { useEffect, useState } from 'react';
import { CATEGORIES, type Expense } from '../types';
import { suggestCategory } from '../services/ai';
import { Modal } from './Modal';
import { useToast } from '../context/ToastContext';
import { todayISO, isFutureDate } from '../utils/format';
import { Wand2 } from 'lucide-react';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { amount: number; category: string; description?: string; date: string }) => Promise<void>;
  initial?: Expense | null;
}

export function ExpenseForm({ open, onClose, onSubmit, initial }: ExpenseFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(initial ? String(initial.amount) : '');
      setCategory(initial?.category ?? 'Food');
      setDescription(initial?.description ?? '');
      setDate(initial?.date ?? todayISO());
      setDateError(null);
    }
  }, [open, initial]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    
    // Clear error if date is valid
    if (newDate && !isFutureDate(newDate)) {
      setDateError(null);
    }
  };

  const autoCategorize = () => {
    if (!description.trim()) {
      toast('Add a description first for smart categorization.', 'info');
      return;
    }
    const suggested = suggestCategory(description);
    setCategory(suggested);
    toast(`Suggested category: ${suggested}`, 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date
    if (isFutureDate(date)) {
      setDateError('Expenses cannot be added for a future date.');
      toast('Expenses cannot be added for a future date.', 'error');
      return;
    }
    
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast('Enter a valid amount.', 'error');
      return;
    }
    if (!category) {
      toast('Choose a category.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        amount: amt,
        category,
        description: description.trim() || undefined,
        date,
      });
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit expense' : 'Add expense'}
      description="Track a new spending transaction."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="expense-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add expense'}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="amount">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className="input pl-7"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="category">Category</label>
          <div className="flex gap-2">
            <select
              id="category"
              className="input flex-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={autoCategorize}
              className="btn-secondary shrink-0"
              title="AI-suggest category from description"
            >
              <Wand2 className="h-4 w-4" />
              AI
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            max={todayISO()}
            className={`input ${dateError ? 'border-rose-500' : ''}`}
            value={date}
            onChange={handleDateChange}
          />
          {dateError && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{dateError}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="description">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            id="description"
            className="input min-h-[80px] resize-y"
            placeholder="e.g. Grocery run at Whole Foods"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

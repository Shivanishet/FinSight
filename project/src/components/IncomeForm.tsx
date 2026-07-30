import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useToast } from '../context/ToastContext';
import { CATEGORIES } from '../types';
import { todayISO, isFutureDate } from '../utils/format';

interface IncomeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { amount: number; source: string; description?: string; date: string }) => Promise<void>;
  initial?: { id: string; amount: number; source: string; description: string | null; date: string } | null;
}

const SOURCES = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Gift', 'Refund', 'Other'];

export function IncomeForm({ open, onClose, onSubmit, initial }: IncomeFormProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount(initial ? String(initial.amount) : '');
      setSource(initial?.source ?? 'Salary');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date
    if (isFutureDate(date)) {
      setDateError('Income cannot be added for a future date.');
      toast('Income cannot be added for a future date.', 'error');
      return;
    }
    
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast('Enter a valid amount.', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({
        amount: amt,
        source,
        description: description.trim() || undefined,
        date,
      });
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save income', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit income' : 'Add income'}
      description="Log a new income source."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="income-form" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add income'}
          </button>
        </>
      }
    >
      <form id="income-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="i-amount">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              id="i-amount"
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
          <label className="label" htmlFor="i-source">Source</label>
          <select id="i-source" className="input" value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="i-date">Date</label>
          <input 
            id="i-date" 
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
          <label className="label" htmlFor="i-desc">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            id="i-desc"
            className="input min-h-[80px] resize-y"
            placeholder="e.g. October paycheck"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

export { CATEGORIES };

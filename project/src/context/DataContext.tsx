import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import * as api from '../services/api';
import { generateInsights } from '../services/ai';
import { insertInsights } from '../services/api';
import type { Expense, Income, Budget, Insight, Analytics } from '../types';
import { currentMonth } from '../utils/format';

interface DataContextValue {
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
  insights: Insight[];
  analytics: Analytics | null;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshInsights: () => Promise<void>;
  addExpense: (input: { amount: number; category: string; description?: string; date: string }) => Promise<void>;
  updateExpense: (id: string, input: Partial<Pick<Expense, 'amount' | 'category' | 'description' | 'date'>>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addIncome: (input: { amount: number; source: string; description?: string; date: string }) => Promise<void>;
  updateIncome: (id: string, input: Partial<Pick<Income, 'amount' | 'source' | 'description' | 'date'>>) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
  saveBudget: (input: { category: string; limit_amount: number; month: string }) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  markInsightRead: (id: string) => Promise<void>;
  removeInsight: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setIncome([]);
      setBudgets([]);
      setInsights([]);
      setAnalytics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [exp, inc, bud, ins] = await Promise.all([
        api.listExpenses(),
        api.listIncome(),
        api.listBudgets(),
        api.listInsights(),
      ]);
      setExpenses(exp);
      setIncome(inc);
      setBudgets(bud);
      setInsights(ins);
      const an = await api.getAnalytics();
      setAnalytics(an);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load data';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const refreshInsights = useCallback(async () => {
    if (!user) return;
    try {
      const generated = generateInsights({ expenses, income, budgets });
      if (generated.length === 0) {
        toast('No new insights to generate right now.', 'info');
        return;
      }
      await insertInsights(generated);
      const ins = await api.listInsights();
      setInsights(ins);
      toast(`Generated ${generated.length} fresh AI insights.`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate insights';
      toast(msg, 'error');
    }
  }, [user, expenses, income, budgets, toast]);

  const addExpense: DataContextValue['addExpense'] = useCallback(
    async (input) => {
      await api.createExpense(input);
      await refresh();
      toast('Expense added.', 'success');
    },
    [refresh, toast],
  );

  const updateExpense: DataContextValue['updateExpense'] = useCallback(
    async (id, input) => {
      await api.updateExpense(id, input);
      await refresh();
      toast('Expense updated.', 'success');
    },
    [refresh, toast],
  );

  const removeExpense: DataContextValue['removeExpense'] = useCallback(
    async (id) => {
      await api.deleteExpense(id);
      await refresh();
      toast('Expense deleted.', 'info');
    },
    [refresh, toast],
  );

  const addIncome: DataContextValue['addIncome'] = useCallback(
    async (input) => {
      await api.createIncome(input);
      await refresh();
      toast('Income added.', 'success');
    },
    [refresh, toast],
  );

  const updateIncome: DataContextValue['updateIncome'] = useCallback(
    async (id, input) => {
      await api.updateIncome(id, input);
      await refresh();
      toast('Income updated.', 'success');
    },
    [refresh, toast],
  );

  const removeIncome: DataContextValue['removeIncome'] = useCallback(
    async (id) => {
      await api.deleteIncome(id);
      await refresh();
      toast('Income deleted.', 'info');
    },
    [refresh, toast],
  );

  const saveBudget: DataContextValue['saveBudget'] = useCallback(
    async (input) => {
      await api.upsertBudget(input);
      await refresh();
      toast('Budget saved.', 'success');
    },
    [refresh, toast],
  );

  const removeBudget: DataContextValue['removeBudget'] = useCallback(
    async (id) => {
      await api.deleteBudget(id);
      await refresh();
      toast('Budget deleted.', 'info');
    },
    [refresh, toast],
  );

  const markInsightRead: DataContextValue['markInsightRead'] = useCallback(
    async (id) => {
      await api.markInsightRead(id);
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    },
    [],
  );

  const removeInsight: DataContextValue['removeInsight'] = useCallback(
    async (id) => {
      await api.deleteInsight(id);
      setInsights((prev) => prev.filter((i) => i.id !== id));
      toast('Insight dismissed.', 'info');
    },
    [toast],
  );

  const value: DataContextValue = {
    expenses,
    income,
    budgets,
    insights,
    analytics,
    loading,
    refresh,
    refreshInsights,
    addExpense,
    updateExpense,
    removeExpense,
    addIncome,
    updateIncome,
    removeIncome,
    saveBudget,
    removeBudget,
    markInsightRead,
    removeInsight,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export { currentMonth };

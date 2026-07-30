import { supabase } from './supabase';
import type { Expense, Income, Budget, Insight, Analytics } from '../types';
import { monthKey, monthLabel, getMonthsUpToCurrent } from '../utils/format';

function handleError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/**
 * Validate that a date is not in the future
 * Throws an error if the date is in the future
 */
function validateNotFutureDate(dateStr: string, fieldName: string): void {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  if (date > today) {
    throw new Error(`${fieldName} cannot be added for a future date.`);
  }
}

/* ---------------- Expenses ---------------- */
export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  return handleError(data, error) ?? [];
}

export async function createExpense(input: {
  amount: number;
  category: string;
  description?: string;
  date: string;
}): Promise<Expense> {
  // Backend validation: prevent future dates
  validateNotFutureDate(input.date, 'Expenses');
  
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      amount: input.amount,
      category: input.category,
      description: input.description || null,
      date: input.date,
    })
    .select()
    .single();
  return handleError(data, error);
}

export async function updateExpense(
  id: string,
  input: Partial<Pick<Expense, 'amount' | 'category' | 'description' | 'date'>>,
): Promise<Expense> {
  // Backend validation: prevent future dates if date is being updated
  if (input.date) {
    validateNotFutureDate(input.date, 'Expenses');
  }
  
  const { data, error } = await supabase.from('expenses').update(input).eq('id', id).select().single();
  return handleError(data, error);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------- Income ---------------- */
export async function listIncome(): Promise<Income[]> {
  const { data, error } = await supabase.from('income').select('*').order('date', { ascending: false });
  return handleError(data, error) ?? [];
}

export async function createIncome(input: {
  amount: number;
  source: string;
  description?: string;
  date: string;
}): Promise<Income> {
  // Backend validation: prevent future dates
  validateNotFutureDate(input.date, 'Income');
  
  const { data, error } = await supabase
    .from('income')
    .insert({
      amount: input.amount,
      source: input.source,
      description: input.description || null,
      date: input.date,
    })
    .select()
    .single();
  return handleError(data, error);
}

export async function updateIncome(
  id: string,
  input: Partial<Pick<Income, 'amount' | 'source' | 'description' | 'date'>>,
): Promise<Income> {
  // Backend validation: prevent future dates if date is being updated
  if (input.date) {
    validateNotFutureDate(input.date, 'Income');
  }
  
  const { data, error } = await supabase.from('income').update(input).eq('id', id).select().single();
  return handleError(data, error);
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('income').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------- Budgets ---------------- */
export async function listBudgets(month?: string): Promise<Budget[]> {
  let q = supabase.from('budgets').select('*').order('category', { ascending: true });
  if (month) q = q.eq('month', month);
  const { data, error } = await q;
  return handleError(data, error) ?? [];
}

export async function upsertBudget(input: {
  category: string;
  limit_amount: number;
  month: string;
}): Promise<Budget> {
  // try update first, else insert
  const { data: existing } = await supabase
    .from('budgets')
    .select('*')
    .eq('category', input.category)
    .eq('month', input.month)
    .maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from('budgets')
      .update({ limit_amount: input.limit_amount })
      .eq('id', existing.id)
      .select()
      .single();
    return handleError(data, error);
  }
  const { data, error } = await supabase
    .from('budgets')
    .insert(input)
    .select()
    .single();
  return handleError(data, error);
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------- Insights ---------------- */
export async function listInsights(): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .order('created_at', { ascending: false });
  return handleError(data, error) ?? [];
}

export async function markInsightRead(id: string): Promise<void> {
  const { error } = await supabase.from('insights').update({ read: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteInsight(id: string): Promise<void> {
  const { error } = await supabase.from('insights').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertInsights(insights: Omit<Insight, 'id' | 'created_at' | 'read'>[]): Promise<void> {
  if (insights.length === 0) return;
  const { error } = await supabase.from('insights').insert(insights);
  if (error) throw new Error(error.message);
}

/* ---------------- Analytics ---------------- */
export async function getAnalytics(): Promise<Analytics> {
  const [expenses, income, budgets] = await Promise.all([
    listExpenses(),
    listIncome(),
    listBudgets(monthKey(new Date())),
  ]);

  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Only include months up to the current month (exclude future months)
  const months = getMonthsUpToCurrent(6);
  const monthlyTrends = months.map((m) => {
    const inc = income
      .filter((i) => monthKey(new Date(i.date)) === m)
      .reduce((s, i) => s + Number(i.amount), 0);
    const exp = expenses
      .filter((e) => monthKey(new Date(e.date)) === m)
      .reduce((s, e) => s + Number(e.amount), 0);
    return { month: monthLabel(m), income: inc, expenses: exp, savings: inc - exp };
  });

  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + Number(e.amount));
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const budgetUtilization = budgets.map((b) => {
    const spent = expenses
      .filter((e) => e.category === b.category && monthKey(new Date(e.date)) === b.month)
      .reduce((s, e) => s + Number(e.amount), 0);
    return {
      category: b.category,
      limit: Number(b.limit_amount),
      spent,
      utilization: b.limit_amount > 0 ? (spent / Number(b.limit_amount)) * 100 : 0,
    };
  });

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    monthlyTrends,
    categoryBreakdown,
    budgetUtilization,
  };
}

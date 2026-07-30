import type { Expense, Income, Budget, Insight } from '../types';
import { monthKey, monthLabel, lastNMonths, formatCurrency } from '../utils/format';

interface GenerateArgs {
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
}

const KEYWORDS: Record<string, string[]> = {
  Food: ['grocery', 'restaurant', 'cafe', 'coffee', 'pizza', 'food', 'lunch', 'dinner', 'breakfast', 'snack', 'uber eats', 'doordash'],
  Transport: ['uber', 'lyft', 'gas', 'fuel', 'transit', 'bus', 'train', 'taxi', 'parking', 'car', 'metro', 'flight'],
  Housing: ['rent', 'mortgage', 'apartment', 'landlord', 'hoa', 'home'],
  Utilities: ['electric', 'water', 'gas bill', 'internet', 'wifi', 'phone', 'cable', 'utility', 'broadband'],
  Entertainment: ['netflix', 'spotify', 'movie', 'concert', 'game', 'steam', 'hulu', 'disney', 'ticket'],
  Healthcare: ['doctor', 'pharmacy', 'dental', 'hospital', 'medicine', 'therapy', 'gym', 'health', 'prescription'],
  Shopping: ['amazon', 'mall', 'clothes', 'shoes', 'electronics', 'target', 'walmart', 'store'],
  Education: ['tuition', 'course', 'book', 'class', 'udemy', 'coursera', 'school', 'training'],
  Travel: ['hotel', 'airbnb', 'vacation', 'trip', 'resort', 'booking'],
};

export function suggestCategory(description: string, fallback = 'Other'): string {
  const lower = description.toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return cat;
  }
  return fallback;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function generateInsights({ expenses, income, budgets }: GenerateArgs): Omit<
  Insight,
  'id' | 'created_at' | 'read'
>[] {
  const out: Omit<Insight, 'id' | 'created_at' | 'read'>[] = [];
  const thisMonth = monthKey(new Date());

  /* 1. Categorization suggestions */
  const uncategorized = expenses.filter(
    (e) => e.category === 'Other' && e.description,
  );
  const seen = new Set<string>();
  for (const e of uncategorized.slice(0, 5)) {
    const suggested = suggestCategory(e.description ?? '');
    if (suggested !== 'Other' && !seen.has(e.id)) {
      seen.add(e.id);
      out.push({
        type: 'categorization',
        title: 'Smart categorization suggestion',
        body: `Your expense "${e.description}" ($${Number(e.amount).toFixed(2)}) looks like it belongs in ${suggested}.`,
        severity: 'info',
        metadata: { expenseId: e.id, suggested },
      });
    }
  }

  /* 2. Monthly spending prediction */
  const months = lastNMonths(4);
  const monthlyTotals = months.map((m) =>
    expenses.filter((e) => monthKey(new Date(e.date)) === m).reduce((s, e) => s + Number(e.amount), 0),
  );
  const recentAvg = avg(monthlyTotals.slice(-3));
  const trend = monthlyTotals[3] - monthlyTotals[2];
  const predicted = Math.max(0, recentAvg + trend * 0.3);
  out.push({
    type: 'prediction',
    title: 'Next month spending forecast',
    body: `Based on your last 3 months averaging ${formatCurrency(recentAvg)}, we project next month's spending around ${formatCurrency(predicted)}.`,
    severity: trend > 0 ? 'warning' : 'positive',
    metadata: { predicted, average: recentAvg, trend },
  });

  /* 3. Unusual expense detection */
  const byCategory = new Map<string, number[]>();
  for (const e of expenses) {
    const arr = byCategory.get(e.category) ?? [];
    arr.push(Number(e.amount));
    byCategory.set(e.category, arr);
  }
  for (const e of expenses.slice(0, 50)) {
    const arr = byCategory.get(e.category) ?? [];
    if (arr.length < 3) continue;
    const mean = avg(arr);
    const std = Math.sqrt(avg(arr.map((n) => (n - mean) ** 2)));
    if (std > 0 && Number(e.amount) > mean + 2 * std && Number(e.amount) > mean * 1.8) {
      out.push({
        type: 'anomaly',
        title: 'Unusual expense detected',
        body: `A ${e.category} expense of ${formatCurrency(Number(e.amount))} on ${new Date(e.date).toLocaleDateString()} is significantly higher than your typical ${formatCurrency(mean)} in this category.`,
        severity: 'warning',
        metadata: { expenseId: e.id, mean, amount: Number(e.amount) },
      });
      break;
    }
  }

  /* 4. Budget warnings */
  for (const b of budgets.filter((b) => b.month === thisMonth)) {
    const spent = expenses
      .filter((e) => e.category === b.category && monthKey(new Date(e.date)) === b.month)
      .reduce((s, e) => s + Number(e.amount), 0);
    const ratio = b.limit_amount > 0 ? spent / Number(b.limit_amount) : 0;
    if (ratio >= 0.9) {
      out.push({
        type: 'recommendation',
        title: 'Budget alert',
        body: `You've used ${Math.round(ratio * 100)}% of your ${b.category} budget (${formatCurrency(spent)} of ${formatCurrency(Number(b.limit_amount))}). ${ratio >= 1 ? "You're over budget — consider trimming here next month." : 'Consider slowing down spending in this category.'}`,
        severity: ratio >= 1 ? 'warning' : 'warning',
        metadata: { category: b.category, spent, limit: Number(b.limit_amount) },
      });
    }
  }

  /* 5. Savings recommendation */
  const lastMonth = months[3];
  const lastMonthIncome = income
    .filter((i) => monthKey(new Date(i.date)) === lastMonth)
    .reduce((s, i) => s + Number(i.amount), 0);
  const lastMonthExpenses = monthlyTotals[3];
  const savingsRate = lastMonthIncome > 0 ? (lastMonthIncome - lastMonthExpenses) / lastMonthIncome : 0;
  if (savingsRate < 0.2 && lastMonthIncome > 0) {
    out.push({
      type: 'recommendation',
      title: 'Boost your savings rate',
      body: `Your savings rate last ${monthLabel(lastMonth)} was ${Math.round(savingsRate * 100)}%. Financial coaches recommend saving at least 20% of income. Trimming your top category could close the gap.`,
      severity: 'warning',
      metadata: { savingsRate, income: lastMonthIncome, expenses: lastMonthExpenses },
    });
  } else if (savingsRate >= 0.2 && lastMonthIncome > 0) {
    out.push({
      type: 'recommendation',
      title: 'Great savings performance',
      body: `You saved ${Math.round(savingsRate * 100)}% of your income last ${monthLabel(lastMonth)} — above the 20% benchmark. Keep it up!`,
      severity: 'positive',
      metadata: { savingsRate },
    });
  }

  /* 6. Coach message */
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
  const net = totalIncome - totalExpenses;
  out.push({
    type: 'coach',
    title: 'Your AI financial coach',
    body:
      net >= 0
        ? `You're net positive by ${formatCurrency(net)} overall. Stay consistent with tracking — small daily reviews compound into big financial wins.`
        : `You're currently net negative by ${formatCurrency(Math.abs(net))}. Let's focus on your top 2 spending categories this month and find one subscription to pause.`,
    severity: net >= 0 ? 'positive' : 'warning',
    metadata: { net },
  });

  return out;
}

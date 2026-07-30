import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { generateInsights } from '../services/ai';
import { currentMonth } from '../utils/format';

const SEED_FLAG_KEY = 'finsight-seeded';

interface SeedArgs {
  expenses: { amount: number; category: string; description: string; date: string }[];
  income: { amount: number; source: string; description: string; date: string }[];
  budgets: { category: string; limit_amount: number; month: string }[];
}

function buildSampleData(): SeedArgs {
  const today = new Date();
  const thisMonth = currentMonth();
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const expenses = [
    { amount: 64.2, category: 'Food', description: 'Whole Foods grocery run', date: iso(new Date(today.getFullYear(), today.getMonth(), 3)) },
    { amount: 12.5, category: 'Food', description: 'Lunch at Sweetgreen', date: iso(new Date(today.getFullYear(), today.getMonth(), 5)) },
    { amount: 48.0, category: 'Transport', description: 'Uber to airport', date: iso(new Date(today.getFullYear(), today.getMonth(), 7)) },
    { amount: 1200, category: 'Housing', description: 'Monthly rent', date: iso(new Date(today.getFullYear(), today.getMonth(), 1)) },
    { amount: 89.99, category: 'Utilities', description: 'Internet bill', date: iso(new Date(today.getFullYear(), today.getMonth(), 2)) },
    { amount: 15.99, category: 'Entertainment', description: 'Netflix subscription', date: iso(new Date(today.getFullYear(), today.getMonth(), 4)) },
    { amount: 240, category: 'Shopping', description: 'Amazon order — headphones', date: iso(new Date(today.getFullYear(), today.getMonth(), 8)) },
    { amount: 32.5, category: 'Healthcare', description: 'Pharmacy prescription', date: iso(new Date(today.getFullYear(), today.getMonth(), 9)) },
    { amount: 58.3, category: 'Food', description: 'Dinner with friends', date: iso(new Date(today.getFullYear(), today.getMonth(), 10)) },
    { amount: 45, category: 'Transport', description: 'Gas refill', date: iso(new Date(today.getFullYear(), today.getMonth(), 11)) },
    { amount: 520, category: 'Food', description: 'Groceries last month', date: iso(lastMonthDate) },
    { amount: 1180, category: 'Housing', description: 'Rent last month', date: iso(lastMonthDate) },
    { amount: 95, category: 'Utilities', description: 'Electric bill last month', date: iso(lastMonthDate) },
    { amount: 410, category: 'Food', description: 'Groceries', date: iso(new Date(today.getFullYear(), today.getMonth() - 2, 12)) },
    { amount: 1180, category: 'Housing', description: 'Rent', date: iso(new Date(today.getFullYear(), today.getMonth() - 2, 1)) },
  ];

  const income = [
    { amount: 4200, source: 'Salary', description: 'Monthly paycheck', date: iso(new Date(today.getFullYear(), today.getMonth(), 1)) },
    { amount: 850, source: 'Freelance', description: 'Design gig', date: iso(new Date(today.getFullYear(), today.getMonth(), 12)) },
    { amount: 4200, source: 'Salary', description: 'Paycheck', date: iso(lastMonthDate) },
    { amount: 4200, source: 'Salary', description: 'Paycheck', date: iso(new Date(today.getFullYear(), today.getMonth() - 2, 1)) },
    { amount: 300, source: 'Refund', description: 'Tax refund', date: iso(new Date(today.getFullYear(), today.getMonth() - 2, 18)) },
  ];

  const budgets = [
    { category: 'Food', limit_amount: 600, month: thisMonth },
    { category: 'Transport', limit_amount: 200, month: thisMonth },
    { category: 'Entertainment', limit_amount: 100, month: thisMonth },
    { category: 'Shopping', limit_amount: 300, month: thisMonth },
    { category: 'Utilities', limit_amount: 200, month: thisMonth },
  ];

  return { expenses, income, budgets };
}

export function useSeed() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const flag = localStorage.getItem(SEED_FLAG_KEY);
    if (flag === user.id) return;

    const run = async () => {
      setSeeding(true);
      try {
        // Only seed if the user has no data yet
        const { count } = await supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true });

        if (count === 0) {
          const data = buildSampleData();
          await supabase.from('expenses').insert(data.expenses);
          await supabase.from('income').insert(data.income);
          await supabase.from('budgets').insert(data.budgets);

          // Generate initial insights
          const exp = (await supabase.from('expenses').select('*')).data ?? [];
          const inc = (await supabase.from('income').select('*')).data ?? [];
          const bud = (await supabase.from('budgets').select('*')).data ?? [];
          const generated = generateInsights({ expenses: exp as any, income: inc as any, budgets: bud as any });
          if (generated.length) await supabase.from('insights').insert(generated);
        }
        localStorage.setItem(SEED_FLAG_KEY, user.id);
      } catch (e) {
        console.warn('Seed failed:', e);
      } finally {
        setSeeding(false);
      }
    };
    run();
  }, [user]);

  return { seeding };
}

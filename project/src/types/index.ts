export type Category =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Shopping'
  | 'Education'
  | 'Travel'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Travel',
  'Other',
];

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  month: string;
  created_at: string;
}

export type InsightType =
  | 'categorization'
  | 'prediction'
  | 'anomaly'
  | 'recommendation'
  | 'coach';

export type InsightSeverity = 'info' | 'warning' | 'positive';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  severity: InsightSeverity;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface Analytics {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyTrends: { month: string; income: number; expenses: number; savings: number }[];
  categoryBreakdown: { category: string; amount: number }[];
  budgetUtilization: {
    category: string;
    limit: number;
    spent: number;
    utilization: number;
  }[];
}

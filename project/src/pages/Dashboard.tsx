import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, StatCard, Progress, EmptyState, Spinner } from '../components/ui';
import { MonthlyTrendChart, CategoryPieChart } from '../components/charts';
import { formatCurrency, formatDate } from '../utils/format';
import type { InsightSeverity } from '../types';

const SEVERITY_STYLES: Record<InsightSeverity, string> = {
  info: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
};

export function Dashboard() {
  const { analytics, expenses, insights, loading, refreshInsights } = useData();

  const recentExpenses = useMemo(() => expenses.slice(0, 6), [expenses]);
  const topInsights = useMemo(() => insights.slice(0, 3), [insights]);

  if (loading && !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  const a = analytics!;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your financial overview at a glance.</p>
        </div>
        <button onClick={refreshInsights} className="btn-secondary self-start">
          <Sparkles className="h-4 w-4" />
          Generate AI insights
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatCurrency(a.totalIncome)} icon={TrendingUp} accent="accent" loading={loading} />
        <StatCard label="Total Expenses" value={formatCurrency(a.totalExpenses)} icon={TrendingDown} accent="rose" loading={loading} />
        <StatCard
          label="Current Balance"
          value={formatCurrency(a.balance)}
          icon={Wallet}
          accent="brand"
          loading={loading}
          trend={
            a.monthlyTrends.length >= 2
              ? {
                  value: `${a.balance >= 0 ? 'Net positive' : 'Net negative'} this period`,
                  positive: a.balance >= 0,
                }
              : undefined
          }
        />
        <StatCard
          label="Savings Rate"
          value={a.totalIncome > 0 ? `${Math.round((a.balance / a.totalIncome) * 100)}%` : '—'}
          icon={PiggyBank}
          accent="amber"
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Income vs Expenses</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 6 months</p>
            </div>
          </div>
          <MonthlyTrendChart data={a.monthlyTrends} />
        </Card>
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Spending by Category</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">All-time breakdown</p>
          </div>
          {a.categoryBreakdown.length > 0 ? (
            <CategoryPieChart data={a.categoryBreakdown} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">No expense data yet</div>
          )}
        </Card>
      </div>

      {/* Budgets + recent + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Budget Utilization</h2>
            <Link to="/budgets" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Manage
            </Link>
          </div>
          {a.budgetUtilization.length > 0 ? (
            <div className="space-y-4">
              {a.budgetUtilization.map((b) => (
                <div key={b.category}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{b.category}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <Progress value={b.utilization} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PiggyBank}
              title="No budgets set"
              description="Create budgets to track your spending limits by category."
              action={
                <Link to="/budgets" className="btn-primary">
                  <Plus className="h-4 w-4" /> Set a budget
                </Link>
              }
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent Expenses</h2>
            <Link to="/expenses" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {e.description || e.category}
                    </p>
                    <p className="text-xs text-slate-400">
                      {e.category} · {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(Number(e.amount))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No expenses yet"
              description="Add your first expense to start tracking."
              action={
                <Link to="/expenses" className="btn-primary">
                  <Plus className="h-4 w-4" /> Add expense
                </Link>
              }
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">AI Insights</h2>
            <Link to="/insights" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {topInsights.length > 0 ? (
            <div className="space-y-3">
              {topInsights.map((ins) => (
                <div key={ins.id} className={`rounded-xl border p-3 ${SEVERITY_STYLES[ins.severity]}`}>
                  <p className="text-sm font-semibold">{ins.title}</p>
                  <p className="mt-1 text-xs opacity-90 line-clamp-3">{ins.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No insights yet"
              description="Generate AI insights from your spending data."
              action={
                <button onClick={refreshInsights} className="btn-primary">
                  <Sparkles className="h-4 w-4" /> Generate
                </button>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}

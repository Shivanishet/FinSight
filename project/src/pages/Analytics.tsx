import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, StatCard, Progress, Spinner, EmptyState } from '../components/ui';
import { MonthlyTrendChart, SavingsTrendChart, CategoryPieChart, CategoryBarChart } from '../components/charts';
import { formatCurrency } from '../utils/format';

export function Analytics() {
  const { analytics, loading } = useData();

  const savingsData = useMemo(
    () => (analytics?.monthlyTrends ?? []).map((m) => ({ month: m.month, savings: m.savings })),
    [analytics],
  );

  if (loading && !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  const a = analytics!;
  const savingsRate = a.totalIncome > 0 ? (a.balance / a.totalIncome) * 100 : 0;
  const avgMonthlyExpense = a.monthlyTrends.length > 0 ? a.totalExpenses / a.monthlyTrends.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Deep dive into your financial patterns.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatCurrency(a.totalIncome)} icon={TrendingUp} accent="accent" loading={loading} />
        <StatCard label="Total Expenses" value={formatCurrency(a.totalExpenses)} icon={TrendingDown} accent="rose" loading={loading} />
        <StatCard label="Net Balance" value={formatCurrency(a.balance)} icon={Wallet} accent="brand" loading={loading} />
        <StatCard
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          accent="amber"
          loading={loading}
          trend={{ value: savingsRate >= 20 ? 'Healthy' : 'Below 20% target', positive: savingsRate >= 20 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Income vs Expenses</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Monthly trend, last 6 months</p>
          <MonthlyTrendChart data={a.monthlyTrends} />
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Savings Trend</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Monthly net savings</p>
          <SavingsTrendChart data={savingsData} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Category Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Share of total spending</p>
          {a.categoryBreakdown.length > 0 ? (
            <CategoryPieChart data={a.categoryBreakdown} />
          ) : (
            <EmptyState icon={BarChart3} title="No data" description="Add expenses to see category distribution." />
          )}
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Top Categories</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">By total amount spent</p>
          {a.categoryBreakdown.length > 0 ? (
            <CategoryBarChart data={a.categoryBreakdown.slice(0, 6)} />
          ) : (
            <EmptyState icon={BarChart3} title="No data" description="Add expenses to see top categories." />
          )}
        </Card>
      </div>

      {/* Budget utilization detail */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Budget Utilization</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Current month performance</p>
        {a.budgetUtilization.length > 0 ? (
          <div className="space-y-4">
            {a.budgetUtilization.map((b) => (
              <div key={b.category}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{b.category}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)} · {Math.round(b.utilization)}%
                  </span>
                </div>
                <Progress value={b.utilization} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={PiggyBank} title="No budgets this month" description="Set budgets in the Budgets page to track utilization." />
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Summary</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Key derived metrics</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg monthly expense</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(avgMonthlyExpense)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Top category</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {a.categoryBreakdown[0]?.category ?? '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total transactions</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {a.categoryBreakdown.reduce((s, c) => s + c.amount, 0) > 0 ? 'Tracked' : '0'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

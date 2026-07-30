import { useMemo, useState } from 'react';
import {
  Sparkles, Wand2, TrendingUp, AlertTriangle, Lightbulb, Brain, Check, Trash2, RefreshCw,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Card, EmptyState, Spinner, Badge } from '../components/ui';
import { formatDate } from '../utils/format';
import type { InsightType, InsightSeverity } from '../types';

const TYPE_META: Record<InsightType, { icon: typeof Sparkles; label: string; color: string }> = {
  categorization: { icon: Wand2, label: 'Categorization', color: 'brand' },
  prediction: { icon: TrendingUp, label: 'Prediction', color: 'brand' },
  anomaly: { icon: AlertTriangle, label: 'Anomaly', color: 'rose' },
  recommendation: { icon: Lightbulb, label: 'Recommendation', color: 'amber' },
  coach: { icon: Brain, label: 'Coach', color: 'emerald' },
};

const SEVERITY_BORDER: Record<InsightSeverity, string> = {
  info: 'border-l-brand-500',
  warning: 'border-l-amber-500',
  positive: 'border-l-emerald-500',
};

export function Insights() {
  const { insights, loading, refreshInsights, markInsightRead, removeInsight } = useData();
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(
    () => (filter === 'all' ? insights : insights.filter((i) => i.type === filter)),
    [insights, filter],
  );

  const unread = insights.filter((i) => !i.read).length;

  const handleGenerate = async () => {
    setGenerating(true);
    await refreshInsights();
    setGenerating(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            AI Insights
            {unread > 0 && <Badge color="brand">{unread} new</Badge>}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personalized intelligence from your financial data.
          </p>
        </div>
        <button onClick={handleGenerate} className="btn-primary self-start" disabled={generating}>
          {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Generating…' : 'Generate insights'}
        </button>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(TYPE_META) as InsightType[]).map((t) => {
          const meta = TYPE_META[t];
          const count = insights.filter((i) => i.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? 'all' : t)}
              className={`card p-4 text-left transition-all hover:shadow-card-hover ${filter === t ? 'ring-2 ring-brand-500' : ''}`}
            >
              <meta.icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{meta.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{count}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Sparkles}
            title="No insights yet"
            description="Generate AI-powered insights to discover spending patterns, predictions, and personalized recommendations."
            action={
              <button onClick={handleGenerate} className="btn-primary" disabled={generating}>
                <Sparkles className="h-4 w-4" /> Generate now
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ins) => {
            const meta = TYPE_META[ins.type];
            const Icon = meta.icon;
            return (
              <Card key={ins.id} className={`border-l-4 ${SEVERITY_BORDER[ins.severity]} ${!ins.read ? 'ring-1 ring-brand-200 dark:ring-brand-900' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{ins.title}</h3>
                      <Badge color={meta.color as any}>{meta.label}</Badge>
                      {!ins.read && <Badge color="brand">New</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{ins.body}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(ins.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!ins.read && (
                      <button
                        onClick={() => markInsightRead(ins.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 transition"
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeInsight(ins.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                      aria-label="Dismiss"
                      title="Dismiss"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

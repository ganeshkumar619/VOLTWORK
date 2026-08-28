import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Zap,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { BusinessAnalytics } from '../../types/index.ts';

export const AnalyticsPage: React.FC = () => {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('/api/analytics');
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p>{t('Calculating live database analytics...', 'Calculating live database analytics...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-cyan-400" />
          {t('Analytics', 'Business & Workforce Analytics')}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {t('Real database metrics calculating profitability, operational efficiency, and demand patterns', 'Real database metrics calculating profitability, operational efficiency, and demand patterns')}
        </p>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Total Revenue', 'Total Revenue')}</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatCurrency(analytics.totalRevenue)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Monthly', 'Month')}: {formatCurrency(analytics.thisMonthRevenue)}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Salary Expenses', 'Total Salary Expenses')}</span>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">
            {formatCurrency(analytics.totalSalaryExpense)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Pending Salaries', 'Pending')}: {formatCurrency(analytics.pendingSalaryExpense)}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Estimated Net Profit', 'Estimated Net Profit')}</span>
          <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {formatCurrency(analytics.estimatedProfit)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Revenue minus Technician Pay', 'Revenue minus Technician Pay')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Avg. Turnaround Time', 'Avg. Turnaround Time')}</span>
          <p className="text-2xl font-black text-purple-400 font-mono mt-1">
            {analytics.averageCompletionHours} {t('hours', 'hrs')}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('From request to completion', 'From request to completion')}</span>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart (SVG Bars) */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          {t('7-Day Revenue Flow', '7-Day Revenue Flow (₹)')}
        </h3>

        <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-zinc-800">
          {analytics.revenueTrend.map((item) => {
            const maxVal = Math.max(...analytics.revenueTrend.map((t) => t.amount), 1000);
            const heightPercent = Math.max(8, (item.amount / maxVal) * 100);

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition">
                  {formatCurrency(item.amount)}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all group-hover:brightness-125 shadow-sm shadow-cyan-500/20"
                />
                <span className="text-[10px] text-zinc-500 font-mono">{item.date.substring(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Top Electricians */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Categories Breakdown */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            {t('Service Volume by Category', 'Service Volume by Category')}
          </h3>

          <div className="space-y-3">
            {analytics.categoryDistribution.map((cat) => {
              const maxCount = Math.max(...analytics.categoryDistribution.map((c) => c.count), 1);
              const percent = (cat.count / maxCount) * 100;

              return (
                <div key={cat.category} className="text-xs space-y-1">
                  <div className="flex justify-between text-zinc-300">
                    <span className="font-medium">{t(cat.category, cat.category)}</span>
                    <span className="font-mono text-cyan-400">
                      {cat.count} {t('Jobs', 'jobs')} ({formatCurrency(cat.revenue)})
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Electrician Rankings */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            {t('Workforce Productivity Leaderboard', 'Workforce Productivity Leaderboard')}
          </h3>

          <div className="space-y-3">
            {analytics.topWorkers.map((w, idx) => (
              <div
                key={w.workerId}
                className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{w.workerName}</h4>
                    <p className="text-[10px] text-zinc-500">{t('Rating', 'Customer Rating')}: ★ {w.rating} / 5.0</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-cyan-300 block">{w.completedJobs} {t('Completed', 'Jobs Completed')}</span>
                  <span className="font-mono font-bold text-emerald-400 text-[11px]">
                    {formatCurrency(w.revenueGenerated)} {t('revenue', 'revenue')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


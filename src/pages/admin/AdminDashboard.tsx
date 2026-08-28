import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  UserCheck,
  TrendingUp,
  Banknote,
  DollarSign,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Compass,
  Radio,
  Settings,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDate, formatDateTime, formatTimeIST, formatDateIST } from '../../lib/formatters.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { AdminSiteProfileModal } from '../../components/AdminSiteProfileModal.tsx';
import type { BusinessAnalytics, Job, CompanySettings } from '../../types/index.ts';
import { useI18n } from '../../lib/i18n.tsx';

interface AdminDashboardProps {
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectJob, onNavigate }) => {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [siteModalOpen, setSiteModalOpen] = useState(false);

  // Live IST Clock
  const [timeIST, setTimeIST] = useState(formatTimeIST());
  const [dateIST, setDateIST] = useState(formatDateIST());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTimeIST(formatTimeIST());
      setDateIST(formatDateIST());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, jobsData, settingsData] = await Promise.all([
        apiRequest('/api/analytics'),
        apiRequest('/api/jobs'),
        apiRequest('/api/settings/company').catch(() => null),
      ]);
      setAnalytics(statsData);
      setRecentJobs(Array.isArray(jobsData) ? jobsData.slice(0, 6) : []);
      if (settingsData) setCompanySettings(settingsData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner with Immersive UI Glassmorphism */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase tracking-widest text-[10px]">
              {t('Master Electrician Command Hub', 'MASTER ELECTRICIAN COMMAND HUB')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('Operations Overview', 'Operations Overview')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t(
              'Real-time live monitoring of field service jobs, workforce dispatch, and revenue streams',
              'Real-time live monitoring of field service jobs, workforce dispatch, and revenue streams'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSiteModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>{t('Site Location', 'Site Location')}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer"
            title={t('Refresh', 'Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('jobs')}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.4)] transition flex items-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            {t('Manage All Jobs', 'Manage All Jobs')}
          </button>
        </div>
      </div>

      {/* Admin Site Location & Operations Hub Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#090e1a] via-[#091122] to-[#041527] border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {t('Admin Operations Base', 'Admin Operations Base')}:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-500/40">
                {t('PIN', 'PIN')}: {companySettings?.adminLocation?.pincode || '628716'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                {t('GPS', 'GPS')}: {companySettings?.adminLocation?.latitude || '9.17'}°N, {companySettings?.adminLocation?.longitude || '77.87'}°E
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {t(
                companySettings?.adminLocation?.formattedAddress ||
                  'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
                'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716'
              )}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300">
                <Radio className="w-3 h-3 text-cyan-400" />
                {t('Service Area', 'Service Area')}:{' '}
                {t(
                  companySettings?.serviceArea?.defaultLocation ||
                    'Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
                  'Kovilpatti, Thoothukudi District, Tamilnadu - 628716'
                )}
              </span>
              <span>•</span>
              <span>
                {t('Radius', 'Radius')}: {companySettings?.serviceArea?.serviceRadiusKm || 25} {t('km', 'km')}
              </span>
            </div>
          </div>
        </div>

        {/* Live IST Real-time Widget */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-right">
            <div className="flex items-center justify-end gap-1.5 font-mono text-xs font-bold text-cyan-300">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span>{timeIST}</span>
              <span className="text-[10px] text-slate-400 font-sans">IST</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{dateIST} (UTC+5:30)</div>
          </div>

          <button
            onClick={() => setSiteModalOpen(true)}
            className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white transition cursor-pointer"
            title={t('Configure Site & Location Settings', 'Configure Site & Location Settings')}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Revenue', 'Total Revenue')}</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {formatCurrency(analytics?.totalRevenue || 0)}
          </span>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>{t('Today', 'Today')}: {formatCurrency(analytics?.todayRevenue || 0)}</span>
            <span>{t('Month', 'Month')}: {formatCurrency(analytics?.thisMonthRevenue || 0)}</span>
          </div>
        </div>

        {/* Active & Pending Jobs */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Active / Pending', 'Active / Pending')}</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">
              {analytics?.activeJobsCount || 0}
            </span>
            <span className="text-xs text-slate-400">{t('active on field', 'active on field')}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
            <span>{analytics?.pendingJobsCount || 0} {t('requests pending', 'requests pending')}</span>
            <span>{analytics?.completedJobsCount || 0} {t('Completed', 'completed')}</span>
          </div>
        </div>

        {/* Workforce */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Electricians', 'Electricians')}</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono tracking-tight">
              {analytics?.availableWorkersCount || 0}
            </span>
            <span className="text-xs text-slate-400">/ {analytics?.totalWorkersCount || 0} {t('Available', 'available')}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            <span>{t('Customers', 'Customers')}: {analytics?.totalCustomersCount || 0} {t('registered', 'registered')}</span>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Net Profit', 'Net Profit')}</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono tracking-tight">
            {formatCurrency(analytics?.estimatedProfit || 0)}
          </span>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
            <span>{t('Salaries', 'Salaries')}: {formatCurrency(analytics?.totalSalaryExpense || 0)}</span>
            <span>{t('Pending', 'Pending')}: {formatCurrency(analytics?.pendingSalaryExpense || 0)}</span>
          </div>
        </div>
      </div>

      {/* Live Recent Jobs Table */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <h3 className="text-base font-bold text-white tracking-tight">{t('Live Service Queue', 'Live Service Queue')}</h3>
          </div>
          <button
            onClick={() => onNavigate('jobs')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 uppercase tracking-wider"
          >
            {t('View All', 'View All')} ({analytics?.totalJobsCount || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {t('No service requests registered yet.', 'No service requests registered yet.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">{t('Job ID', 'Job ID')}</th>
                  <th className="py-3 px-3">{t('Customer', 'Customer')}</th>
                  <th className="py-3 px-3">{t('Category', 'Category')}</th>
                  <th className="py-3 px-3">{t('Status', 'Status')}</th>
                  <th className="py-3 px-3">{t('Priority', 'Priority')}</th>
                  <th className="py-3 px-3">{t('Assigned Electrician', 'Assigned Electrician')}</th>
                  <th className="py-3 px-3 text-right">{t('Final Bill', 'Final Bill')}</th>
                  <th className="py-3 px-3 text-center">{t('Action', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    className="hover:bg-white/5 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">{job.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{job.customerName}</div>
                      <div className="text-[10px] text-slate-500">{job.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{job.category}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={job.priority} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {job.assignedWorkerName ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                          {job.assignedWorkerName}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">{t('Unassigned', 'Unassigned')}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {job.finalAmount ? (
                        <span className="text-emerald-400">{formatCurrency(job.finalAmount)}</span>
                      ) : (
                        <span className="text-slate-500">{t('Pending Review', 'Pending Review')}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectJob(job.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                      >
                        {t('Inspect Dossier', 'Inspect Dossier')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Technicians */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              {t('Top Performing Technicians', 'Top Performing Technicians')}
            </h4>
            <button
              onClick={() => onNavigate('workers')}
              className="text-xs text-cyan-400 hover:underline uppercase tracking-wider font-bold cursor-pointer"
            >
              {t('Manage', 'Manage')}
            </button>
          </div>

          <div className="space-y-2.5">
            {analytics?.topWorkers && analytics.topWorkers.length > 0 ? (
              analytics.topWorkers.map((w, idx) => (
                <div
                  key={w.workerId}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono text-slate-300 text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{w.workerName}</p>
                      <p className="text-[10px] text-slate-400">
                        {t('Rating', 'Rating')}: ★ {w.rating} / 5.0
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-cyan-300 block">
                      {w.completedJobs} {t('jobs', 'jobs')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {formatCurrency(w.revenueGenerated)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                {t('No technicians registered yet', 'No technicians registered yet')}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              {t('Service Demand Breakdown', 'Service Demand Breakdown')}
            </h4>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs text-cyan-400 hover:underline uppercase tracking-wider font-bold cursor-pointer"
            >
              {t('Categories', 'Categories')}
            </button>
          </div>

          <div className="space-y-2.5">
            {analytics?.categoryDistribution && analytics.categoryDistribution.length > 0 ? (
              analytics.categoryDistribution.slice(0, 5).map((cat) => (
                <div
                  key={cat.category}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">{t(cat.category, cat.category)}</p>
                    <p className="text-[10px] text-slate-400">
                      {cat.count} {t('total jobs', 'total jobs')}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(cat.revenue)}</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                {t('No service categories logged', 'No service categories logged')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Site Location & Settings Modal */}
      <AdminSiteProfileModal
        isOpen={siteModalOpen}
        onClose={() => setSiteModalOpen(false)}
        onSettingsUpdated={fetchData}
      />
    </div>
  );
};

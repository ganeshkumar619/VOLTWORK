import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Phone,
  ArrowRight,
  Zap,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { Job } from '../../types/index.ts';

interface CustomerDashboardProps {
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onSelectJob, onNavigate }) => {
  const { user, customerProfile } = useAuth();
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customer jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter((j) =>
    ['REQUESTED', 'AI_ANALYSIS', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED', 'COMPLETED', 'WAITING_FOR_ADMIN_VERIFICATION', 'ADMIN_VERIFIED', 'PAYMENT_PENDING'].includes(j.status)
  );

  const pastJobs = jobs.filter((j) => ['PAID', 'CLOSED'].includes(j.status));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950/40 border border-zinc-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>{t('VoltWork Customer Portal', 'VoltWork Customer Portal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('Welcome,', 'Welcome,')} {user?.name || t('Customer', 'Customer')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t('Certified electricians on demand, AI diagnostic safety analysis, and live GPS dispatch', 'Certified electricians on demand, AI diagnostic safety analysis, and live GPS dispatch')}
          </p>
        </div>

        <button
          onClick={() => onNavigate('new_request')}
          className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-black shadow-xl shadow-cyan-500/25 transition flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {t('Book Electrical Service', 'Book Electrical Service')}
        </button>
      </div>

      {/* Customer Location & GPS Status Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider">{t('Service Property Address', 'Service Property Address')}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('GPS Captured ✓', 'GPS Captured ✓')}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-medium">
              {customerProfile?.address || user?.address || '123, Main Street, Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716'}
            </p>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
              {t('Coordinates:', 'Coordinates:')} {Number(customerProfile?.latitude || user?.latitude || 9.17).toFixed(4)}° N, {Number(customerProfile?.longitude || user?.longitude || 77.87).toFixed(4)}° E
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          {t('Update Address & GPS', 'Update Address & GPS')}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Active Requests', 'Active Requests')}</span>
          <p className="text-2xl font-black text-cyan-400 font-mono mt-1">{activeJobs.length}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('In dispatch or in-service', 'In dispatch or in-service')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Past Completed Repairs', 'Past Completed Repairs')}</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{pastJobs.length}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Fully verified and closed', 'Fully verified and closed')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Total Spent', 'Total Spent')}</span>
          <p className="text-2xl font-black text-purple-400 font-mono mt-1">
            {formatCurrency(customerProfile?.totalSpent || 0)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('All registered jobs', 'All registered jobs')}</span>
        </div>
      </div>

      {/* Active Service Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            {t('Active Service Requests', 'Active Service Requests')} ({activeJobs.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-400">
            <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p>{t('Loading...', 'Loading...')}</p>
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
            <p className="text-sm font-semibold text-zinc-400 mb-1">{t('No Jobs Yet', 'No Jobs Yet')}</p>
            <p>{t('You have no active electrical service requests right now.', 'You have no active electrical service requests right now.')}</p>
            <button
              onClick={() => onNavigate('new_request')}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {t('Book a Service Now', 'Book a Service Now')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 cursor-pointer transition space-y-4 shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-cyan-400">{t('Job ID', 'Job ID')}: {job.id}</span>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      {t(job.category, job.category)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={job.priority} size="sm" />
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2">
                  "{job.description || (job as any).problemDescription || 'Electrical service requested'}"
                </p>

                {/* Assigned Electrician Pill */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-xs">
                      ⚡
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">{t('Assigned Worker', 'Assigned Worker')}:</span>
                      <span className="font-semibold text-white">
                        {job.assignedWorkerName || t('Assigning certified technician...', 'Assigning certified technician...')}
                      </span>
                    </div>
                  </div>

                  {job.finalAmount ? (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">{t('Approved Bill', 'Approved Bill')}</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(job.finalAmount)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60">
                  <span className="text-zinc-500">{formatDateTime(job.createdAt)}</span>
                  <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    {t('Track Job', 'Track Job')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Completed Jobs */}
      {pastJobs.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              {t('Service History', 'Completed Service History')} ({pastJobs.length})
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
            >
              {t('View Full History', 'View Full History')}
            </button>
          </div>

          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium bg-zinc-950/40">
                  <th className="py-3 px-4">{t('Job ID', 'Job ID')}</th>
                  <th className="py-3 px-4">{t('Category', 'Category')}</th>
                  <th className="py-3 px-4">{t('Date', 'Date')}</th>
                  <th className="py-3 px-4">{t('Worker', 'Technician')}</th>
                  <th className="py-3 px-4 text-right">{t('Final Amount', 'Amount Paid')}</th>
                  <th className="py-3 px-4 text-center">{t('Payment Status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {pastJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{job.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{t(job.category, job.category)}</td>
                    <td className="py-3 px-4 text-zinc-400">{formatDateTime(job.createdAt)}</td>
                    <td className="py-3 px-4 text-zinc-300">{job.assignedWorkerName || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(job.finalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-green-500/20 text-green-500 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-green-500 font-bold">{t('PAID', 'PAID ✓')}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

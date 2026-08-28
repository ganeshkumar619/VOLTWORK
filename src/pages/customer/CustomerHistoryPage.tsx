import React, { useState, useEffect } from 'react';
import { Clock, Search, Calendar, FileText, CheckCircle2, DollarSign, ArrowRight, UserCheck, Wrench } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { Job } from '../../types/index.ts';

interface CustomerHistoryPageProps {
  onSelectJob: (jobId: string) => void;
}

export const CustomerHistoryPage: React.FC<CustomerHistoryPageProps> = ({ onSelectJob }) => {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiRequest('/api/jobs')
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load history jobs:', err);
        setLoading(false);
      });
  }, []);

  const completed = jobs.filter((j) => ['PAID', 'CLOSED', 'COMPLETED', 'ADMIN_VERIFIED', 'PAYMENT_PENDING'].includes(j.status));

  const filtered = completed.filter((j) => {
    const q = searchQuery.toLowerCase();
    const desc = (j.description || (j as any).problemDescription || '').toLowerCase();
    return (
      j.id.toLowerCase().includes(q) ||
      j.category.toLowerCase().includes(q) ||
      desc.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" />
            {t('Service History', 'Service History')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Permanent digital record of all past electrical maintenance, technician notes, and invoices', 'Permanent digital record of all past electrical maintenance, technician notes, and invoices')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search Jobs', 'Search Jobs...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400">
            <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p>{t('Loading...', 'Loading...')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-500 space-y-2">
            <p className="text-sm font-semibold text-zinc-400">{t('No History Yet', 'No History Yet')}</p>
            <p className="text-zinc-500">{t('No completed service records found.', 'No completed service records found.')}</p>
          </div>
        ) : (
          filtered.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 cursor-pointer transition space-y-4 shadow-lg group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                    {t('Job ID', 'Job ID')}: {job.id}
                  </span>
                  <StatusBadge status={job.status} size="sm" />
                </div>
                <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  {formatDateTime(job.createdAt)}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
                    {t('Category', 'Category')}:
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                    {t(job.category, job.category)}
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 leading-relaxed">
                  <strong className="text-zinc-400 mr-1">{t('Problem', 'Problem')}:</strong>
                  "{job.description || (job as any).problemDescription || 'Electrical service'}"
                </p>
              </div>

              {/* Work Performed / Resolution Notes */}
              {job.workerNotes && (
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-1">
                  <span className="text-zinc-400 font-bold block text-[11px]">
                    {t('Work Performed', 'Work Performed')} / {t('Notes', 'Notes')}:
                  </span>
                  <p className="text-zinc-200">{job.workerNotes}</p>
                </div>
              )}

              {/* Materials Used if available */}
              {job.materials && job.materials.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1">
                  <span className="text-zinc-400 font-bold block text-[11px] flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    {t('Materials', 'Materials')}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.materials.map((m, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px]">
                        {m.materialName} ({m.quantity}x - {formatCurrency(m.cost)})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>
                    {t('Worker', 'Worker')}: <strong className="text-zinc-200">{job.assignedWorkerName || '—'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">{t('Final Amount', 'Final Amount')}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(job.finalAmount || 0)}
                    </span>
                  </div>

                  <span className="text-cyan-400 font-semibold flex items-center gap-1 text-xs group-hover:translate-x-0.5 transition">
                    {t('View Details', 'View Details')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

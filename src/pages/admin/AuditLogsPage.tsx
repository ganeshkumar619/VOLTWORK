import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Clock, User, Shield, Trash2, RotateCcw, AlertTriangle, Filter } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatDateTime } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { AuditLog } from '../../types/index.ts';

export const AuditLogsPage: React.FC = () => {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'deletions' | 'restores' | 'approvals'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/audit');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const actUpper = action.toUpperCase();
    if (actUpper.includes('HARD_DELETE')) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase bg-red-950 text-red-300 border border-red-800 flex items-center gap-1 w-fit">
          <Trash2 className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (actUpper.includes('DELETE')) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1 w-fit">
          <Trash2 className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (actUpper.includes('RESTORE')) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 w-fit">
          <RotateCcw className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (actUpper.includes('VERIF') || actUpper.includes('APPROV')) {
      return (
        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase bg-purple-950/80 text-purple-300 border border-purple-800/60 w-fit">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase bg-zinc-950 text-cyan-400 border border-cyan-900/50 w-fit">
        {action}
      </span>
    );
  };

  const filtered = logs.filter((l) => {
    const act = l.action.toLowerCase();

    if (actionFilter === 'deletions' && !act.includes('delete')) return false;
    if (actionFilter === 'restores' && !act.includes('restore')) return false;
    if (actionFilter === 'approvals' && !act.includes('verify') && !act.includes('approv') && !act.includes('paid')) return false;

    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.userName.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.jobId && l.jobId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-cyan-400" />
          {t('Audit Trail', 'System Security & Audit Trail')}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {t('Immutable event log tracking administrative deletions, restorations, billing verifications, and user actions', 'Immutable event log tracking administrative deletions, restorations, billing verifications, and user actions')}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search audit trail by operator, action event, job ID, or details...', 'Search audit trail by operator, action event, job ID, or details...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `${t('All Events', 'All Events')} (${logs.length})` },
            { id: 'deletions', label: `${t('Deletions', 'Deletions')} (${logs.filter((l) => l.action.toLowerCase().includes('delete')).length})` },
            { id: 'restores', label: `${t('Restorations', 'Restorations')} (${logs.filter((l) => l.action.toLowerCase().includes('restore')).length})` },
            { id: 'approvals', label: t('Billing & Approvals', 'Billing & Approvals') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActionFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                actionFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4">{t('Timestamp', 'Timestamp')}</th>
                <th className="py-3.5 px-4">{t('Operator', 'Operator')}</th>
                <th className="py-3.5 px-4">{t('Role', 'Role')}</th>
                <th className="py-3.5 px-4">{t('Action Event', 'Action Event')}</th>
                <th className="py-3.5 px-4">{t('Job Reference', 'Job Reference')}</th>
                <th className="py-3.5 px-4">{t('Audit Trail Details', 'Audit Trail Details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    {t('No matching audit records found.', 'No matching audit records found.')}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{log.userName}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-zinc-800 text-zinc-300">
                        {t(log.role, log.role)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">{log.jobId || '—'}</td>
                    <td className="py-3.5 px-4 text-zinc-300 max-w-md">{t(log.details, log.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


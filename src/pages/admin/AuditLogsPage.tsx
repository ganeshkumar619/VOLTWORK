import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Clock,
  User,
  Shield,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatDateTime } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { AuditLog } from '../../types/index.ts';

export const AuditLogsPage: React.FC = () => {
  const { t, language } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'deletions' | 'restores' | 'approvals'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/audit');
      setLogs(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Delete a single audit log
  const handleDeleteSingle = async (id: string) => {
    const confirmed = window.confirm(
      t('Are you sure you want to delete this audit record?', 'Are you sure you want to delete this audit record?')
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await apiRequest(`/api/audit/${id}`, { method: 'DELETE' });
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showNotification('success', t('Audit record deleted successfully', 'Audit record deleted successfully'));
    } catch (err: any) {
      showNotification('error', err.message || t('Operation Failed', 'Failed to delete audit log'));
    } finally {
      setDeletingId(null);
    }
  };

  // Delete multiple selected audit logs
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      t(
        `Are you sure you want to delete ${selectedIds.length} selected audit records?`,
        `Are you sure you want to delete ${selectedIds.length} selected audit records?`
      )
    );
    if (!confirmed) return;

    try {
      await apiRequest('/api/audit', {
        method: 'DELETE',
        body: JSON.stringify({ ids: selectedIds }),
      });
      setLogs((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
      setSelectedIds([]);
      showNotification('success', t(`${selectedIds.length} audit records deleted successfully`, `${selectedIds.length} audit records deleted successfully`));
    } catch (err: any) {
      showNotification('error', err.message || t('Operation Failed', 'Failed to delete selected audit records'));
    }
  };

  // Clear all audit logs
  const handleClearAll = async () => {
    const confirmed = window.confirm(
      t('Are you sure you want to clear all audit logs?', 'Are you sure you want to permanently clear all audit logs?')
    );
    if (!confirmed) return;

    try {
      await apiRequest('/api/audit', { method: 'DELETE' });
      setLogs([]);
      setSelectedIds([]);
      showNotification('success', t('All audit records cleared successfully', 'All audit records cleared successfully'));
    } catch (err: any) {
      showNotification('error', err.message || t('Operation Failed', 'Failed to clear audit logs'));
    }
  };

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

  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selectedIds.includes(l.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((l) => l.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filtered.map((l) => l.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Bulk Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-cyan-400" />
            {t('Audit Trail', 'System Security & Audit Trail')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t(
              'Immutable event log tracking administrative deletions, restorations, billing verifications, and user actions',
              'Immutable event log tracking administrative deletions, restorations, billing verifications, and user actions'
            )}
          </p>
        </div>

        {/* Top Delete Options */}
        <div className="flex items-center gap-2.5">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer animate-in fade-in"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {t('Delete Selected', 'Delete Selected')} ({selectedIds.length})
              </span>
            </button>
          )}

          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-300 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>{t('Clear All Logs', 'Clear All Logs')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'Search audit trail by operator, action event, job ID, or details...',
              'Search audit trail by operator, action event, job ID, or details...'
            )}
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
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
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

      {/* Logs Table with Selection and Delete Actions */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:text-cyan-400 text-zinc-500 transition cursor-pointer"
                    title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">{t('Timestamp', 'Timestamp')}</th>
                <th className="py-3.5 px-4">{t('Operator', 'Operator')}</th>
                <th className="py-3.5 px-4">{t('Role', 'Role')}</th>
                <th className="py-3.5 px-4">{t('Action Event', 'Action Event')}</th>
                <th className="py-3.5 px-4">{t('Job Reference', 'Job Reference')}</th>
                <th className="py-3.5 px-4">{t('Audit Trail Details', 'Audit Trail Details')}</th>
                <th className="py-3.5 px-4 text-right">{t('Action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                      <span>{t('Loading...', 'Loading audit records...')}</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    {t('No matching audit records found.', 'No matching audit records found.')}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isSelected = selectedIds.includes(log.id);
                  const isBeingDeleted = deletingId === log.id;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-zinc-800/40 transition ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      } ${isBeingDeleted ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleSelectOne(log.id)}
                          className="p-1 text-zinc-500 hover:text-cyan-400 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSingle(log.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title={t('Delete Audit Log', 'Delete Audit Log')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



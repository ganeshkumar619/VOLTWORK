import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, CheckCircle2, AlertCircle, Phone, Clock, ShieldCheck, Filter, User, Wrench, Trash2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { PermanentDeleteModal } from '../../components/PermanentDeleteModal.tsx';
import { useToast } from '../../components/ToastNotification.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { SMSLog } from '../../types/index.ts';

export const SMSLogsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const { toast } = useToast();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BILL' | 'SALARY'>('ALL');
  const [messageToDelete, setMessageToDelete] = useState<SMSLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/sms/logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load SMS logs:', err);
      toast.error(t('operation_failed', 'Failed to load messages'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handlePermanentDelete = async (log: SMSLog) => {
    try {
      await apiRequest(`/api/messages/${log.id}`, {
        method: 'DELETE',
      });
      toast.success(t('operation_successful', 'messages permanently deleted'));
      setMessageToDelete(null);
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || t('operation_failed', 'Failed to delete message'));
    }
  };

  const filtered = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    const recipientName = l.customerName || l.workerName || '';
    const refId = l.jobId || l.salaryId || l.id || '';

    const matchesSearch =
      refId.toLowerCase().includes(q) ||
      recipientName.toLowerCase().includes(q) ||
      l.phoneNumber.includes(q) ||
      l.messageContent.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterType === 'BILL') {
      return l.type === 'BILL' || Boolean(l.jobId);
    }
    if (filterType === 'SALARY') {
      return l.type === 'SALARY' || Boolean(l.salaryId) || l.recipientType === 'worker';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-cyan-400" />
            {t('Messages & SMS Logs', 'Messages & SMS Dispatch Logs')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Carrier delivery audit of all Admin-authorized billing & salary SMS messages', 'Carrier delivery audit of all Admin-authorized billing & salary SMS messages')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterType === 'ALL'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('All SMS', 'All Messages')} ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('BILL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                filterType === 'BILL'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              {t('Customer Bills', 'Customer Bills')}
            </button>
            <button
              onClick={() => setFilterType('SALARY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                filterType === 'SALARY'
                  ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3 h-3" />
              {t('Worker Salaries', 'Worker Salaries')}
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('refresh', 'Refresh messages')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          id="input-search-messages"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search SMS Logs', 'Search messages by reference ID, recipient name, mobile number...')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4">{t('Type', 'Type / Ref')}</th>
                <th className="py-3.5 px-4">{t('Recipient', 'Recipient')}</th>
                <th className="py-3.5 px-4">{t('Mobile Number', 'Mobile Number')}</th>
                <th className="py-3.5 px-4">{t('Message Content', 'Message Content')}</th>
                <th className="py-3.5 px-4 text-right">{t('Amount', 'Amount')}</th>
                <th className="py-3.5 px-4 text-center">{t('Status', 'Status')}</th>
                <th className="py-3.5 px-4">{t('Sent At', 'Sent At')}</th>
                {isAdmin && <th className="py-3.5 px-4 text-center">{t('Actions', 'Actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-zinc-500">
                    {t('No SMS Logs Found', 'No messages matching selected criteria.')}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isSalary = log.type === 'SALARY' || Boolean(log.salaryId);
                  const recipient = log.customerName || log.workerName || t('Recipient', 'Recipient');
                  const ref = log.jobId || log.salaryId || log.id;

                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isSalary
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {isSalary ? t('Salary', 'SALARY') : t('Bill', 'BILL')}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-zinc-300 mt-1">{ref}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{recipient}</div>
                        <div className="text-[10px] text-zinc-500 capitalize">
                          {log.recipientType === 'worker' ? t('Worker', 'Worker') : log.recipientType === 'customer' ? t('Customer', 'Customer') : (isSalary ? t('Worker', 'Worker') : t('Customer', 'Customer'))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-300">{log.phoneNumber}</td>

                      <td className="py-3.5 px-4 text-zinc-300 max-w-sm">
                        <p className="line-clamp-2 leading-relaxed bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-[11px]">
                          {log.messageContent}
                        </p>
                        {log.providerResponse && (
                          <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                            {log.providerResponse}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {log.finalAmount !== undefined ? formatCurrency(log.finalAmount) : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 justify-center w-max mx-auto">
                          <CheckCircle2 className="w-3 h-3" />
                          {log.smsStatus === 'Sent' ? `${t('Sent', 'Sent')} ✓` : log.smsStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                        {formatDateTime(log.sentAt)}
                        <span className="text-[10px] text-zinc-500 block">{t('by', 'by')} {log.sentByName}</span>
                      </td>

                      {/* Admin Delete Action */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            id={`btn-delete-message-${log.id}`}
                            type="button"
                            onClick={() => setMessageToDelete(log)}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white transition"
                            title={t('Delete SMS Log', 'Permanently delete')}
                            aria-label={t('Delete SMS Log', 'Permanently delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Message Confirmation Modal */}
      {messageToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(messageToDelete)}
          onClose={() => setMessageToDelete(null)}
          onConfirm={() => handlePermanentDelete(messageToDelete)}
          itemType="message"
          itemName={`SMS to ${messageToDelete.customerName || messageToDelete.workerName || messageToDelete.phoneNumber}`}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Recipient', 'Recipient')}:</span>
                <span className="text-white font-semibold">
                  {messageToDelete.customerName || messageToDelete.workerName} ({messageToDelete.phoneNumber})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Content', 'Content')}:</span>
                <span className="text-zinc-300 truncate max-w-[240px]">{messageToDelete.messageContent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Dispatched', 'Dispatched')}:</span>
                <span className="text-zinc-400 font-mono">{formatDateTime(messageToDelete.sentAt)}</span>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Zap,
  Phone,
  MapPin,
  Clock,
  UserCheck,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { PermanentDeleteModal } from '../../components/PermanentDeleteModal.tsx';
import { useToast } from '../../components/ToastNotification.tsx';
import type { Job, JobStatus, JobPriority } from '../../types/index.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';

interface JobsManagementProps {
  onSelectJob: (jobId: string) => void;
}

export const JobsManagement: React.FC<JobsManagementProps> = ({ onSelectJob }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Multi-selection state for bulk delete
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  // Permanent Delete Modal state
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch history records:', err);
      toast.error(t('operation_failed', 'Failed to load history records'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePermanentDelete = async (job: Job) => {
    try {
      await apiRequest(`/api/history/${job.id}`, {
        method: 'DELETE',
      });
      toast.success(t('operation_successful', 'history permanently deleted'));
      setJobToDelete(null);
      setSelectedJobIds((prev) => prev.filter((id) => id !== job.id));
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || t('operation_failed', 'Failed to delete history'));
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedJobIds.length === 0) return;

    try {
      await apiRequest('/api/jobs/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ jobIds: selectedJobIds }),
      });
      toast.success(t('operation_successful', 'history permanently deleted'));
      setShowBulkDeleteModal(false);
      setSelectedJobIds([]);
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || t('operation_failed', 'Failed to delete history'));
    }
  };

  const toggleSelectJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.id.toLowerCase().includes(q) ||
      job.customerName.toLowerCase().includes(q) ||
      job.customerPhone.includes(q) ||
      job.category.toLowerCase().includes(q) ||
      job.address.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && job.priority !== priorityFilter) return false;

    return true;
  });

  const toggleSelectAll = () => {
    if (selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(filteredJobs.map((j) => j.id));
    }
  };

  const allFilteredSelected = filteredJobs.length > 0 && selectedJobIds.length === filteredJobs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-cyan-400" />
            {t('Service History & Work Orders', 'Service History & Work Orders')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Track, assign, inspect, and manage electrical service jobs across the field', 'Track, assign, inspect, and manage electrical service jobs across the field')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchJobs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('refresh', 'Refresh list')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            id="input-search-history"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search Jobs', 'Search by Job ID, customer name, phone number, category...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
          >
            <option value="all">{t('All Statuses', 'All Statuses')}</option>
            <option value="REQUESTED">{t('status_REQUESTED', 'Requested')}</option>
            <option value="ASSIGNED">{t('status_ASSIGNED', 'Assigned')}</option>
            <option value="ACCEPTED">{t('status_ACCEPTED', 'Accepted')}</option>
            <option value="ON_THE_WAY">{t('status_ON_THE_WAY', 'On The Way')}</option>
            <option value="REACHED">{t('status_REACHED', 'Reached')}</option>
            <option value="WORK_STARTED">{t('status_WORK_STARTED', 'Work Started')}</option>
            <option value="WORK_COMPLETED">{t('status_COMPLETED', 'Work Completed')}</option>
            <option value="WAITING_FOR_ADMIN_VERIFICATION">{t('status_WAITING_FOR_ADMIN_VERIFICATION', 'Waiting Verification')}</option>
            <option value="ADMIN_VERIFIED">{t('status_ADMIN_VERIFIED', 'Admin Verified')}</option>
            <option value="PAID">{t('status_PAID', 'Paid / Completed')}</option>
            <option value="CANCELLED">{t('CANCELLED', 'Cancelled')}</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <Zap className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
          <select
            id="select-priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
          >
            <option value="all">{t('All Priorities', 'All Priorities')}</option>
            <option value="LOW">{t('Low Priority', 'Low Priority')}</option>
            <option value="MEDIUM">{t('Medium Priority', 'Medium Priority')}</option>
            <option value="HIGH">{t('High Priority', 'High Priority')}</option>
            <option value="EMERGENCY">{t('Emergency (1hr)', 'Emergency (1hr)')}</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar (When 1+ items selected) */}
      {selectedJobIds.length > 0 && isAdmin && (
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-rose-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold font-mono">
              {selectedJobIds.length} {t('Selected', 'Selected')}
            </div>
            <span className="text-zinc-300 font-medium">{t('Batch Operations', 'Batch Operations')}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-bulk-delete"
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95"
              title={t('Delete Records Permanently', 'Permanently delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('Delete', 'Delete')} {selectedJobIds.length} {t('Delete Records Permanently', 'Records Permanently')}
            </button>

            <button
              type="button"
              onClick={() => setSelectedJobIds([])}
              className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-medium"
            >
              {t('Clear', 'Clear')}
            </button>
          </div>
        </div>
      )}

      {/* History Records Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                {isAdmin && (
                  <th className="py-3.5 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-zinc-400 hover:text-white transition"
                      title={allFilteredSelected ? t('Deselect all', 'Deselect all') : t('Select all', 'Select all')}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3.5 px-4">{t('Job ID', 'Job ID')}</th>
                <th className="py-3.5 px-4">{t('Customer & Location', 'Customer & Location')}</th>
                <th className="py-3.5 px-4">{t('Category', 'Service Category')}</th>
                <th className="py-3.5 px-4">{t('Priority', 'Priority')}</th>
                <th className="py-3.5 px-4">{t('Status', 'Status')}</th>
                <th className="py-3.5 px-4">{t('Assigned Worker', 'Technician')}</th>
                <th className="py-3.5 px-4 text-right">{t('Final Bill', 'Final Bill')}</th>
                <th className="py-3.5 px-4 text-center">{t('Actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-zinc-500">
                    {t('No matching service history records found.', 'No matching service history records found.')}
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const isSelected = selectedJobIds.includes(job.id);

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job.id)}
                      className={`hover:bg-zinc-800/40 cursor-pointer transition ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center" onClick={(e) => toggleSelectJob(job.id, e)}>
                          <button type="button" className="text-zinc-400 hover:text-white transition">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-cyan-400">{job.id}</span>
                        <span className="text-[10px] text-zinc-500 block">{formatDateTime(job.createdAt)}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{job.customerName}</div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {job.customerPhone}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[180px]">{job.address}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-200">{t(job.category, job.category)}</span>
                        {job.aiAnalysis && (
                          <span className="text-[10px] text-cyan-400/80 block">{t('AI Verified', 'AI Verified')}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={job.priority} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={job.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        {job.assignedWorkerName ? (
                          <div>
                            <span className="font-medium text-purple-300">{job.assignedWorkerName}</span>
                            <span className="text-[10px] text-zinc-500 block">{job.assignedWorkerPhone}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">{t('Unassigned', 'Unassigned')}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {job.finalAmount ? (
                          <span className="font-mono font-bold text-emerald-400">
                            {formatCurrency(job.finalAmount)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 italic">{t('Unverified', 'Unverified')}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onSelectJob(job.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold transition text-[11px]"
                          >
                            {t('Inspect', 'Inspect')}
                          </button>

                          {/* Only ADMIN can see delete button */}
                          {isAdmin && (
                            <button
                              id={`btn-delete-history-${job.id}`}
                              type="button"
                              onClick={() => setJobToDelete(job)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white transition"
                              title={t('Delete Job', 'Permanently delete')}
                              aria-label={t('Delete Job', 'Permanently delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Single History Modal */}
      {jobToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(jobToDelete)}
          onClose={() => setJobToDelete(null)}
          onConfirm={() => handlePermanentDelete(jobToDelete)}
          itemType="history record"
          itemName={jobToDelete.id}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Job ID', 'Job ID')}:</span>
                <span className="font-mono font-bold text-cyan-400">{jobToDelete.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Category', 'Service Category')}:</span>
                <span className="text-white font-semibold">{t(jobToDelete.category, jobToDelete.category)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Customer', 'Customer')}:</span>
                <span className="text-zinc-200">{jobToDelete.customerName} ({jobToDelete.customerPhone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Final Bill', 'Final Bill')}:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(jobToDelete.finalAmount || 0)}</span>
              </div>
            </div>
          }
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <PermanentDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkPermanentDelete}
          itemType={`${selectedJobIds.length} history records`}
          itemName={`${selectedJobIds.length} items`}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Total', 'Total Count')}:</span>
                <span className="font-bold text-rose-400">{selectedJobIds.length} records</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Job ID', 'Target IDs')}:</span>
                <span className="font-mono text-zinc-300 truncate max-w-[260px]">
                  {selectedJobIds.slice(0, 5).join(', ')}{selectedJobIds.length > 5 ? ` +${selectedJobIds.length - 5} more` : ''}
                </span>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};


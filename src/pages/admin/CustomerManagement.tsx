import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  ChevronRight,
  X,
  FileText,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Filter,
  CreditCard,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/formatters.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { PermanentDeleteModal } from '../../components/PermanentDeleteModal.tsx';
import { useToast } from '../../components/ToastNotification.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { CustomerProfile, Job, ServiceHistoryItem } from '../../types/index.ts';

export const CustomerManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // History modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Deletion modals
  const [customerToDelete, setCustomerToDelete] = useState<CustomerProfile | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deletingAllCustomerHistory, setDeletingAllCustomerHistory] = useState<CustomerProfile | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/customers');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error(t('operation_failed', 'Failed to load customers directory'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openHistoryModal = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setHistoryLoading(true);
    try {
      const data = await apiRequest(`/api/customers/${customer.id}/history`);
      setCustomerJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load customer history:', err);
      toast.error(t('operation_failed', 'Failed to load customer service history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await apiRequest(`/api/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });
      toast.success(`${t('Customer', 'Customer')} ${customerToDelete.name} ${t('Success', 'permanently deleted')}`);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || t('operation_failed', 'Failed to delete customer'));
    }
  };

  const handleDeleteSingleJob = async () => {
    if (!jobToDelete) return;
    try {
      await apiRequest(`/api/history/${jobToDelete.id}`, {
        method: 'DELETE',
      });
      toast.success(t('operation_successful', 'history permanently deleted'));
      setJobToDelete(null);
      if (selectedCustomer) {
        openHistoryModal(selectedCustomer);
      }
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || t('operation_failed', 'Failed to delete history record'));
    }
  };

  const handleDeleteAllCustomerHistory = async () => {
    if (!deletingAllCustomerHistory) return;
    try {
      await apiRequest(`/api/customers/${deletingAllCustomerHistory.id}/history`, {
        method: 'DELETE',
      });
      toast.success(t('operation_successful', 'history permanently deleted'));
      setDeletingAllCustomerHistory(null);
      if (selectedCustomer) {
        openHistoryModal(selectedCustomer);
      }
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || t('operation_failed', 'Failed to delete customer history'));
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-cyan-400" />
            {t('Customer Directory', 'Customer Directory')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Real-time client CRM, complete repair history, address details, and lifetime spending', 'Real-time client CRM, complete repair history, address details, and lifetime spending')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('refresh', 'Refresh customers')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search Customers', 'Search by customer name, phone number, email address...')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4">{t('Customer', 'Customer')}</th>
                <th className="py-3.5 px-4">{t('Phone', 'Contact Info')}</th>
                <th className="py-3.5 px-4">{t('Address', 'Location')}</th>
                <th className="py-3.5 px-4 text-center">{t('Lifetime Spend', 'Lifetime Spent')}</th>
                <th className="py-3.5 px-4 text-center">{t('Service History & Invoices', 'Repairs History')}</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">{t('Actions', 'Actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-zinc-500">
                    {t('No Customers Yet', 'No customers found matching search query.')}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border flex items-center justify-center font-extrabold text-xs bg-cyan-500/15 border-cyan-500/30 text-cyan-300">
                            {c.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{c.name}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">{t('Customer ID', 'ID')}: {c.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-mono">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{c.phone}</span>
                        </div>
                        {c.email && <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">{c.email}</div>}
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex items-start gap-1.5 text-zinc-300">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[11px]">{c.address || '—'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(c.totalSpent || 0)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openHistoryModal(c)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-zinc-300 font-semibold transition flex items-center gap-1.5 mx-auto text-[11px]"
                        >
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t('Service History', 'History')} ({c.totalJobsCount || 0})</span>
                        </button>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(c)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition flex items-center gap-1.5 font-bold shadow-sm active:scale-95 group text-[11px] ml-auto"
                            title={t('Delete Customer', 'Permanently delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                            <span>{t('Delete', 'Delete')}</span>
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

      {/* Customer Full Repair History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl text-zinc-100 relative max-h-[88vh] flex flex-col">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  {t('Service History', 'Service History')} — {selectedCustomer.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('Phone', 'Mobile')}: <span className="font-mono text-cyan-400">{selectedCustomer.phone}</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{t('Address', 'Address')}: {selectedCustomer.address || '—'}</p>
              </div>

              {/* Bulk Delete All History Button for this customer */}
              {isAdmin && customerJobs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeletingAllCustomerHistory(selectedCustomer)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white font-bold transition flex items-center gap-1.5 text-xs shadow-sm active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('Delete All History', 'Delete All History')}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {historyLoading ? (
                <div className="py-12 text-center text-xs text-zinc-400">{t('Loading...', 'Loading history records...')}</div>
              ) : customerJobs.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  {t('No service history for this customer', 'No service records registered for this customer.')}
                </div>
              ) : (
                customerJobs.map((job) => {
                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl border text-xs space-y-3 relative bg-zinc-950 border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">
                            {job.id}
                          </span>
                          <StatusBadge status={job.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{formatDate(job.createdAt)}</span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setJobToDelete(job)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-600 text-zinc-400 hover:text-white transition"
                              title={t('Delete Job', 'Permanently delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white text-sm">{t(job.category, job.category)}</h4>
                        <p className="text-zinc-300 mt-1">"{job.problemDescription || job.description}"</p>
                      </div>

                      {job.workerNotes && (
                        <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-zinc-300">
                          <span className="text-zinc-500 block text-[10px] mb-0.5">{t('Work Details', 'Technician Solution')}:</span>
                          {job.workerNotes}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px]">
                        <span className="text-zinc-400">
                          {t('Assigned Worker', 'Technician')}: <strong className="text-zinc-200">{job.assignedWorkerName || '—'}</strong>
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(job.finalAmount || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(customerToDelete)}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={handleDeleteCustomer}
          itemType="customer"
          itemName={customerToDelete.name}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Customer Name', 'Customer Name')}:</span>
                <span className="font-bold text-white">{customerToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Phone', 'Phone Number')}:</span>
                <span className="font-mono text-cyan-400">{customerToDelete.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Lifetime Spend', 'Total Lifetime Spent')}:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(customerToDelete.totalSpent || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Total Jobs', 'Service Jobs History')}:</span>
                <span className="font-bold text-zinc-200">{customerToDelete.totalJobsCount || 0} {t('jobs', 'repairs')}</span>
              </div>
            </div>
          }
        />
      )}

      {/* Delete Single Job Modal */}
      {jobToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(jobToDelete)}
          onClose={() => setJobToDelete(null)}
          onConfirm={handleDeleteSingleJob}
          itemType="history"
          itemName={`Record #${jobToDelete.id}`}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Job ID', 'Job ID')}:</span>
                <span className="font-mono font-bold text-cyan-400">{jobToDelete.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Category', 'Category')}:</span>
                <span className="text-white font-semibold">{t(jobToDelete.category, jobToDelete.category)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Customer', 'Customer')}:</span>
                <span className="text-zinc-200">{jobToDelete.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Amount', 'Final Amount')}:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(jobToDelete.finalAmount || 0)}</span>
              </div>
            </div>
          }
        />
      )}

      {/* Delete All History For Customer Modal */}
      {deletingAllCustomerHistory && (
        <PermanentDeleteModal
          isOpen={Boolean(deletingAllCustomerHistory)}
          onClose={() => setDeletingAllCustomerHistory(null)}
          onConfirm={handleDeleteAllCustomerHistory}
          itemType="history"
          itemName={`All history for ${deletingAllCustomerHistory.name}`}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Customer', 'Customer')}:</span>
                <span className="font-bold text-white">{deletingAllCustomerHistory.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Total', 'Total Records to Delete')}:</span>
                <span className="font-bold text-rose-400">{customerJobs.length} {t('jobs', 'records')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Details', 'Scope')}:</span>
                <span className="text-zinc-300">{t('No service history for this customer', 'All historical repair tickets for this customer')}</span>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};


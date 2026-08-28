import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  Receipt,
  X,
  Phone,
  Send,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { PermanentDeleteModal } from '../../components/PermanentDeleteModal.tsx';
import { useToast } from '../../components/ToastNotification.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { PaymentRecord, Job } from '../../types/index.ts';

export const PaymentsManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [billToDelete, setBillToDelete] = useState<PaymentRecord | null>(null);

  const [formData, setFormData] = useState({
    jobId: '',
    amount: 500,
    paymentMethod: 'upi',
    transactionRef: '',
    notes: 'Payment confirmed by Admin',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payData, jobsData] = await Promise.all([
        apiRequest('/api/billing/payments'),
        apiRequest('/api/jobs'),
      ]);
      setPayments(Array.isArray(payData) ? payData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      if (jobsData.length > 0) {
        setFormData((prev) => ({ ...prev, jobId: jobsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load bills/payments:', err);
      toast.error(t('operation_failed', 'Failed to load bills'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/billing/record-payment', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setShowRecordModal(false);
      fetchData();
      toast.success(t('operation_successful', 'Payment recorded successfully'));
    } catch (err: any) {
      toast.error(err.message || t('operation_failed', 'Failed to record payment'));
    }
  };

  const handlePermanentDelete = async (payment: PaymentRecord) => {
    try {
      await apiRequest(`/api/bills/${payment.id}`, {
        method: 'DELETE',
      });
      toast.success(t('operation_successful', 'bills permanently deleted'));
      setBillToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t('operation_failed', 'Failed to delete bill'));
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.jobId.toLowerCase().includes(q) ||
      (p.customerName || '').toLowerCase().includes(q) ||
      (p.paymentMethod || '').toLowerCase().includes(q) ||
      (p.transactionRef || '').toLowerCase().includes(q)
    );
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-cyan-400" />
            {t('Bills & Invoices', 'Bills & Customer Payments')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Audit, track, and manage customer invoices, receipts, and digital/cash transactions', 'Audit, track, and manage customer invoices, receipts, and digital/cash transactions')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('refresh', 'Refresh bills')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-record-offline-payment"
            onClick={() => setShowRecordModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('Record Payment', 'Record Payment / Bill')}
          </button>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs text-zinc-400 font-semibold">{t('Total Revenue', 'Total Revenue Collected')}</span>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          id="input-search-bills"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Search Bills', 'Search bills by Payment ID, Job Reference, Customer Name, Transaction Ref...')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4">{t('Payment ID', 'Payment ID')}</th>
                <th className="py-3.5 px-4">{t('Job ID', 'Job Reference')}</th>
                <th className="py-3.5 px-4">{t('Customer', 'Customer')}</th>
                <th className="py-3.5 px-4">{t('Payment Method', 'Method')}</th>
                <th className="py-3.5 px-4">{t('Transaction Ref', 'Transaction Ref')}</th>
                <th className="py-3.5 px-4 text-right">{t('Amount', 'Amount')}</th>
                <th className="py-3.5 px-4 text-center">{t('Status', 'Status')}</th>
                <th className="py-3.5 px-4">{t('Date & Time', 'Date & Time')}</th>
                {isAdmin && <th className="py-3.5 px-4 text-center">{t('Actions', 'Actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-zinc-500">
                    {t('No Bills Found', 'No bill or payment records found.')}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{p.id}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">{p.jobId}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{p.customerName}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-zinc-800 text-zinc-300">
                        {p.paymentMethod === 'cash' ? t('Cash', 'Cash') : p.paymentMethod === 'upi' ? t('UPI', 'UPI') : p.paymentMethod === 'card' ? t('Card', 'Card') : t('Net Banking', 'Net Banking')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{p.transactionRef || '—'}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-green-500/20 text-green-500 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)] flex items-center justify-center gap-1 w-fit mx-auto">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-green-500 font-bold">{t('Paid', 'PAID')} ✓</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 text-[11px]">{formatDateTime(p.paymentDate)}</td>

                    {/* Only ADMIN can see delete button */}
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          id={`btn-delete-bill-${p.id}`}
                          type="button"
                          onClick={() => setBillToDelete(p)}
                          className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white transition"
                          title={t('Delete Bill', 'Permanently delete')}
                          aria-label={t('Delete Bill', 'Permanently delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Bill Confirmation Modal */}
      {billToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(billToDelete)}
          onClose={() => setBillToDelete(null)}
          onConfirm={() => handlePermanentDelete(billToDelete)}
          itemType="bill"
          itemName={`Bill #${billToDelete.id}`}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Payment ID', 'Bill ID')}:</span>
                <span className="font-mono font-bold text-cyan-400">{billToDelete.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Job ID', 'Job Reference')}:</span>
                <span className="font-mono text-zinc-300">{billToDelete.jobId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Customer', 'Customer')}:</span>
                <span className="text-white font-semibold">{billToDelete.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Amount', 'Amount')}:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(billToDelete.amount)}</span>
              </div>
            </div>
          }
        />
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setShowRecordModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">{t('Record Payment', 'Record Offline Payment')}</h2>
            <p className="text-xs text-zinc-400 mb-4">{t('Enter payment details to confirm bill', 'Mark customer invoice as paid in cash or offline transfer')}</p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Select Job', 'Select Job')}</label>
                <select
                  required
                  value={formData.jobId}
                  onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.id} — {j.customerName} ({t(j.category, j.category)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Amount', 'Received Amount (₹)')}</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Payment Method', 'Payment Method')}</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="cash">{t('Cash', 'Cash on Delivery / Direct Cash')}</option>
                  <option value="upi">{t('UPI', 'UPI / GPay / QR Scan')}</option>
                  <option value="card">{t('Card', 'Card POS Terminal')}</option>
                  <option value="netbanking">{t('Net Banking', 'Net Banking Transfer')}</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Transaction Ref', 'Transaction Ref / Cheque No.')}</label>
                <input
                  type="text"
                  value={formData.transactionRef}
                  onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                  placeholder={t('Optional reference number', 'Optional reference number')}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold"
                >
                  {t('Confirm Payment', 'Confirm & Update Job Status')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


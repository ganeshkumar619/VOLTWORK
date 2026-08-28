import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Search,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Send,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDate } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { SalaryRecord, WorkerProfile } from '../../types/index.ts';

export const SalaryManagement: React.FC = () => {
  const { t } = useI18n();
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payoutRecord, setPayoutRecord] = useState<SalaryRecord | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  // New/Edit Record Form State
  const [formData, setFormData] = useState({
    workerId: '',
    salaryPeriod: new Date().toISOString().substring(0, 7),
    basicSalary: 18000,
    commission: 2500,
    bonus: 1000,
    deduction: 0,
    paidAmount: 0,
    paymentMethod: 'bank_transfer',
    notes: 'Monthly standard salary computation',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salData, wData] = await Promise.all([
        apiRequest('/api/salaries'),
        apiRequest('/api/workers'),
      ]);
      setSalaries(Array.isArray(salData) ? salData : []);
      setWorkers(Array.isArray(wData) ? wData : []);
      if (wData.length > 0) {
        setFormData((prev) => ({ ...prev, workerId: wData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load salaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/salaries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || t('operation_failed', 'Failed to save salary record'));
    }
  };

  const handleDisbursePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutRecord) return;

    try {
      await apiRequest(`/api/salaries/${payoutRecord.id}/payout`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(payoutAmount),
          paymentMethod: payoutMethod,
        }),
      });

      setPayoutRecord(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || t('operation_failed', 'Payout failed'));
    }
  };

  const handleSendSalarySMS = async (salaryId: string, workerName: string) => {
    setSendingSmsId(salaryId);
    setSmsFeedback(null);
    try {
      const res = await apiRequest(`/api/salaries/${salaryId}/send-sms`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setSmsFeedback(`SMS sent to ${workerName}: ${res.message || 'Delivered'}`);
      fetchData();
      setTimeout(() => setSmsFeedback(null), 4000);
    } catch (err: any) {
      setSmsFeedback(`Failed to send SMS: ${err.message}`);
    } finally {
      setSendingSmsId(null);
    }
  };

  const totalDisbursed = salaries.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const totalPending = salaries.reduce((s, r) => s + (r.remainingAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Banknote className="w-7 h-7 text-cyan-400" />
            {t('Worker Salaries & Payout Engine', 'Worker Salaries & Payout Engine')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Automated computations: Basic Pay + Commission + Bonus - Deductions', 'Automated computations: Basic Pay + Commission + Bonus - Deductions')}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('Create Salary', 'Create / Compute Salary')}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">{t('Total Disbursed', 'Total Disbursed Salaries')}</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatCurrency(totalDisbursed)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">{t('Pending Payouts', 'Pending Salary Obligations')}</span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">{formatCurrency(totalPending)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SMS Feedback Alert */}
      {smsFeedback && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Send className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{smsFeedback}</span>
        </div>
      )}

      {/* Salaries Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4">{t('Worker Name', 'Technician')}</th>
                <th className="py-3.5 px-4">{t('Period', 'Period')}</th>
                <th className="py-3.5 px-4 text-right">{t('Basic Salary', 'Basic Pay')}</th>
                <th className="py-3.5 px-4 text-right">{t('Commission', 'Commission')}</th>
                <th className="py-3.5 px-4 text-right">{t('Bonus', 'Bonus')}</th>
                <th className="py-3.5 px-4 text-right">{t('Deductions', 'Deduction')}</th>
                <th className="py-3.5 px-4 text-right">{t('Net Salary', 'Total Computed')}</th>
                <th className="py-3.5 px-4 text-right">{t('Paid Amount', 'Paid Amount')}</th>
                <th className="py-3.5 px-4 text-center">{t('Status', 'Status')}</th>
                <th className="py-3.5 px-4 text-center">{t('SMS Status', 'SMS Alert')}</th>
                <th className="py-3.5 px-4 text-center">{t('Payout', 'Payout')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-500">
                    {t('No Salary Records', 'No salary records created yet. Click "Create / Compute Salary" above.')}
                  </td>
                </tr>
              ) : (
                salaries.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{s.workerName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{s.id}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-cyan-300">{s.salaryPeriod}</td>

                    <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                      {formatCurrency(s.basicSalary)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                      +{formatCurrency(s.commission)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-cyan-400">+{formatCurrency(s.bonus)}</td>

                    <td className="py-3.5 px-4 text-right font-mono text-rose-400">
                      -{formatCurrency(s.deduction)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-white text-sm">
                      {formatCurrency(s.totalSalary)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(s.paidAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          s.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : s.status === 'partial'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {s.status === 'paid' ? t('Paid', 'Paid') : s.status === 'partial' ? t('Partial', 'Partial') : t('Pending', 'Pending')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                            s.smsStatus === 'Sent'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {s.smsStatus === 'Sent' ? `${t('Sent', 'Sent')} ✓` : t('Pending', 'Pending')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSendSalarySMS(s.id, s.workerName)}
                          disabled={sendingSmsId === s.id}
                          title={t('Send SMS', 'Send official SMS breakdown to worker')}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 border border-zinc-700 hover:border-cyan-500/30 transition disabled:opacity-50 cursor-pointer"
                        >
                          {sendingSmsId === s.id ? (
                            <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {s.remainingAmount > 0 ? (
                        <button
                          onClick={() => {
                            setPayoutRecord(s);
                            setPayoutAmount(s.remainingAmount);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          {t('Pay', 'Pay')} ₹{s.remainingAmount}
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">{t('Fully Disbursed', 'Fully Disbursed')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Salary Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">{t('Compute Salary', 'Compute Worker Salary')}</h2>
            <p className="text-xs text-zinc-400 mb-4">{t('Calculate monthly remuneration and commissions', 'Calculate monthly remuneration and commissions')}</p>

            <form onSubmit={handleSaveSalary} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Worker Name', 'Technician')}</label>
                <select
                  required
                  value={formData.workerId}
                  onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({t('Basic Salary', 'Base')}: ₹{w.basicSalary})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Period', 'Salary Month (YYYY-MM)')}</label>
                <input
                  type="month"
                  required
                  value={formData.salaryPeriod}
                  onChange={(e) => setFormData({ ...formData, salaryPeriod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">{t('Basic Salary', 'Basic Salary (₹)')}</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">{t('Commission', 'Commission Earned (₹)')}</label>
                  <input
                    type="number"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">{t('Bonus', 'Bonus (₹)')}</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">{t('Deductions', 'Deduction (₹)')}</label>
                  <input
                    type="number"
                    value={formData.deduction}
                    onChange={(e) => setFormData({ ...formData, deduction: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between font-bold">
                <span className="text-zinc-400">{t('Total Salary', 'Total Computed Salary')}:</span>
                <span className="text-emerald-400 font-mono text-base">
                  {formatCurrency(
                    Number(formData.basicSalary) +
                      Number(formData.commission) +
                      Number(formData.bonus) -
                      Number(formData.deduction)
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold"
                >
                  {t('Save', 'Save Salary Statement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal */}
      {payoutRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setPayoutRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">{t('Disburse Salary', 'Disburse Salary Payout')}</h2>
            <p className="text-xs text-zinc-400 mb-4">
              {t('Worker Name', 'Technician')}: <strong className="text-zinc-200">{payoutRecord.workerName}</strong> ({payoutRecord.salaryPeriod})
            </p>

            <form onSubmit={handleDisbursePayout} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Amount', 'Payout Amount (₹)')}</label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Payment Method', 'Payment Method')}</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="bank_transfer">{t('Bank Transfer', 'Direct Bank NEFT / IMPS')}</option>
                  <option value="upi">{t('UPI', 'UPI / GPay / PhonePe')}</option>
                  <option value="cash">{t('Cash', 'Direct Cash Handover')}</option>
                  <option value="cheque">{t('Cheque', 'Cheque Disbursement')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPayoutRecord(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold"
                >
                  {t('Confirm Payout', 'Confirm Payout')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Banknote, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDate } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { SalaryRecord } from '../../types/index.ts';

export const WorkerSalaryPage: React.FC = () => {
  const { t } = useI18n();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/salaries/my').then((data) => {
      setRecords(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const totalPaid = records.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const totalPending = records.reduce((s, r) => s + (r.remainingAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">{t('My Salary Statements & Payouts', 'My Salary Statements & Payouts')}</h1>
        <p className="text-xs text-zinc-400 mt-1">
          {t('Detailed monthly compensation breakdown: Basic pay + job commissions + bonuses', 'Detailed monthly compensation breakdown: Basic pay + job commissions + bonuses')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">{t('Total Received Earnings', 'Total Received Earnings')}</span>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">{t('Pending Disbursal', 'Pending Disbursal')}</span>
            <p className="text-2xl font-black text-amber-400 font-mono mt-1">{formatCurrency(totalPending)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
              <th className="py-3.5 px-4">{t('Period', 'Period')}</th>
              <th className="py-3.5 px-4 text-right">{t('Basic Pay', 'Basic Pay')}</th>
              <th className="py-3.5 px-4 text-right">{t('Commission', 'Commission')}</th>
              <th className="py-3.5 px-4 text-right">{t('Bonus', 'Bonus')}</th>
              <th className="py-3.5 px-4 text-right">{t('Deduction', 'Deduction')}</th>
              <th className="py-3.5 px-4 text-right">{t('Total Net', 'Total Net')}</th>
              <th className="py-3.5 px-4 text-right">{t('Paid Amount', 'Paid Amount')}</th>
              <th className="py-3.5 px-4 text-center">{t('Status', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500">
                  {t('No salary slips issued for your account yet.', 'No salary slips issued for your account yet.')}
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{r.salaryPeriod}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-300">{formatCurrency(r.basicSalary)}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400">+{formatCurrency(r.commission)}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-cyan-400">+{formatCurrency(r.bonus)}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-rose-400">-{formatCurrency(r.deduction)}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-white text-sm">
                    {formatCurrency(r.totalSalary)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatCurrency(r.paidAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        r.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : r.status === 'partial'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {t(r.status, r.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

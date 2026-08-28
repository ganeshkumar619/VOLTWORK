import React from 'react';
import { X, Printer, CheckCircle, Zap, ShieldCheck, Download } from 'lucide-react';
import type { Invoice, JobMaterial } from '../types/index.ts';
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters.ts';
import { useI18n } from '../lib/i18n.tsx';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  materials?: JobMaterial[];
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice, materials = [] }) => {
  const { t } = useI18n();

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-zinc-100 relative my-8 print:p-0 print:border-none print:bg-white print:text-black">
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition print:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent print:text-black">
                VOLTWORK AI
              </h2>
            </div>
            <p className="text-xs text-zinc-400 print:text-zinc-600">{t('Smart Electrical Service & Diagnostics', 'Smart Electrical Service & Diagnostics')}</p>
            <p className="text-[11px] text-zinc-400 print:text-zinc-700 mt-0.5">
              Mudukkumeendanpatti, Kovilpatti, Thoothukudi District, Tamilnadu - 628716
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Reg: TN-EL-2026-9941 • GSTIN: 33AAAAA0000A1Z5 • Helpline: +91 98765 43210
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold block mb-1">
              {t('Official Service Invoice', 'OFFICIAL SERVICE INVOICE')}
            </span>
            <span className="text-base font-bold font-mono text-white print:text-black">{invoice.id}</span>
            <p className="text-xs text-zinc-400 mt-1">{t('Date', 'Date')}: {formatDate(invoice.createdAt)}</p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  invoice.status === 'paid'
                    ? 'bg-green-500/20 text-green-500 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {invoice.status === 'paid' ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500 font-bold">{t('PAID', 'PAID ✓')}</span>
                  </>
                ) : (
                  t(invoice.status.toUpperCase(), invoice.status.toUpperCase())
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Billing Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 print:bg-transparent print:border-zinc-300">
          <div>
            <span className="text-zinc-500 font-medium block mb-1">{t('Billed To (Customer):', 'BILLED TO (CUSTOMER):')}</span>
            <p className="text-sm font-semibold text-white print:text-black">{invoice.customerName}</p>
            <p className="text-zinc-400 print:text-zinc-700">{invoice.customerPhone}</p>
            <p className="text-zinc-400 print:text-zinc-700">{invoice.customerAddress}</p>
          </div>

          <div>
            <span className="text-zinc-500 font-medium block mb-1">{t('Service Details:', 'SERVICE DETAILS:')}</span>
            <p className="text-zinc-300 print:text-zinc-800">
              <strong className="text-zinc-200 print:text-black">{t('Job ID', 'Job ID')}:</strong> {invoice.jobId}
            </p>
            <p className="text-zinc-300 print:text-zinc-800">
              <strong className="text-zinc-200 print:text-black">{t('Category', 'Category')}:</strong> {t(invoice.category, invoice.category)}
            </p>
            {invoice.workerName && (
              <p className="text-zinc-300 print:text-zinc-800">
                <strong className="text-zinc-200 print:text-black">{t('Worker', 'Lead Technician')}:</strong> {invoice.workerName}
              </p>
            )}
          </div>
        </div>

        {/* Material & Labour Breakdown Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-medium print:border-zinc-300">
                <th className="py-2.5 px-3">{t('Description / Material', 'Description / Material')}</th>
                <th className="py-2.5 px-3 text-center">{t('Qty', 'Qty')}</th>
                <th className="py-2.5 px-3 text-right">{t('Unit Rate', 'Unit Rate')}</th>
                <th className="py-2.5 px-3 text-right">{t('Amount', 'Amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 print:divide-zinc-200">
              {/* Materials used */}
              {materials.map((m, idx) => (
                <tr key={idx} className="text-zinc-300 print:text-zinc-800">
                  <td className="py-2.5 px-3">{m.materialName}</td>
                  <td className="py-2.5 px-3 text-center">{m.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(m.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(m.totalPrice)}</td>
                </tr>
              ))}

              {materials.length === 0 && (
                <tr className="text-zinc-500">
                  <td colSpan={4} className="py-2 px-3 italic">
                    {t('No individual materials billed (Labour only)', 'No individual materials billed (Labour only)')}
                  </td>
                </tr>
              )}

              {/* Labour */}
              {invoice.labourCharge > 0 && (
                <tr className="text-zinc-300 print:text-zinc-800">
                  <td className="py-2.5 px-3 font-medium">{t('Electrical Labour / Service Charges', 'Electrical Labour / Service Charges')}</td>
                  <td className="py-2.5 px-3 text-center">1</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(invoice.labourCharge)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(invoice.labourCharge)}</td>
                </tr>
              )}

              {/* Additional Charges */}
              {invoice.additionalCharges > 0 && (
                <tr className="text-zinc-300 print:text-zinc-800">
                  <td className="py-2.5 px-3 font-medium">{t('Additional Charges', 'Conduit / Emergency Callout / Extra Charges')}</td>
                  <td className="py-2.5 px-3 text-center">1</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(invoice.additionalCharges)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(invoice.additionalCharges)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 print:bg-transparent print:border-zinc-300 mb-6">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              {t('Verified & Approved by Master Electrician', 'Verified & Approved by Master Electrician')}
            </div>
            <p className="text-[11px] text-zinc-400">
              {t('Admin:', 'Admin:')} {invoice.approvedByAdminName} • {formatDateTime(invoice.approvedAt)}
            </p>
          </div>

          <div className="text-right w-full sm:w-auto">
            <span className="text-xs text-zinc-400 block">{t('Total Bill Amount', 'TOTAL APPROVED AMOUNT')}</span>
            <span className="text-2xl font-black text-cyan-400 font-mono print:text-black">
              {formatCurrency(invoice.finalAmount)}
            </span>
          </div>
        </div>

        {/* Actions (Hidden on Print) */}
        <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
          >
            {t('Cancel', 'Close')}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {t('Print / Save PDF', 'Print / Save PDF')}
          </button>
        </div>
      </div>
    </div>
  );
};

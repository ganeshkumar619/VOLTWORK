import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  Sparkles,
  Zap,
  Wrench,
  ShieldCheck,
  Star,
  DollarSign,
  X,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { JobTimeline } from '../../components/JobTimeline.tsx';
import { AIAnalysisCard } from '../../components/AIAnalysisCard.tsx';
import { InvoiceModal } from '../../components/InvoiceModal.tsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { Job, Invoice, JobMaterial, WorkerProfile } from '../../types/index.ts';

interface JobDetailCustomerProps {
  jobId: string;
  onBack: () => void;
}

export const JobDetailCustomer: React.FC<JobDetailCustomerProps> = ({ jobId, onBack }) => {
  const { t } = useI18n();
  const [job, setJob] = useState<Job | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [materials, setMaterials] = useState<JobMaterial[]>([]);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchJobDossier = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/jobs/${jobId}`);
      const j = data.job || data;
      setJob(j);
      setMaterials(data.materials || j.materials || []);
      setInvoice(data.invoice || null);

      const workerId = j.assignedWorkerId;
      if (workerId) {
        const workers = await apiRequest('/api/workers');
        const assigned = (workers || []).find((w: WorkerProfile) => w.id === workerId);
        if (assigned) setWorker(assigned);
      }
    } catch (err) {
      console.error('Failed to load customer job dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDossier();
  }, [jobId]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !job.finalAmount) return;

    setPaying(true);
    try {
      await apiRequest('/api/billing/record-payment', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          amount: job.finalAmount,
          paymentMethod,
          transactionRef: `TXN-UPI-${Date.now().toString().slice(-6)}`,
          notes: 'Customer digital payment via VoltWork Portal',
        }),
      });

      setPaymentSuccess(true);
      setShowPayModal(false);
      fetchJobDossier();
    } catch (err: any) {
      alert(err.message || t('Operation Failed', 'Payment failed'));
    } finally {
      setPaying(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p>{t('Loading...', 'Loading Service Status & Live Radar...')}</p>
      </div>
    );
  }

  const isBillReady = job.finalAmount && ['ADMIN_VERIFIED', 'PAYMENT_PENDING', 'PAID', 'CLOSED'].includes(job.status);
  const isPaid = ['PAID', 'CLOSED'].includes(job.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Back to My Requests', 'Back to My Requests')}
        </button>

        <div className="flex items-center gap-3">
          {invoice && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              {t('Digital Receipt / Bill', 'Digital Receipt / Bill')}
            </button>
          )}

          {isBillReady && !isPaid && (
            <button
              onClick={() => setShowPayModal(true)}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              {t('Pay Bill', 'Pay Bill')}: {formatCurrency(job.finalAmount!)}
            </button>
          )}
        </div>
      </div>

      {paymentSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="block text-white">{t('Payment Confirmed!', 'Payment Confirmed!')}</strong>
            <span>{t('Operation Successful', 'Your electrical service invoice is fully settled. Thank you for choosing VoltWork AI.')}</span>
          </div>
        </div>
      )}

      {/* Main Header & Stage Tracker */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono font-black text-cyan-400 text-lg">{job.id}</span>
              <PriorityBadge priority={job.priority} size="sm" />
              <StatusBadge status={job.status} size="sm" />
            </div>
            <h1 className="text-xl font-bold text-white">{t(job.category, job.category)}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{t('Created Date', 'Booked on')}: {formatDateTime(job.createdAt)}</p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">{t('Total Bill Amount', 'Total Bill Amount')}</span>
            {job.finalAmount ? (
              <span className="text-2xl font-mono font-black text-emerald-400">
                {formatCurrency(job.finalAmount)}
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                {t('Admin Reviewing Bill', 'Admin Reviewing Bill')}
              </span>
            )}
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        <JobTimeline currentStatus={job.status} history={job.statusHistory} />
      </div>

      {/* Grid: Map & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Technician & Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Assigned Technician Profile */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              {t('Assigned Electrician', 'Assigned Electrician')}
            </h3>

            {job.assignedWorkerName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-extrabold text-base">
                    {job.assignedWorkerName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{job.assignedWorkerName}</h4>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{worker?.rating || '4.9'} {t('Verified Rating', 'Verified Rating')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t('Contact Number:', 'Contact Number:')}</span>
                    <a
                      href={`tel:${job.assignedWorkerPhone}`}
                      className="font-mono text-cyan-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {job.assignedWorkerPhone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t('Experience:', 'Experience:')}</span>
                    <span className="text-zinc-300">{worker?.experienceYears || 3} {t('Years Certified', 'Years Certified')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-400 space-y-1">
                <Clock className="w-4 h-4 text-amber-400 mx-auto animate-pulse" />
                <p className="font-medium text-zinc-300">{t('Dispatch in Progress', 'Dispatch in Progress')}</p>
                <p className="text-[11px] text-zinc-500">{t('Admin is matching the best nearby electrician.', 'Admin is matching the best nearby electrician.')}</p>
              </div>
            )}
          </div>

          {/* Fault Summary */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
            <h3 className="font-bold text-white text-sm">{t('Fault Description', 'Fault Description')}</h3>
            <p className="text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 leading-relaxed">
              "{job.description || (job as any).problemDescription || 'General electrical service requested'}"
            </p>
          </div>
        </div>

        {/* Right Column: Site Address & AI Safety Check */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Site Address Card */}
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              {t('Service Site Location & Address', 'Service Site Location & Address')}
            </h3>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                {t('Customer Premise Address:', 'Customer Premise Address:')}
              </span>
              <p className="text-sm font-semibold text-zinc-200 leading-relaxed">
                {job.address || 'Kovilpatti, Thoothukudi District, Tamilnadu - 628716'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-800/80 text-zinc-400">
                <span>{t('Customer', 'Customer')}: <strong className="text-zinc-200">{job.customerName}</strong></span>
                <span>{t('Contact Number:', 'Contact:')} <strong className="text-zinc-200">{job.customerPhone}</strong></span>
              </div>
            </div>
          </div>

          {/* AI Analysis View */}
          {job.aiAnalysis && <AIAnalysisCard analysis={job.aiAnalysis} />}

          {/* Final Bill Breakdown if verified */}
          {isBillReady && (
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-extrabold text-white">{t('Verified Bill Breakdown', 'Verified Bill Breakdown')}</h3>
                </div>
                {isPaid ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-500 font-bold border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500 font-bold">{t('PAID', 'PAID ✓')}</span>
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {t('Payment Due', 'Payment Due')}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>{t('Labour Charges:', 'Labour Charges:')}</span>
                  <span className="font-mono text-zinc-200">{formatCurrency(job.labourCharge || 0)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('Materials & Spares:', 'Materials & Spares:')}</span>
                  <span className="font-mono text-zinc-200">{formatCurrency(job.materialCost || 0)}</span>
                </div>
                {job.additionalCharges ? (
                  <div className="flex justify-between text-zinc-400">
                    <span>{t('Callout / Extra:', 'Callout / Extra:')}</span>
                    <span className="font-mono text-zinc-200">{formatCurrency(job.additionalCharges)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
                  <span>{t('Total Amount:', 'Total Amount:')}</span>
                  <span className="font-mono text-emerald-400 text-base">{formatCurrency(job.finalAmount!)}</span>
                </div>
              </div>

              {!isPaid && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  {t('Pay Now', 'Pay Now')} ({formatCurrency(job.finalAmount!)}) {t('via UPI / Card', 'via UPI / Card')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Digital Invoice Modal */}
      {invoice && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoice={invoice}
          materials={materials}
        />
      )}

      {/* Online Pay Modal */}
      {showPayModal && job && job.finalAmount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">{t('VoltWork Secure Checkout', 'VoltWork Secure Checkout')}</h2>
            <p className="text-xs text-zinc-400 mb-4">{t('Pay electrical service bill for', 'Pay electrical service bill for')} {job.id}</p>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center mb-4">
              <span className="text-xs text-zinc-500 block">{t('Total Due:', 'Total Due:')}</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {formatCurrency(job.finalAmount)}
              </span>
            </div>

            <form onSubmit={handlePayNow} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-2">{t('Select Payment Method', 'Select Payment Method')}</label>
                <div className="space-y-2">
                  {[
                    { id: 'upi', label: 'UPI / Google Pay / PhonePe / QR' },
                    { id: 'card', label: 'Credit or Debit Card' },
                    { id: 'cash', label: 'Cash on Completion' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        paymentMethod === m.id
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-semibold">{t(m.label, m.label)}</span>
                      <input
                        type="radio"
                        name="pay"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="accent-cyan-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {paying ? (
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {t('Confirm Payment', 'Confirm Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

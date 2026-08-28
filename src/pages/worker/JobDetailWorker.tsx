import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Plus,
  X,
  Send,
  Zap,
  Wrench,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { JobTimeline } from '../../components/JobTimeline.tsx';
import { AIAnalysisCard } from '../../components/AIAnalysisCard.tsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { Job, JobMaterial } from '../../types/index.ts';

interface JobDetailWorkerProps {
  jobId: string;
  onBack: () => void;
}

export const JobDetailWorker: React.FC<JobDetailWorkerProps> = ({ jobId, onBack }) => {
  const { t } = useI18n();
  const [job, setJob] = useState<Job | null>(null);
  const [materials, setMaterials] = useState<JobMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [locStatus, setLocStatus] = useState('');

  // Field Submission Form
  const [workerNotes, setWorkerNotes] = useState('');
  const [labourCharge, setLabourCharge] = useState<number>(350);
  const [materialItems, setMaterialItems] = useState<
    Array<{ materialName: string; quantity: number; unitPrice: number }>
  >([{ materialName: 'Capacitor 2.5 mfd', quantity: 1, unitPrice: 120 }]);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
  ]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/jobs/${jobId}`);
      const j = data.job || data;
      setJob(j);
      setMaterials(data.materials || j.materials || []);
      if (j.workDetails?.workSummary || j.workerNotes) {
        setWorkerNotes(j.workDetails?.workSummary || j.workerNotes);
      }
      if (j.workDetails?.labourCharge || j.labourCharge) {
        setLabourCharge(j.workDetails?.labourCharge || j.labourCharge);
      }
    } catch (err) {
      console.error('Failed to load job for worker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  // Stage transition with live GPS location capture
  const handleTransition = async (status: string) => {
    setLocStatus(t('Updating status...', 'Updating status...'));
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (navigator.geolocation && ['ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(status)) {
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, enableHighAccuracy: true });
        });
        latitude = Number(pos.coords.latitude.toFixed(6));
        longitude = Number(pos.coords.longitude.toFixed(6));
        setLocStatus(`${t('Location Shared', 'Location Shared')}: ${latitude}, ${longitude}`);
      } catch (err) {
        console.warn('Geolocation not available for worker transition:', err);
      }
    }

    try {
      await apiRequest(`/api/jobs/${jobId}/worker-status`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          latitude,
          longitude,
        }),
      });
      setLocStatus(t('Status updated ✓', 'Status updated ✓'));
      fetchJob();
    } catch (err: any) {
      alert(err.message || t('Status transition failed', 'Status transition failed'));
      setLocStatus('');
    }
  };

  // Add/Remove material items
  const handleAddMaterialRow = () => {
    setMaterialItems([...materialItems, { materialName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveMaterialRow = (idx: number) => {
    setMaterialItems(materialItems.filter((_, i) => i !== idx));
  };

  const handleMaterialChange = (idx: number, field: string, value: any) => {
    const updated = [...materialItems];
    (updated[idx] as any)[field] = value;
    setMaterialItems(updated);
  };

  const handleAddPhoto = (type: 'before' | 'after') => {
    const sample = 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&auto=format&fit=crop&q=60';
    if (type === 'before') {
      setBeforePhotos([...beforePhotos, sample]);
    } else {
      setAfterPhotos([...afterPhotos, sample]);
    }
  };

  // Submit Field Execution to Admin
  // Strict rule: Worker CANNOT approve bill or set customer final amount!
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerNotes.trim()) {
      alert(t('Please describe what electrical repair was performed.', 'Please describe what electrical repair was performed.'));
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/api/jobs/${jobId}/worker-complete`, {
        method: 'POST',
        body: JSON.stringify({
          workSummary: workerNotes,
          workerNotes,
          labourCharge: Number(labourCharge),
          materialsList: materialItems.filter((m) => m.materialName.trim()),
          beforePhotos,
          afterPhotos,
        }),
      });

      setSubmitSuccess(true);
      fetchJob();
    } catch (err: any) {
      alert(err.message || t('Operation Failed', 'Operation Failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p>{t('Loading Job Details...', 'Loading Job Details...')}</p>
      </div>
    );
  }

  const isSubmittedForAdmin = [
    'COMPLETED',
    'WAITING_FOR_ADMIN_VERIFICATION',
    'ADMIN_VERIFIED',
    'PAYMENT_PENDING',
    'PAID',
    'CLOSED',
  ].includes(job.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Work Orders', 'Back to Work Orders')}
        </button>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={job.priority} size="sm" />
          <StatusBadge status={job.status} size="sm" />
        </div>
      </div>

      {/* Main Header & Timeline */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
        <div>
          <span className="font-mono text-sm font-bold text-cyan-400">{job.id}</span>
          <h1 className="text-xl font-extrabold text-white mt-0.5">{t(job.category, job.category)}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Preferred Schedule', 'Scheduled')}: {job.preferredSchedule || formatDateTime(job.createdAt)}
          </p>
        </div>

        <JobTimeline currentStatus={job.status} history={job.statusHistory} />
      </div>

      {/* Customer Contact & Navigation Card */}
      <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            {t('Customer Site & Contact', 'Customer Site & Contact')}
          </h3>
          {(job.gpsCaptured || (job.latitude && job.longitude)) && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('GPS Captured ✓', 'GPS Captured ✓')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-zinc-500">{t('Customer Name', 'Customer Name')}:</span>
            <p className="font-bold text-white text-sm">{job.customerName}</p>
            <p className="text-zinc-200 font-medium mt-1 leading-relaxed">{job.address}</p>
            {job.latitude && job.longitude && (
              <p className="text-[11px] font-mono text-cyan-400 mt-1">
                GPS: {job.latitude.toFixed(5)}, {job.longitude.toFixed(5)}
              </p>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <a
              href={`tel:${job.customerPhone}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              {t('Call Customer', 'Call Customer')} ({job.customerPhone})
            </a>
          </div>
        </div>
      </div>

      {/* Reported Problem & AI Safety Guidance */}
      <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          {t('Fault Details', 'Fault Details')}
        </h3>
        <p className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 leading-relaxed">
          "{job.description || (job as any).problemDescription || t('General electrical fault', 'General electrical fault')}"
        </p>

        {job.aiAnalysis && <AIAnalysisCard analysis={job.aiAnalysis} />}
      </div>

      {/* Step Actions Progress Row with Geolocation Trigger */}
      <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            {t('Execution Status Progress (Live Location Enabled)', 'Execution Status Progress (Live Location Enabled)')}
          </h3>
          {locStatus && <span className="text-[11px] text-cyan-400 font-mono">{locStatus}</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <button
            onClick={() => handleTransition('ACCEPTED')}
            disabled={job.status !== 'ASSIGNED'}
            className={`p-3 rounded-xl font-bold transition ${
              job.status === 'ASSIGNED'
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md cursor-pointer'
                : 'bg-zinc-950 text-zinc-600 border border-zinc-800/80'
            }`}
          >
            1. {t('Accept', 'Accept')}
          </button>

          <button
            onClick={() => handleTransition('ON_THE_WAY')}
            disabled={job.status !== 'ACCEPTED'}
            className={`p-3 rounded-xl font-bold transition ${
              job.status === 'ACCEPTED'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer'
                : 'bg-zinc-950 text-zinc-600 border border-zinc-800/80'
            }`}
          >
            2. {t('On The Way', 'On The Way')} 📍
          </button>

          <button
            onClick={() => handleTransition('REACHED')}
            disabled={job.status !== 'ON_THE_WAY'}
            className={`p-3 rounded-xl font-bold transition ${
              job.status === 'ON_THE_WAY'
                ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md cursor-pointer'
                : 'bg-zinc-950 text-zinc-600 border border-zinc-800/80'
            }`}
          >
            3. {t('Reached Site', 'Reached Site')}
          </button>

          <button
            onClick={() => handleTransition('WORK_STARTED')}
            disabled={job.status !== 'REACHED'}
            className={`p-3 rounded-xl font-bold transition ${
              job.status === 'REACHED'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md cursor-pointer'
                : 'bg-zinc-950 text-zinc-600 border border-zinc-800/80'
            }`}
          >
            4. {t('Start Work', 'Start Work')}
          </button>
        </div>
      </div>

      {/* FIELD EXECUTION & MATERIALS SUBMISSION FORM */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">{t('Technician Field Execution & Materials', 'Technician Field Execution & Materials')}</h3>
            <p className="text-xs text-zinc-400">
              {t(
                'Submit your repair notes & materials used. Master Electrician / Admin will verify and set final customer bill.',
                'Submit your repair notes & materials used. Master Electrician / Admin will verify and set final customer bill.'
              )}
            </p>
          </div>

          {isSubmittedForAdmin && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {t('Submitted for Admin Verification', 'Submitted for Admin Verification')}
            </span>
          )}
        </div>

        {submitSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t(
              'Field report and spare materials submitted to Admin successfully!',
              'Field report and spare materials submitted to Admin successfully!'
            )}
          </div>
        )}

        <form onSubmit={handleSubmitWork} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">
              {t('Work Performed & Solution Notes', 'Work Performed & Solution Notes')}
            </label>
            <textarea
              rows={3}
              required
              disabled={isSubmittedForAdmin}
              value={workerNotes}
              onChange={(e) => setWorkerNotes(e.target.value)}
              placeholder={t(
                'e.g. Diagnosed worn capacitor on ceiling fan. Replaced with new 2.5mfd capacitor. Re-greased bearings. Fan now running smoothly.',
                'e.g. Diagnosed worn capacitor on ceiling fan. Replaced with new 2.5mfd capacitor. Re-greased bearings. Fan now running smoothly.'
              )}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Dynamic Materials Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-300">{t('Materials / Spares Used', 'Materials / Spares Used')}</label>
              {!isSubmittedForAdmin && (
                <button
                  type="button"
                  onClick={handleAddMaterialRow}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3 h-3" />
                  {t('+ Add Spare Part', '+ Add Spare Part')}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {materialItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={isSubmittedForAdmin}
                    value={item.materialName}
                    onChange={(e) => handleMaterialChange(idx, 'materialName', e.target.value)}
                    placeholder={t('Material name (e.g. 2.5mfd Capacitor)', 'Material name (e.g. 2.5mfd Capacitor)')}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                  />

                  <input
                    type="number"
                    disabled={isSubmittedForAdmin}
                    value={item.quantity}
                    onChange={(e) => handleMaterialChange(idx, 'quantity', Number(e.target.value))}
                    placeholder={t('Qty', 'Qty')}
                    className="w-16 px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-center focus:outline-none focus:border-cyan-500 font-mono"
                  />

                  <input
                    type="number"
                    disabled={isSubmittedForAdmin}
                    value={item.unitPrice}
                    onChange={(e) => handleMaterialChange(idx, 'unitPrice', Number(e.target.value))}
                    placeholder={t('₹ Unit', '₹ Unit')}
                    className="w-24 px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />

                  {!isSubmittedForAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialRow(idx)}
                      className="p-2 text-zinc-500 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-zinc-300 mb-1">{t('Labour Charge (₹)', 'Labour Charge (₹)')}</label>
              <input
                type="number"
                disabled={isSubmittedForAdmin}
                value={labourCharge}
                onChange={(e) => setLabourCharge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400">{t('Total Materials + Labour:', 'Total Materials + Labour:')}</span>
              <span className="font-mono font-bold text-emerald-400 text-base">
                {formatCurrency(
                  labourCharge +
                    materialItems.reduce((s, m) => s + (Number(m.quantity) * Number(m.unitPrice) || 0), 0)
                )}
              </span>
            </div>
          </div>

          {/* Submission Notice & Action */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[11px] text-zinc-500">
              {t('⚡ Admin will review before generating invoice and customer SMS.', '⚡ Admin will review before generating invoice and customer SMS.')}
            </span>

            {!isSubmittedForAdmin && (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t('Submit to Admin for Verification', 'Submit to Admin for Verification')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

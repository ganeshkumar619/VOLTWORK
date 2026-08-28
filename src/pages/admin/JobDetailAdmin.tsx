import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserCheck,
  MapPin,
  Phone,
  Calendar,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Printer,
  Wrench,
  AlertTriangle,
  Camera,
  CheckCircle2,
  DollarSign,
  Layers,
  Save,
  Send,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { JobTimeline } from '../../components/JobTimeline.tsx';
import { AIAnalysisCard } from '../../components/AIAnalysisCard.tsx';
import { InvoiceModal } from '../../components/InvoiceModal.tsx';
import { SMSModal } from '../../components/SMSModal.tsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import type { Job, WorkerProfile, JobMaterial, Invoice } from '../../types/index.ts';

interface JobDetailAdminProps {
  jobId: string;
  onBack: () => void;
}

export const JobDetailAdmin: React.FC<JobDetailAdminProps> = ({ jobId, onBack }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [materials, setMaterials] = useState<JobMaterial[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [loading, setLoading] = useState(true);

  // Verification Form State
  const [labourCharge, setLabourCharge] = useState<number>(0);
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  const fetchJobDossier = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/jobs/${jobId}`);
      const j = data.job || data;
      setJob(j);
      setMaterials(data.materials || j.materials || []);
      setInvoice(data.invoice || null);

      // Auto-fill verification fields
      const matTotal = (data.materials || j.materials || []).reduce((s: number, m: JobMaterial) => s + m.totalPrice, 0);
      setMaterialCost(j.materialCost || matTotal);
      setLabourCharge(j.labourCharge || (j.workDetails?.labourCharge) || 350);
      setAdditionalCharges(j.additionalCharges || (j.workDetails?.additionalCharges) || 0);
      setFinalAmount(j.finalAmount || matTotal + (j.labourCharge || (j.workDetails?.labourCharge) || 350));
      setVerificationNotes(j.adminVerificationNotes || (j.workDetails?.adminVerificationNotes) || '');

      // Load workers & AI recommendation
      const [workersList, recs] = await Promise.all([
        apiRequest('/api/workers'),
        apiRequest('/api/ai/recommend-workers', {
          method: 'POST',
          body: JSON.stringify({ jobId: j.id }),
        }),
      ]);

      setWorkers(workersList);
      setRecommendations(recs.recommendations || []);
      if (j.assignedWorkerId) {
        setSelectedWorkerId(j.assignedWorkerId);
      } else if (recs.recommendations && recs.recommendations.length > 0) {
        setSelectedWorkerId(recs.recommendations[0].worker.id);
      }
    } catch (err) {
      console.error('Failed to load job dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDossier();
  }, [jobId]);

  // Recalculate suggested total when items change
  const handleCalculateTotal = (mat: number, lab: number, add: number) => {
    setMaterialCost(mat);
    setLabourCharge(lab);
    setAdditionalCharges(add);
    setFinalAmount(mat + lab + add);
  };

  // Assign Technician
  const handleAssignWorker = async () => {
    if (!selectedWorkerId) return;
    try {
      await apiRequest(`/api/jobs/${jobId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ workerId: selectedWorkerId }),
      });
      fetchJobDossier();
    } catch (err: any) {
      alert(err.message || 'Failed to assign electrician');
    }
  };

  // Admin Verification & Bill Finalization
  const handleVerifyBill = async () => {
    if (finalAmount <= 0) {
      alert('Please specify a valid final bill amount.');
      return;
    }

    setVerifying(true);
    try {
      await apiRequest(`/api/jobs/${jobId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          finalAmount: Number(finalAmount),
          labourCharge: Number(labourCharge),
          materialCost: Number(materialCost),
          additionalCharges: Number(additionalCharges),
          adminVerificationNotes: verificationNotes,
        }),
      });

      setVerifySuccess(true);
      fetchJobDossier();
      setTimeout(() => setVerifySuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="py-20 text-center">
        <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p className="text-xs text-zinc-400">Loading Job Dossier...</p>
      </div>
    );
  }

  const assignedWorker = workers.find((w) => w.id === job.assignedWorkerId);
  const isVerified = job.finalAmount && ['ADMIN_VERIFIED', 'PAYMENT_PENDING', 'PAID', 'CLOSED'].includes(job.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar with Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>

        <div className="flex items-center gap-2">
          {invoice && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              View Invoice
            </button>
          )}

          {isVerified && (
            <button
              onClick={() => setShowSmsModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Send Customer SMS
            </button>
          )}
        </div>
      </div>

      {/* Main Dossier Header */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-lg font-black text-cyan-400">{job.id}</span>
              <PriorityBadge priority={job.priority} size="sm" />
              <StatusBadge status={job.status} size="sm" />
            </div>
            <h1 className="text-xl font-bold text-white">{job.category}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Created: {formatDateTime(job.createdAt)}</p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">Admin Approved Bill</span>
            {job.finalAmount ? (
              <span className="text-2xl font-mono font-black text-emerald-400">
                {formatCurrency(job.finalAmount)}
              </span>
            ) : (
              <span className="text-sm font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                Pending Verification
              </span>
            )}
          </div>
        </div>

        {/* Visual Stage Timeline */}
        <JobTimeline currentStatus={job.status} history={job.statusHistory} />
      </div>

      {/* Grid: Details & AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Problem Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              Customer Information
            </h3>

            <div className="space-y-2">
              <div>
                <span className="text-zinc-500 block">Name:</span>
                <span className="font-semibold text-zinc-200">{job.customerName}</span>
              </div>

              <div>
                <span className="text-zinc-500 block">Phone Number (SMS Target):</span>
                <span className="font-mono text-cyan-400 font-medium">{job.customerPhone}</span>
              </div>

              <div>
                <span className="text-zinc-500 block">Service Address:</span>
                <span className="text-zinc-300">{job.address}</span>
              </div>

              <div>
                <span className="text-zinc-500 block">GPS Coordinates:</span>
                <span className="font-mono text-zinc-400">
                  {job.latitude ? `${job.latitude.toFixed(4)}, ${job.longitude?.toFixed(4)}` : 'Not captured'}
                </span>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Reported Electrical Fault
            </h3>

            <p className="text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 leading-relaxed">
              "{job.description || (job as any).problemDescription || 'Electrical service requested'}"
            </p>

            {((job.customerPhotos && job.customerPhotos.length > 0) || job.problemPhotoUrl) && (
              <div>
                <span className="text-zinc-500 block mb-2 font-medium">Customer Uploaded Photos:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(job.customerPhotos || (job.problemPhotoUrl ? [job.problemPhotoUrl] : [])).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt="Fault photo"
                      className="w-full h-24 object-cover rounded-lg border border-zinc-700"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Column: AI Diagnosis, Map, Assignment & Verification */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis Panel */}
          {job.aiAnalysis && <AIAnalysisCard analysis={job.aiAnalysis} isAdminView />}

          {/* Service Premise & Customer Details Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Service Premise & Location Address
            </h3>
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                Site Address:
              </span>
              <p className="text-sm font-semibold text-zinc-200 leading-relaxed">
                {job.address || 'Kovilpatti, Thoothukudi District, Tamilnadu - 628716'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-800/80 text-zinc-400">
                <span>Customer: <strong className="text-zinc-200">{job.customerName}</strong></span>
                <span>Contact: <strong className="text-zinc-200">{job.customerPhone}</strong></span>
              </div>
            </div>
          </div>

          {/* Technician Assignment Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                Technician Dispatch & Assignment
              </h3>
              {job.assignedWorkerName && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Assigned: {job.assignedWorkerName}
                </span>
              )}
            </div>

            {recommendations.length > 0 && (
              <div className="mb-4">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  AI Recommended Technicians (Ranked by Skill & Distance)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recommendations.slice(0, 4).map((rec: any) => (
                    <div
                      key={rec.worker.id}
                      onClick={() => setSelectedWorkerId(rec.worker.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        selectedWorkerId === rec.worker.id
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          {rec.worker.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                            Score: {rec.score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{rec.reason}</p>
                      </div>
                      <span className="text-xs font-mono text-cyan-400">~{rec.estimatedETA}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select an electrician...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.skills.join(', ')}) — Status: {w.availability}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAssignWorker}
                disabled={!selectedWorkerId}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition whitespace-nowrap"
              >
                Assign Worker
              </button>
            </div>
          </div>

          {/* Field Technician Submission Review (Materials & Labour) */}
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              Field Technician Submission & Materials
            </h3>

            {job.workerNotes && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
                <span className="text-zinc-500 block text-[11px] mb-1">Technician Field Notes:</span>
                "{job.workerNotes}"
              </div>
            )}

            {/* Materials Table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2 px-2">Material / Part</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Price</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {materials.map((m, idx) => (
                    <tr key={idx} className="text-zinc-300">
                      <td className="py-2 px-2">{m.materialName}</td>
                      <td className="py-2 px-2 text-center">{m.quantity}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(m.unitPrice)}</td>
                      <td className="py-2 px-2 text-right font-medium text-white">
                        {formatCurrency(m.totalPrice)}
                      </td>
                    </tr>
                  ))}
                  {materials.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-center text-zinc-500 italic">
                        No materials billed by technician
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Photos (Before and After) */}
            {(() => {
              const beforeList = job.workDetails?.beforePhotos || job.beforeRepairPhotos || [];
              const afterList = job.workDetails?.afterPhotos || job.afterRepairPhotos || [];
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {beforeList.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 block mb-2">Before Repair Photos:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {beforeList.map((p: string, idx: number) => (
                          <img key={idx} src={p} alt="Before" className="w-24 h-24 object-cover rounded-lg border border-zinc-700" />
                        ))}
                      </div>
                    </div>
                  )}

                  {afterList.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 block mb-2">After Repair Photos:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {afterList.map((p: string, idx: number) => (
                          <img key={idx} src={p} alt="After" className="w-24 h-24 object-cover rounded-lg border border-emerald-500/40" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* CRITICAL: ADMIN FINAL BILL VERIFICATION & LOCK PANEL */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-900 border-2 border-cyan-500/40 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Admin Bill Verification & Final Lock</h3>
                  <p className="text-xs text-zinc-400">
                    The Worker reports data, but only the Admin approves and sets the binding customer bill.
                  </p>
                </div>
              </div>

              {isVerified && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Bill Locked & Verified
                </span>
              )}
            </div>

            {verifySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Final Bill successfully verified & saved to database! You may now trigger the Customer SMS.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Material Cost (₹)</label>
                <input
                  type="number"
                  value={materialCost}
                  onChange={(e) => handleCalculateTotal(Number(e.target.value), labourCharge, additionalCharges)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Labour Charge (₹)</label>
                <input
                  type="number"
                  value={labourCharge}
                  onChange={(e) => handleCalculateTotal(materialCost, Number(e.target.value), additionalCharges)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Extra / Callout (₹)</label>
                <input
                  type="number"
                  value={additionalCharges}
                  onChange={(e) => handleCalculateTotal(materialCost, labourCharge, Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* FINAL BINDING AMOUNT OVERRIDE */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold text-cyan-300 block">FINAL ADMIN-APPROVED BILL (₹):</span>
                <span className="text-[11px] text-zinc-400">
                  This exact amount will be sent via SMS and charged on the invoice.
                </span>
              </div>

              <div className="w-full sm:w-48">
                <input
                  type="number"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border-2 border-cyan-500 text-lg font-black text-cyan-400 font-mono text-right focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Admin Approval Notes (Optional)</label>
              <input
                type="text"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g. Capacitor replaced, tested load on full speed for 15 mins. Guaranteed for 6 months."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleVerifyBill}
                disabled={verifying}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition flex items-center gap-2"
              >
                {verifying ? (
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Approve & Lock Final Bill
              </button>

              <button
                type="button"
                onClick={() => setShowSmsModal(true)}
                disabled={!isVerified}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send SMS to Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {invoice && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          invoice={invoice}
          materials={materials}
        />
      )}

      {showSmsModal && (
        <SMSModal
          isOpen={showSmsModal}
          onClose={() => setShowSmsModal(false)}
          job={job}
          onSmsSent={fetchJobDossier}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { X, Send, MessageSquare, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency } from '../lib/formatters.ts';
import type { Job } from '../types/index.ts';

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onSmsSent?: () => void;
}

export const SMSModal: React.FC<SMSModalProps> = ({ isOpen, onClose, job, onSmsSent }) => {
  const defaultMessage = `VoltWork AI (Mudukkumeendanpatti, Kovilpatti - 628716): Dear ${job.customerName}, your electrical service for ${job.category} (Job: ${job.id}) is complete. Admin approved final bill: ${formatCurrency(job.finalAmount || 0)}. View invoice & pay online in your portal. Helpline: +91 98765 43210. Thank you!`;

  const [message, setMessage] = useState(defaultMessage);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !job) return null;

  const isVerified = job.finalAmount && ['ADMIN_VERIFIED', 'PAYMENT_PENDING', 'PAID', 'CLOSED'].includes(job.status);

  const handleSend = async () => {
    if (!isVerified) {
      setErrorMsg('Cannot send SMS until Admin sets and approves the final bill amount.');
      setStatus('error');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await apiRequest('/api/sms/send', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          customMessage: message,
        }),
      });

      setStatus('success');
      if (onSmsSent) onSmsSent();
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch SMS');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Admin-Controlled Customer SMS</h3>
            <p className="text-xs text-zinc-400">Direct gateway dispatch to registered customer mobile</p>
          </div>
        </div>

        {/* Verification Check Notice */}
        {!isVerified ? (
          <div className="p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Bill Not Verified Yet</strong>
              You must verify completed work and set the final amount before triggering customer SMS.
            </div>
          </div>
        ) : (
          <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Bill Verified: <strong>{formatCurrency(job.finalAmount)}</strong>
            </span>
          </div>
        )}

        {/* Recipient Details */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-zinc-400">Recipient Name:</span>
            <span className="text-zinc-200 font-medium">{job.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Mobile Number:</span>
            <span className="text-cyan-400 font-mono font-medium">{job.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Service Reference:</span>
            <span className="text-zinc-200">{job.id}</span>
          </div>
        </div>

        {/* Message Content Editor */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">SMS Message Body:</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!isVerified || loading}
            className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 font-sans resize-none"
          />
          <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
            <span>Encoding: GSM 7-bit</span>
            <span>{message.length} characters (1 SMS credit)</span>
          </div>
        </div>

        {status === 'error' && (
          <div className="p-2.5 mb-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {status === 'success' && (
          <div className="p-2.5 mb-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            SMS dispatched successfully! Delivered to carrier.
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!isVerified || loading}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send Customer SMS
          </button>
        </div>
      </div>
    </div>
  );
};

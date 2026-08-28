import type { JobStatus, JobPriority, PaymentStatus, AttendanceStatus } from '../types/index.ts';

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export function formatTimeIST(date?: Date | string): string {
  try {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function formatDateIST(date?: Date | string): string {
  try {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function getStatusColor(status: JobStatus): { bg: string; text: string; border: string; glow: string } {
  switch (status) {
    case 'REQUESTED':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' };
    case 'AI_ANALYSIS':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' };
    case 'ASSIGNED':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' };
    case 'ACCEPTED':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' };
    case 'ON_THE_WAY':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20' };
    case 'REACHED':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', glow: 'shadow-teal-500/20' };
    case 'WORK_STARTED':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/20' };
    case 'COMPLETED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' };
    case 'WAITING_FOR_ADMIN_VERIFICATION':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' };
    case 'ADMIN_VERIFIED':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' };
    case 'PAYMENT_PENDING':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' };
    case 'PAID':
      return { bg: 'bg-green-500/20', text: 'text-green-500 font-bold', border: 'border-green-500/40', glow: 'shadow-green-500/20' };
    case 'CLOSED':
      return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', glow: 'shadow-zinc-700/20' };
    default:
      return { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700', glow: 'shadow-zinc-700/20' };
  }
}

export function getPriorityColor(priority: JobPriority): { bg: string; text: string; border: string } {
  switch (priority) {
    case 'emergency':
      return { bg: 'bg-rose-500/15', text: 'text-rose-400 font-semibold', border: 'border-rose-500/40' };
    case 'high':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'medium':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'low':
      return { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' };
    default:
      return { bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' };
  }
}

export function getPaymentBadge(status: PaymentStatus): { bg: string; text: string } {
  switch (status) {
    case 'paid':
      return { bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]', text: 'PAID ✓' };
    case 'pending':
      return { bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', text: 'PENDING' };
    case 'failed':
      return { bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30', text: 'FAILED' };
    case 'cancelled':
      return { bg: 'bg-zinc-800 text-zinc-400 border border-zinc-700', text: 'CANCELLED' };
  }
}

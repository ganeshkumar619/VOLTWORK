import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { JobStatus, JobPriority } from '../types/index.ts';
import { getStatusColor, getPriorityColor } from '../lib/formatters.ts';
import { useI18n } from '../lib/i18n.tsx';

interface StatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useI18n();
  const colors = getStatusColor(status);

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  const isPaid = status === 'PAID' || status === ('paid' as any);

  if (isPaid) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border backdrop-blur-xs whitespace-nowrap shrink-0 bg-green-500/20 text-green-500 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)] ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
        <span className="text-green-500 font-bold">{t('status_PAID', 'PAID ✓')}</span>
      </span>
    );
  }

  const getGlowDot = () => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-emerald-400 shadow-[0_0_6px_#10b981]';
      case 'in_progress':
      case 'assigned':
      case 'on_the_way':
        return 'bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse';
      case 'work_submitted':
      case 'bill_approved':
        return 'bg-purple-400 shadow-[0_0_6px_#a855f7]';
      case 'cancelled':
        return 'bg-rose-400 shadow-[0_0_6px_#f43f5e]';
      default:
        return 'bg-amber-400 shadow-[0_0_6px_#f59e0b]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border backdrop-blur-xs whitespace-nowrap shrink-0 ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getGlowDot()}`} />
      {t(`status_${status}`, status.replace(/_/g, ' '))}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: JobPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const { t } = useI18n();
  const colors = getPriorityColor(priority);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-md border backdrop-blur-xs whitespace-nowrap shrink-0 ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      {priority === 'emergency' && <span className="animate-bounce">⚡</span>}
      {t(`priority_${priority}`, priority.toUpperCase())}
    </span>
  );
};

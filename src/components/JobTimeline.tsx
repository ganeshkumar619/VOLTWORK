import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import type { JobStatus, JobStatusHistoryItem } from '../types/index.ts';
import { formatDateTime } from '../lib/formatters.ts';
import { useI18n } from '../lib/i18n.tsx';

interface JobTimelineProps {
  currentStatus: JobStatus;
  history?: JobStatusHistoryItem[];
}

const STAGES: { key: JobStatus; label: string }[] = [
  { key: 'REQUESTED', label: 'Request Submitted' },
  { key: 'ASSIGNED', label: 'Electrician Assigned' },
  { key: 'ACCEPTED', label: 'Job Accepted' },
  { key: 'ON_THE_WAY', label: 'On The Way' },
  { key: 'REACHED', label: 'Reached Site' },
  { key: 'WORK_STARTED', label: 'Work In Progress' },
  { key: 'WAITING_FOR_ADMIN_VERIFICATION', label: 'Work Done - In Review' },
  { key: 'ADMIN_VERIFIED', label: 'Admin Approved Bill' },
  { key: 'PAID', label: 'Payment Complete' },
];

export const JobTimeline: React.FC<JobTimelineProps> = ({ currentStatus, history = [] }) => {
  const { t } = useI18n();

  // Determine active step index
  const stageKeys = STAGES.map((s) => s.key);
  let currentIndex = stageKeys.indexOf(currentStatus);
  if (currentStatus === 'COMPLETED') {
    currentIndex = stageKeys.indexOf('WAITING_FOR_ADMIN_VERIFICATION');
  } else if (currentStatus === 'PAYMENT_PENDING') {
    currentIndex = stageKeys.indexOf('ADMIN_VERIFIED');
  } else if (currentStatus === 'CLOSED') {
    currentIndex = stageKeys.length;
  }
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="w-full py-4">
      {/* Horizontal on Desktop, Vertical on Mobile */}
      <div className="hidden lg:grid grid-cols-9 gap-2 relative">
        {/* Connecting bar */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-800 -z-0" />

        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          const historyEntry = history.find((h) => h.status === stage.key);

          return (
            <div key={stage.key} className="flex flex-col items-center text-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  isPassed
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20 animate-pulse'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </div>

              <p
                className={`mt-2 text-xs font-medium leading-tight ${
                  isCurrent ? 'text-cyan-300 font-semibold' : isPassed ? 'text-zinc-200' : 'text-zinc-500'
                }`}
              >
                {t(stage.key, stage.label)}
              </p>

              {historyEntry && (
                <span className="text-[10px] text-zinc-500 mt-1">
                  {new Date(historyEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Vertical Timeline on Mobile / Small Screens */}
      <div className="lg:hidden space-y-4 relative pl-6 border-l-2 border-zinc-800 ml-3">
        {STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const historyEntry = history.find((h) => h.status === stage.key);

          return (
            <div key={stage.key} className="relative">
              <div
                className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                  isPassed
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/20 animate-pulse'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? 'text-cyan-300 font-semibold' : isPassed ? 'text-zinc-200' : 'text-zinc-500'
                  }`}
                >
                  {t(stage.key, stage.label)}
                </span>
                {historyEntry && (
                  <span className="text-xs text-zinc-500">
                    {formatDateTime(historyEntry.timestamp)} • {historyEntry.updatedByName}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

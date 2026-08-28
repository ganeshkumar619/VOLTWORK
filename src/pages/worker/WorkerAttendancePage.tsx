import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, MapPin, CheckCircle, Plus } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatDate } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { AttendanceRecord } from '../../types/index.ts';

export const WorkerAttendancePage: React.FC = () => {
  const { t } = useI18n();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/attendance/my').then((data) => {
      setRecords(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">{t('My Attendance & Duty Hours', 'My Attendance & Duty Hours')}</h1>
        <p className="text-xs text-zinc-400 mt-1">
          {t('Daily logs of your work check-ins, check-outs, and calculated field hours', 'Daily logs of your work check-ins, check-outs, and calculated field hours')}
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
              <th className="py-3.5 px-4">{t('Date', 'Date')}</th>
              <th className="py-3.5 px-4">{t('Check-In', 'Check-In')}</th>
              <th className="py-3.5 px-4">{t('Check-Out', 'Check-Out')}</th>
              <th className="py-3.5 px-4 text-center">{t('Working Hours', 'Working Hours')}</th>
              <th className="py-3.5 px-4 text-center">{t('Status', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  {t('No attendance history logged yet.', 'No attendance history logged yet.')}
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/40 transition">
                  <td className="py-3.5 px-4 font-mono text-zinc-200 font-medium">{formatDate(r.date)}</td>
                  <td className="py-3.5 px-4 font-mono text-cyan-300">{r.checkIn || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400">{r.checkOut || '—'}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                    {r.workingHours ? `${r.workingHours} ${t('hrs', 'hrs')}` : t('In Progress', 'In Progress')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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

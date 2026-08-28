import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Plus,
  X,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatDate } from '../../lib/formatters.ts';
import { useI18n } from '../../lib/i18n.tsx';
import type { AttendanceRecord, WorkerProfile } from '../../types/index.ts';

export const AttendanceManagement: React.FC = () => {
  const { t } = useI18n();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00:00',
    checkOut: '18:00:00',
    workingHours: 9,
    status: 'present',
    notes: 'Admin recorded',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attData, wData] = await Promise.all([
        apiRequest('/api/attendance'),
        apiRequest('/api/workers'),
      ]);
      setAttendance(Array.isArray(attData) ? attData : []);
      setWorkers(Array.isArray(wData) ? wData : []);
      if (wData.length > 0) {
        setFormData((prev) => ({ ...prev, workerId: wData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/attendance/admin-record', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || t('operation_failed', 'Failed to save attendance'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-cyan-400" />
            {t('Attendance Management', 'Technician Attendance & Working Hours')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Real-time daily check-in, check-out, working hours calculation, and GPS stamps', 'Real-time daily check-in, check-out, working hours calculation, and GPS stamps')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('Record Attendance', 'Record / Adjust Attendance')}
        </button>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4">{t('Worker Name', 'Technician')}</th>
                <th className="py-3.5 px-4">{t('Date', 'Date')}</th>
                <th className="py-3.5 px-4">{t('Check In', 'Check-In')}</th>
                <th className="py-3.5 px-4">{t('Check Out', 'Check-Out')}</th>
                <th className="py-3.5 px-4 text-center">{t('Working Hours', 'Total Working Hours')}</th>
                <th className="py-3.5 px-4 text-center">{t('Status', 'Status')}</th>
                <th className="py-3.5 px-4">{t('GPS Location', 'GPS Location')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    {t('No Attendance Records', 'No attendance records for today.')}
                  </td>
                </tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">{a.workerName}</td>
                    <td className="py-3.5 px-4 text-zinc-300 font-mono">{formatDate(a.date)}</td>
                    <td className="py-3.5 px-4 font-mono text-cyan-300">{a.checkIn || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{a.checkOut || '—'}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {a.workingHours ? `${a.workingHours} ${t('hours', 'hrs')}` : t('In Progress', 'In Progress')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          a.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : a.status === 'half_day'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {a.status === 'present' ? t('Present', 'Present') : a.status === 'half_day' ? t('Half Day', 'Half Day') : t('Absent', 'Absent')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                      {a.locationLat ? `${a.locationLat.toFixed(3)}, ${a.locationLng?.toFixed(3)}` : t('App Check-in', 'App check-in')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">{t('Record Attendance', 'Record Technician Attendance')}</h2>
            <p className="text-xs text-zinc-400 mb-4">{t('Manual adjustment or duty registration', 'Manual adjustment or duty registration')}</p>

            <form onSubmit={handleSaveAttendance} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Worker Name', 'Technician')}</label>
                <select
                  required
                  value={formData.workerId}
                  onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Date', 'Date')}</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">{t('Check In', 'Check In Time')}</label>
                  <input
                    type="time"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">{t('Check Out', 'Check Out Time')}</label>
                  <input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Status', 'Attendance Status')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="present">{t('Present', 'Present (Full Day)')}</option>
                  <option value="half_day">{t('Half Day', 'Half Day')}</option>
                  <option value="leave">{t('Leave', 'Approved Leave')}</option>
                  <option value="absent">{t('Absent', 'Absent')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold"
                >
                  {t('Save', 'Save Attendance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


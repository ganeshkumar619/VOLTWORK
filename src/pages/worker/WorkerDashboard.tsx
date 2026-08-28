import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Navigation,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  Zap,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Play,
  Share2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge.tsx';
import { formatCurrency, formatDateTime } from '../../lib/formatters.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { Job } from '../../types/index.ts';

interface WorkerDashboardProps {
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ onSelectJob, onNavigate }) => {
  const { user, workerProfile, refreshUser } = useAuth();
  const { t } = useI18n();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharingGps, setIsSharingGps] = useState(workerProfile?.isSharingLocation || false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const [jobsData, attData] = await Promise.all([
        apiRequest('/api/jobs'),
        apiRequest('/api/attendance/today'),
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setTodayAttendance(attData?.record || null);
      setIsCheckedIn(!!attData?.record?.checkIn && !attData?.record?.checkOut);
    } catch (err) {
      console.error('Failed to load worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  // Daily Check-In / Check-Out
  const handleToggleAttendance = async () => {
    try {
      if (!isCheckedIn) {
        // Check in with Kovilpatti HQ default fallback coordinates
        let lat = 9.1726;
        let lng = 77.8711;
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((p) => {
            lat = p.coords.latitude;
            lng = p.coords.longitude;
          });
        }
        await apiRequest('/api/attendance/check-in', {
          method: 'POST',
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
      } else {
        // Check out
        await apiRequest('/api/attendance/check-out', {
          method: 'POST',
        });
      }
      fetchWorkerData();
    } catch (err: any) {
      alert(err.message || t('Attendance update failed', 'Attendance update failed'));
    }
  };

  // Toggle Live Location Tracking
  const handleToggleGpsSharing = async () => {
    const nextState = !isSharingGps;
    setIsSharingGps(nextState);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          await apiRequest('/api/workers/location', {
            method: 'POST',
            body: JSON.stringify({
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              isSharing: nextState,
            }),
          });
          refreshUser();
        } catch (err) {
          console.warn('Location update err:', err);
        }
      });
    }
  };

  // Quick Action on Job (Accept, Travel, Reach, Start)
  const handleQuickStatus = async (jobId: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      fetchWorkerData();
    } catch (err: any) {
      alert(err.message || t('Status transition failed', 'Status transition failed'));
    }
  };

  const activeJobs = jobs.filter((j) =>
    ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'REACHED', 'WORK_STARTED'].includes(j.status)
  );

  const pendingVerification = jobs.filter((j) =>
    ['COMPLETED', 'WAITING_FOR_ADMIN_VERIFICATION'].includes(j.status)
  );

  return (
    <div className="space-y-6">
      {/* Worker Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-purple-950/40 border border-zinc-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>{t('Field Electrician Terminal', 'Field Electrician Terminal')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('Hello', 'Hello')}, {user?.name || t('Technician', 'Technician')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {t('Status', 'Status')}: <span className="font-semibold text-emerald-400">{t('On Duty', 'On Duty')}</span> • {t('Rating', 'Rating')}: ★{' '}
            {workerProfile?.rating || '4.9'} / 5.0
          </p>
        </div>

        {/* Action Controls: Attendance & GPS Broadcast */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleGpsSharing}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              isSharingGps
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isSharingGps ? 'animate-pulse text-emerald-400' : ''}`} />
            {isSharingGps ? t('GPS Radar Active', 'GPS Radar Active') : t('Enable Live GPS', 'Enable Live GPS')}
          </button>

          <button
            onClick={handleToggleAttendance}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              isCheckedIn
                ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/20 font-black'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            {isCheckedIn ? t('Check-Out', 'Check-Out') : t('Check-In', 'Check-In')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Active Field Tasks', 'Active Field Tasks')}</span>
          <p className="text-2xl font-black text-cyan-400 font-mono mt-1">{activeJobs.length}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Assigned', 'Assigned')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Awaiting Admin Verification', 'Awaiting Admin Verification')}</span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{pendingVerification.length}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Work details submitted', 'Work details submitted')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Completed Jobs', 'Completed Jobs')}</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {workerProfile?.completedJobsCount || jobs.filter((j) => ['PAID', 'CLOSED'].includes(j.status)).length}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Total completed jobs', 'Total completed jobs')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-semibold">{t('Basic Salary', 'Basic Salary')}</span>
          <p className="text-2xl font-black text-purple-400 font-mono mt-1">
            {formatCurrency(workerProfile?.basicSalary || 18000)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">+ {workerProfile?.commissionRate || 10}% {t('Commission', 'Commission')}</span>
        </div>
      </div>

      {/* Active Assigned Jobs Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          {t('Active Work Orders', 'Active Work Orders')} ({activeJobs.length})
        </h2>

        {activeJobs.length === 0 ? (
          <div className="p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
            {t('No active jobs in your queue.', 'No active jobs in your queue. Admin will assign new requests shortly.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 cursor-pointer transition space-y-4 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{job.id}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{t(job.category, job.category)}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={job.priority} size="sm" />
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                </div>

                <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                  "{job.problemDescription}"
                </p>

                {/* Customer Contact & Navigation Address */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-semibold">{job.customerName}</span>
                    <a
                      href={`tel:${job.customerPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-cyan-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {job.customerPhone}
                    </a>
                  </div>

                  <div className="text-[11px] text-zinc-400">
                    <span className="block truncate">{job.address}</span>
                  </div>
                </div>

                {/* Direct Stage Step Action Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  {job.status === 'ASSIGNED' && (
                    <button
                      onClick={(e) => handleQuickStatus(job.id, 'ACCEPTED', e)}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
                    >
                      ✓ {t('Accept', 'Accept Job')}
                    </button>
                  )}

                  {job.status === 'ACCEPTED' && (
                    <button
                      onClick={(e) => handleQuickStatus(job.id, 'ON_THE_WAY', e)}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                    >
                      🚀 {t('On The Way', 'Start Travel (On The Way)')}
                    </button>
                  )}

                  {job.status === 'ON_THE_WAY' && (
                    <button
                      onClick={(e) => handleQuickStatus(job.id, 'REACHED', e)}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-md transition"
                    >
                      📍 {t('Reached Site', 'Reached Customer Site')}
                    </button>
                  )}

                  {job.status === 'REACHED' && (
                    <button
                      onClick={(e) => handleQuickStatus(job.id, 'WORK_STARTED', e)}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition"
                    >
                      ⚡ {t('Start Work', 'Start Electrical Work')}
                    </button>
                  )}

                  {job.status === 'WORK_STARTED' && (
                    <button
                      onClick={() => onSelectJob(job.id)}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <span>{t('Submit for Verification', 'Submit Work & Materials For Admin Review')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

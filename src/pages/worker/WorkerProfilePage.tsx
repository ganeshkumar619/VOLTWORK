import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Wrench,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Briefcase,
  Save,
  ShieldCheck,
  Zap,
  Activity,
  Award,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.tsx';
import { apiRequest } from '../../lib/api.ts';
import { formatDate, formatCurrency } from '../../lib/formatters.ts';
import { useToast } from '../../components/ToastNotification.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { WorkerProfile } from '../../types/index.ts';

export const WorkerProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline' | 'on_duty'>('available');
  const [experienceYears, setExperienceYears] = useState(3);
  const [address, setAddress] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // First try /api/workers/me, then fall back to /api/workers with user.id or /api/auth/me
      const data = await apiRequest('/api/workers/me');
      if (data) {
        setProfile(data);
        setName(data.name || user?.name || '');
        setPhone(data.phone || user?.phone || '');
        setEmail(data.email || user?.email || '');
        setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || 'Wiring, MCB, Inverter'));
        setAvailability(data.availability || 'available');
        setExperienceYears(data.experienceYears || 3);
        setAddress(data.address || '');
      }
    } catch (err) {
      console.warn('Failed to load /api/workers/me, fetching from workers list:', err);
      try {
        const workers = await apiRequest('/api/workers');
        const selfWorker = Array.isArray(workers) ? workers.find((w: any) => w.userId === user?.id || w.email === user?.email) : null;
        if (selfWorker) {
          setProfile(selfWorker);
          setName(selfWorker.name || user?.name || '');
          setPhone(selfWorker.phone || user?.phone || '');
          setEmail(selfWorker.email || user?.email || '');
          setSkills(Array.isArray(selfWorker.skills) ? selfWorker.skills.join(', ') : (selfWorker.skills || ''));
          setAvailability(selfWorker.availability || 'available');
          setExperienceYears(selfWorker.experienceYears || 3);
          setAddress(selfWorker.address || '');
        } else if (user) {
          setName(user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
        }
      } catch (e) {
        console.error('Error fetching worker profile:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      await apiRequest('/api/workers/me', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          skills: skillsArray,
          availability,
          experienceYears: Number(experienceYears),
          address,
        }),
      });

      showToast(t('Profile updated successfully', 'Worker profile updated successfully'), 'success', t('Profile Saved', 'Profile Saved'));
      await refreshUser();
      await fetchProfile();
    } catch (err: any) {
      showToast(err.message || t('Failed to update profile', 'Failed to update profile'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAvailability = async (newStatus: 'available' | 'busy' | 'offline' | 'on_duty') => {
    setAvailability(newStatus);
    try {
      await apiRequest('/api/workers/me', {
        method: 'PUT',
        body: JSON.stringify({ availability: newStatus }),
      });
      showToast(`${t('Work status set to', 'Work status set to')} ${t(newStatus, newStatus.replace('_', ' ').toUpperCase())}`, 'success');
      await fetchProfile();
    } catch (err: any) {
      showToast(err.message || t('Failed to update status', 'Failed to update status'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-zinc-400">
        <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
        <p>{t('Loading Electrician Profile from Database...', 'Loading Electrician Profile from Database...')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-purple-950/40 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)] shrink-0 overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{name ? name[0].toUpperCase() : 'W'}</span>
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Zap className="w-3 h-3" />
              <span>{t('Certified Field Technician', 'Certified Field Technician')}</span>
            </div>
            <h1 className="text-2xl font-black text-white">{name || t('Technician', 'Technician')}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t('Member Since', 'Member Since')}: <strong className="text-zinc-200">{formatDate(profile?.joiningDate || user?.createdAt)}</strong>
            </p>
          </div>
        </div>

        {/* Quick Status Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold">{t('Duty Status', 'Duty Status')}:</span>
          <select
            value={availability}
            onChange={(e) => handleQuickAvailability(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs focus:outline-none"
          >
            <option value="available">🟢 {t('Available for Dispatch', 'Available for Dispatch')}</option>
            <option value="busy">🟡 {t('Busy on Field Work', 'Busy on Field Work')}</option>
            <option value="on_duty">🔵 {t('On Duty', 'On Duty')}</option>
            <option value="offline">⚪ {t('Off Duty / Offline', 'Off Duty / Offline')}</option>
          </select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Total completed jobs', 'Total Completed Jobs')}</span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {profile?.completedJobsCount || 0}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('AI Verified', 'Verified & Settled')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Service Rating', 'Service Rating')}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-black text-amber-400 font-mono">
              {profile?.rating || '5.0'}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Customer Feedback', 'Customer Feedback')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Experience', 'Experience')}</span>
          <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {profile?.experienceYears || experienceYears} {t('Yrs', 'Yrs')}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">{t('Licensed Experience', 'Licensed Experience')}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400">{t('Basic Salary', 'Monthly Basic Base')}</span>
          <p className="text-2xl font-black text-purple-400 font-mono mt-1">
            {formatCurrency(profile?.basicSalary || 18000)}
          </p>
          <span className="text-[11px] text-zinc-500 mt-1 block">+ {profile?.commissionRate || 10}% {t('Commission', 'Commission')}</span>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            {t('Technician Profile Details (Database Record)', 'Technician Profile Details (Database Record)')}
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('Live Synced', 'Live Synced')}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                {t('Full Name', 'Full Name')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                {t('Email Address', 'Email Address')} <span className="text-zinc-500">({t('Account Login', 'Account Login')})</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                {t('Phone Number', 'Phone Number')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Experience Years */}
            <div>
              <label className="block text-zinc-400 font-semibold mb-1.5">
                {t('Years of Professional Experience', 'Years of Professional Experience')}
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Electrical Skills */}
          <div className="text-xs">
            <label className="block text-zinc-400 font-semibold mb-1.5 flex items-center justify-between">
              <span>{t('Electrical Skills & Specializations (Comma Separated)', 'Electrical Skills & Specializations (Comma Separated)')}</span>
              <span className="text-zinc-500">{t('Used by AI Dispatcher to match jobs', 'Used by AI Dispatcher to match jobs')}</span>
            </label>
            <div className="relative">
              <Wrench className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Wiring, MCB / DB, Inverter, 3-Phase, Motor Starter, Lighting"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Skills Tag Cloud */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-cyan-400" />
                    {t(skill, skill)}
                  </span>
                ))}
            </div>
          </div>

          {/* Address */}
          <div className="text-xs">
            <label className="block text-zinc-400 font-semibold mb-1.5">
              {t('Base Service Station / Address', 'Base Service Station / Address')}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kovilpatti, Thoothukudi District, Tamilnadu - 628716"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('Save Profile Changes', 'Save Profile Changes')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

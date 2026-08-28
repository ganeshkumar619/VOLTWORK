import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Shield,
  Zap,
  Wrench,
  DollarSign,
  X,
  Trash2,
  AlertTriangle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency, formatDate } from '../../lib/formatters.ts';
import { PermanentDeleteModal } from '../../components/PermanentDeleteModal.tsx';
import { useToast } from '../../components/ToastNotification.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { WorkerProfile } from '../../types/index.ts';

export const WorkerManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const { toast } = useToast();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'on_job' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Permanent Delete Modal state
  const [workerToDelete, setWorkerToDelete] = useState<WorkerProfile | null>(null);

  // Add Worker Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: 'Wiring, MCB / DB, General',
    experienceYears: 3,
    salaryType: 'monthly',
    basicSalary: 18000,
    commissionRate: 10,
    address: 'Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
  });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/workers');
      setWorkers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load workers:', err);
      toast.error(t('operation_failed', 'Failed to load workers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/workers', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
          experienceYears: Number(formData.experienceYears),
          basicSalary: Number(formData.basicSalary),
          commissionRate: Number(formData.commissionRate),
        }),
      });

      setShowAddModal(false);
      fetchWorkers();
      toast.success(`${t('Worker', 'Electrician')} ${formData.name} ${t('Success', 'added successfully')}`);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        skills: 'Wiring, MCB / DB, General',
        experienceYears: 3,
        salaryType: 'monthly',
        basicSalary: 18000,
        commissionRate: 10,
        address: 'Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
      });
    } catch (err: any) {
      toast.error(err.message || t('operation_failed', 'Failed to add worker'));
    }
  };

  const handlePermanentDelete = async (worker: WorkerProfile) => {
    try {
      await apiRequest(`/api/workers/${worker.id}`, {
        method: 'DELETE',
      });
      toast.success(t('operation_successful', 'workers permanently deleted'));
      setWorkerToDelete(null);
      fetchWorkers();
    } catch (error: any) {
      toast.error(error.message || t('operation_failed', 'Failed to delete worker'));
    }
  };

  const filtered = workers.filter((w) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      w.name.toLowerCase().includes(q) ||
      w.phone.includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.skills.some((s) => s.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'available' && w.availability !== 'available') return false;
      if (statusFilter === 'on_job' && w.availability !== 'on_job') return false;
      if (statusFilter === 'inactive' && w.status !== 'inactive') return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-cyan-400" />
            {t('Electricians & Workforce', 'Electricians & Workforce')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Manage certified electricians, skill profiles, payroll parameters, and real-time field status', 'Manage certified electricians, skill profiles, payroll parameters, and real-time field status')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchWorkers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition disabled:opacity-50"
            title={t('refresh', 'Refresh workers')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              id="btn-add-worker-modal"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t('Add Worker', 'Add Electrician')}
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            id="input-search-workers"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search Workers', 'Search workers by name, phone, specialization...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
          <select
            id="select-worker-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
          >
            <option value="all">{t('All Availability', 'All Electricians')}</option>
            <option value="available">{t('Available', 'Available Now')}</option>
            <option value="on_job">{t('Currently on Job', 'On Active Job')}</option>
            <option value="inactive">{t('Inactive', 'Inactive')}</option>
          </select>
        </div>
      </div>

      {/* Worker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-zinc-700 opacity-50" />
            {t('No Workers Yet', 'No electricians found matching criteria.')}
          </div>
        ) : (
          filtered.map((w) => {
            return (
              <div
                key={w.id}
                className="p-5 rounded-2xl border transition space-y-4 shadow-lg relative overflow-hidden bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-sm bg-cyan-500/15 border-cyan-500/30 text-cyan-300">
                      {w.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{w.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{w.rating || 5.0} {t('Rating', 'rating')}</span>
                        <span>• {w.experienceYears}y {t('Experience', 'exp')}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                      w.availability === 'available'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : w.availability === 'on_job'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {w.availability === 'available'
                      ? t('Available', 'Available')
                      : w.availability === 'on_job'
                      ? t('On Job', 'On Job')
                      : t('Inactive', 'Inactive')}
                  </span>
                </div>

                {/* Skills Pills */}
                <div>
                  <span className="text-[11px] text-zinc-500 block mb-1.5 font-medium">{t('Skills', 'Specializations')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {(w.skills || []).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300"
                      >
                        {t(s, s)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact & Pay Details */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] space-y-1.5 text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-zinc-200 font-mono">{w.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="truncate">{w.email}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span>{t('Basic Salary', 'Base Salary')}:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(w.basicSalary)} /mo</span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px]">
                  <span className="text-cyan-400/90 font-mono">{w.completedJobsCount || 0} {t('completed', 'jobs done')}</span>

                  {/* Only ADMIN can see delete button */}
                  {isAdmin && (
                    <button
                      id={`btn-delete-worker-${w.id}`}
                      type="button"
                      onClick={() => setWorkerToDelete(w)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition flex items-center gap-1.5 font-bold shadow-sm active:scale-95 group"
                      title={t('Delete Worker', 'Permanently delete')}
                      aria-label={t('Delete Worker', 'Permanently delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                      <span>{t('Delete', 'Delete')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Worker Modal */}
      {workerToDelete && (
        <PermanentDeleteModal
          isOpen={Boolean(workerToDelete)}
          onClose={() => setWorkerToDelete(null)}
          onConfirm={() => handlePermanentDelete(workerToDelete)}
          itemType="worker"
          itemName={workerToDelete.name}
          itemDetails={
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Worker Name', 'Technician')}:</span>
                <span className="text-white font-semibold">{workerToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Phone', 'Phone')}:</span>
                <span className="text-zinc-300 font-mono">{workerToDelete.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">{t('Basic Salary', 'Base Salary')}:</span>
                <span className="font-mono font-bold text-emerald-400">{formatCurrency(workerToDelete.basicSalary)} /mo</span>
              </div>
            </div>
          }
        />
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">{t('Add Certified Electrician', 'Register New Electrician')}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">{t('Worker Name', 'Full Name')} *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. S. Murugan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">{t('Phone', 'Mobile Number')} *</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">{t('Email', 'Email Address')} *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="worker@voltwork.ai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">{t('Password', 'Login Password')} *</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create strong account password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">{t('Experience', 'Experience (Years)')}</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">{t('Basic Salary', 'Base Salary (₹ / Mo)')}</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">{t('Skills', 'Skills & Certifications (Comma separated)')}</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="House Wiring, DB Box, Inverter, Industrial 3-Phase"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-semibold"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition shadow-lg shadow-cyan-500/25"
                >
                  {t('Save', 'Save Electrician')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


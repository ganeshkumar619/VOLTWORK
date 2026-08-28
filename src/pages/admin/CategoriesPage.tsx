import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Zap, X, Wrench, DollarSign, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/formatters.ts';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { ServiceCategory } from '../../types/index.ts';

export const CategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const isTa = language === 'ta';
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameTa: '',
    requiredSkill: 'General',
    defaultRefPrice: 400,
    description: '',
    iconName: 'Zap',
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setShowAddModal(false);
      fetchCategories();
      setFormData({
        name: '',
        nameTa: '',
        requiredSkill: 'General',
        defaultRefPrice: 400,
        description: '',
        iconName: 'Zap',
      });
    } catch (err: any) {
      alert(err.message || t('operation_failed', 'Failed to save category'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm(t('confirm_delete', 'Are you sure you want to delete this service category?'))) return;
    try {
      await apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || t('operation_failed', 'Failed to delete category'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Tag className="w-7 h-7 text-cyan-400" />
            {t('Service Categories', 'Electrical Service Categories')}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Manage supported service catalogs and baseline reference rates', 'Manage supported service catalogs and baseline reference rates')}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('Add Category', 'Add Custom Category')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">{t('Loading...', 'Loading categories...')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-xs">
          {t('No service categories logged', 'No service categories logged')}
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const displayName = isTa ? (cat.nameTa || t(cat.name, cat.name)) : cat.name;
            const subtitleName = isTa && cat.name ? cat.name : (cat.nameTa || '');
            const displayDesc = cat.description ? t(cat.description, cat.description) : '';

            return (
              <div
                key={cat.id}
                className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition-transform">
                      <Zap className="w-5 h-5" />
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title={t('delete', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight">{displayName}</h3>
                  {subtitleName && subtitleName !== displayName && (
                    <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">{subtitleName}</p>
                  )}
                  {displayDesc && (
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{displayDesc}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">
                    {t('Skill Level', 'Skill')}: <span className="text-zinc-200">{t(cat.requiredSkill, cat.requiredSkill)}</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {formatCurrency(cat.defaultRefPrice)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">{t('Add Category', 'Add Electrical Category')}</h2>
            <p className="text-xs text-zinc-400 mb-4">{t('Add a custom electrical repair offering to the portal', 'Add a custom electrical repair offering to the portal')}</p>

            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Category Name (English)', 'Category Name (English)')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Solar Inverter Setup"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Category Name (Tamil)', 'Category Name (Tamil)')}</label>
                <input
                  type="text"
                  value={formData.nameTa}
                  onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                  placeholder="எ.கா. சோலார் இன்வெர்ட்டர் பழுது"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Required Skillset', 'Required Skillset')}</label>
                <input
                  type="text"
                  required
                  value={formData.requiredSkill}
                  onChange={(e) => setFormData({ ...formData, requiredSkill: e.target.value })}
                  placeholder="e.g. Solar, Inverter, High Voltage"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Base Rate', 'Baseline Reference Charge (₹)')}</label>
                <input
                  type="number"
                  value={formData.defaultRefPrice}
                  onChange={(e) => setFormData({ ...formData, defaultRefPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">{t('Description', 'Description')}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of typical electrical repairs..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold cursor-pointer"
                >
                  {t('Cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold cursor-pointer"
                >
                  {t('Save Category', 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



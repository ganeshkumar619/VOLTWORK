import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Compass,
  Clock,
  Building,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileText,
  Phone,
  Mail,
  Zap,
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatTimeIST, formatDateIST } from '../lib/formatters.ts';
import { useToast } from './ToastNotification.tsx';
import type { CompanySettings } from '../types/index.ts';
import { useI18n } from '../lib/i18n.tsx';

interface AdminSiteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

export const AdminSiteProfileModal: React.FC<AdminSiteProfileModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'service_area' | 'business' | 'coordinates'>('profile');

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState(formatTimeIST());
  const [currentDate, setCurrentDate] = useState(formatDateIST());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTimeIST());
      setCurrentDate(formatDateIST());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [settings, setSettings] = useState<CompanySettings>({
    name: 'VoltWork AI Electrical Services',
    tagline: 'Smart Electrical Service & Diagnostics',
    adminLocation: {
      village: 'Mudukkumeendanpatti',
      taluk: 'Kovilpatti',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      pincode: '628716',
      formattedAddress: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716',
      latitude: 9.17,
      longitude: 77.87,
    },
    serviceArea: {
      defaultLocation: 'Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
      district: 'Thoothukudi',
      state: 'Tamilnadu',
      primaryPincode: '628716',
      serviceRadiusKm: 25,
      serviceZones: [
        '628716 (Mudukkumeendanpatti / HQ)',
        '628501 (Kovilpatti Main)',
        '628502 (Kovilpatti North / Industrial)',
        '628503 (Kovilpatti East)',
        '628720 (Kayathar Sub-Division)',
        '628714 (Kadambur Zone)',
        '628552 (Ilayarasanendal)',
      ],
    },
    businessAddress: 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi District, Tamilnadu - 628716',
    phone: '+91 98765 43210',
    email: 'admin@voltwork.ai',
    gstin: '33AAAAA0000A1Z5',
    registrationNumber: 'TN-EL-2026-9941',
    timezone: 'Asia/Kolkata',
    timezoneOffset: 'UTC+5:30',
  });

  const [newZoneInput, setNewZoneInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/settings/company');
      if (data && data.adminLocation) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load company settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Recompute formatted address
      const formatted = `${settings.adminLocation.village}, ${settings.adminLocation.taluk}, ${settings.adminLocation.district}, ${settings.adminLocation.state} - ${settings.adminLocation.pincode}`;
      const payload: CompanySettings = {
        ...settings,
        adminLocation: {
          ...settings.adminLocation,
          formattedAddress: formatted,
        },
        businessAddress: settings.businessAddress || formatted,
      };

      await apiRequest('/api/settings/company', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSettings(payload);
      showToast('Admin site location & business settings saved', 'success', 'Location Updated');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addZone = () => {
    if (!newZoneInput.trim()) return;
    setSettings((prev) => ({
      ...prev,
      serviceArea: {
        ...prev.serviceArea,
        serviceZones: [...prev.serviceArea.serviceZones, newZoneInput.trim()],
      },
    }));
    setNewZoneInput('');
  };

  const removeZone = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      serviceArea: {
        ...prev.serviceArea,
        serviceZones: prev.serviceArea.serviceZones.filter((_, i) => i !== index),
      },
    }));
  };

  if (!isOpen) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${settings.adminLocation.latitude},${settings.adminLocation.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#090e1a] border border-cyan-500/30 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 relative my-8">
        {/* Header */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {t('Site & Location Settings', 'Admin Site & Location Hub')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                  {t('PIN', 'PIN')}: {settings.adminLocation.pincode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('Headquarters coordinates, PIN code service zones, business billing & IST timezone', 'Headquarters coordinates, PIN code service zones, business billing & IST timezone')}
              </p>
            </div>
          </div>

          {/* Live IST Clock Widget */}
          <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <div className="text-right">
              <div className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{currentTime}</span>
                <span className="text-[10px] text-slate-400 font-sans">IST (UTC+5:30)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{currentDate}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 mb-6 border-b border-white/10 pb-3 overflow-x-auto">
          {[
            { id: 'profile', label: t('Admin Location', 'Admin Location'), icon: MapPin },
            { id: 'service_area', label: t('Service Area', 'Service Coverage Area'), icon: Radio },
            { id: 'coordinates', label: t('GPS', 'Map Coordinates & GPS'), icon: Compass },
            { id: 'business', label: t('Billing', 'Business & Invoicing'), icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: ADMIN PROFILE LOCATION */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Official Admin Location Configuration</strong>
                  This exact village, taluk, district, and PIN code is used for all platform dispatch algorithms,
                  technician assignments, and customer-facing service communications.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Village / Town *
                  </label>
                  <input
                    type="text"
                    value={settings.adminLocation.village}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: { ...settings.adminLocation, village: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Taluk *
                  </label>
                  <input
                    type="text"
                    value={settings.adminLocation.taluk}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: { ...settings.adminLocation, taluk: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    District *
                  </label>
                  <input
                    type="text"
                    value={settings.adminLocation.district}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: { ...settings.adminLocation, district: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    State *
                  </label>
                  <input
                    type="text"
                    value={settings.adminLocation.state}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: { ...settings.adminLocation, state: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Postal PIN Code *</span>
                    <span className="text-[10px] text-slate-400 font-normal font-mono">(6 Digits)</span>
                  </label>
                  <input
                    type="text"
                    value={settings.adminLocation.pincode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: { ...settings.adminLocation, pincode: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-cyan-300 font-mono font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.15)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Admin Timezone
                  </label>
                  <input
                    type="text"
                    disabled
                    value="IST (UTC+5:30) - Asia/Kolkata"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Formatted Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                  Full Formatted Admin Location:
                </span>
                <p className="text-sm font-bold text-cyan-300 font-mono">
                  {settings.adminLocation.village}, {settings.adminLocation.taluk},{' '}
                  {settings.adminLocation.district}, {settings.adminLocation.state} - {settings.adminLocation.pincode}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICE AREA */}
          {activeTab === 'service_area' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Default Service Location *
                  </label>
                  <input
                    type="text"
                    value={settings.serviceArea.defaultLocation}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        serviceArea: { ...settings.serviceArea, defaultLocation: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Operational Radius (km)
                  </label>
                  <input
                    type="number"
                    value={settings.serviceArea.serviceRadiusKm}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        serviceArea: {
                          ...settings.serviceArea,
                          serviceRadiusKm: Number(e.target.value) || 25,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                  />
                </div>
              </div>

              {/* PIN Code Service Zones */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      PIN Code Based Service Zones
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Electrical technicians will be prioritized for service bookings within these postal codes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g. 628716 (Mudukkumeendanpatti)"
                    value={newZoneInput}
                    onChange={(e) => setNewZoneInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={addZone}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
                  >
                    Add Zone
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {settings.serviceArea.serviceZones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 flex items-center gap-2 font-mono"
                    >
                      <span>{zone}</span>
                      <button
                        type="button"
                        onClick={() => removeZone(idx)}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAP COORDINATES */}
          {activeTab === 'coordinates' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-0.5">Mudukkumeendanpatti HQ Geopoint</div>
                  <p className="text-[11px] text-slate-400">
                    Official GPS latitude and longitude used for radar dispatch and worker distance calculation.
                  </p>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Open in Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
                    Latitude (approx 9.17) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.adminLocation.latitude}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: {
                          ...settings.adminLocation,
                          latitude: parseFloat(e.target.value) || 9.17,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-cyan-300 font-mono font-bold text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
                    Longitude (approx 77.87) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={settings.adminLocation.longitude}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        adminLocation: {
                          ...settings.adminLocation,
                          longitude: parseFloat(e.target.value) || 77.87,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-cyan-300 font-mono font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-200 font-bold mb-1">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Cartographic Reference:</span>
                </div>
                Mudukkumeendanpatti is a village situated in Kovilpatti Taluk of Thoothukudi District in Tamil Nadu,
                India. Geographic centroid lock: 9.17° N, 77.87° E.
              </div>
            </div>
          )}

          {/* TAB 4: BUSINESS SETTINGS */}
          {activeTab === 'business' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Helpline / Phone
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
                  Official Registered Business Address (Printed on Invoices & Bills) *
                </label>
                <textarea
                  rows={2}
                  value={settings.businessAddress}
                  onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-slate-100 text-xs font-medium leading-relaxed"
                  required
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Timezone: Asia/Kolkata (IST UTC+5:30)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(34,211,238,0.3)] transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Site Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

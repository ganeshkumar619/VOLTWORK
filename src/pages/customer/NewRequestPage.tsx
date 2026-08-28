import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  MapPin,
  Navigation,
  Calendar,
  Clock,
  Camera,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { AIAnalysisCard } from '../../components/AIAnalysisCard.tsx';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import type { AIAnalysisResult, ServiceCategory } from '../../types/index.ts';

interface NewRequestPageProps {
  onSuccess: (jobId: string) => void;
  onCancel: () => void;
}

export const NewRequestPage: React.FC<NewRequestPageProps> = ({ onSuccess, onCancel }) => {
  const { user, customerProfile } = useAuth();
  const { t } = useI18n();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [category, setCategory] = useState('Fan Repair');
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [address, setAddress] = useState(customerProfile?.address || '');
  const [latitude, setLatitude] = useState(customerProfile?.latitude || 9.17);
  const [longitude, setLongitude] = useState(customerProfile?.longitude || 77.87);
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [photos, setPhotos] = useState<string[]>([]);

  // AI Diagnostic State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'detected' | 'denied' | 'error'>('idle');
  const [geoMessage, setGeoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    apiRequest('/api/categories')
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          if (!category) {
            setCategory(cats[0].name);
          }
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Run AI Problem Analysis using server Gemini API
  const handleRunAiAnalysis = async () => {
    if (!problemDescription.trim()) {
      setFormErrors((prev) => ({ ...prev, problemDescription: t('Please fill all required fields', 'Please enter a description to run AI analysis') }));
      setErrorMsg(t('Please fill all required fields', 'Please describe the electrical issue first to run AI diagnosis.'));
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');

    try {
      const result = await apiRequest('/api/ai/analyze-problem', {
        method: 'POST',
        body: JSON.stringify({
          description: problemDescription,
          categoryHint: category,
        }),
      });

      if (result) {
        setAiAnalysis(result);
        const resolvedCategory = result.serviceCategory || result.category;
        if (resolvedCategory) {
          setCategory(resolvedCategory);
        }
        if (result.priority) {
          const p = String(result.priority).toLowerCase();
          if (['low', 'medium', 'high', 'emergency'].includes(p)) {
            setPriority(p as any);
          }
        }
      }
    } catch (err: any) {
      console.log('AI analysis fetch fallback:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Web Geolocation API with error and permission handling
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoMessage(t('location_permission_denied', 'Geolocation is not supported by your browser. Please enter address manually.'));
      return;
    }

    setGeoStatus('detecting');
    setGeoMessage(t('Acquiring GPS...', 'Locating your GPS coordinates...'));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setGeoStatus('detected');
        setGeoMessage(`${t('GPS Captured ✓', 'GPS captured:')} ${lat}, ${lng}`);
        if (!address) {
          setAddress(`GPS Location (${lat}, ${lng}) - Kovilpatti & Surrounding Area`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setGeoStatus('denied');
          setGeoMessage(t('Location Permission Denied', 'Location access denied. Please type your service address below.'));
        } else {
          setGeoStatus('error');
          setGeoMessage(t('Enter Address Manually', 'Unable to retrieve GPS coordinates. Please enter your address manually.'));
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAddSamplePhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500&auto=format&fit=crop&q=60',
    ];
    const pick = samplePhotos[photos.length % samplePhotos.length];
    setPhotos([...photos, pick]);
  };

  // Comprehensive client-side validation
  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (!problemDescription || problemDescription.trim() === '') {
      errors.problemDescription = `${t('Problem Description', 'Problem description')} ${t('is required', 'is required')}`;
    }

    if (!category || category.trim() === '') {
      errors.category = `${t('Category', 'Service category')} ${t('is required', 'is required')}`;
    }

    if (!address || address.trim() === '') {
      errors.address = `${t('Address', 'Service property address')} ${t('is required', 'is required')}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setErrorMsg(t('Please fill all required fields', 'Please correct the highlighted fields before submitting.'));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        category,
        description: problemDescription.trim(),
        problemDescription: problemDescription.trim(),
        priority,
        address: address.trim(),
        location: address.trim(),
        latitude,
        longitude,
        preferredSchedule: `${preferredDate} ${preferredTime}`,
        preferredDate,
        customerPhotos: photos,
        problemPhotoUrl: photos.length > 0 ? photos[0] : undefined,
        aiAnalysis,
      };

      const newJob = await apiRequest('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSuccess(newJob.id);
    } catch (err: any) {
      console.error('Job submission failed:', err);
      setErrorMsg(err.message || t('Operation Failed', 'Failed to submit service request. Please check inputs.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>{t('VoltWork AI Rapid Dispatch', 'VoltWork AI Rapid Dispatch')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('Book Electrical Service', 'Book Electrical Service')}</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {t('Provide problem details to get real-time AI safety analysis & certified electrician assignment', 'Provide problem details to get real-time AI safety analysis & certified electrician assignment')}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category & Priority Grid */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{t('Service Category & Urgency', '1. Service Category & Urgency')}</span>
            <span className="text-rose-400 text-xs font-bold">*</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {t('Electrical Category', 'Electrical Category')} <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (formErrors.category) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.category;
                      return next;
                    });
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border ${
                  formErrors.category ? 'border-rose-500 focus:border-rose-400' : 'border-zinc-800 focus:border-cyan-500'
                } text-xs text-white focus:outline-none`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.nameTa ? `${c.nameTa} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <span className="text-rose-400 text-[11px] mt-1 block">{formErrors.category}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {t('Priority Level', 'Priority Level')} <span className="text-rose-400">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="low">{t('Low', 'Low Priority (Routine check / installation)')}</option>
                <option value="medium">{t('Medium', 'Medium Priority (Standard repair)')}</option>
                <option value="high">{t('High', 'High Priority (Main appliance down / no power in room)')}</option>
                <option value="emergency">⚡ {t('Emergency', 'Emergency (Sparking / Burning Smell / Shock Risk)')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Problem Description & AI Diagnosis Trigger */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{t('Problem Description & AI Technical Analysis', '2. Problem Description & AI Technical Analysis')}</span>
              <span className="text-rose-400 text-xs font-bold">*</span>
            </h3>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={analyzing || !problemDescription.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              {analyzing ? (
                <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              )}
              {t('Run AI Problem Analysis', 'Run AI Diagnostic (Gemini 3.7)')}
            </button>
          </div>

          <div>
            <textarea
              rows={4}
              required
              value={problemDescription}
              onChange={(e) => {
                setProblemDescription(e.target.value);
                if (formErrors.problemDescription) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.problemDescription;
                    return next;
                  });
                }
              }}
              placeholder={t('Describe the issue clearly...', 'Describe the issue clearly. E.g. Master bedroom ceiling fan running very slowly with humming sound, or MCB tripping immediately whenever the AC is turned on...')}
              className={`w-full px-4 py-3 rounded-2xl bg-zinc-950 border ${
                formErrors.problemDescription ? 'border-rose-500 focus:border-rose-400' : 'border-zinc-800 focus:border-cyan-500'
              } text-xs text-white placeholder-zinc-500 focus:outline-none leading-relaxed resize-none`}
            />
            {formErrors.problemDescription && (
              <span className="text-rose-400 text-[11px] mt-1 block">{formErrors.problemDescription}</span>
            )}
          </div>

          {/* Render Gemini AI Diagnostic card if generated */}
          {aiAnalysis && (
            <div className="mt-2">
              <AIAnalysisCard analysis={aiAnalysis} />
            </div>
          )}
        </div>

        {/* Service Address & GPS Coordinates */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{t('Service Location & Schedule', '3. Service Location & Schedule')}</span>
              <span className="text-rose-400 text-xs font-bold">*</span>
            </h3>
            <button
              type="button"
              onClick={detectLocation}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 transition cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              {geoStatus === 'detecting'
                ? t('Loading...', 'Detecting GPS...')
                : geoStatus === 'detected'
                ? t('GPS Captured ✓', 'GPS Captured ✓')
                : t('Capture GPS Location', 'Auto-Detect Live Location')}
            </button>
          </div>

          {geoMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                geoStatus === 'detected'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              {geoStatus === 'detected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{geoMessage}</span>
            </div>
          )}

          {/* Quick Area Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{t('Quick Fill', 'Quick Fill')}:</span>
            <button
              type="button"
              onClick={() => {
                setLatitude(9.1726);
                setLongitude(77.8711);
                setAddress('Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716');
                setGeoStatus('detected');
                setGeoMessage('GPS location set to Mudukkumeendanpatti HQ ✓');
                if (formErrors.address) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.address;
                    return next;
                  });
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-[11px] text-cyan-300 font-bold transition cursor-pointer"
            >
              ⚡ Mudukkumeendanpatti HQ (628716)
            </button>
            <button
              type="button"
              onClick={() => {
                setLatitude(9.1712);
                setLongitude(77.8707);
                setAddress('Bazaar Street, Kovilpatti, Thoothukudi District, Tamilnadu - 628501');
                setGeoStatus('detected');
                setGeoMessage('GPS location set to Kovilpatti Main ✓');
                if (formErrors.address) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.address;
                    return next;
                  });
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-[11px] text-blue-300 font-bold transition cursor-pointer"
            >
              ⚡ Kovilpatti Town (628501)
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {t('Address', 'Property Service Address')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (formErrors.address) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.address;
                        return next;
                      });
                    }
                  }}
                  placeholder={t('Door No, Street Name, Landmark...', 'Door No, Street Name, Landmark (e.g. Main Road, Mudukkumeendanpatti, Kovilpatti)')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border ${
                    formErrors.address ? 'border-rose-500 focus:border-rose-400' : 'border-zinc-800 focus:border-cyan-500'
                  } text-xs text-white focus:outline-none`}
                />
              </div>
              {formErrors.address && (
                <span className="text-rose-400 text-[11px] mt-1 block">{formErrors.address}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">{t('Preferred Date', 'Preferred Date')}</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">{t('Preferred Time Slot', 'Preferred Time Slot')}</label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Immediate Emergency">{t('Emergency', 'Immediate Emergency (Next available tech)')}</option>
                  <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM</option>
                  <option value="01:00 PM - 04:00 PM">01:00 PM - 04:00 PM</option>
                  <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Attachment */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">{t('Fault Photos', '4. Photos of Fault / Switchboard (Optional)')}</h3>
              <p className="text-xs text-zinc-400">{t('Helps technician bring right spare parts', 'Helps the technician bring the right spare parts')}</p>
            </div>
            <button
              type="button"
              onClick={handleAddSamplePhoto}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              + {t('Upload Photos', 'Attach Photo')}
            </button>
          </div>

          {photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {photos.map((url, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <img
                    src={url}
                    alt="Fault"
                    className="w-24 h-24 object-cover rounded-xl border border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition cursor-pointer"
          >
            {t('Cancel', 'Cancel')}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 text-xs font-black shadow-xl shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {t('Book Service', 'Submit Service Request')}
          </button>
        </div>
      </form>
    </div>
  );
};

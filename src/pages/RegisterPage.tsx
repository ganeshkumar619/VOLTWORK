import React, { useState, useEffect } from 'react';
import {
  Zap,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Home,
} from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { useI18n } from '../lib/i18n.tsx';
import { reverseGeocodeGPS, formatFullAddress } from '../lib/geocoding.ts';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onRegisterSuccess }) => {
  const { register } = useAuth();
  const { t } = useI18n();

  // Form State with Default HQ fallback: Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    doorNo: '',
    street: '',
    area: 'Mudukkumeendanpatti',
    city: 'Kovilpatti',
    district: 'Thoothukudi',
    state: 'Tamilnadu',
    pincode: '628716',
    address: '',
    latitude: 9.1726,
    longitude: 77.8711,
    gpsCaptured: false,
  });

  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    doorNo?: string;
    street?: string;
    address?: string;
    gps?: string;
    general?: string;
  }>({});

  // GPS State
  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'detected' | 'error' | 'denied'>('idle');
  const [geoMessage, setGeoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Update computed full formatted address whenever address components change
  useEffect(() => {
    const full = formatFullAddress({
      doorNo: formData.doorNo,
      street: formData.street,
      area: formData.area || 'Mudukkumeendanpatti',
      city: formData.city || 'Kovilpatti',
      district: formData.district || 'Thoothukudi',
      state: formData.state || 'Tamilnadu',
      pincode: formData.pincode || '628716',
    });
    setFormData((prev) => ({ ...prev, address: full }));
  }, [
    formData.doorNo,
    formData.street,
    formData.area,
    formData.city,
    formData.district,
    formData.state,
    formData.pincode,
  ]);

  // GPS Capture Handler with High Accuracy and Reverse Geocoding
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoMessage('GPS not available. Enter address manually.');
      return;
    }

    setGeoStatus('detecting');
    setGeoMessage('Capturing location...');
    setErrors((prev) => ({ ...prev, gps: undefined }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));

        try {
          // Reverse geocode GPS to address components
          const geo = await reverseGeocodeGPS(lat, lng);
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            gpsCaptured: true,
            doorNo: geo.doorNo || prev.doorNo || '',
            street: geo.street || prev.street || '',
            area: geo.area || prev.area || 'Mudukkumeendanpatti',
            city: geo.city || prev.city || 'Kovilpatti',
            district: geo.district || prev.district || 'Thoothukudi',
            state: geo.state || prev.state || 'Tamilnadu',
            pincode: geo.pincode || prev.pincode || '628716',
          }));
          setGeoStatus('detected');
          setGeoMessage(`GPS Captured ✓ [${lat}, ${lng}]`);
        } catch (e) {
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            gpsCaptured: true,
          }));
          setGeoStatus('detected');
          setGeoMessage(`GPS Captured ✓ [${lat}, ${lng}]`);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setGeoStatus('denied');
          setGeoMessage('Permission denied. Enter address manually.');
        } else if (err.code === 3) {
          // TIMEOUT
          setGeoStatus('error');
          setGeoMessage('GPS taking too long. Please try again.');
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setGeoStatus('error');
          setGeoMessage('GPS not available. Enter address manually.');
        } else {
          setGeoStatus('error');
          setGeoMessage('GPS not available. Enter address manually.');
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Form Validation
  const validateForm = () => {
    const errs: typeof errors = {};

    // 1. Full Name Validation
    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed || nameTrimmed.length < 2 || !/^[a-zA-Z\s]{2,50}$/.test(nameTrimmed)) {
      errs.name = 'Please enter your full name';
    }

    // 2. Original Email Validation
    const cleanEmail = formData.email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      errs.email = 'Please enter a valid original email address (e.g. name@gmail.com)';
    } else if (cleanEmail === 'ganeshkumargurusamy619@gmail.com') {
      errs.email = 'This email is reserved for Admin. Please use your personal original email.';
    } else {
      const [localPart, domainPart] = cleanEmail.split('@');
      const disposableDomains = [
        'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
        'throwaway.com', 'yopmail.com', 'test.com', 'example.com', 'fake.com',
        'dispostable.com', 'trashmail.com', 'sharklasers.com', 'grr.la',
        'guerrillamail.biz', 'guerrillamail.net', 'guerrillamail.org', 'spam4.me',
        'temp-mail.org', 'fakemailgenerator.com', 'inboxkitten.com', 'burnermail.io',
        'getnada.com', 'mohmal.com', 'crazymailing.com', 'disposablemail.com',
        'maildrop.cc', 'mytemp.email', 'tempinbox.com', 'emailondeck.com',
        'fakeemail.com', 'generator.email', 'tempail.com', 'trashmail.net'
      ];
      const dummyLocalParts = ['test', 'testing', 'fake', 'dummy', 'asdf', 'qwerty', 'temp', 'sample', 'user123', 'admin'];

      if (disposableDomains.includes(domainPart)) {
        errs.email = 'Temporary or disposable email addresses are not allowed. Please enter your original email.';
      } else if (dummyLocalParts.includes(localPart)) {
        errs.email = 'Please enter your original personal email, not a dummy or test email.';
      }
    }

    // 3. Phone Number Validation (10 digits Indian format, starts with 6,7,8,9)
    const rawDigits = formData.phone.replace(/\D/g, '').slice(-10);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!rawDigits || !phoneRegex.test(rawDigits)) {
      errs.phone = 'Please enter a valid 10-digit phone number (starts with 6,7,8,9)';
    }

    // 4. Password Validation (min 6 chars, at least one number)
    if (!formData.password || formData.password.length < 6 || !/\d/.test(formData.password)) {
      errs.password = 'Password must be at least 6 characters with a number';
    }

    // 5. Address Validation
    if (!formData.doorNo.trim()) {
      errs.doorNo = 'Door / Flat No is required';
    }
    if (!formData.street.trim()) {
      errs.street = 'Street / Road name is required';
    }
    if (
      !formData.area.trim() ||
      !formData.city.trim() ||
      !formData.district.trim() ||
      !formData.pincode.trim()
    ) {
      errs.address = 'All address fields (Area, City, District, PIN) are required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        password: formData.password,
        doorNo: formData.doorNo.trim(),
        street: formData.street.trim(),
        area: formData.area.trim() || 'Mudukkumeendanpatti',
        city: formData.city.trim() || 'Kovilpatti',
        district: formData.district.trim() || 'Thoothukudi',
        state: formData.state.trim() || 'Tamilnadu',
        pincode: formData.pincode.trim() || '628716',
        address: formData.address.trim(),
        latitude: formData.latitude || 9.1726,
        longitude: formData.longitude || 77.8711,
        gpsCaptured: formData.gpsCaptured,
        role: 'customer',
      });
      onRegisterSuccess();
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
      } else if (msg.toLowerCase().includes('phone')) {
        setErrors((prev) => ({ ...prev, phone: 'This phone number is already registered' }));
      } else {
        setErrors((prev) => ({ ...prev, general: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 my-4 relative">
      {/* Top Left Back Navigation */}
      <div className="absolute top-2 left-4 sm:top-4 sm:left-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('customer/login')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#090e1a]/80 hover:bg-[#0f172a] border border-cyan-500/30 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-bold backdrop-blur-md shadow-lg shadow-black/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-200 group cursor-pointer min-h-[44px] min-w-[44px]"
          aria-label="Back to Customer Sign In"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
          <span>{t('Back to Sign In', 'Back to Sign In')}</span>
        </button>
      </div>

      <div className="w-full max-w-xl bg-[#090e1a]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl mt-12 sm:mt-0">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#030712] border border-cyan-400/50 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <Zap className="w-6 h-6 fill-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('Customer Registration', 'Customer Registration')}</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t('AI electrical diagnosis, certified local technicians & instant GPS dispatch', 'AI electrical diagnosis, certified local technicians & instant GPS dispatch')}
          </p>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Full Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              {t('Full Name', 'Full Name')} <span className="text-rose-400">*</span>
            </label>
            <div className="relative group">
              <User className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute left-3.5 top-3 transition-colors" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder={t('Full Name', 'e.g. Anand Kumar')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  errors.name ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/50' : 'border-white/10 focus:border-cyan-400'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* 2. Email and Phone in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {t('Original Email Address', 'Original Email Address')} <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-cyan-400 font-medium">
                  {t('Active Email Only', 'Active Email Only')}
                </span>
              </div>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute left-3.5 top-3 transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="yourname@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                    errors.email ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/50' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                {t('Enter your genuine personal email for booking updates & invoices.', 'Enter your genuine personal email for booking updates & invoices.')}
              </p>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                {t('Phone Number', 'Mobile Number (10 Digits)')} <span className="text-rose-400">*</span>
              </label>
              <div className="relative group">
                <Phone className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute left-3.5 top-3 transition-colors" />
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: clean });
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="9876543210"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                    errors.phone ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/50' : 'border-white/10 focus:border-cyan-400'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* 3. Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              {t('Password', 'Password (min 6 chars, at least 1 number)')} <span className="text-rose-400">*</span>
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 absolute left-3.5 top-3 transition-colors" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="Choose a password with at least 1 number"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
                  errors.password ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/50' : 'border-white/10 focus:border-cyan-400'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password}
              </p>
            )}
          </div>

          {/* 4. Service Address Section with GPS Capture Button Above */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-4 h-4 text-cyan-400" />
                {t('Service Address & GPS Location', 'Service Address & GPS Location')}
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">Kovilpatti • 628716</span>
            </div>

            {/* GPS Capture Button & Quick Location Presets */}
            <div className="space-y-2.5">
              <button
                type="button"
                id="btn-capture-gps"
                onClick={handleCaptureGPS}
                disabled={geoStatus === 'detecting'}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00D4FF] hover:bg-[#00bcee] disabled:opacity-60 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(0,212,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <MapPin className={`w-4 h-4 text-slate-950 ${geoStatus === 'detecting' ? 'animate-bounce' : ''}`} />
                <span>{geoStatus === 'detecting' ? t('Capturing location...', 'Capturing location...') : t('Capture GPS Location', '📍 Capture GPS Location')}</span>
              </button>

              {/* Quick Area Presets for Instant 1-Click Auto-Fill */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t('Quick Fill:', 'Quick Fill:')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: 9.1726,
                      longitude: 77.8711,
                      gpsCaptured: true,
                      doorNo: prev.doorNo || '123',
                      street: prev.street || 'Main Road',
                      area: 'Mudukkumeendanpatti',
                      city: 'Kovilpatti',
                      district: 'Thoothukudi',
                      state: 'Tamilnadu',
                      pincode: '628716',
                    }));
                    setGeoStatus('detected');
                    setGeoMessage('GPS set to Mudukkumeendanpatti HQ ✓');
                    setErrors((prev) => ({ ...prev, doorNo: undefined, street: undefined, address: undefined }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-[11px] text-cyan-300 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>⚡ Mudukkumeendanpatti HQ (628716)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: 9.1712,
                      longitude: 77.8707,
                      gpsCaptured: true,
                      doorNo: prev.doorNo || '45',
                      street: prev.street || 'Bazaar Street',
                      area: 'Kovilpatti Main',
                      city: 'Kovilpatti',
                      district: 'Thoothukudi',
                      state: 'Tamilnadu',
                      pincode: '628501',
                    }));
                    setGeoStatus('detected');
                    setGeoMessage('GPS set to Kovilpatti Main ✓');
                    setErrors((prev) => ({ ...prev, doorNo: undefined, street: undefined, address: undefined }));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-[11px] text-blue-300 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>⚡ Kovilpatti Town (628501)</span>
                </button>
              </div>
            </div>

            {/* GPS Success UI */}
            {formData.gpsCaptured && geoStatus === 'detected' && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('GPS Captured ✓', 'GPS Captured ✓')}</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    {t('High-Accuracy Fix', 'High-Accuracy Fix')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-200/90 pt-1 border-t border-emerald-500/20">
                  <div>
                    <span className="text-emerald-400/80">{t('Latitude', 'Latitude')}:</span>{' '}
                    <strong className="text-white">{formData.latitude.toFixed(4)}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400/80">{t('Longitude', 'Longitude')}:</span>{' '}
                    <strong className="text-white">{formData.longitude.toFixed(4)}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-100/90 pt-1 border-t border-emerald-500/20 leading-relaxed">
                  <span className="text-emerald-400 font-semibold">{t('Address', 'Address')}: </span>
                  <span className="text-white font-medium">
                    {formData.address || 'Auto-filled from GPS'}
                  </span>
                </div>
              </div>
            )}

            {/* GPS Error & Denied Handling UI */}
            {(geoStatus === 'denied' || geoStatus === 'error') && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-200">
                      {geoMessage || t('Location access denied. Please enter address manually.', 'Location access denied. Please enter address manually.')}
                    </p>
                    <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                      {t('You can enter your complete service address manually below to finish registration.', 'You can enter your complete service address manually below to finish registration.')}
                    </p>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('Try GPS Capture Again', 'Try GPS Capture Again')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Address Input Fields Grid */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Door No */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('Door / Flat No', 'Door / Flat No')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.doorNo}
                    onChange={(e) => {
                      setFormData({ ...formData, doorNo: e.target.value });
                      if (errors.doorNo) setErrors({ ...errors, doorNo: undefined });
                    }}
                    placeholder="e.g. 123 / Plot 4B"
                    className={`w-full px-3 py-2 rounded-xl bg-black/50 border ${
                      errors.doorNo ? 'border-rose-500 focus:border-rose-400' : 'border-white/10 focus:border-cyan-400'
                    } text-xs text-white placeholder-slate-500 focus:outline-none`}
                  />
                  {errors.doorNo && (
                    <p className="text-[10px] text-rose-400 font-medium mt-1">{errors.doorNo}</p>
                  )}
                </div>

                {/* Street */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('Street / Road', 'Street / Road')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => {
                      setFormData({ ...formData, street: e.target.value });
                      if (errors.street) setErrors({ ...errors, street: undefined });
                    }}
                    placeholder="e.g. Main Road / Bazaar Street"
                    className={`w-full px-3 py-2 rounded-xl bg-black/50 border ${
                      errors.street ? 'border-rose-500 focus:border-rose-400' : 'border-white/10 focus:border-cyan-400'
                    } text-xs text-white placeholder-slate-500 focus:outline-none`}
                  />
                  {errors.street && (
                    <p className="text-[10px] text-rose-400 font-medium mt-1">{errors.street}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Area */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('Area / Village', 'Area / Village')}
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Mudukkumeendanpatti"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('City / Town', 'City / Town')}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kovilpatti"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('District', 'District')}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Thoothukudi"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {t('PIN Code', 'PIN Code')}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="628716"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Full Formatted Address Preview */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
                <span className="text-[10px] font-bold text-zinc-400 block mb-1 uppercase tracking-wider">
                  {t('Full Formatted Address', 'Full Formatted Address')}
                </span>
                <p className="text-zinc-200 font-medium leading-relaxed">
                  {formData.address || 'Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716'}
                </p>
              </div>

              {errors.address && (
                <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.address}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)] cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('Complete Registration & Open Dashboard', 'Complete Registration & Open Dashboard')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
          {t('Already registered?', 'Already registered?')}{' '}
          <button
            onClick={() => onNavigate('customer/login')}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            {t('Customer Sign In', 'Sign In to Customer Portal')}
          </button>
        </div>
      </div>
    </div>
  );
};


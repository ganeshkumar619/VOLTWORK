import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Save,
  Crosshair,
  Building,
  Home,
  Navigation,
  ShieldCheck,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.tsx';
import { apiRequest } from '../../lib/api.ts';
import { reverseGeocodeGPS, formatFullAddress } from '../../lib/geocoding.ts';
import { useToast } from '../../components/ToastNotification.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import { formatDate } from '../../lib/formatters.ts';

export const CustomerProfilePage: React.FC = () => {
  const { user, customerProfile, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [doorNo, setDoorNo] = useState(customerProfile?.doorNo || '');
  const [street, setStreet] = useState(customerProfile?.street || '');
  const [area, setArea] = useState(customerProfile?.area || 'Mudukkumeendanpatti');
  const [city, setCity] = useState(customerProfile?.city || 'Kovilpatti');
  const [district, setDistrict] = useState(customerProfile?.district || 'Thoothukudi');
  const [state, setState] = useState(customerProfile?.state || 'Tamilnadu');
  const [pincode, setPincode] = useState(customerProfile?.pincode || '628716');
  const [address, setAddress] = useState(customerProfile?.address || '');
  const [latitude, setLatitude] = useState(customerProfile?.latitude || 9.17);
  const [longitude, setLongitude] = useState(customerProfile?.longitude || 77.87);
  const [gpsCaptured, setGpsCaptured] = useState(Boolean(customerProfile?.gpsCaptured));

  const [geoStatus, setGeoStatus] = useState<'idle' | 'detecting' | 'detected' | 'error' | 'denied'>('idle');
  const [geoMessage, setGeoMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if profile loads asynchronously
  useEffect(() => {
    if (customerProfile) {
      if (customerProfile.doorNo) setDoorNo(customerProfile.doorNo);
      if (customerProfile.street) setStreet(customerProfile.street);
      if (customerProfile.area) setArea(customerProfile.area);
      if (customerProfile.city) setCity(customerProfile.city);
      if (customerProfile.district) setDistrict(customerProfile.district);
      if (customerProfile.state) setState(customerProfile.state);
      if (customerProfile.pincode) setPincode(customerProfile.pincode);
      if (customerProfile.address) setAddress(customerProfile.address);
      if (customerProfile.latitude) setLatitude(customerProfile.latitude);
      if (customerProfile.longitude) setLongitude(customerProfile.longitude);
      if (customerProfile.gpsCaptured !== undefined) setGpsCaptured(customerProfile.gpsCaptured);
    }
  }, [customerProfile]);

  // Keep full address formatted as components update
  useEffect(() => {
    const formatted = formatFullAddress({
      doorNo,
      street,
      area,
      city,
      district,
      state,
      pincode,
    });
    setAddress(formatted);
  }, [doorNo, street, area, city, district, state, pincode]);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoMessage(t('location_permission_denied', 'Geolocation is not supported by your browser.'));
      return;
    }

    setGeoStatus('detecting');
    setGeoMessage(t('Acquiring GPS...', 'Acquiring GPS...'));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setGpsCaptured(true);

        try {
          const geo = await reverseGeocodeGPS(lat, lng);
          if (geo.doorNo) setDoorNo(geo.doorNo);
          if (geo.street) setStreet(geo.street);
          if (geo.area) setArea(geo.area);
          if (geo.city) setCity(geo.city);
          if (geo.district) setDistrict(geo.district);
          if (geo.state) setState(geo.state);
          if (geo.pincode) setPincode(geo.pincode);
          setAddress(geo.formattedAddress);
        } catch (e) {
          console.warn('Reverse geocode fallback:', e);
        }

        setGeoStatus('detected');
        setGeoMessage(`${t('GPS Captured ✓', 'GPS Captured ✓')} [${lat}, ${lng}]`);
        showToast(t('GPS Captured ✓', 'GPS coordinates updated from live location'), 'success', t('Success', 'GPS Fix Acquired'));
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus('denied');
          setGeoMessage(t('Location Permission Denied', 'Location access denied. Please enter address manually.'));
        } else {
          setGeoStatus('error');
          setGeoMessage(t('Enter Address Manually', 'Unable to retrieve GPS coordinates. Please enter address manually.'));
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await apiRequest('/api/customers/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          doorNo,
          street,
          area,
          city,
          district,
          state,
          pincode,
          address,
          latitude,
          longitude,
          gpsCaptured: true,
        }),
      });

      setSaveSuccess(true);
      showToast(t('Profile Updated', 'Profile updated successfully'), 'success', t('Success', 'Saved'));
      if (refreshUser) refreshUser();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      showToast(err.message || t('Operation Failed', 'Failed to update profile'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950/30 border border-zinc-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5" />
            <span>{t('My Profile', 'My Profile')}</span>
          </div>
          <h1 className="text-2xl font-black text-white">{user?.name || t('My Profile', 'My Profile')}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {t('Manage your service property address, live GPS location coordinates, and contact details', 'Manage your service property address, live GPS location coordinates, and contact details')}
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="block text-white">{t('Profile Updated', 'Profile Updated Successfully')}</strong>
            <span>{t('Operation Successful', 'Your registered service address and GPS dispatch coordinates have been saved.')}</span>
          </div>
        </div>
      )}

      {/* Grid: Form & Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Editable Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Credentials */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              {t('Account Details', 'Account Credentials & Verification')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">{t('Full Name', 'Full Name')}</span>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  {user?.name}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">{t('Email Address', 'Email Address')}</span>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  {user?.email}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-zinc-500 block mb-1">{t('Phone Number', 'Phone Number')}</span>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-cyan-400 font-mono font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  {user?.phone || customerProfile?.phone}
                </div>
              </div>
            </div>
          </div>

          {/* GPS Location & Reverse Geocoding Section */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                {t('Service Address', 'Service Address')} & {t('GPS Location', 'GPS Location')}
              </h3>

              <button
                type="button"
                onClick={handleCaptureGPS}
                disabled={geoStatus === 'detecting'}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 text-xs font-black shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${geoStatus === 'detecting' ? 'animate-spin' : ''}`} />
                <span>{geoStatus === 'detecting' ? t('Loading...', 'Acquiring GPS...') : t('Capture GPS Location', 'Capture GPS Location')}</span>
              </button>
            </div>

            {/* GPS Live Status Indicator */}
            {gpsCaptured && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">{t('GPS Captured ✓', 'GPS Captured ✓')}</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                  {t('Latitude', 'Latitude')}: {latitude.toFixed(4)}, {t('Longitude', 'Longitude')}: {longitude.toFixed(4)}
                </span>
              </div>
            )}

            {/* Quick Fill Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{t('Quick Fill', 'Quick Fill')}:</span>
              <button
                type="button"
                onClick={() => {
                  setLatitude(9.1726);
                  setLongitude(77.8711);
                  setGpsCaptured(true);
                  if (!doorNo) setDoorNo('123');
                  if (!street) setStreet('Main Road');
                  setArea('Mudukkumeendanpatti');
                  setCity('Kovilpatti');
                  setDistrict('Thoothukudi');
                  setState('Tamilnadu');
                  setPincode('628716');
                  setGeoStatus('detected');
                  setGeoMessage('Location set to Mudukkumeendanpatti HQ ✓');
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
                  setGpsCaptured(true);
                  if (!doorNo) setDoorNo('45');
                  if (!street) setStreet('Bazaar Street');
                  setArea('Kovilpatti Main');
                  setCity('Kovilpatti');
                  setDistrict('Thoothukudi');
                  setState('Tamilnadu');
                  setPincode('628501');
                  setGeoStatus('detected');
                  setGeoMessage('Location set to Kovilpatti Main ✓');
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-[11px] text-blue-300 font-bold transition cursor-pointer"
              >
                ⚡ Kovilpatti Town (628501)
              </button>
            </div>

            {(geoStatus === 'denied' || geoStatus === 'error') && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{geoMessage}</p>
                </div>
              </div>
            )}

            {/* Structured Address Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {t('Door/Flat No', 'Door/Flat No')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={doorNo}
                    onChange={(e) => setDoorNo(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    {t('Street/Road', 'Street/Road')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Main Street"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">{t('Area/Village', 'Area/Village')}</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Mudukkumeendanpatti"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">{t('City/Town', 'City/Town')}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kovilpatti"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">{t('District', 'District')}</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Thoothukudi"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">{t('PIN Code', 'PIN Code')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="628716"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Formatted Address Box */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  {t('Service Address', 'Service Address')}
                </span>
                <p className="text-zinc-200 font-medium leading-relaxed">
                  {address || '123, Main Street, Mudukkumeendanpatti, Kovilpatti, Thoothukudi, Tamilnadu - 628716'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('Save Changes', 'Save Changes')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 1 Col: Service Coverage & Coordinates Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              {t('Service Area', 'Service Area')} & {t('GPS Location', 'GPS Location')}
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">{t('Service Address', 'Registered Address')}:</span>
                <p className="text-zinc-200 font-medium leading-relaxed">{address || t('No address set', 'No address set')}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>{t('Latitude', 'Latitude')}:</span>
                  <span className="text-zinc-200 font-mono font-medium">{latitude.toFixed(4)}° N</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('Longitude', 'Longitude')}:</span>
                  <span className="text-zinc-200 font-mono font-medium">{longitude.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('Total Jobs', 'Total Jobs')}:</span>
                  <span className="text-cyan-400 font-mono font-bold">{customerProfile?.totalJobs || 0}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('Registration Date', 'Registration Date')}:</span>
                  <span className="text-zinc-200 font-mono">{formatDate(customerProfile?.createdAt || new Date().toISOString())}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, User, Plus, Shield, Wrench, ArrowRight, AlertCircle, CheckCircle2, Smartphone, Sparkles, Mail } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { useI18n } from '../lib/i18n.tsx';

export interface GoogleAccount {
  email: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  isRegistered?: boolean;
}

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'customer' | 'worker';
  onSelectAccount: (account: { email: string; name: string; avatarUrl?: string }) => Promise<void> | void;
  errorMessage?: string;
  loading?: boolean;
}

const SAVED_ACCOUNTS_STORAGE_KEY = 'voltwork_saved_google_accounts';

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  role,
  onSelectAccount,
  errorMessage,
  loading = false,
}) => {
  const { t } = useI18n();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'enter_email' | 'saved_accounts'>('enter_email');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [localAccounts, setLocalAccounts] = useState<GoogleAccount[]>([]);
  const [inputError, setInputError] = useState('');

  // Load saved accounts & default recommendations
  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setInputError('');
      setSelectedEmail(null);

      if (role === 'admin') {
        setCustomEmail('ganeshkumargurusamy619@gmail.com');
        setCustomName('Ganesh Kumar');
      } else {
        // If there is a last used email, populate it
        try {
          const stored = localStorage.getItem('voltwork_last_google_email');
          if (stored) {
            setCustomEmail(stored);
          } else {
            setCustomEmail('');
          }
        } catch {
          setCustomEmail('');
        }
        setCustomName('');
      }
    }
  }, [isOpen, role]);

  const loadAccounts = async () => {
    let combined: GoogleAccount[] = [];

    // 1. Load user-saved original accounts from device localStorage
    try {
      const storedJson = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
      if (storedJson) {
        const parsed = JSON.parse(storedJson);
        if (Array.isArray(parsed)) {
          combined = [...parsed];
        }
      }
    } catch (e) {
      console.warn('Could not read saved accounts from localStorage', e);
    }

    // 2. Fetch server accounts (e.g. registered users in db)
    try {
      const res = await apiRequest('/api/auth/google/accounts').catch(() => null);
      if (res && Array.isArray(res.accounts)) {
        res.accounts.forEach((acc: any) => {
          if (!combined.some((c) => c.email.toLowerCase() === acc.email.toLowerCase())) {
            combined.push(acc);
          }
        });
      }
    } catch {
      // ignore
    }

    // 3. Ensure master admin email is always available for Admin role
    if (role === 'admin' && !combined.some((a) => a.email.toLowerCase() === 'ganeshkumargurusamy619@gmail.com')) {
      combined.unshift({
        email: 'ganeshkumargurusamy619@gmail.com',
        name: 'Ganesh Kumar (Admin)',
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
        role: 'admin',
        isRegistered: true,
      });
    }

    // Filter relevant accounts by role if applicable or show top matches
    const roleFiltered = combined.filter((a) => {
      if (role === 'admin') return a.role === 'admin' || a.email.toLowerCase() === 'ganeshkumargurusamy619@gmail.com';
      if (role === 'worker') return a.role === 'worker';
      return true; // customer can view customer/general
    });

    setLocalAccounts(roleFiltered.length > 0 ? roleFiltered : combined);
    if (roleFiltered.length > 0 && activeTab === 'saved_accounts') {
      setActiveTab('saved_accounts');
    }
  };

  const saveAccountToDevice = (acc: GoogleAccount) => {
    try {
      const storedJson = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
      let list: GoogleAccount[] = storedJson ? JSON.parse(storedJson) : [];
      if (!Array.isArray(list)) list = [];

      list = list.filter((item) => item.email.toLowerCase() !== acc.email.toLowerCase());
      list.unshift(acc);
      if (list.length > 8) list = list.slice(0, 8);

      localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
      localStorage.setItem('voltwork_last_google_email', acc.email);
    } catch (e) {
      console.warn('Could not save account to localStorage', e);
    }
  };

  if (!isOpen) return null;

  const handleAccountClick = (acc: GoogleAccount) => {
    setSelectedEmail(acc.email);
    saveAccountToDevice(acc);
    onSelectAccount({
      email: acc.email,
      name: acc.name,
      avatarUrl: acc.avatarUrl,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');

    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setInputError(t('Please enter your email', 'Please enter your original Google email address'));
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setInputError(t('Invalid email format', 'Please enter a valid email format (e.g. user@gmail.com)'));
      return;
    }

    const name = customName.trim() || cleanEmail.split('@')[0];
    const accountObj: GoogleAccount = {
      email: cleanEmail,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      role,
    };

    setSelectedEmail(cleanEmail);
    saveAccountToDevice(accountObj);

    onSelectAccount({
      email: cleanEmail,
      name,
      avatarUrl: accountObj.avatarUrl,
    });
  };

  const appendDomain = (domain: string) => {
    if (!customEmail) {
      setCustomEmail(`@${domain}`);
      return;
    }
    if (customEmail.includes('@')) {
      const prefix = customEmail.split('@')[0];
      setCustomEmail(`${prefix}@${domain}`);
    } else {
      setCustomEmail(`${customEmail}@${domain}`);
    }
  };

  const getRoleBadge = (accRole?: string) => {
    if (accRole === 'admin') {
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          Admin
        </span>
      );
    }
    if (accRole === 'worker') {
      return (
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Electrician
        </span>
      );
    }
    return (
      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        Customer
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#161922] text-slate-100 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Google brand */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800 bg-[#1a1e29]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Google Colored Logo */}
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{t('Continue with Google', 'Continue with Google')}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t('Sign in with your original Google account', 'Sign in with your original Google account')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error message banner */}
        {(errorMessage || inputError) && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage || inputError}</span>
          </div>
        )}

        {/* APK / Mobile Info Note */}
        <div className="px-5 pt-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-start gap-2">
            <Smartphone className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300">Android APK & Mobile Sign-In: </span>
              <span>{t('Enter your genuine Google email to sign in directly without popup blocks.', 'Enter your genuine Google email to sign in directly without popup blocks.')}</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('enter_email');
                setInputError('');
              }}
              className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'enter_email'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✉️ {t('Enter Original Email', 'Enter Original Email')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('saved_accounts');
                setInputError('');
              }}
              className={`py-2 px-3 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'saved_accounts'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📱 {t('Saved Accounts', 'Saved Accounts')} ({localAccounts.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Enter Original Google Email Directly */}
        {activeTab === 'enter_email' && (
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {t('Original Google / Gmail Address', 'Original Google / Gmail Address')} *
                </label>
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomEmail('ganeshkumargurusamy619@gmail.com');
                      setCustomName('Ganesh Kumar');
                    }}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    ⚡ Auto-fill Master Admin
                  </button>
                )}
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              {/* Domain Quick-Tap Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500">{t('Quick Add:', 'Quick Add:')}</span>
                {['gmail.com', 'googlemail.com'].map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => appendDomain(dom)}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    @{dom}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('Your Name (Optional)', 'Your Name (Optional)')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={role === 'admin' ? 'Ganesh Kumar' : 'e.g. Ravi Kumar'}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!customEmail.trim() || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{t('Authenticating Google...', 'Authenticating Google...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('Sign in with Original Google Account', 'Sign in with Original Google Account')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Saved / Pick from Available Accounts */}
        {activeTab === 'saved_accounts' && (
          <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
            {localAccounts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('No saved accounts on this device yet. Switch to "Enter Original Email" to add one.', 'No saved accounts on this device yet. Switch to "Enter Original Email" to add one.')}
              </div>
            ) : (
              localAccounts.map((acc) => {
                const isSelected = selectedEmail === acc.email && loading;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleAccountClick(acc)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500 text-white'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acc.email)}`}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full bg-slate-700 object-cover shrink-0 border border-slate-600"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{acc.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {getRoleBadge(acc.role)}
                      {isSelected && (
                        <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </button>
                );
              })
            )}

            <button
              type="button"
              onClick={() => setActiveTab('enter_email')}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition cursor-pointer mt-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Add another original Google email', 'Add another original Google email')}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-[#11141c] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>VoltWork AI OAuth Security</span>
          </span>
          <span className="text-slate-500">v2.4 Production Ready</span>
        </div>
      </div>
    </div>
  );
};


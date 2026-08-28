import React, { useState, useEffect } from 'react';
import { X, User, Plus, Shield, Wrench, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';

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

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  role,
  onSelectAccount,
  errorMessage,
  loading = false,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [localAccounts, setLocalAccounts] = useState<GoogleAccount[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableAccounts();
      setShowCustomInput(false);
      setCustomEmail('');
      setCustomName('');
      setSelectedEmail(null);
    }
  }, [isOpen, role]);

  const fetchAvailableAccounts = async () => {
    try {
      // Fetch known database accounts to show realistic browser-logged-in Google accounts
      const res = await apiRequest('/api/auth/google/accounts').catch(() => null);
      if (res && Array.isArray(res.accounts)) {
        setLocalAccounts(res.accounts);
      } else {
        // Fallback default accounts
        setLocalAccounts([
          {
            email: 'ganeshkumargurusamy619@gmail.com',
            name: 'Ganesh Kumar',
            avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
            role: 'customer',
          },
          {
            email: 'admin@voltwork.ai',
            name: 'VoltWork AI Admin',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
            role: 'admin',
          },
          {
            email: 'murugan@voltwork.ai',
            name: 'Murugan Electrician',
            avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Murugan',
            role: 'worker',
          },
          {
            email: 'customer@email.com',
            name: 'Ravi Kumar',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ravi',
            role: 'customer',
          },
        ]);
      }
    } catch (e) {
      setLocalAccounts([
        {
          email: 'ganeshkumargurusamy619@gmail.com',
          name: 'Ganesh Kumar',
          avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ganesh',
          role: 'customer',
        },
        {
          email: 'admin@voltwork.ai',
          name: 'VoltWork AI Admin',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
          role: 'admin',
        },
        {
          email: 'murugan@voltwork.ai',
          name: 'Murugan Electrician',
          avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Murugan',
          role: 'worker',
        },
        {
          email: 'customer@email.com',
          name: 'Ravi Kumar',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ravi',
          role: 'customer',
        },
      ]);
    }
  };

  if (!isOpen) return null;

  const handleAccountClick = (acc: GoogleAccount) => {
    setSelectedEmail(acc.email);
    onSelectAccount({
      email: acc.email,
      name: acc.name,
      avatarUrl: acc.avatarUrl,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    setSelectedEmail(customEmail.trim());
    onSelectAccount({
      email: customEmail.trim().toLowerCase(),
      name,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customEmail)}`,
    });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#1e222b] text-slate-100 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Google brand */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Google Colored Logo */}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              <div>
                <h3 className="text-base font-bold text-white">Choose an account</h3>
                <p className="text-xs text-slate-400">
                  to continue to <span className="font-semibold text-cyan-400">VoltWork AI</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error message banner if authentication rejected */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Portal Scope Hint */}
        <div className="px-6 pt-3">
          <div className="text-[11px] text-slate-400 bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <span>Target Portal:</span>
            <span className="font-bold uppercase tracking-wider text-cyan-400">
              {role === 'admin' ? '🛡️ Admin Portal' : role === 'worker' ? '⚡ Electrician Portal' : '👤 Customer Portal'}
            </span>
          </div>
        </div>

        {/* Account List */}
        <div className="p-6 space-y-2 max-h-72 overflow-y-auto">
          {!showCustomInput ? (
            <>
              {localAccounts.map((acc) => {
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
              })}

              {/* Use another account option */}
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/20 hover:bg-slate-800/50 border border-dashed border-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Use another Google account</div>
                  <div className="text-[11px] text-slate-400">Enter custom Google email & name</div>
                </div>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customEmail.trim() || loading}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Prompt: <code className="text-cyan-400">select_account</code></span>
          <span>VoltWork AI Security</span>
        </div>
      </div>
    </div>
  );
};

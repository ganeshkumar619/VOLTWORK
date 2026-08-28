import React, { useState } from 'react';
import {
  Wrench,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Zap,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  X,
  Shield,
  User,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';
import { apiRequest } from '../../lib/api.ts';
import { GoogleAccountPickerModal } from '../../components/GoogleAccountPickerModal.tsx';

interface WorkerLoginPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (role: string) => void;
}

export const WorkerLoginPage: React.FC<WorkerLoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { login, loginWithGoogle, forgotPassword } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [verifiedUserName, setVerifiedUserName] = useState('');

  // Google identity modal
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Email & Password login for Worker
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your technician email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password, 'worker');
      onLoginSuccess(user.role);
    } catch (err: any) {
      setError(err.message || 'Worker login failed. Please verify credentials or contact Admin.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In with Worker Verification
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const oauthConfig = await apiRequest('/api/auth/google/url?prompt=select_account').catch(() => ({ hasClientId: false, url: '' }));

      if (oauthConfig.hasClientId && oauthConfig.url) {
        // Ensure prompt=select_account is in the OAuth provider configuration URL
        const authUrl = new URL(oauthConfig.url);
        authUrl.searchParams.set('prompt', 'select_account');
        const authWindow = window.open(
          authUrl.toString(),
          'google_oauth_popup',
          'width=500,height=600,menubar=no,toolbar=no,status=no'
        );

        if (!authWindow) {
          setGoogleModalOpen(true);
        }
      } else {
        setGoogleModalOpen(true);
      }
    } catch (err: any) {
      console.warn('Fallback to Google identity selector:', err);
      setGoogleModalOpen(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const executeGoogleAuth = async (account: { email: string; name: string; avatarUrl?: string }) => {
    setGoogleLoading(true);
    setError('');

    try {
      const user = await loginWithGoogle(
        {
          email: account.email,
          name: account.name || account.email.split('@')[0],
          avatarUrl: account.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(account.email)}`,
        },
        'worker' // Enforce Worker role check
      );
      setGoogleModalOpen(false);
      onLoginSuccess(user.role);
    } catch (err: any) {
      setError(err.message || 'Access Denied. Not a Worker account.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Forgot password handlers
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered technician email');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await forgotPassword(forgotEmail.trim());
      if (res.userFound) {
        if (res.role !== 'worker') {
          setForgotError('This email is not registered as a Field Electrician.');
          return;
        }
        setVerifiedUserName(res.name || 'Field Technician');
        setForgotStep('reset');
      } else {
        setForgotError(res.message || 'Worker account not found');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Verification failed');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await forgotPassword(forgotEmail.trim(), newPassword);
      setForgotSuccessMsg(res.message || 'Password updated successfully!');
      setForgotStep('success');
      setEmail(forgotEmail.trim());
      setPassword(newPassword);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to update password');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotModalOpen(false);
    setForgotStep('verify');
    setForgotError('');
    setForgotSuccessMsg('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Top Left Back Navigation */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#090e1a]/80 hover:bg-[#0f172a] border border-purple-500/30 hover:border-purple-400 text-slate-300 hover:text-purple-300 text-xs font-bold backdrop-blur-md shadow-lg shadow-black/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all duration-200 group cursor-pointer min-h-[44px] min-w-[44px]"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
          <span>{t('Back', 'Back')}</span>
        </button>
      </div>

      {/* Electric Purple & Amber Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md bg-[#090e1a]/95 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] backdrop-blur-xl transition-all duration-300">
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
        <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Role Badge and Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-3 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <HardHat className="w-3.5 h-3.5" />
            <span>{t('Field Electrician Hub', 'Field Electrician Hub')}</span>
          </div>

          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#030712] border border-purple-400/50 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {t('Worker Sign In', 'Electrician Sign In')}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t('Field workforce dispatch, live navigation & attendance tracking', 'Field workforce dispatch, live navigation & attendance tracking')}
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Sign-In with Worker Verification */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 text-xs font-bold transition duration-200 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="tracking-wide">{t('Continue with Google', 'Worker Google Sign In')}</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-white/10" />
            <span className="absolute px-3 bg-[#090e1a] text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {t('OR', 'OR WORKER CREDENTIALS')}
            </span>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('Email Address', 'Technician Email')}
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 absolute left-3.5 top-3 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="worker1@voltwork.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 shadow-inner transition duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {t('Password', 'Password')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold hover:underline transition cursor-pointer"
                >
                  {t('Forgot Password?', 'Forgot Password?')}
                </button>
              </div>

              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 absolute left-3.5 top-3 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 shadow-inner transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('Worker Sign In', 'Sign In as Electrician')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Role Portal Switcher Links */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => onNavigate('admin/login')}
            className="hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('Admin Sign In', 'Admin Login')}</span>
          </button>

          <span className="text-slate-600">•</span>

          <button
            type="button"
            onClick={() => onNavigate('customer/login')}
            className="hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('Customer Sign In', 'Customer Login')}</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#090e1a] border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-slate-100">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{t('Reset Electrician Password', 'Reset Electrician Password')}</h3>
                <p className="text-[11px] text-slate-400">{t('VoltWork AI Account Security', 'Field Account Recovery')}</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('Enter your registered electrician email address to reset your account password.', 'Enter your registered electrician email address to reset your account password.')}
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('Email Address', 'Electrician Email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="worker@voltwork.ai"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                  >
                    {t('Cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] transition flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{t('Verify Email', 'Verify Email')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{t('Electrician confirmed:', 'Electrician confirmed:')} <strong>{verifiedUserName}</strong> ({forgotEmail})</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('New Password', 'New Password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('Confirm Password', 'Confirm Password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('verify')}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
                  >
                    {t('Back', 'Back')}
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] transition"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t('Save Password', 'Save Password')
                    )}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{t('Password Updated!', 'Password Updated!')}</h4>
                  <p className="text-xs text-slate-300 mt-1">{forgotSuccessMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] transition"
                >
                  {t('Proceed to Sign In', 'Proceed to Sign In')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Account Selector Dialog */}
      <GoogleAccountPickerModal
        isOpen={googleModalOpen}
        onClose={() => {
          setGoogleModalOpen(false);
          setError('');
        }}
        role="worker"
        onSelectAccount={executeGoogleAuth}
        errorMessage={error}
        loading={googleLoading}
      />
    </div>
  );
};

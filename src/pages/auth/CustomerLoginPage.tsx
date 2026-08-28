import React, { useState } from 'react';
import {
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  Zap,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  X,
  UserPlus,
  Shield,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../lib/auth.tsx';
import { useI18n } from '../../lib/i18n.tsx';

interface CustomerLoginPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (role: string) => void;
}

export const CustomerLoginPage: React.FC<CustomerLoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
}) => {
  const { login, forgotPassword } = useAuth();
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [verifiedUserName, setVerifiedUserName] = useState('');

  // Handle Username / Phone / Email Login for Customer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your Customer Username, Mobile or Email, and Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(identifier.trim(), password, 'customer');
      onLoginSuccess(res.user.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials or create a new account.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleVerifyIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered username, phone, or email');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await forgotPassword(forgotIdentifier.trim());
      if (res.userFound) {
        setVerifiedUserName(res.name || 'Customer');
        setForgotStep('reset');
      } else {
        setForgotError(res.message || 'Account not found');
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
      const res = await forgotPassword(forgotIdentifier.trim(), newPassword);
      setForgotSuccessMsg(res.message || 'Password updated successfully!');
      setForgotStep('success');
      setIdentifier(forgotIdentifier.trim());
      setPassword(newPassword);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password');
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
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#090e1a]/80 hover:bg-[#0f172a] border border-blue-500/30 hover:border-blue-400 text-slate-300 hover:text-blue-300 text-xs font-bold backdrop-blur-md shadow-lg shadow-black/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all duration-200 group cursor-pointer min-h-[44px] min-w-[44px]"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-1 transition-transform" />
          <span>{t('Back', 'Back')}</span>
        </button>
      </div>

      {/* Electric Blue Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md bg-[#090e1a]/95 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300">
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        <div className="absolute -bottom-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Role Badge and Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-3 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
            <User className="w-3.5 h-3.5" />
            <span>{t('Customer Portal', 'Customer Portal')}</span>
          </div>

          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#030712] border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
              <Zap className="w-6 h-6 fill-blue-400" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {t('Customer Sign In', 'Customer Sign In')}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t('Book certified electricians, track live arrivals & pay bills securely', 'Book certified electricians, track live arrivals & pay bills securely')}
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Create Customer Account Callout Box */}
        <div className="mb-5 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-300 block tracking-wider">
              {t("New to VoltWork?", "New Customer?")}
            </span>
            <span className="text-white font-medium">
              {t("Create your account in seconds", "Create account to access dashboard")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('Register', 'Register')}</span>
          </button>
        </div>

        {/* Username/Phone & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {t('Username / Mobile / Email', 'Username / Mobile / Email')}
              </label>
            </div>
            <div className="relative group">
              <User className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 absolute left-3.5 top-3 transition-colors" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. anand_customer or 9876543210"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 shadow-inner transition duration-200 font-medium"
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
                  setForgotIdentifier(identifier || '');
                  setForgotModalOpen(true);
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline transition cursor-pointer"
              >
                {t('Forgot Password?', 'Forgot Password?')}
              </button>
            </div>

            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400 absolute left-3.5 top-3 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 shadow-inner transition duration-200"
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
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('Customer Sign In', 'Sign In as Customer')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Portal Switchers */}
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
            onClick={() => onNavigate('worker/login')}
            className="hover:text-purple-300 transition flex items-center gap-1 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('Worker Sign In', 'Worker Login')}</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#090e1a] border border-blue-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.25)] text-slate-100">
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{t('Reset Customer Password', 'Reset Customer Password')}</h3>
                <p className="text-[11px] text-slate-400">{t('VoltWork AI Account Security', 'VoltWork AI Account Security')}</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyIdentifier} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t('Enter your registered customer username, phone, or email to verify account identity.', 'Enter your registered customer username, phone, or email to verify account identity.')}
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('Username / Mobile / Email', 'Username / Mobile / Email')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. anand_customer or 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-medium"
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
                    className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.4)] transition flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{t('Verify Account', 'Verify Account')}</span>
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
                  <span>{t('Account confirmed for', 'Account confirmed for')} <strong>{verifiedUserName}</strong> ({forgotIdentifier})</span>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
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
                    className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.4)] transition"
                  >
                    {forgotLoading ? (
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
                  className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.4)] transition"
                >
                  {t('Proceed to Customer Sign In', 'Proceed to Customer Sign In')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


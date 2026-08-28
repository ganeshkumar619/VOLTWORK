import React, { useState } from 'react';
import { KeyRound, ShieldCheck, Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { useToast } from './ToastNotification.tsx';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
  onSuccess?: () => void;
}

export const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
  onSuccess,
}) => {
  const { user, changePassword, setMustChangePassword } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(true);
      showToast('Admin password updated successfully!', 'success');
      if (setMustChangePassword) {
        setMustChangePassword(false);
      }
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        if (onClose && !isMandatory) onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              {isMandatory ? 'Set New Admin Password' : 'Change Password'}
            </h2>
            <p className="text-xs text-zinc-400">
              {isMandatory
                ? 'Temporary password detected. Please set a secure permanent password.'
                : 'Update your administrator password credentials.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">Password Updated!</h3>
            <p className="text-xs text-zinc-400">Your new credentials have been safely recorded in the database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Current / Temporary Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter current / temp password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-white text-xs outline-none transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                New Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter secure new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-white text-xs outline-none transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-white text-xs outline-none transition font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Updating Database...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Save & Activate New Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

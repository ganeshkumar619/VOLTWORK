import React, { useState, useEffect } from 'react';
import { AdminLoginPage } from './auth/AdminLoginPage.tsx';
import { CustomerLoginPage } from './auth/CustomerLoginPage.tsx';
import { WorkerLoginPage } from './auth/WorkerLoginPage.tsx';
import { Shield, User, Wrench } from 'lucide-react';
import { useI18n } from '../lib/i18n.tsx';

interface LoginPageProps {
  initialRole?: 'admin' | 'customer' | 'worker';
  onNavigate: (page: string) => void;
  onLoginSuccess: (role: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialRole = 'customer',
  onNavigate,
  onLoginSuccess,
}) => {
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'customer' | 'worker'>(initialRole);

  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  return (
    <div className="flex flex-col items-center">
      {/* Top Role Switcher Bar */}
      <div className="pt-4 pb-2 z-20 flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              onNavigate('admin/login');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('Admin Sign In', 'Admin')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('customer');
              onNavigate('customer/login');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedRole === 'customer'
                ? 'bg-blue-500 text-slate-950 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('Customer Sign In', 'Customer')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('worker');
              onNavigate('worker/login');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedRole === 'worker'
                ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{t('Worker Sign In', 'Worker')}</span>
          </button>
        </div>
      </div>

      {/* Render Role-Specific Login Component */}
      <div className="w-full">
        {selectedRole === 'admin' && (
          <AdminLoginPage onNavigate={onNavigate} onLoginSuccess={onLoginSuccess} />
        )}
        {selectedRole === 'customer' && (
          <CustomerLoginPage onNavigate={onNavigate} onLoginSuccess={onLoginSuccess} />
        )}
        {selectedRole === 'worker' && (
          <WorkerLoginPage onNavigate={onNavigate} onLoginSuccess={onLoginSuccess} />
        )}
      </div>
    </div>
  );
};

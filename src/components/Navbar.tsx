import React, { useState } from 'react';
import { Zap, LogOut, User as UserIcon, Menu, X, Shield, Wrench, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { useI18n } from '../lib/i18n.tsx';
import { LanguageToggle } from './LanguageToggle.tsx';
import { NotificationCenter } from './NotificationCenter.tsx';
import { AdminChangePasswordModal } from './AdminChangePasswordModal.tsx';
import { AdminSiteProfileModal } from './AdminSiteProfileModal.tsx';

interface NavbarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenMobileMenu?: () => void;
  onSelectJob?: (jobId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab = 'overview',
  onSelectTab,
  onOpenMobileMenu,
  onSelectJob,
}) => {
  const { user, logout, isAuthenticated, role } = useAuth();
  const { t, language } = useI18n();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [siteLocationModalOpen, setSiteLocationModalOpen] = useState(false);

  const [publicMobileMenuOpen, setPublicMobileMenuOpen] = useState(false);

  // Role-specific primary navigation links
  const navLinks = !isAuthenticated
    ? [
        { id: 'platform', label: 'PLATFORM', labelKey: 'nav_platform' },
        { id: 'workflow', label: 'WORKFLOW', labelKey: 'nav_workflow' },
        { id: 'access', label: 'ACCESS', labelKey: 'nav_access' },
        { id: 'coverage', label: 'COVERAGE', labelKey: 'nav_coverage' },
      ]
    : role === 'admin'
    ? [
        { id: 'overview', label: 'DASHBOARD', labelKey: 'nav_overview' },
        { id: 'jobs', label: 'SERVICE JOBS', labelKey: 'nav_service_jobs' },
        { id: 'workers', label: 'WORKFORCE', labelKey: 'nav_workforce' },
        { id: 'billing', label: 'BILLING', labelKey: 'nav_billing' },
        { id: 'salaries', label: 'SALARIES', labelKey: 'nav_salaries' },
        { id: 'analytics', label: 'ANALYTICS', labelKey: 'nav_analytics' },
      ]
    : role === 'worker'
    ? [
        { id: 'dashboard', label: 'ASSIGNED JOBS', labelKey: 'nav_assigned_jobs' },
        { id: 'attendance', label: 'ATTENDANCE', labelKey: 'nav_attendance' },
        { id: 'salary', label: 'MY PAY', labelKey: 'nav_my_salary' },
        { id: 'profile', label: 'PROFILE', labelKey: 'nav_profile' },
      ]
    : [
        { id: 'my_jobs', label: 'MY REQUESTS', labelKey: 'nav_my_requests' },
        { id: 'new_request', label: 'BOOK SERVICE', labelKey: 'nav_new_request' },
        { id: 'history', label: 'HISTORY', labelKey: 'nav_history' },
        { id: 'profile', label: 'ACCOUNT', labelKey: 'nav_account' },
      ];

  const getInitials = (name?: string) => {
    if (!name) return 'VW';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white/5 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* ZONE 1: BRAND TITLE */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPublicMobileMenuOpen(!publicMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            aria-label="Toggle Navigation"
          >
            {publicMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={() =>
            onSelectTab &&
            onSelectTab(
              isAuthenticated ? (role === 'admin' ? 'overview' : role === 'worker' ? 'dashboard' : 'my_jobs') : 'landing'
            )
          }
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)] group-hover:scale-105 transition-transform duration-200">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap">
            {t('app_name', 'VOLTWORK AI')}
          </span>
        </button>
      </div>

      {/* ZONE 2: NAV LINKS (Centered High-Tech Tabs with Cyan Highlight) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium h-16">
        {navLinks.slice(0, 6).map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab && onSelectTab(link.id)}
              className={`h-full flex items-center transition-colors text-xs font-bold tracking-wider cursor-pointer uppercase ${
                isActive
                  ? 'text-cyan-400 border-b-2 border-cyan-400 shadow-[0_4px_12px_rgba(34,211,238,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t(link.labelKey || link.label, link.label)}
            </button>
          );
        })}
      </nav>

      {/* ZONE 3: PRIMARY ACTIONS, LANGUAGE TOGGLE & PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Universal Language Toggle */}
        <LanguageToggle />

        {isAuthenticated ? (
          <>
            {/* Notification Center */}
            <NotificationCenter onSelectJob={onSelectJob} />

            {/* Profile Dropdown & Badge */}
            <div className="relative flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end text-right">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  {role === 'admin' ? t('role_admin', 'Admin Console') : role === 'worker' ? t('role_worker', 'Technician Hub') : t('role_customer', 'Customer Account')}
                </span>
                <span className="text-xs text-slate-300 font-medium max-w-[120px] truncate">{user?.name}</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 rounded-full border-2 border-cyan-500/40 overflow-hidden bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:border-cyan-400 transition cursor-pointer"
                  aria-label="User menu"
                >
                  {getInitials(user?.name)}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0b1120]/95 border border-white/10 backdrop-blur-xl shadow-2xl p-2 z-50 text-slate-200">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] uppercase font-bold tracking-wider">
                        {role?.toUpperCase()}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectTab &&
                            onSelectTab(role === 'admin' ? 'overview' : role === 'worker' ? 'dashboard' : 'my_jobs');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                        {t('dashboard', 'Dashboard')}
                      </button>

                      {role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              setSiteLocationModalOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            {t('Site & Location Settings', 'Site & Location Settings')}
                          </button>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              setChangePasswordOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                            {t('Change Password', 'Change Password')}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          if (onSelectTab) onSelectTab('landing');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('logout', 'Sign Out')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Modals */}
            {role === 'admin' && (
              <>
                <AdminChangePasswordModal
                  isOpen={changePasswordOpen}
                  onClose={() => setChangePasswordOpen(false)}
                  isMandatory={false}
                />
                <AdminSiteProfileModal
                  isOpen={siteLocationModalOpen}
                  onClose={() => setSiteLocationModalOpen(false)}
                />
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab && onSelectTab('login')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              {t('login', 'Login')}
            </button>
            <button
              onClick={() => onSelectTab && onSelectTab('register')}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-[0_0_12px_rgba(34,211,238,0.4)] transition whitespace-nowrap uppercase tracking-tight cursor-pointer"
            >
              {t('sign_up', 'Sign Up')}
            </button>
          </div>
        )}
      </div>

      {/* Public Mobile Navigation Drawer */}
      {!isAuthenticated && publicMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#0b1120]/95 border-b border-white/10 backdrop-blur-xl p-4 flex flex-col gap-3 md:hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setPublicMobileMenuOpen(false);
                    onSelectTab && onSelectTab(link.id);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition cursor-pointer ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t(link.labelKey || link.label, link.label)}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center gap-2">
            <button
              onClick={() => {
                setPublicMobileMenuOpen(false);
                onSelectTab && onSelectTab('login');
              }}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition text-center"
            >
              {t('login', 'Login')}
            </button>
            <button
              onClick={() => {
                setPublicMobileMenuOpen(false);
                onSelectTab && onSelectTab('register');
              }}
              className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-[0_0_12px_rgba(34,211,238,0.4)] transition uppercase tracking-tight text-center"
            >
              {t('sign_up', 'Sign Up')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

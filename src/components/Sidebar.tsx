import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCheck,
  Receipt,
  Banknote,
  CalendarCheck,
  Tag,
  MessageSquare,
  BarChart3,
  ShieldAlert,
  PlusCircle,
  Clock,
  User,
  Zap,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { useI18n } from '../lib/i18n.tsx';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { role, user } = useAuth();
  const { t } = useI18n();

  if (!role) return null;

  const adminMenu = [
    { id: 'overview', labelKey: 'nav_overview', icon: LayoutDashboard },
    { id: 'jobs', labelKey: 'nav_jobs', icon: Briefcase },
    { id: 'workers', labelKey: 'nav_workers', icon: UserCheck },
    { id: 'customers', labelKey: 'nav_customers', icon: Users },
    { id: 'billing', labelKey: 'nav_billing', icon: Receipt },
    { id: 'salaries', labelKey: 'nav_salaries', icon: Banknote },
    { id: 'attendance', labelKey: 'nav_attendance', icon: CalendarCheck },
    { id: 'categories', labelKey: 'nav_categories', icon: Tag },
    { id: 'sms_logs', labelKey: 'nav_sms_logs', icon: MessageSquare },
    { id: 'analytics', labelKey: 'nav_analytics', icon: BarChart3 },
    { id: 'audit_logs', labelKey: 'nav_audit_logs', icon: ShieldAlert },
  ];

  const customerMenu = [
    { id: 'my_jobs', labelKey: 'nav_my_requests', icon: Briefcase },
    { id: 'new_request', labelKey: 'nav_new_request', icon: PlusCircle },
    { id: 'history', labelKey: 'nav_history', icon: Clock },
    { id: 'profile', labelKey: 'nav_profile', icon: User },
  ];

  const workerMenu = [
    { id: 'dashboard', labelKey: 'nav_assigned_jobs', icon: Briefcase },
    { id: 'attendance', labelKey: 'nav_attendance', icon: CalendarCheck },
    { id: 'salary', labelKey: 'nav_my_salary', icon: Banknote },
    { id: 'profile', labelKey: 'nav_profile', icon: User },
  ];

  const currentMenu = role === 'admin' ? adminMenu : role === 'worker' ? workerMenu : customerMenu;

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-[#060b18]/80 backdrop-blur-md border-r border-white/10 p-4 flex flex-col justify-between transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <div className="flex items-center justify-between px-3 py-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {role === 'admin' ? t('admin_dashboard', 'Administration') : role === 'worker' ? t('worker_dashboard', 'Technician Hub') : t('customer_dashboard', 'Client Portal')}
            </span>
            {isOpenMobile && (
              <button onClick={onCloseMobile} className="md:hidden p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {currentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{t(item.labelKey, item.id)}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom User Card */}
        <div className="pt-3 border-t border-white/10">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold text-xs uppercase shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-cyan-400 font-mono capitalize tracking-wide">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

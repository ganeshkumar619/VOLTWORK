import React from 'react';
import { Shield, User, Wrench, Zap, X, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { useI18n } from '../lib/i18n.tsx';

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'admin' | 'customer' | 'worker') => void;
}

export const RoleSelectModal: React.FC<RoleSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  const { t, language } = useI18n();
  if (!isOpen) return null;

  const isTa = language === 'ta';

  const roles = [
    {
      id: 'admin' as const,
      title: isTa ? 'நிர்வாக அணுகல் தளம்' : 'Administrator Portal',
      subtitle: isTa ? 'முதன்மை எலக்ட்ரீசியன் & அனுப்புதல்' : 'Master Electrician & Dispatch',
      badge: isTa ? 'நிர்வாகம் மட்டும்' : 'Admin Only',
      desc: isTa
        ? 'வேலை ஒதுக்கீடு, GPS ரேடார், கட்டண சரிபார்ப்பு, தொழிலாளர் சம்பளம் மற்றும் வணிக பகுப்பாய்விற்கான மத்திய கட்டுப்பாட்டு அறை.'
        : 'Central control room for job dispatch, GPS radar, bill lock, worker payroll & business analytics.',
      icon: Shield,
      accentColor: 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 text-cyan-400',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      route: '/admin/login',
    },
    {
      id: 'customer' as const,
      title: isTa ? 'வாடிக்கையாளர் தளம்' : 'Customer Portal',
      subtitle: isTa ? 'வீடு & வணிக மின்சார சேவை' : 'Home & Business Electrical Service',
      badge: isTa ? 'வாடிக்கையாளர்கள்' : 'Public & Business',
      desc: isTa
        ? 'எலக்ட்ரீசியன்களை உடனடியாக பதிவு செய்யுங்கள், நேரலை வருகையைக் கண்காணிக்கவும் மற்றும் பாதுகாப்பாக பணம் செலுத்துங்கள்.'
        : 'Book electricians on-demand, track incoming technicians live, approve estimates & pay online securely.',
      icon: User,
      accentColor: 'border-blue-500/40 hover:border-blue-400 bg-blue-950/20 text-blue-400',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      route: '/customer/login',
    },
    {
      id: 'worker' as const,
      title: isTa ? 'கள எலக்ட்ரீசியன் தளம்' : 'Field Electrician Hub',
      subtitle: isTa ? 'தொழிலாளர் மொபைல் தளம்' : 'Technician Mobile Portal',
      badge: isTa ? 'தொழிலாளர்கள் மட்டும்' : 'Electricians Only',
      desc: isTa
        ? 'ஒதுக்கப்பட்ட வேலைகளைப் பார்க்கவும், GPS வழிகாட்டல் பெறவும், பயன்படுத்திய பொருட்களைப் பதிவு செய்து சம்பளத்தைக் கண்காணிக்கவும்.'
        : 'View assigned jobs, GPS route navigation, log repair materials & track attendance and earned wages.',
      icon: Wrench,
      accentColor: 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20 text-purple-400',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      route: '/worker/login',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#090e1a]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100">
        {/* Animated ambient glow top line */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pr-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <Zap className="w-6 h-6 fill-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isTa ? 'உங்கள் தளத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Your Portal'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isTa
              ? 'உள்நுழைய உங்கள் அங்கீகரிக்கப்பட்ட கணக்கு வகையைத் தேர்ந்தெடுக்கவும்'
              : 'Choose your authorized account role to access your dedicated login page'}
          </p>
        </div>

        {/* Role Cards List */}
        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRole(r.id)}
                className={`w-full p-4 rounded-2xl border ${r.accentColor} transition-all duration-200 text-left flex items-start sm:items-center justify-between gap-4 group hover:scale-[1.01] hover:shadow-lg cursor-pointer backdrop-blur-sm`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {r.title}
                      </h3>
                      <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 sm:line-clamp-1 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-cyan-300 shrink-0">
                  <span>{isTa ? 'திறக்கவும்' : 'Open'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            {isTa ? 'நேரடி இணையதள முகவரிகள்' : 'Direct URLs'}: <span className="text-cyan-400">/admin/login</span> • <span className="text-blue-400">/customer/login</span> • <span className="text-purple-400">/worker/login</span>
          </p>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  ShieldCheck,
  Navigation,
  FileSpreadsheet,
  Banknote,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Clock,
  Wrench,
  Users,
  Shield,
  Layers,
  User,
  ChevronRight,
  MapPin,
  Globe,
  Radio,
  Building2,
  Factory,
  Home,
  PhoneCall,
  Phone,
} from 'lucide-react';
import { useI18n } from '../lib/i18n.tsx';
import { RoleSelectModal } from '../components/RoleSelectModal.tsx';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t, language } = useI18n();
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const isTa = language === 'ta';

  const coverageDetails = {
    primaryArea: isTa ? 'முடுக்கமீண்டான்பட்டி' : 'Mudukkumeendanpatti',
    serviceArea: isTa ? 'கோவில்பட்டி, தூத்துக்குடி மாவட்டம்' : 'Kovilpatti, Thoothukudi District',
    district: isTa ? 'தூத்துக்குடி மாவட்டம்' : 'Thoothukudi District',
    statePincode: isTa ? 'தமிழ்நாடு - 628716' : 'Tamilnadu - 628716',
    pincode: '628716',
    coverage: isTa ? 'முடுக்கமீண்டான்பட்டி மற்றும் சுற்றியுள்ள பகுதிகள்' : 'Mudukkumeendanpatti and surrounding areas',
    eta: isTa ? '25-35 நிமிடங்கள்' : '25-35 minutes',
    activeFleet: isTa ? '28 எலக்ட்ரீசியன்கள்' : '28 Electricians',
    helpline: '24/7 Emergency Helpline: 8925190164',
    phone: '8925190164',
    zones: [
      {
        name: isTa ? 'முடுக்கமீண்டான்பட்டி' : 'Mudukkumeendanpatti',
        type: isTa ? 'முதன்மை தலைமையகம் & மையம்' : 'Primary Hub & Command Base',
        pincode: 'PIN 628716',
        status: isTa ? 'செயலில் உள்ள சேவை' : 'Active Dispatch',
        response: isTa ? '25-35 நிமிடங்கள்' : '25-35 mins',
        activeFleet: isTa ? '10 தொழிலாளர்கள்' : '10 Electricians',
        focus: isTa ? 'வீட்டு & விவசாய மின்சார மையம்' : 'Domestic & Agricultural Hub',
      },
      {
        name: isTa ? 'கோவில்பட்டி' : 'Kovilpatti',
        type: isTa ? 'வட்டார வணிக & நகர மையம்' : 'Taluk Commercial & Urban Hub',
        pincode: 'PIN 628716',
        status: isTa ? 'செயலில் உள்ள சேவை' : 'Active Dispatch',
        response: isTa ? '25-35 நிமிடங்கள்' : '25-35 mins',
        activeFleet: isTa ? '12 தொழிலாளர்கள்' : '12 Electricians',
        focus: isTa ? 'வணிக & 3-பேஸ் வயரிங்' : 'Commercial & 3-Phase Wiring',
      },
      {
        name: isTa ? 'தூத்துக்குடி மாவட்டம்' : 'Thoothukudi District',
        type: isTa ? 'மண்டல சேவை எல்லை' : 'Regional Service Jurisdiction',
        pincode: isTa ? 'தமிழ்நாடு' : 'Tamil Nadu',
        status: isTa ? 'செயலில் உள்ள சேவை' : 'Active Dispatch',
        response: isTa ? '25-35 நிமிடங்கள்' : '25-35 mins',
        activeFleet: isTa ? '6 தொழிலாளர்கள்' : '6 Electricians',
        focus: isTa ? 'தொழில்துறை & பவர் கிரிட் பழுதுகள்' : 'Industrial & Power Grid Repairs',
      },
      {
        name: isTa ? 'சுற்றியுள்ள கிராமப்புற பகுதிகள்' : 'Surrounding Rural Belt',
        type: isTa ? 'விவசாய & மோட்டார் இணைப்புகள்' : 'Periphery & Farm Connections',
        pincode: '628716 Zone',
        status: isTa ? 'செயலில் உள்ள சேவை' : 'Active Dispatch',
        response: isTa ? '25-35 நிமிடங்கள்' : '25-35 mins',
        activeFleet: isTa ? '28 மொத்த தொழிலாளர்கள்' : '28 Total Fleet',
        focus: isTa ? 'மோட்டார் பம்புகள் & டிரான்ஸ்பார்மர்' : 'Motor Pumps & Transformer Support',
      },
    ],
  };

  const workflowSteps = isTa
    ? [
        { num: '01', title: 'சேவை பதிவு', desc: 'வாடிக்கையாளர் பிரச்சனையை விவரித்து GPS பகிர்கிறார்.' },
        { num: '02', title: 'AI ஆய்வு', desc: 'Gemini AI இயந்திரம் சிக்கல், முன்னுரிமை & உதிரி பாகங்களை பகுப்பாய்வு செய்கிறது.' },
        { num: '03', title: 'வேலை ஒதுக்கீடு', desc: 'திறன் & தூரத்தின் அடிப்படையில் நிர்வாகி தொழிலாளரை நியமிக்கிறார்.' },
        { num: '04', title: 'நேரலை கண்காணிப்பு', desc: 'தொழிலாளி வரும் வழியை GPS வரைபடத்தில் நேரலையாகக் காணலாம்.' },
        { num: '05', title: 'களப்பணி & உதிரிபாகங்கள்', desc: 'பழுதுநீக்கும் புகைப்படங்கள் மற்றும் பயன்படுத்திய பொருட்கள் பதிவு செய்யப்படுகின்றன.' },
        { num: '06', title: 'நிர்வாக சரிபார்ப்பு', desc: 'தலைமை நிர்வாகி சரிபார்த்து இறுதி கட்டணத்தை நிர்ணயிக்கிறார்.' },
        { num: '07', title: 'SMS & பணம் செலுத்துதல்', desc: 'வாடிக்கையாளருக்கு SMS அனுப்பப்படுகிறது; எளிதாக ஆன்லைனில் பணம் செலுத்தலாம்.' },
      ]
    : [
        { num: '01', title: 'Request Service', desc: 'Customer describes electrical fault & shares GPS.' },
        { num: '02', title: 'AI Diagnostics', desc: 'Rule-based & Gemini engine analyzes category, priority & spares.' },
        { num: '03', title: 'Smart Dispatch', desc: 'Admin assigns electrician based on skills & distance.' },
        { num: '04', title: 'Live Tracking', desc: 'Technician on-the-way with consent GPS radar.' },
        { num: '05', title: 'Field Execution', desc: 'Photos, materials, & labour details captured.' },
        { num: '06', title: 'Admin Verification', desc: 'Master electrician reviews & sets final bill.' },
        { num: '07', title: 'SMS & Payment', desc: 'Admin dispatches SMS; customer pays online.' },
      ];

  const features = isTa
    ? [
        {
          icon: Sparkles,
          title: 'AI பிரச்சனை ஆய்வு',
          desc: 'Gemini AI மூலம் மின்சாரப் பிரச்சனையை நொடிகளில் வகைப்படுத்துதல், ஆபத்துக் கணிப்பு & உதிரிபாகப் பரிந்துரை.',
          color: 'from-cyan-400 to-blue-500',
        },
        {
          icon: Users,
          title: 'திறன்மிகு வேலை ஒதுக்கீடு',
          desc: 'தொழிலாளர்களின் திறன், இருப்பிட தூரம் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் வேலை ஒதுக்கீடு.',
          color: 'from-blue-400 to-indigo-500',
        },
        {
          icon: Navigation,
          title: 'நேரலை GPS ரேடார்',
          desc: 'தொழிலாளர்களின் நிகழ்நேர இருப்பிடம் மற்றும் வாடிக்கையாளர் இடத்திற்கு எளிதான வழிசெலுத்தல்.',
          color: 'from-cyan-400 to-emerald-400',
        },
        {
          icon: Clock,
          title: 'நிரந்தர பழுது வரலாறு',
          desc: 'முந்தைய பழுதுபார்ப்புகள், வயரிங் விவரங்கள் மற்றும் மாற்றுப் பொருட்களின் முழுமையான வரலாறு.',
          color: 'from-purple-400 to-pink-500',
        },
        {
          icon: Banknote,
          title: 'தொழிலாளர் சம்பள மேலாண்மை',
          desc: 'அடிப்படை சம்பளம், கமிஷன், போனஸ், பிடித்தங்கள் மற்றும் வருகை நேரத்துடனான கணக்கீடு.',
          color: 'from-emerald-400 to-teal-500',
        },
        {
          icon: FileSpreadsheet,
          title: 'துல்லியமான டிஜிட்டல் பில்லிங்',
          desc: 'தொழிலாளர்கள் விவரங்களை சமர்ப்பிக்கிறார்கள்; நிர்வாகி மட்டுமே இறுதி ரசீதை அங்கீகரிக்கிறார்.',
          color: 'from-amber-400 to-orange-500',
        },
        {
          icon: MessageSquare,
          title: 'நிர்வாக SMS சேவை',
          desc: 'அங்கீகரிக்கப்பட்ட கட்டண விவரங்கள் வாடிக்கையாளரின் மொபைல் எண்ணிற்கு SMS ஆக உடனடியாக அனுப்பப்படுகிறது.',
          color: 'from-blue-400 to-cyan-400',
        },
        {
          icon: BarChart3,
          title: 'வணிக பகுப்பாய்வு',
          desc: 'நிகர லாப வரம்பு, வருவாய் போக்குகள், சிறந்த தொழிலாளர்கள் மற்றும் சராசரி பழுதுபார்க்கும் நேரம்.',
          color: 'from-indigo-400 to-purple-500',
        },
      ]
    : [
        {
          icon: Sparkles,
          title: 'AI Problem Analysis',
          desc: 'Instant electrical issue categorization, danger detection, and spares recommendation via Gemini 3.7 & instant rule engine fallback.',
          color: 'from-cyan-400 to-blue-500',
        },
        {
          icon: Users,
          title: 'Smart Worker Assignment',
          desc: 'Algorithmically rank field technicians by skill match, distance, live availability, and current workload.',
          color: 'from-blue-400 to-indigo-500',
        },
        {
          icon: Navigation,
          title: 'Live Job Radar & GPS',
          desc: 'Consent-based technician location tracking and one-tap navigation to the customer work site.',
          color: 'from-cyan-400 to-emerald-400',
        },
        {
          icon: Clock,
          title: 'Permanent Repair History',
          desc: 'Complete historical logs of past repairs, wiring schematics, and materials with role-based soft-deletion & audit recovery.',
          color: 'from-purple-400 to-pink-500',
        },
        {
          icon: Banknote,
          title: 'Workforce Salary Engine',
          desc: 'Comprehensive pay manager with basic pay, commissions, bonus, deductions, and attendance hours.',
          color: 'from-emerald-400 to-teal-500',
        },
        {
          icon: FileSpreadsheet,
          title: 'Strict Digital Billing',
          desc: 'Workers submit work details; only the Admin approves the final binding bill and invoice.',
          color: 'from-amber-400 to-orange-500',
        },
        {
          icon: MessageSquare,
          title: 'Admin-Controlled SMS',
          desc: 'Automated carrier-grade SMS dispatch with approved bill figures directly to the customer mobile.',
          color: 'from-blue-400 to-cyan-400',
        },
        {
          icon: BarChart3,
          title: 'Real Business Analytics',
          desc: 'Real database-calculated profit margins, revenue trends, top electricians, and job turnaround times.',
          color: 'from-indigo-400 to-purple-500',
        },
      ];

  const handleRoleSelected = (role: 'admin' | 'customer' | 'worker') => {
    setRoleModalOpen(false);
    if (role === 'admin') onNavigate('admin/login');
    else if (role === 'customer') onNavigate('customer/login');
    else if (role === 'worker') onNavigate('worker/login');
  };

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden">
      {/* Role Selection Modal */}
      <RoleSelectModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSelectRole={handleRoleSelected}
      />

      {/* Hero Section & Role Portals (ACCESS) */}
      <section id="access" className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center scroll-mt-20">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white max-w-4xl mx-auto leading-tight">
          {isTa ? (
            <>
              AI மூலம் இயங்கும்{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                நவீன மின்சார சேவை மேலாண்மை
              </span>
            </>
          ) : (
            <>
              Smart Electrical Service Management,{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </>
          )}
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          {isTa
            ? 'வாடிக்கையாளர்கள், மின்சார சேவை கோரிக்கைகள், AI பகுப்பாய்வு, கள தொழில்நுட்ப வல்லுநர்கள், நேரலை GPS கண்காணிப்பு, பழுது வரலாறு, டிஜிட்டல் பில்லிங், தொழிலாளர் சம்பளம் மற்றும் SMS சேவைகளை ஒரே தளத்தில் நிர்வகிக்கவும்.'
            : 'Manage customers, electrical service requests, AI diagnostics, field technicians, live GPS tracking, repair history, strict digital billing, worker salaries, and SMS communication in one unified enterprise platform.'}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('register')}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.4)] transition transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
          >
            {t('get_started', isTa ? 'இப்போது பதிவு செய்க' : 'Book Service Now')}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setRoleModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-cyan-500/30 text-cyan-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer backdrop-blur-sm shadow-[0_0_15px_rgba(34,211,238,0.15)] flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{isTa ? 'உள்நுழைவு தளத்தைத் தேர்ந்தெடுக்கவும்' : 'Select Login Portal'}</span>
          </button>
        </div>

        {/* 3 Dedicated Login Portal Cards */}
        <div id="roles" className="mt-12 max-w-4xl mx-auto scroll-mt-24">
          <p className="text-xs font-mono text-slate-400 mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isTa ? 'பயனர் பொறுப்பு வாரியாக தனித்தனி தளங்கள்' : 'Separate Portals by Role'}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Admin Card */}
            <div className="p-5 rounded-2xl bg-[#090e1a]/80 border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex flex-col justify-between group shadow-xl backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {isTa ? 'நிர்வாகம்' : 'Admin Only'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {isTa ? 'முதன்மை நிர்வாக தளம்' : 'Master Admin Console'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isTa
                    ? 'தொழிலாளர்களை நியமித்தல், AI ஆய்வை சரிபார்த்தல், கட்டணங்களை நிர்ணயித்தல் & பகுப்பாய்வு.'
                    : 'Dispatch workers, review AI diagnosis, set final bills & view analytics.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('admin/login')}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-tight transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.3)] cursor-pointer"
                >
                  <span>{isTa ? 'நிர்வாக உள்நுழைவு' : 'Admin Login'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Customer Card */}
            <div className="p-5 rounded-2xl bg-[#090e1a]/80 border border-blue-500/30 hover:border-blue-400/60 transition-all flex flex-col justify-between group shadow-xl backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {isTa ? 'வாடிக்கையாளர்' : 'Customers'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  {isTa ? 'வாடிக்கையாளர் சேவை தளம்' : 'Customer Service Portal'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isTa
                    ? 'மின்சார பழுது பதிவு, தொழிலாளி வருகை நேரலை கண்காணிப்பு & ஆன்லைன் கட்டணம்.'
                    : 'Book repairs, track live technician arrival & pay verified invoices online.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('customer/login')}
                  className="w-full py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs uppercase tracking-tight transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] cursor-pointer"
                >
                  <span>{isTa ? 'வாடிக்கையாளர் உள்நுழைவு' : 'Customer Login'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="w-full py-1 text-[10px] text-blue-400 hover:text-blue-300 font-mono transition text-center cursor-pointer"
                >
                  {isTa ? '✨ புதியவரா? கணக்கை உருவாக்குங்கள்' : '✨ New? Register Account'}
                </button>
              </div>
            </div>

            {/* Worker Card */}
            <div className="p-5 rounded-2xl bg-[#090e1a]/80 border border-purple-500/30 hover:border-purple-400/60 transition-all flex flex-col justify-between group shadow-xl backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {isTa ? 'தொழிலாளர்கள்' : 'Electricians'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  {isTa ? 'கள எலக்ட்ரீசியன் தளம்' : 'Field Electrician Hub'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isTa
                    ? 'வேலைகளை ஏற்றுக்கொள்வது, GPS வழிசெலுத்தல், உதிரி பாகங்கள் மற்றும் சம்பளம் அறிவது.'
                    : 'Accept jobs, follow GPS navigation, log materials & track wages and attendance.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <button
                  type="button"
                  onClick={() => onNavigate('worker/login')}
                  className="w-full py-2 px-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-tight transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
                >
                  <span>{isTa ? 'தொழிலாளர் உள்நுழைவு' : 'Worker Login'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM / FEATURES SECTION */}
      <section id="platform" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>{isTa ? 'தளத்தின் முக்கிய அம்சங்கள்' : 'Platform Core Capabilities'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isTa ? 'மின்சாரத் தொழில்களுக்காக பிரத்யேகமாக வடிவமைக்கப்பட்டது' : 'Engineered for Real Electrical Operations'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {isTa
              ? 'உங்கள் மின்சார வணிகத்தை துல்லியமாகவும் வேகமாகவும் நிர்வகிக்கத் தேவையான அனைத்தும்.'
              : 'Everything your electrical contracting business requires to operate smoothly, accurately, and at scale.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 backdrop-blur-sm shadow-xl transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_10px_rgba(34,211,238,0.2)] group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="workflow" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono uppercase mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>{isTa ? 'பணிப்பாய்வு செயல்முறை' : 'Standard Operating Procedure'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isTa ? 'முழு சேவை வாழ்க்கை சுழற்சி' : 'Full Service Lifecycle Flow'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {isTa
              ? 'வாடிக்கையாளர் கோரிக்கை முதல் AI ஆய்வு, களப்பணி, நிர்வாக ஒப்புதல் மற்றும் SMS உறுதிப்படுத்தல் வரை.'
              : 'From emergency customer request to AI diagnostic, field completion, Admin bill lock, and SMS confirmation.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 hover:bg-white/[0.08] backdrop-blur-sm transition group shadow-lg"
            >
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 group-hover:text-cyan-300">{step.num}</span>
                <h4 className="mt-1 text-sm font-bold text-slate-100">{step.title}</h4>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
              <div className="mt-3 w-full h-0.5 bg-white/10 group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition" />
            </div>
          ))}
        </div>
      </section>

      {/* COVERAGE & DISPATCH NETWORK SECTION */}
      <section id="coverage" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>{isTa ? 'சேவை பரவல்' : 'SERVICE COVERAGE'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isTa ? 'முதன்மை மின்சார சேவை பகுதிகள்' : 'Primary Electrical Service Area'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {isTa
              ? 'முடுக்கமீண்டான்பட்டி, கோவில்பட்டி, தூத்துக்குடி மாவட்டம், தமிழ்நாடு - 628716 முழுவதற்கும் 24/7 மின்சார சேவை.'
              : 'Dedicated 24/7 electrical dispatch network covering Mudukkumeendanpatti, Kovilpatti, Thoothukudi District, Tamilnadu - 628716.'}
          </p>
        </div>

        {/* Primary Service Area Main Card */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#090e1a]/95 via-[#0d1527]/95 to-[#090e1a]/95 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.12)] backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Location Hierarchy */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
                <MapPin className="w-4 h-4" />
                <span>{isTa ? 'முதன்மை சேவை பகுதி' : 'Primary Service Area'}</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {coverageDetails.primaryArea}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base sm:text-lg text-slate-200 font-semibold">
                  <span className="text-cyan-300">{isTa ? 'கோவில்பட்டி' : 'Kovilpatti'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">{isTa ? 'தூத்துக்குடி மாவட்டம்' : 'Thoothukudi District'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-mono">{coverageDetails.statePincode}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                {isTa
                  ? 'கோவில்பட்டி தாலுகா மற்றும் முடுக்கமீண்டான்பட்டி சுற்றுவட்டார பகுதிகளுக்கான விரைவான மின்சார பழுதுநீக்கும் சேவை. வீட்டு வயரிங், விவசாய மோட்டார் பம்புகள் மற்றும் வணிக 3-பேஸ் இணைப்புகளுக்கான உடனடி தீர்வு.'
                  : 'Comprehensive electrical operations servicing Mudukkumeendanpatti and surrounding areas across Kovilpatti Taluk. Rapid response for residential wiring, agricultural pump sets, commercial meters, and 3-phase transformers.'}
              </p>

              {/* Service Details Badges */}
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                  {isTa ? 'சேவை பகுதி: கோவில்பட்டி, தூத்துக்குடி மாவட்டம்' : 'Service Area: Kovilpatti, Thoothukudi District'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  {isTa ? 'அஞ்சல் குறியீடு: 628716' : 'PIN Code: 628716'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300">
                  {isTa ? 'கவரேஜ்: முடுக்கமீண்டான்பட்டி & சுற்றுவட்டாரங்கள்' : 'Coverage: Mudukkumeendanpatti & Surrounding Areas'}
                </span>
              </div>
            </div>

            {/* Right: Key Metric Blocks */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-slate-400 uppercase">{isTa ? 'சராசரி வருகை நேரம்' : 'Average ETA'}</div>
                <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">{coverageDetails.eta}</div>
                <div className="text-[11px] text-slate-400 mt-1">{isTa ? 'விரைவான சேவை உத்தரவாதம்' : 'Guaranteed SLA arrival'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-slate-400 uppercase">{isTa ? 'செயலில் உள்ள தொழிலாளர்கள்' : 'Active Fleet'}</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{coverageDetails.activeFleet}</div>
                <div className="text-[11px] text-slate-400 mt-1">{isTa ? 'சான்றளிக்கப்பட்ட கள வல்லுநர்கள்' : 'Certified field masters'}</div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-white/5 to-blue-950/20 border border-cyan-500/30 flex flex-col justify-between sm:col-span-2 shadow-lg shadow-cyan-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                    {isTa ? 'அவசர உதவி' : 'EMERGENCY SUPPORT'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {isTa ? '24/7 நேரலை' : 'Live 24/7'}
                  </span>
                </div>

                <div className="my-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      {isTa ? '24/7 அவசர உதவி எண்' : '24/7 Emergency Helpline'}
                    </div>
                    <a
                      href="tel:8925190164"
                      className="text-2xl sm:text-3xl font-black text-white hover:text-cyan-300 transition-colors flex items-center gap-2 mt-0.5 tracking-tight group"
                    >
                      <span className="text-cyan-400">📞</span>
                      <span className="text-cyan-300 font-mono tracking-normal">8925190164</span>
                    </a>
                  </div>

                  <a
                    href="tel:8925190164"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.35)] transition cursor-pointer shrink-0 active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{isTa ? 'அழைக்க: 8925190164' : 'Call: 8925190164'}</span>
                  </a>
                </div>

                <div className="text-[11px] text-slate-300 border-t border-white/10 pt-2 font-medium">
                  {isTa
                    ? 'மின் தடை மற்றும் ஷார்ட் சர்க்யூட் சிக்கல்களுக்கு உடனடி அவசர சேவை'
                    : 'Instant priority dispatch for power outages & short circuits'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Specific Zones in Mudukkumeendanpatti & Kovilpatti */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {coverageDetails.zones.map((zone, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gradient-to-b from-[#090e1a]/90 to-[#0d1527]/90 border border-cyan-500/20 hover:border-cyan-400/50 transition-all group backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {zone.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {zone.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{zone.type}</p>

              <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">{isTa ? 'குறியீடு / மண்டலம்:' : 'PIN / Zone:'}</span>
                  <span className="text-slate-200">{zone.pincode}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">{isTa ? 'சராசரி நேரம்:' : 'Average ETA:'}</span>
                  <span className="text-cyan-400 font-bold">{zone.response}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">{isTa ? 'தொழிலாளர்கள்:' : 'Fleet Unit:'}</span>
                  <span className="text-emerald-300 font-semibold">{zone.activeFleet}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500">{isTa ? 'சிறப்புப் பிரிவு:' : 'Specialization:'}</span>
                  <span className="text-slate-200 truncate ml-2 text-right">{zone.focus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage Features & Emergency Dispatch Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#0a1020]/90 to-blue-950/40 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold">
              <PhoneCall className="w-4 h-4" />
              <span>{isTa ? '24/7 அவசர உதவி எண் • 📞 8925190164' : '24/7 Emergency Dispatch Helpline • 📞 8925190164'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {isTa
                ? 'முடுக்கமீண்டான்பட்டி அல்லது கோவில்பட்டியில் உடனடி மின்சார சேவை தேவையா?'
                : 'Need immediate electrical repairs in Mudukkumeendanpatti or Kovilpatti?'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {isTa
                ? 'எங்கள் தானியங்கி அமைப்பு அருகிலுள்ள எலக்ட்ரீசியனை சில நொடிகளில் நியமித்து, நேரலை GPS வழிகாட்டலுடன் அனுப்பி வைக்கிறது.'
                : 'Our automated dispatch system assigns the nearest available certified master electrician across Thoothukudi District within seconds with live GPS tracking.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0">
            <a
              href="tel:8925190164"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.35)] transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>{isTa ? 'அழைக்க: 8925190164' : 'Call: 8925190164'}</span>
            </a>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.4)] transition cursor-pointer"
            >
              {isTa ? 'சேவை பதிவு செய்க' : 'Book Service Online'}
            </button>
            <button
              onClick={() => setRoleModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              {isTa ? 'உள்நுழைக' : 'Role Sign In'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};


import React from 'react';
import { useI18n } from '../lib/i18n.tsx';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  variant?: 'navbar' | 'inline' | 'compact';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'navbar', className = '' }) => {
  const { language, setLanguage } = useI18n();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold backdrop-blur-md shadow-sm transition-all ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
      <button
        type="button"
        id="btn-lang-en"
        onClick={() => setLanguage('en')}
        className={`px-1.5 py-0.5 rounded text-xs transition cursor-pointer ${
          language === 'en'
            ? 'text-cyan-400 font-bold bg-cyan-500/15'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        English
      </button>
      <span className="text-slate-600 select-none">|</span>
      <button
        type="button"
        id="btn-lang-ta"
        onClick={() => setLanguage('ta')}
        className={`px-1.5 py-0.5 rounded text-xs transition cursor-pointer ${
          language === 'ta'
            ? 'text-cyan-400 font-bold bg-cyan-500/15'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};

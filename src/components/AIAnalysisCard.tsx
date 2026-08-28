import React from 'react';
import { Sparkles, Wrench, AlertTriangle, CheckSquare, Zap, ShieldCheck } from 'lucide-react';
import type { AIAnalysisResult } from '../types/index.ts';
import { PriorityBadge } from './StatusBadge.tsx';
import { formatCurrency } from '../lib/formatters.ts';
import { useI18n } from '../lib/i18n.tsx';

interface AIAnalysisCardProps {
  analysis?: AIAnalysisResult;
  onApplyCategory?: (category: string) => void;
  isAdminView?: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis, onApplyCategory, isAdminView }) => {
  const { t } = useI18n();

  if (!analysis) return null;

  const displayCategory = analysis.serviceCategory || analysis.category || 'General Electrical';
  const displayPriority = (typeof analysis.priority === 'string' ? analysis.priority.toLowerCase() : 'medium') as any;
  const displayComplexity = analysis.estimatedComplexity || 'Moderate';

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/25 via-zinc-900 to-purple-950/25 p-5 shadow-xl relative overflow-hidden">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              {t('AI Analysis', 'VoltWork AI Technical Analysis')}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                {analysis.confidence ? `${analysis.confidence}% ${t('Match', 'Match')}` : t('AI Verified', 'AI Verified')}
              </span>
            </h4>
            <p className="text-xs text-zinc-400">
              {analysis.engine || t('Automated electrical diagnostic & workforce recommendation', 'Automated electrical diagnostic & workforce recommendation')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={displayPriority} size="sm" />
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold">
            {t(displayComplexity, displayComplexity)} {t('Complexity', 'Complexity')}
          </span>
        </div>
      </div>

      {/* Safety Warning if present */}
      {analysis.safetyWarning && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <strong className="font-bold block text-rose-200 mb-0.5">{t('Safety Notice:', 'Safety Notice:')}</strong>
            <span>{analysis.safetyWarning}</span>
          </div>
        </div>
      )}

      {/* Technical Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-zinc-400 block text-[11px] font-semibold mb-1">{t('Identified Issue:', 'Identified Issue:')}</span>
            <p className="text-zinc-200 font-medium leading-relaxed">{analysis.possibleIssue}</p>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-zinc-400">{t('Category', 'Detected Category')}:</span>
            <span className="font-bold text-cyan-300">{t(displayCategory, displayCategory)}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-zinc-400">{t('Recommended Skill Level:', 'Recommended Skill Level:')}</span>
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              {t(analysis.requiredSkill || 'Junior', analysis.requiredSkill || 'Junior')} {t('Technician', 'Technician')}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {analysis.estimatedPriceRange && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400">{t('Reference Cost Range:', 'Reference Cost Range:')}</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatCurrency(analysis.estimatedPriceRange.min)} - {formatCurrency(analysis.estimatedPriceRange.max)}
              </span>
            </div>
          )}

          {/* Suggested Materials */}
          {analysis.suggestedMaterials && analysis.suggestedMaterials.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <span className="text-zinc-400 block text-[11px] font-semibold mb-1.5 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                {t('Materials', 'Recommended Materials / Spares')}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.suggestedMaterials.map((mat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-[11px] font-medium"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Diagnostic Steps */}
      {analysis.diagnosticPoints && analysis.diagnosticPoints.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80">
          <span className="text-zinc-400 text-[11px] font-bold block mb-2">{t('Key Diagnostic Checklist:', 'Key Diagnostic Checklist:')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
            {analysis.diagnosticPoints.map((point, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/60">
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdminView && onApplyCategory && (
        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={() => onApplyCategory(displayCategory)}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            {t('Apply Category', 'Apply Suggested Category')} ({t(displayCategory, displayCategory)})
          </button>
        </div>
      )}
    </div>
  );
};

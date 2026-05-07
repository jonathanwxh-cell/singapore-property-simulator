import type { ReactNode } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';

interface GuidedFocusPanelProps {
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  termIds?: string[];
  accentColor?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}

export default function GuidedFocusPanel({
  eyebrow,
  title,
  summary,
  bullets,
  termIds,
  accentColor = '#00F0FF',
  actions,
  footer,
}: GuidedFocusPanelProps) {
  return (
    <GlassCard accentColor={accentColor}>
      <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-cyan-glow" />
            <p className="label-text text-[10px] text-cyan-glow">{eyebrow}</p>
          </div>
          <h3 className="section-title text-white">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{summary}</p>

          <div className="mt-4 grid gap-2">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-2 rounded-xl border border-glass-border bg-white/[0.03] px-3 py-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
                <p className="text-xs leading-relaxed text-text-secondary">{bullet}</p>
              </div>
            ))}
          </div>

          {termIds && termIds.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {termIds.map((termId) => (
                <GlossaryTerm key={termId} termId={termId} />
              ))}
            </div>
          )}

          {footer && (
            <div className="mt-3 text-xs leading-relaxed text-text-dim">
              {footer}
            </div>
          )}
        </div>

        {actions && (
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[15rem] lg:grid-cols-1">
            {actions}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

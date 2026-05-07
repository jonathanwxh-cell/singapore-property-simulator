import { useState } from 'react';
import type { ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { getRuleGlossaryEntry } from '@/data/ruleGlossary';
import { cn } from '@/lib/utils';

interface GlossaryTermProps {
  termId: string;
  children?: ReactNode;
  className?: string;
}

export default function GlossaryTerm({ termId, children, className }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const entry = getRuleGlossaryEntry(termId);

  if (!entry) {
    return <span className={className}>{children ?? termId}</span>;
  }

  return (
    <span className="relative inline-flex align-baseline">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-cyan-glow/35 bg-cyan-glow/10 px-2 py-0.5 align-baseline',
          'font-mono text-[0.72em] font-semibold uppercase tracking-[0.08em] text-cyan-glow hover:bg-cyan-glow/20',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/60',
          className,
        )}
        aria-expanded={open}
        aria-label={`Explain ${entry.label}`}
      >
        <span>{children ?? entry.label}</span>
        <Info size={11} aria-hidden="true" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-3 right-3 z-[70] block max-h-[70vh] overflow-y-auto rounded-2xl border border-cyan-glow/35 bg-void-navy/98 p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:absolute sm:left-0 sm:right-auto sm:top-full sm:bottom-auto sm:mt-2 sm:block sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:max-h-none sm:overflow-visible"
        >
          <span className="mb-2 flex items-start justify-between gap-3">
            <span>
              <span className="block font-rajdhani text-sm font-bold uppercase tracking-[0.14em] text-white">
                {entry.label}
              </span>
              <span className="block text-xs font-mono text-cyan-glow">{entry.summary}</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-text-dim hover:bg-white/10 hover:text-white"
              aria-label={`Close ${entry.label} explanation`}
            >
              <X size={14} />
            </button>
          </span>
          <span className="block text-xs leading-relaxed text-text-secondary">{entry.detail}</span>
          <span className="mt-3 block rounded-xl border border-success/25 bg-success/10 p-3">
            <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-success">Why it matters</span>
            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{entry.whyItMatters}</span>
          </span>
          <span className="mt-2 block text-xs leading-relaxed text-text-dim">
            Example: {entry.example}
          </span>
        </span>
      )}
    </span>
  );
}

import GlassCard from '@/components/GlassCard';
import { getRuleGlossaryEntries } from '@/data/ruleGlossary';

interface RuleGlossaryPanelProps {
  title?: string;
  termIds?: string[];
  compact?: boolean;
}

export default function RuleGlossaryPanel({
  title = 'Singapore Rule Cheatsheet',
  termIds,
  compact = false,
}: RuleGlossaryPanelProps) {
  const entries = getRuleGlossaryEntries(termIds);

  return (
    <GlassCard accentColor="#00F0FF">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="label-text text-text-dim text-[10px] mb-1">Plain English Rules</p>
          <h3 className="section-title text-white">{title}</h3>
        </div>
        <span className="rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-glow">
          Sim Lite
        </span>
      </div>
      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-3'}`}>
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm">{entry.label}</p>
              <p className="text-[10px] font-mono text-cyan-glow">{entry.summary}</p>
            </div>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">{entry.detail}</p>
            <div className="mt-3 rounded-lg border border-success/20 bg-success/10 p-2">
              <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-success">Why it matters</p>
              <p className="text-text-secondary text-xs mt-1 leading-relaxed">{entry.whyItMatters}</p>
            </div>
            <p className="text-text-dim text-[11px] mt-2 leading-relaxed">Example: {entry.example}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

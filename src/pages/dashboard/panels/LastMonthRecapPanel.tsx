import GlassCard from '@/components/GlassCard';
import type { TurnRecap } from '@/engine/turnRecap';

export default function LastMonthRecapPanel({ recap }: { recap: TurnRecap }) {
  const accentColor = recap.tone === 'good' ? '#00E676' : recap.tone === 'warn' ? '#FFD740' : '#00F0FF';

  return (
    <GlassCard accentColor={accentColor}>
      <div aria-live="polite" className="grid gap-4 lg:grid-cols-[0.95fr,1.4fr]">
        <div>
          <p className="label-text mb-1 text-[10px] text-cyan-glow">What changed</p>
          <h3 className="section-title text-white">{recap.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{recap.summary}</p>
          <p className="mt-3 rounded-xl border border-cyan-glow/20 bg-cyan-glow/10 p-3 text-xs leading-relaxed text-cyan-glow">
            {recap.nextHint}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recap.facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
              <p className="label-text text-[9px] text-text-dim">{fact.label}</p>
              <p className={`mt-1 font-mono text-lg ${
                fact.tone === 'good'
                  ? 'text-success'
                  : fact.tone === 'warn'
                    ? 'text-warning'
                    : 'text-white'
              }`}>
                {fact.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text-dim">{fact.detail}</p>
            </div>
          ))}
        </div>
      </div>
      {recap.notes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
          {recap.notes.map((note) => (
            <span key={note} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-text-secondary">
              {note}
            </span>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

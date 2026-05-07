import GlassCard from '@/components/GlassCard';
import type { MonthlyIntentOption } from '@/engine/monthlyIntents';

export default function MonthlyIntentPanel({
  intents,
  compactMode,
  highlighted,
  onSelect,
  onOpen,
  onToggleCompact,
}: {
  intents: MonthlyIntentOption[];
  compactMode: boolean;
  highlighted: boolean;
  onSelect: (intent: MonthlyIntentOption) => void;
  onOpen: (intent: MonthlyIntentOption) => void;
  onToggleCompact: () => void;
}) {
  return (
    <GlassCard accentColor="#00F0FF" className={highlighted ? 'ring-2 ring-cyan-glow/70 shadow-[0_0_36px_rgba(0,240,255,0.22)]' : undefined}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-text mb-1 text-[10px] text-cyan-glow">Choose your month</p>
          <h3 className="section-title text-white">Monthly Intent</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Pick a plan, then either advance immediately or open the relevant page first. Time moves only when you choose "Use plan + advance".
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleCompact}
            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${
              compactMode
                ? 'border-success/35 bg-success/10 text-success'
                : 'border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow'
            }`}
          >
            {compactMode ? 'Compact on' : 'Compact off'}
          </button>
          <span className="rounded-full border border-cyan-glow/25 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-glow">
            1 click plan
          </span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {intents.map((intent) => (
          <div
            key={intent.id}
            className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
              intent.recommended
                ? 'border-success/40 bg-success/10'
                : intent.tone === 'warn'
                  ? 'border-warning/30 bg-warning/10'
                  : 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/40'
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${intent.recommended ? 'text-success' : 'text-text-dim'}`}>
                {intent.recommended ? 'Recommended' : intent.tone}
              </span>
              <span className="text-[10px] text-text-dim">No surprise advance</span>
            </div>
            <p className="font-rajdhani text-lg font-semibold text-white">{intent.label}</p>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-glow">Choose how to use this month</p>
            {!compactMode && (
              <>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{intent.detail}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="label-text text-[9px] text-success">Upside</p>
                    <p className="mt-1 text-[11px] text-text-secondary">{intent.upside}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="label-text text-[9px] text-warning">Tradeoff</p>
                    <p className="mt-1 text-[11px] text-text-secondary">{intent.risk}</p>
                  </div>
                </div>
              </>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelect(intent)}
                className={intent.recommended ? 'btn-primary min-h-11 px-3 py-2 text-xs' : 'btn-secondary min-h-11 px-3 py-2 text-xs'}
              >
                Use plan + advance
              </button>
              <button
                type="button"
                onClick={() => onOpen(intent)}
                className="min-h-11 rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-3 py-2 font-rajdhani text-xs font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/20"
              >
                Open first
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

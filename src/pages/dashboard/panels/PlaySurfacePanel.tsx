import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import type { PlaySurfaceChoice, PlaySurfaceState, PlaySurfaceStage } from '@/engine/playSurface';
import { cn } from '@/lib/utils';

interface PlaySurfacePanelProps {
  state: PlaySurfaceState;
  compactMode: boolean;
  highlighted: boolean;
  advanceSlot?: ReactNode;
  onPlayChoice: (choice: PlaySurfaceChoice) => void;
  onInspectChoice: (choice: PlaySurfaceChoice) => void;
  onToggleCompact: () => void;
}

const toneClass = {
  good: 'border-success/35 bg-success/10 text-success',
  warn: 'border-warning/35 bg-warning/10 text-warning',
  bad: 'border-danger/35 bg-danger/10 text-danger',
  neutral: 'border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow',
} satisfies Record<string, string>;

export default function PlaySurfacePanel({
  state,
  compactMode,
  highlighted,
  advanceSlot,
  onPlayChoice,
  onInspectChoice,
  onToggleCompact,
}: PlaySurfacePanelProps) {
  return (
    <GlassCard accentColor="#00F0FF" className="mb-6 overflow-hidden" padding="none">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(0,240,255,0.16),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(255,215,64,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_44%)]" />
        <div className="pointer-events-none absolute -bottom-20 right-8 h-56 w-56 rounded-full bg-success/10 blur-3xl" />

        <div className="relative p-5 lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr,21rem]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/35 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow">
                  <Sparkles size={13} /> {state.label}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-text-secondary">
                  <CalendarDays size={13} /> {state.monthLabel}
                </span>
                <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-warning">
                  {state.scene.label}
                </span>
              </div>

              <p className="label-text mb-2 text-[10px] text-text-dim">{state.scene.detail}</p>
              <h2 className="max-w-4xl font-display text-3xl leading-none text-white md:text-5xl">
                {state.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                {state.subtitle}
              </p>

              {advanceSlot && (
                <div className="mt-4 rounded-2xl border border-cyan-glow/20 bg-black/20 p-2 xl:hidden">
                  {advanceSlot}
                </div>
              )}

              <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="label-text text-[10px] text-cyan-glow">Life path</p>
                    <p className="mt-1 text-sm text-text-secondary">Progress should feel like a board path, not a stack of dashboards.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleCompact}
                    className={cn(
                      'w-fit rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]',
                      compactMode ? 'border-success/35 bg-success/10 text-success' : 'border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow',
                    )}
                  >
                    {compactMode ? 'Compact play on' : 'Compact play off'}
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-5">
                  {state.timeline.map((stage) => (
                    <TimelineStage key={stage.id} stage={stage} />
                  ))}
                </div>
              </div>
            </div>

            <aside className="grid content-start gap-3">
              {advanceSlot && (
                <div className="hidden rounded-2xl border border-cyan-glow/20 bg-black/20 p-2 xl:block">
                  {advanceSlot}
                </div>
              )}
              {state.metrics.map((metric) => (
                <div key={metric.id} className="rounded-2xl border border-glass-border bg-black/25 p-3">
                  <p className="label-text text-[9px] text-text-dim">{metric.label}</p>
                  <p className={cn(
                    'mt-1 font-mono text-lg',
                    metric.tone === 'good'
                      ? 'text-success'
                      : metric.tone === 'warn'
                        ? 'text-warning'
                        : metric.tone === 'bad'
                          ? 'text-danger'
                          : 'text-white',
                  )}>
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-text-dim">{metric.detail}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-cyan-glow/25 bg-cyan-glow/10 p-3">
                <div className="mb-2 flex items-center gap-2 text-cyan-glow">
                  <BarChart3 size={15} />
                  <p className="label-text text-[10px]">{state.financeModeLabel}</p>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">{state.financeModeDetail}</p>
              </div>
            </aside>
          </div>

          <div className={cn(
            'mt-5 rounded-3xl border bg-black/20 p-4 transition-all',
            highlighted
              ? 'border-cyan-glow/70 shadow-[0_0_36px_rgba(0,240,255,0.22)]'
              : 'border-white/10',
          )}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="label-text text-[10px] text-warning">Make your move</p>
                <h3 className="section-title text-white">{state.prompt.title}</h3>
                {!compactMode && (
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">
                    {state.prompt.detail}
                  </p>
                )}
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-text-dim">{state.prompt.why}</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {state.choices.map((choice) => (
                <ChoiceCard
                  key={choice.id}
                  choice={choice}
                  compactMode={compactMode}
                  onPlay={() => onPlayChoice(choice)}
                  onInspect={() => onInspectChoice(choice)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function TimelineStage({ stage }: { stage: PlaySurfaceStage }) {
  return (
    <div className={cn(
      'relative rounded-2xl border p-3',
      stage.status === 'current'
        ? 'border-cyan-glow/45 bg-cyan-glow/10'
        : stage.status === 'past'
          ? 'border-success/25 bg-success/10'
          : 'border-white/10 bg-white/[0.03]',
    )}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={cn(
          'text-[10px] font-mono uppercase tracking-[0.16em]',
          stage.status === 'current' ? 'text-cyan-glow' : stage.status === 'past' ? 'text-success' : 'text-text-dim',
        )}>
          {stage.status}
        </p>
        {stage.status === 'current' && <ChevronRight size={14} className="text-cyan-glow" />}
      </div>
      <h4 className="font-rajdhani text-sm font-bold uppercase tracking-[0.1em] text-white">{stage.label}</h4>
      <p className="mt-1 min-h-8 text-[11px] leading-snug text-text-dim">{stage.detail}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full', stage.status === 'past' ? 'bg-success' : 'bg-cyan-glow')}
          style={{ width: `${stage.progressPct}%` }}
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  choice,
  compactMode,
  onPlay,
  onInspect,
}: {
  choice: PlaySurfaceChoice;
  compactMode: boolean;
  onPlay: () => void;
  onInspect: () => void;
}) {
  const tone = choice.tone === 'bad' ? 'warn' : choice.tone;

  return (
    <article className={cn(
      'rounded-2xl border p-4 transition-all hover:-translate-y-0.5',
      choice.recommended ? 'border-success/40 bg-success/10' : toneClass[tone] ?? toneClass.neutral,
    )}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={cn(
          'rounded-full border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.16em]',
          choice.recommended ? 'border-success/35 bg-success/10 text-success' : 'border-white/10 bg-black/20 text-text-dim',
        )}>
          {choice.recommended ? 'Recommended' : choice.kind === 'intent' ? 'Playable' : 'Required'}
        </span>
        <span className="text-[10px] text-text-dim">{choice.kind === 'intent' ? '1 month' : 'no time'}</span>
      </div>
      <h4 className="font-rajdhani text-xl font-bold uppercase tracking-[0.08em] text-white">{choice.label}</h4>
      {!compactMode && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{choice.detail}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-success/15 bg-success/10 p-2">
              <p className="label-text text-[8px] text-success">Upside</p>
              <p className="mt-1 text-[11px] leading-snug text-text-secondary">{choice.upside}</p>
            </div>
            <div className="rounded-xl border border-warning/15 bg-warning/10 p-2">
              <p className="label-text text-[8px] text-warning">Tradeoff</p>
              <p className="mt-1 text-[11px] leading-snug text-text-secondary">{choice.risk}</p>
            </div>
          </div>
        </>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onPlay}
          className={choice.recommended ? 'btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs' : 'btn-secondary inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2 text-xs'}
        >
          {choice.primaryLabel}
          <ArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={onInspect}
          className="min-h-11 rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-3 py-2 font-rajdhani text-xs font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/20"
        >
          {choice.secondaryLabel}
        </button>
      </div>
    </article>
  );
}

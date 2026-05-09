import type { ReactNode } from 'react';
import { CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import type { LifeBoardVisualState, LivingHomeVisualState } from '@/engine/visuals';
import { cn } from '@/lib/utils';
import LivingHomeDiorama from './LivingHomeDiorama';

type SceneMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
};

export default function SingaporeLifeBoardScene({
  board,
  home,
  label,
  monthLabel,
  title,
  subtitle,
  sceneLabel,
  sceneDetail,
  metrics,
  advanceSlot,
  compactMode,
  onToggleCompact,
}: {
  board: LifeBoardVisualState;
  home: LivingHomeVisualState | null;
  label: string;
  monthLabel: string;
  title: string;
  subtitle: string;
  sceneLabel: string;
  sceneDetail: string;
  metrics: SceneMetric[];
  advanceSlot?: ReactNode;
  compactMode: boolean;
  onToggleCompact: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#06111f] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,215,64,0.24),transparent_24%),radial-gradient(circle_at_86%_4%,rgba(0,240,255,0.2),transparent_28%),linear-gradient(180deg,rgba(20,69,107,0.92),rgba(6,17,31,0.96)_58%,rgba(3,7,18,1))]" />
      <Skyline />

      <div className="relative grid gap-5 p-4 lg:grid-cols-[1fr,22rem] lg:p-6">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/35 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow">
              <Sparkles size={13} /> {label}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-text-secondary">
              <CalendarDays size={13} /> {monthLabel}
            </span>
            <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-warning">
              {sceneLabel}
            </span>
          </div>

          <p className="label-text mb-2 text-[10px] text-text-dim">{sceneDetail}</p>
          <h2 className="max-w-4xl font-display text-3xl leading-none text-white md:text-5xl">{title}</h2>
          {!compactMode && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">{subtitle}</p>}

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label-text text-[10px] text-cyan-glow">{board.chapterLabel}</p>
                {!compactMode && <p className="mt-1 text-sm text-text-secondary">{board.chapterDetail}</p>}
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

            <div className="relative grid gap-2 md:grid-cols-5">
              {board.stages.map((stage, index) => (
                <div key={stage.id} className="relative">
                  {index === board.avatarStageIndex && (
                    <div className="absolute -top-4 left-4 z-10 h-9 w-9 rounded-full border-4 border-white bg-[radial-gradient(circle_at_35%_28%,#FFFFFF_0_16%,#00F0FF_34%,#2979FF_78%)] shadow-[0_12px_28px_rgba(0,240,255,0.24)]" />
                  )}
                  <div className={cn(
                    'min-h-[5.5rem] rounded-2xl border p-3 pt-5',
                    stage.status === 'current'
                      ? 'border-cyan-glow/50 bg-cyan-glow/15'
                      : stage.status === 'past'
                        ? 'border-success/25 bg-success/10'
                        : 'border-white/10 bg-white/[0.04]',
                  )}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className={cn(
                        'text-[9px] font-mono uppercase tracking-[0.16em]',
                        stage.status === 'current' ? 'text-cyan-glow' : stage.status === 'past' ? 'text-success' : 'text-text-dim',
                      )}>
                        {stage.status}
                      </p>
                      {stage.status === 'current' && <ChevronRight size={13} className="text-cyan-glow" />}
                    </div>
                    <h4 className="font-rajdhani text-sm font-bold uppercase tracking-[0.1em] text-white">{stage.label}</h4>
                    <p className="mt-1 text-[11px] leading-snug text-text-dim">{stage.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-3">
          {advanceSlot && <div className="rounded-2xl border border-cyan-glow/20 bg-black/25 p-2">{advanceSlot}</div>}
          <LivingHomeDiorama home={home} compact />
          <div className="grid grid-cols-2 gap-2">
            {metrics.slice(0, 4).map((metric) => (
              <div key={metric.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <p className="label-text text-[9px] text-text-dim">{metric.label}</p>
                <p className={cn(
                  'mt-1 font-mono text-base',
                  metric.tone === 'good' ? 'text-success' : metric.tone === 'warn' ? 'text-warning' : metric.tone === 'bad' ? 'text-danger' : 'text-white',
                )}>
                  {metric.value}
                </p>
                {!compactMode && <p className="mt-1 text-[11px] leading-snug text-text-dim">{metric.detail}</p>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Skyline() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-70">
      <div className="absolute bottom-0 left-4 h-24 w-10 rounded-t bg-cyan-glow/15" />
      <div className="absolute bottom-0 left-20 h-36 w-12 rounded-t bg-white/10" />
      <div className="absolute bottom-0 left-40 h-28 w-10 rounded-t bg-warning/15" />
      <div className="absolute bottom-0 left-60 h-40 w-14 rounded-t bg-cyan-glow/10" />
      <div className="absolute bottom-0 right-48 h-32 w-12 rounded-t bg-success/15" />
      <div className="absolute bottom-0 right-24 h-40 w-14 rounded-t bg-white/10" />
      <div className="absolute bottom-0 right-6 h-28 w-10 rounded-t bg-cyan-glow/15" />
    </div>
  );
}
